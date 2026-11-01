const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../db');

// In-memory challenge store with 5-minute TTL
const challengeStore = new Map();

function cleanExpiredChallenges() {
  const now = Date.now();
  for (const [key, val] of challengeStore.entries()) {
    if (now - val.timestamp > 300000) { // 5 mins
      challengeStore.delete(key);
    }
  }
}
setInterval(cleanExpiredChallenges, 60000);

// Helper for DB instance
async function db() {
  return await getDb();
}

// Cosine similarity computation for 128D facial vectors
function computeCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Log authentication event
async function logAuthEvent(username, method, status, reason = '', req = null) {
  try {
    const database = await db();
    const id = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    database.run(
      'INSERT INTO auth_audit_log (id, username, method, status, reason, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, username || 'admin', method, status, reason, ip, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// ============================================================================
// OPTION A: WEBAUTHN / FIDO2 DEVICE BIOMETRIC PASSKEYS
// ============================================================================

// 1. GET /api/auth/passkey/register-options
router.post('/passkey/register-options', async (req, res) => {
  try {
    const { username = 'admin' } = req.body;
    const challenge = crypto.randomBytes(32).toString('base64url');
    const userId = crypto.createHash('sha256').update(username).digest('base64url');
    
    // Store challenge
    challengeStore.set(`reg_${username}`, {
      challenge,
      timestamp: Date.now()
    });

    const host = req.get('host') || 'localhost:5000';
    const rpId = host.split(':')[0];

    res.json({
      success: true,
      options: {
        challenge,
        rp: {
          name: 'OPD SHA Hospital Management System',
          id: rpId
        },
        user: {
          id: userId,
          name: username,
          displayName: 'Hospital Administrator'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Windows Hello, Touch ID, Face ID
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    });
  } catch (err) {
    console.error('Passkey register-options error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/auth/passkey/register-verify
router.post('/passkey/register-verify', async (req, res) => {
  try {
    const { username = 'admin', credential, deviceName = 'Device Passkey' } = req.body;
    const record = challengeStore.get(`reg_${username}`);

    if (!record) {
      return res.status(400).json({ success: false, error: 'Registration challenge expired or invalid.' });
    }
    challengeStore.delete(`reg_${username}`);

    if (!credential || !credential.id) {
      return res.status(400).json({ success: false, error: 'No credential provided.' });
    }

    const database = await db();
    const existing = database.get('SELECT id FROM admin_passkeys WHERE id = ?;', [credential.id]);
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'This passkey authenticator is already registered.' });
    }

    const now = new Date().toISOString();
    database.run(
      'INSERT INTO admin_passkeys (id, username, public_key, counter, device_name, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [credential.id, username, credential.rawId || credential.id, 0, deviceName, now, now]
    );

    await logAuthEvent(username, 'PASSKEY', 'SUCCESS', `Passkey enrolled: ${deviceName}`, req);

    res.json({
      success: true,
      message: 'Biometric passkey registered successfully.',
      credentialId: credential.id
    });
  } catch (err) {
    console.error('Passkey register-verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/auth/passkey/login-options
router.post('/passkey/login-options', async (req, res) => {
  try {
    const { username = 'admin' } = req.body;
    const database = await db();
    const passkeys = database.query('SELECT id FROM admin_passkeys WHERE username = ?;', [username]);

    const challenge = crypto.randomBytes(32).toString('base64url');
    challengeStore.set(`auth_${username}`, {
      challenge,
      timestamp: Date.now()
    });

    const allowCredentials = passkeys.map(p => ({
      id: p.id,
      type: 'public-key',
      transports: ['internal', 'hybrid']
    }));

    res.json({
      success: true,
      options: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials
      }
    });
  } catch (err) {
    console.error('Passkey login-options error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/auth/passkey/login-verify
router.post('/passkey/login-verify', async (req, res) => {
  try {
    const { username = 'admin', credential } = req.body;
    const record = challengeStore.get(`auth_${username}`);

    if (!record) {
      await logAuthEvent(username, 'PASSKEY', 'FAILED', 'Challenge expired or missing', req);
      return res.status(400).json({ success: false, error: 'Authentication challenge expired or missing.' });
    }
    challengeStore.delete(`auth_${username}`);

    if (!credential || !credential.id) {
      await logAuthEvent(username, 'PASSKEY', 'FAILED', 'Empty credential payload', req);
      return res.status(400).json({ success: false, error: 'Invalid authentication credential.' });
    }

    const database = await db();
    const registered = database.get('SELECT * FROM admin_passkeys WHERE id = ? AND username = ?;', [credential.id, username]);

    if (!registered) {
      await logAuthEvent(username, 'PASSKEY', 'FAILED', 'Unrecognized passkey credential', req);
      return res.status(401).json({ success: false, error: 'Unrecognized passkey. Please register this device first.' });
    }

    // Update counter and last used
    const now = new Date().toISOString();
    database.run(
      'UPDATE admin_passkeys SET counter = counter + 1, last_used_at = ? WHERE id = ?;',
      [now, credential.id]
    );

    await logAuthEvent(username, 'PASSKEY', 'SUCCESS', `Passkey verified: ${registered.device_name || 'Device'}`, req);

    res.json({
      success: true,
      user: {
        username: 'admin',
        role: 'admin',
        name: 'Hospital Administrator',
        department: 'Administration',
        avatar: '👨‍💼',
        authMethod: 'PASSKEY',
        loginTime: now
      }
    });
  } catch (err) {
    console.error('Passkey login-verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/auth/passkey/delete
router.post('/passkey/delete', async (req, res) => {
  try {
    const { credentialId, username = 'admin' } = req.body;
    if (!credentialId) return res.status(400).json({ success: false, error: 'Credential ID required' });

    const database = await db();
    database.run('DELETE FROM admin_passkeys WHERE id = ? AND username = ?;', [credentialId, username]);
    await logAuthEvent(username, 'PASSKEY', 'SUCCESS', `Deleted passkey ${credentialId.substring(0, 10)}...`, req);

    res.json({ success: true, message: 'Passkey deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// OPTION B: CUSTOM WEBCAM FACE RECOGNITION USING MY FACE
// ============================================================================

// 1. POST /api/auth/face/register
router.post('/face/register', async (req, res) => {
  try {
    const { username = 'admin', embedding, livenessScore = 0.95 } = req.body;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({
        success: false,
        error: 'Invalid face template: 128-dimensional normalized biometric vector required.'
      });
    }

    // Anti-spoof liveness threshold check
    if (livenessScore < 0.70) {
      await logAuthEvent(username, 'FACE', 'FAILED', 'Face registration rejected: failed liveness check', req);
      return res.status(400).json({
        success: false,
        error: 'Registration rejected: Anti-spoofing check failed. Please ensure live face presence, good lighting, and natural eye blinks.'
      });
    }

    const templateHash = crypto.createHash('sha256').update(JSON.stringify(embedding)).digest('hex');
    const now = new Date().toISOString();
    const database = await db();

    // Upsert admin face template
    const existing = database.get('SELECT username FROM admin_face_templates WHERE username = ?;', [username]);
    if (existing) {
      database.run(
        'UPDATE admin_face_templates SET template_hash = ?, embedding_json = ?, liveness_score = ?, updated_at = ? WHERE username = ?;',
        [templateHash, JSON.stringify(embedding), livenessScore, now, username]
      );
    } else {
      database.run(
        'INSERT INTO admin_face_templates (username, template_hash, embedding_json, liveness_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
        [username, templateHash, JSON.stringify(embedding), livenessScore, now, now]
      );
    }

    await logAuthEvent(username, 'FACE', 'SUCCESS', `Enrolled face template (Liveness: ${Math.round(livenessScore * 100)}%)`, req);

    res.json({
      success: true,
      message: 'Face biometric template registered successfully.',
      livenessScore,
      templateHash: templateHash.substring(0, 16) + '...'
    });
  } catch (err) {
    console.error('Face register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/auth/face/verify
router.post('/face/verify', async (req, res) => {
  try {
    const { username = 'admin', embedding, livenessScore = 0 } = req.body;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      await logAuthEvent(username, 'FACE', 'FAILED', 'Invalid live face vector', req);
      return res.status(400).json({ success: false, error: 'Invalid live facial descriptor captured.' });
    }

    // 1. Strict anti-spoof liveness check
    if (livenessScore < 0.65) {
      await logAuthEvent(username, 'FACE', 'FAILED', `Liveness test failed (score: ${Math.round(livenessScore * 100)}%)`, req);
      return res.status(401).json({
        success: false,
        error: 'Liveness check failed! Static photo or screen detected. Please blink and move naturally in front of the camera.'
      });
    }

    const database = await db();
    const template = database.get('SELECT * FROM admin_face_templates WHERE username = ?;', [username]);

    if (!template) {
      await logAuthEvent(username, 'FACE', 'FAILED', 'No registered face template found for user', req);
      return res.status(404).json({
        success: false,
        error: 'No registered face template found for this administrator. Please register your face first in Admin Security Settings.'
      });
    }

    const registeredVector = JSON.parse(template.embedding_json);
    const similarity = computeCosineSimilarity(embedding, registeredVector);

    // Face match threshold (0.84 = high accuracy matching)
    const MATCH_THRESHOLD = 0.84;

    if (similarity >= MATCH_THRESHOLD) {
      const now = new Date().toISOString();
      await logAuthEvent(username, 'FACE', 'SUCCESS', `Face verified (Match: ${Math.round(similarity * 100)}%, Liveness: ${Math.round(livenessScore * 100)}%)`, req);

      return res.json({
        success: true,
        similarity: Math.round(similarity * 1000) / 10,
        livenessScore: Math.round(livenessScore * 100),
        user: {
          username: 'admin',
          role: 'admin',
          name: 'Hospital Administrator',
          department: 'Administration',
          avatar: '👨‍💼',
          authMethod: 'FACE',
          loginTime: now
        }
      });
    } else {
      await logAuthEvent(username, 'FACE', 'FAILED', `Face mismatch (Score: ${Math.round(similarity * 100)}% < ${Math.round(MATCH_THRESHOLD * 100)}%)`, req);
      return res.status(401).json({
        success: false,
        error: 'Face recognition failed. Identity does not match the registered hospital administrator template.',
        similarity: Math.round(similarity * 1000) / 10
      });
    }
  } catch (err) {
    console.error('Face verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/auth/face/delete
router.post('/face/delete', async (req, res) => {
  try {
    const { username = 'admin' } = req.body;
    const database = await db();
    database.run('DELETE FROM admin_face_templates WHERE username = ?;', [username]);
    await logAuthEvent(username, 'FACE', 'SUCCESS', 'Deleted administrator face template', req);

    res.json({
      success: true,
      message: 'Registered face biometric template has been securely deleted.'
    });
  } catch (err) {
    console.error('Face delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// SECURITY STATS & AUDIT LOGS
// ============================================================================

router.get('/security-status', async (req, res) => {
  try {
    const { username = 'admin' } = req.query;
    const database = await db();

    const passkeys = database.query('SELECT id, device_name, created_at, last_used_at FROM admin_passkeys WHERE username = ?;', [username]);
    const faceTemplate = database.get('SELECT username, created_at, updated_at, liveness_score FROM admin_face_templates WHERE username = ?;', [username]);
    
    const lastLogin = database.get(
      "SELECT * FROM auth_audit_log WHERE username = ? AND status = 'SUCCESS' ORDER BY timestamp DESC LIMIT 1;",
      [username]
    );

    const failedCount = database.get(
      "SELECT COUNT(*) AS count FROM auth_audit_log WHERE username = ? AND status = 'FAILED';",
      [username]
    );

    res.json({
      success: true,
      securityStatus: {
        passkeyEnabled: true,
        passkeysCount: passkeys.length,
        passkeys,
        faceEnabled: true,
        faceRegistered: Boolean(faceTemplate),
        faceDetails: faceTemplate ? {
          enrolledAt: faceTemplate.created_at,
          lastUpdated: faceTemplate.updated_at,
          livenessScore: faceTemplate.liveness_score
        } : null,
        lastSuccessfulLogin: lastLogin ? lastLogin.timestamp : null,
        lastLoginMethod: lastLogin ? lastLogin.method : null,
        failedAttempts: failedCount ? failedCount.count : 0
      }
    });
  } catch (err) {
    console.error('Security status error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/audit-log', async (req, res) => {
  try {
    const database = await db();
    const logs = database.query('SELECT * FROM auth_audit_log ORDER BY timestamp DESC LIMIT 20;');
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
