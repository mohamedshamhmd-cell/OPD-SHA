const express = require('express');
const router = express.Router();
const { getDb, resetDatabase } = require('../db');

// Helper to get DB instance
async function db() {
  return await getDb();
}

// 1. GET /api/departments
router.get('/departments', async (req, res) => {
  try {
    const database = await db();
    const departments = database.query(`
      SELECT d.*, f.name AS floor_name, f.level AS floor_level, w.name AS ward_name, w.wing AS ward_wing
      FROM departments d
      JOIN floors f ON d.floor_id = f.id
      JOIN wards w ON d.ward_id = w.id
      ORDER BY f.level ASC, d.name ASC;
    `);

    // Attach queue stats for each department
    const queueCounts = database.query(`
      SELECT department_id, 
             COUNT(CASE WHEN status = 'WAITING' THEN 1 END) AS waiting_count,
             COUNT(CASE WHEN status = 'CALLED' OR status = 'IN_CONSULTATION' THEN 1 END) AS active_count
      FROM patients
      GROUP BY department_id;
    `);

    const countMap = {};
    queueCounts.forEach(c => {
      countMap[c.department_id] = {
        waiting: c.waiting_count,
        active: c.active_count
      };
    });

    // Fetch doctors per department
    const allDoctors = database.query(`
      SELECT * FROM doctors ORDER BY name ASC;
    `);

    const enriched = departments.map(d => {
      const q = countMap[d.id] || { waiting: 0, active: 0 };
      let overcrowding = 'NORMAL';
      if (q.waiting >= 8) overcrowding = 'OVERCROWDED';
      else if (q.waiting >= 4) overcrowding = 'MODERATE';

      const deptDoctors = allDoctors.filter(doc => doc.department_id === d.id);

      return {
        ...d,
        doctors: deptDoctors,
        doctorCount: deptDoctors.length,
        queue: {
          waiting: q.waiting,
          active: q.active,
          totalEstimatedWaitMins: q.waiting * d.avg_service_time_mins,
          overcrowding
        }
      };
    });

    res.json({ success: true, departments: enriched });
  } catch (error) {
    console.error('Error in GET /departments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/doctors (List all doctors or filter by department)
router.get('/doctors', async (req, res) => {
  try {
    const database = await db();
    const { department_id } = req.query;

    let sql = `
      SELECT doc.*, d.name AS department_name, d.code AS department_code, d.color AS department_color,
             f.name AS floor_name, f.level AS floor_level
      FROM doctors doc
      JOIN departments d ON doc.department_id = d.id
      JOIN floors f ON d.floor_id = f.id
    `;
    const params = [];

    if (department_id) {
      sql += ' WHERE doc.department_id = ?';
      params.push(department_id.toUpperCase());
    }

    sql += ' ORDER BY doc.department_id ASC, doc.experience_years DESC;';

    const doctors = database.query(sql, params);

    // Attach active queue count per doctor
    const queueByDoc = database.query(`
      SELECT doctor_id, 
             COUNT(CASE WHEN status = 'WAITING' THEN 1 END) AS waiting_count,
             COUNT(CASE WHEN status = 'CALLED' OR status = 'IN_CONSULTATION' THEN 1 END) AS active_count
      FROM patients
      WHERE doctor_id IS NOT NULL
      GROUP BY doctor_id;
    `);

    const docQueueMap = {};
    queueByDoc.forEach(q => {
      docQueueMap[q.doctor_id] = {
        waiting: q.waiting_count,
        active: q.active_count
      };
    });

    const enrichedDocs = doctors.map(doc => {
      const q = docQueueMap[doc.id] || { waiting: 0, active: 0 };
      return {
        ...doc,
        queue: q
      };
    });

    res.json({ success: true, doctors: enrichedDocs });
  } catch (error) {
    console.error('Error in GET /doctors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /api/doctors/:id
router.get('/doctors/:id', async (req, res) => {
  try {
    const database = await db();
    const docId = req.params.id;

    const doctor = database.get(`
      SELECT doc.*, d.name AS department_name, d.color AS department_color, f.name AS floor_name
      FROM doctors doc
      JOIN departments d ON doc.department_id = d.id
      JOIN floors f ON d.floor_id = f.id
      WHERE doc.id = ?;
    `, [docId]);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    const currentPatients = database.query(`
      SELECT token_number, name, status, appointment_type, slot_time, created_at
      FROM patients
      WHERE doctor_id = ? AND (status = 'WAITING' OR status = 'CALLED' OR status = 'IN_CONSULTATION')
      ORDER BY priority_score DESC, created_at ASC;
    `, [docId]);

    res.json({ success: true, doctor, queue: currentPatients });
  } catch (error) {
    console.error('Error in GET /doctors/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET /api/appointment-slots/:departmentId
router.get('/appointment-slots/:departmentId', async (req, res) => {
  try {
    const database = await db();
    const deptId = req.params.departmentId.toUpperCase();

    // Standard available slots for morning and afternoon shifts
    const slots = [
      { id: 'S1', time: '09:00 AM - 09:30 AM', shift: 'Morning', maxSlots: 5 },
      { id: 'S2', time: '09:30 AM - 10:00 AM', shift: 'Morning', maxSlots: 5 },
      { id: 'S3', time: '10:00 AM - 10:30 AM', shift: 'Morning', maxSlots: 5 },
      { id: 'S4', time: '10:30 AM - 11:00 AM', shift: 'Morning', maxSlots: 5 },
      { id: 'S5', time: '11:00 AM - 11:30 AM', shift: 'Morning', maxSlots: 5 },
      { id: 'S6', time: '11:30 AM - 12:00 PM', shift: 'Morning', maxSlots: 5 },
      { id: 'S7', time: '02:00 PM - 02:30 PM', shift: 'Afternoon', maxSlots: 5 },
      { id: 'S8', time: '02:30 PM - 03:00 PM', shift: 'Afternoon', maxSlots: 5 },
      { id: 'S9', time: '03:00 PM - 03:30 PM', shift: 'Afternoon', maxSlots: 5 },
      { id: 'S10', time: '03:30 PM - 04:00 PM', shift: 'Afternoon', maxSlots: 5 }
    ];

    // Count already booked slots for this department
    const booked = database.query(`
      SELECT slot_time, COUNT(*) AS booked_count
      FROM patients
      WHERE department_id = ? AND appointment_type = 'APPOINTMENT' AND slot_time IS NOT NULL
      GROUP BY slot_time;
    `, [deptId]);

    const bookedMap = {};
    booked.forEach(b => {
      bookedMap[b.slot_time] = b.booked_count;
    });

    const enrichedSlots = slots.map(s => {
      const taken = bookedMap[s.time] || 0;
      const available = Math.max(0, s.maxSlots - taken);
      return {
        ...s,
        booked: taken,
        available,
        status: available > 0 ? 'AVAILABLE' : 'FULL'
      };
    });

    // Also return doctors in this department
    const doctors = database.query(`
      SELECT id, name, qualification, designation, room_number, availability_status, opd_timing
      FROM doctors
      WHERE department_id = ?;
    `, [deptId]);

    res.json({ success: true, slots: enrichedSlots, doctors });
  } catch (error) {
    console.error('Error in GET /appointment-slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. GET /api/floors
router.get('/floors', async (req, res) => {
  try {
    const database = await db();
    const floors = database.query('SELECT * FROM floors ORDER BY level ASC;');
    const wards = database.query('SELECT * FROM wards ORDER BY floor_id ASC, name ASC;');
    const departments = database.query('SELECT * FROM departments ORDER BY floor_id ASC, name ASC;');

    const floorsWithDetails = floors.map(f => {
      const floorWards = wards.filter(w => w.floor_id === f.id).map(w => {
        return {
          ...w,
          departments: departments.filter(d => d.ward_id === w.id)
        };
      });
      return {
        ...f,
        wards: floorWards
      };
    });

    res.json({ success: true, floors: floorsWithDetails });
  } catch (error) {
    console.error('Error in GET /floors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. POST /api/register (Support walk-in OR token appointment slot)
router.post('/register', async (req, res) => {
  try {
    const database = await db();
    const {
      name,
      age,
      gender = 'Not Specified',
      contact = '',
      govt_id = '',
      department_id,
      doctor_id = null,
      appointment_type = 'WALKIN', // 'WALKIN', 'APPOINTMENT'
      slot_time = null,
      is_emergency = false,
      preferred_language = 'en'
    } = req.body;

    if (!name || !age) {
      return res.status(400).json({ success: false, error: 'Name and Age are required fields.' });
    }

    const targetDeptId = is_emergency ? 'EMER' : (department_id || 'GENMED');
    const dept = database.get('SELECT * FROM departments WHERE id = ?;', [targetDeptId]);
    if (!dept) {
      return res.status(400).json({ success: false, error: 'Invalid department selected.' });
    }

    // Determine Doctor
    let assignedDoctorId = doctor_id;
    if (!assignedDoctorId) {
      // Pick first available doctor in this department
      const doc = database.get(
        'SELECT id FROM doctors WHERE department_id = ? ORDER BY availability_status = "AVAILABLE" DESC, experience_years DESC LIMIT 1;',
        [targetDeptId]
      );
      assignedDoctorId = doc ? doc.id : null;
    }

    // Generate Token
    const prefix = is_emergency ? 'EMER' : (dept.code || 'OPD');
    const existingTokens = database.query(
      "SELECT token_number FROM patients WHERE token_number LIKE ? ORDER BY id DESC LIMIT 1;",
      [`${prefix}-%`]
    );

    let nextNum = 101;
    if (is_emergency) nextNum = 1;

    if (existingTokens.length > 0) {
      const lastToken = existingTokens[0].token_number;
      const parts = lastToken.split('-');
      if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
        nextNum = parseInt(parts[1], 10) + 1;
      }
    }

    const tokenNumber = is_emergency 
      ? `EMER-${String(nextNum).padStart(3, '0')}`
      : `${prefix}-${nextNum}`;

    // Priority calculations
    let priorityScore = 0;
    let triageLevel = 'NORMAL';
    const parsedAge = parseInt(age, 10);

    if (is_emergency) {
      priorityScore = 100;
      triageLevel = 'CRITICAL';
    } else if (parsedAge >= 60) {
      priorityScore = 15;
      triageLevel = 'SENIOR';
    } else if (parsedAge <= 6) {
      priorityScore = 10;
      triageLevel = 'CHILD';
    }

    // Insert patient
    const insertRes = database.run(`
      INSERT INTO patients (
        token_number, name, age, gender, contact, govt_id, department_id,
        doctor_id, appointment_type, slot_time,
        is_emergency, preferred_language, status, priority_score, triage_level,
        triage_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', ?, ?, ?, datetime('now'));
    `, [
      tokenNumber,
      name.trim(),
      parsedAge,
      gender,
      contact.trim(),
      govt_id.trim() || `ABHA-TEMP-${Math.floor(1000 + Math.random() * 9000)}`,
      targetDeptId,
      assignedDoctorId,
      appointment_type,
      slot_time,
      is_emergency ? 1 : 0,
      preferred_language,
      priorityScore,
      triageLevel,
      is_emergency 
        ? 'Flagged for immediate triage & medical resuscitation' 
        : appointment_type === 'APPOINTMENT'
          ? `Confirmed OPD Slot Appointment: ${slot_time || 'General Slot'}`
          : 'Standard OPD walk-in registration'
    ]);

    const patient = database.get('SELECT * FROM patients WHERE token_number = ?;', [tokenNumber]);
    const floor = database.get('SELECT * FROM floors WHERE id = ?;', [dept.floor_id]);
    const ward = database.get('SELECT * FROM wards WHERE id = ?;', [dept.ward_id]);
    const assignedDoctor = assignedDoctorId ? database.get('SELECT * FROM doctors WHERE id = ?;', [assignedDoctorId]) : null;

    // Calculate queue position
    let queuePosition = 1;
    let waitMins = 0;
    if (!is_emergency) {
      const ahead = database.query(`
        SELECT COUNT(*) AS count
        FROM patients
        WHERE department_id = ? 
          AND status = 'WAITING' 
          AND (priority_score > ? OR (priority_score = ? AND created_at < ?))
          AND id != ?;
      `, [targetDeptId, priorityScore, priorityScore, patient.created_at, patient.id]);
      queuePosition = (ahead[0]?.count || 0) + 1;
      waitMins = (queuePosition - 1) * dept.avg_service_time_mins;
    }

    res.status(201).json({
      success: true,
      message: is_emergency 
        ? 'Emergency patient registered with highest triage priority!' 
        : appointment_type === 'APPOINTMENT'
          ? `Token Appointment Confirmed for ${slot_time || 'Today'}!`
          : 'OPD Registration successful!',
      token: tokenNumber,
      patient,
      department: dept,
      doctor: assignedDoctor,
      floor,
      ward,
      queue: {
        position: queuePosition,
        estimatedWaitMins: waitMins,
        isEmergency: Boolean(is_emergency),
        appointmentType: appointment_type,
        slotTime: slot_time
      }
    });
  } catch (error) {
    console.error('Error in POST /register:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET /api/slips/:token
router.get('/slips/:token', async (req, res) => {
  try {
    const database = await db();
    const token = req.params.token.toUpperCase().trim();

    const patient = database.get('SELECT * FROM patients WHERE UPPER(token_number) = ?;', [token]);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Token ${token} not found. Please check your token number.` });
    }

    const dept = database.get('SELECT * FROM departments WHERE id = ?;', [patient.department_id]);
    const floor = database.get('SELECT * FROM floors WHERE id = ?;', [dept.floor_id]);
    const ward = database.get('SELECT * FROM wards WHERE id = ?;', [dept.ward_id]);
    const doctor = patient.doctor_id 
      ? database.get('SELECT * FROM doctors WHERE id = ?;', [patient.doctor_id])
      : database.get('SELECT * FROM doctors WHERE department_id = ? LIMIT 1;', [dept.id]);

    // Compute live queue position
    let queuePosition = 0;
    let aheadCount = 0;
    let waitMins = 0;

    if (patient.is_emergency) {
      const activeEmergency = database.query(
        "SELECT COUNT(*) AS count FROM patients WHERE is_emergency = 1 AND status = 'WAITING' AND created_at < ?;",
        [patient.created_at]
      );
      aheadCount = activeEmergency[0]?.count || 0;
      queuePosition = aheadCount + 1;
      waitMins = 0; // Emergency is immediate
    } else if (patient.status === 'WAITING') {
      const ahead = database.query(`
        SELECT COUNT(*) AS count
        FROM patients
        WHERE department_id = ? 
          AND status = 'WAITING' 
          AND (priority_score > ? OR (priority_score = ? AND created_at < ?))
          AND id != ?;
      `, [patient.department_id, patient.priority_score, patient.priority_score, patient.created_at, patient.id]);
      aheadCount = ahead[0]?.count || 0;
      queuePosition = aheadCount + 1;
      waitMins = aheadCount * dept.avg_service_time_mins;
    }

    res.json({
      success: true,
      slip: {
        tokenNumber: patient.token_number,
        appointmentType: patient.appointment_type || 'WALKIN',
        slotTime: patient.slot_time,
        patient: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          contact: patient.contact,
          govtId: patient.govt_id,
          preferredLanguage: patient.preferred_language,
          isEmergency: Boolean(patient.is_emergency),
          status: patient.status,
          triageLevel: patient.triage_level,
          triageNotes: patient.triage_notes,
          createdAt: patient.created_at,
          calledAt: patient.called_at,
          completedAt: patient.completed_at
        },
        doctor: doctor ? {
          id: doctor.id,
          name: doctor.name,
          qualification: doctor.qualification,
          designation: doctor.designation,
          roomNumber: doctor.room_number,
          opdTiming: doctor.opd_timing,
          availability: doctor.availability_status
        } : {
          name: dept.doctor_in_charge,
          qualification: 'Senior Specialist',
          designation: 'Attending Doctor',
          roomNumber: dept.room_number
        },
        department: {
          id: dept.id,
          code: dept.code,
          name: dept.name,
          hindiName: dept.hindi_name,
          tamilName: dept.tamil_name,
          roomNumber: doctor ? doctor.room_number : dept.room_number,
          doctorInCharge: doctor ? doctor.name : dept.doctor_in_charge,
          avgServiceTimeMins: dept.avg_service_time_mins,
          color: dept.color,
          icon: dept.icon,
          landmark: dept.landmark
        },
        floor: {
          id: floor.id,
          name: floor.name,
          hindiName: floor.hindi_name,
          tamilName: floor.tamil_name,
          level: floor.level
        },
        ward: {
          id: ward.id,
          name: ward.name,
          hindiName: ward.hindi_name,
          tamilName: ward.tamil_name,
          wing: ward.wing,
          code: ward.code
        },
        navigation: {
          directionsText: dept.directions_text,
          directionsHindi: dept.directions_hindi,
          directionsTamil: dept.directions_tamil,
          summary: `Floor: ${floor.name} (Level ${floor.level}) → ${ward.wing} → ${ward.name} → ${doctor ? doctor.room_number : dept.room_number}`
        },
        queue: {
          position: queuePosition,
          aheadCount,
          estimatedWaitMins: waitMins,
          status: patient.status
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /slips/:token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. GET /api/queue/:token
router.get('/queue/:token', async (req, res) => {
  try {
    const database = await db();
    const token = req.params.token.toUpperCase().trim();

    const patient = database.get('SELECT * FROM patients WHERE UPPER(token_number) = ?;', [token]);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Token ${token} not found.` });
    }

    const dept = database.get('SELECT * FROM departments WHERE id = ?;', [patient.department_id]);
    const floor = database.get('SELECT * FROM floors WHERE id = ?;', [dept.floor_id]);
    const doctor = patient.doctor_id 
      ? database.get('SELECT * FROM doctors WHERE id = ?;', [patient.doctor_id])
      : null;

    // Check who is currently called/consulting in this department
    const currentlyActive = database.query(`
      SELECT token_number, name, status, called_at
      FROM patients
      WHERE department_id = ? AND (status = 'CALLED' OR status = 'IN_CONSULTATION')
      ORDER BY called_at DESC LIMIT 1;
    `, [patient.department_id]);

    const activeToken = currentlyActive.length > 0 ? currentlyActive[0].token_number : null;

    // Queue count & overcrowding
    const waitingPatients = database.query(`
      SELECT COUNT(*) AS count
      FROM patients
      WHERE department_id = ? AND status = 'WAITING';
    `, [patient.department_id]);
    const totalWaitingInDept = waitingPatients[0]?.count || 0;

    let overcrowding = 'NORMAL';
    if (totalWaitingInDept >= 8) overcrowding = 'OVERCROWDED';
    else if (totalWaitingInDept >= 4) overcrowding = 'MODERATE';

    // Position calculation
    let queuePosition = 0;
    let aheadCount = 0;
    let waitMins = 0;

    if (patient.is_emergency) {
      const emerAhead = database.query(`
        SELECT COUNT(*) AS count
        FROM patients
        WHERE is_emergency = 1 AND status = 'WAITING' AND created_at < ?;
      `, [patient.created_at]);
      aheadCount = emerAhead[0]?.count || 0;
      queuePosition = aheadCount + 1;
      waitMins = 0;
    } else if (patient.status === 'WAITING') {
      const ahead = database.query(`
        SELECT COUNT(*) AS count
        FROM patients
        WHERE department_id = ? 
          AND status = 'WAITING' 
          AND (priority_score > ? OR (priority_score = ? AND created_at < ?))
          AND id != ?;
      `, [patient.department_id, patient.priority_score, patient.priority_score, patient.created_at, patient.id]);
      aheadCount = ahead[0]?.count || 0;
      queuePosition = aheadCount + 1;
      waitMins = aheadCount * dept.avg_service_time_mins;
    }

    const isNearTurn = (patient.status === 'CALLED') || (patient.status === 'WAITING' && queuePosition <= 2);

    let alertMessage = '';
    let alertHindi = '';
    let alertTamil = '';

    const doctorName = doctor ? doctor.name : dept.doctor_in_charge;
    const roomNum = doctor ? doctor.room_number : dept.room_number;

    if (patient.is_emergency) {
      alertMessage = 'EMERGENCY PROTOCOL: Immediate assessment active. Proceed directly to Trauma Bay 1!';
      alertHindi = 'आपातकालीन प्रोटोकॉल: तत्काल जांच सक्रिय। सीधे ट्रॉमा बे 1 पर जाएँ!';
      alertTamil = 'அவசர சிகிச்சை நெறிமுறை: உடனடியாக ட்ராமா பே 1-க்கு செல்லவும்!';
    } else if (patient.status === 'CALLED') {
      alertMessage = `${doctorName} is calling your token now! Please enter ${roomNum} immediately.`;
      alertHindi = `डॉक्टर आपका टोकन बुला रहे हैं! कृपया तुरंत कक्ष ${roomNum} में प्रवेश करें।`;
      alertTamil = `மருத்துவர் உங்களை அழைக்கிறார்! தயவுசெய்து உடனே அறை ${roomNum}-க்குள் செல்லவும்.`;
    } else if (patient.status === 'IN_CONSULTATION') {
      alertMessage = `Consultation currently in progress with ${doctorName}.`;
      alertHindi = `${doctorName} के साथ परामर्श वर्तमान में जारी है।`;
      alertTamil = `${doctorName} உடன் மருத்துவ ஆலோசனை நடைபெறுகிறது.`;
    } else if (patient.status === 'COMPLETED') {
      alertMessage = 'Your OPD consultation is completed. Please proceed to Pharmacy or Diagnostics.';
      alertHindi = 'आपका परामर्श पूर्ण हुआ। कृपया फार्मेसी या जांच केंद्र की ओर जाएँ।';
      alertTamil = 'உங்கள் ஆலோசனை முடிந்தது. மருந்தகம் அல்லது பரிசோதனை மையத்திற்கு செல்லவும்.';
    } else if (queuePosition === 1) {
      alertMessage = `Your turn is NEXT! Please stand by right outside ${roomNum}.`;
      alertHindi = `अगली बारी आपकी है! कृपया कक्ष ${roomNum} के बाहर तैयार रहें।`;
      alertTamil = `அடுத்த முறை உங்களுடையது! தயவுசெய்து அறை ${roomNum} வெளியே காத்திருக்கவும்.`;
    } else if (queuePosition <= 2) {
      alertMessage = `Your turn is near (Position #${queuePosition}). Please be seated in the waiting area.`;
      alertHindi = `आपकी बारी पास है (क्रम संख्या #${queuePosition})। कृपया प्रतीक्षालय में बैठें।`;
      alertTamil = `உங்கள் முறை மிக அருகில் உள்ளது (#${queuePosition}). காத்திருப்பு பகுதியில் அமரவும்.`;
    } else {
      alertMessage = `Position #${queuePosition} in line. Estimated wait time is ~${waitMins} minutes.`;
      alertHindi = `कतार में स्थिति #${queuePosition}। अनुमानित प्रतीक्षा समय लगभग ${waitMins} मिनट है।`;
      alertTamil = `வரிசையில் உங்கள் எண் #${queuePosition}. காத்திருப்பு நேரம் தோராயமாக ${waitMins} நிமிடங்கள்.`;
    }

    res.json({
      success: true,
      tokenNumber: patient.token_number,
      patientName: patient.name,
      patientAge: patient.age,
      status: patient.status,
      appointmentType: patient.appointment_type || 'WALKIN',
      slotTime: patient.slot_time,
      isEmergency: Boolean(patient.is_emergency),
      doctor: doctor ? {
        id: doctor.id,
        name: doctor.name,
        qualification: doctor.qualification,
        designation: doctor.designation,
        roomNumber: doctor.room_number
      } : null,
      department: {
        id: dept.id,
        name: dept.name,
        roomNumber: roomNum,
        doctor: doctorName,
        floor: floor.name,
        color: dept.color
      },
      queue: {
        position: queuePosition,
        aheadCount,
        estimatedWaitMins: waitMins,
        isNearTurn,
        currentlyActiveToken: activeToken,
        totalWaitingInDept,
        overcrowding
      },
      alert: {
        message: alertMessage,
        hindi: alertHindi,
        tamil: alertTamil,
        isUrgent: isNearTurn || patient.is_emergency
      }
    });
  } catch (error) {
    console.error('Error in GET /queue/:token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. GET /api/navigation/:departmentId
router.get('/navigation/:departmentId', async (req, res) => {
  try {
    const database = await db();
    const deptId = req.params.departmentId.toUpperCase();

    const dept = database.get('SELECT * FROM departments WHERE id = ?;', [deptId]);
    if (!dept) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    const floor = database.get('SELECT * FROM floors WHERE id = ?;', [dept.floor_id]);
    const ward = database.get('SELECT * FROM wards WHERE id = ?;', [dept.ward_id]);

    const steps = [
      {
        stepNumber: 1,
        title: 'Start at Ground Floor Main Entrance & Lobby',
        titleHindi: 'भू-तल मुख्य प्रवेश द्वार एवं लॉबी से शुरू करें',
        titleTamil: 'தரை தளம் முக்கிய நுழைவாயிலில் தொடங்கவும்',
        instruction: 'Stand at the Central Registration & Help Desk Atrium facing the information boards.',
        instructionHindi: 'सूचना पट्ट के सामने केंद्रीय पंजीकरण एवं सहायता केंद्र पर खड़े हों।',
        instructionTamil: 'தகவல் பலகையை நோக்கி மத்திய வரவேற்பு அரங்கில் நிற்கவும்.',
        icon: 'MapPin',
        highlightZone: 'W-REG'
      },
      {
        stepNumber: 2,
        title: floor.level === 0 ? 'Proceed along Ground Floor Corridor' : `Take Lift / Stairs to ${floor.name}`,
        titleHindi: floor.level === 0 ? 'भू-तल के गलियारे में आगे बढ़ें' : `लिफ्ट अथवा सीढ़ियों से ${floor.hindi_name} पर जाएँ`,
        titleTamil: floor.level === 0 ? 'தரை தள நடைபாதை வழியாக செல்லவும்' : `லிஃப்ட் அல்லது படிகள் வழியாக ${floor.tamil_name}-க்கு செல்லவும்`,
        instruction: floor.level === 0 
          ? 'Walk through the central lobby following corridor directional signage.'
          : `Use Lift A (Central) or Accessible Lift B next to help desk to reach Level ${floor.level}.`,
        instructionHindi: floor.level === 0
          ? 'केंद्रीय लॉबी से होते हुए दिशा-सूचक बोर्ड का पालन करें।'
          : `लेवल ${floor.level} पर जाने के लिए लिफ्ट ए या सुलभ लिफ्ट बी का उपयोग करें।`,
        instructionTamil: floor.level === 0
          ? 'மத்திய அரங்கம் வழியாக வழிகாட்டி பலகைகளை பின்பற்றி நடக்கவும்.'
          : `தளம் ${floor.level}-ஐ அடைய லிஃப்ட் ஏ அல்லது லிஃப்ட் பி-ஐ பயன்படுத்தவும்.`,
        icon: floor.level === 0 ? 'Footprints' : 'ArrowUpRight',
        highlightZone: 'LIFT-A'
      },
      {
        stepNumber: 3,
        title: `Enter ${ward.wing} (${ward.name})`,
        titleHindi: `${ward.wing} (${ward.hindi_name}) में प्रवेश करें`,
        titleTamil: `${ward.wing} (${ward.tamil_name})-க்குள் நுழையவும்`,
        instruction: dept.directions_text,
        instructionHindi: dept.directions_hindi,
        instructionTamil: dept.directions_tamil,
        icon: 'Navigation',
        highlightZone: ward.id
      },
      {
        stepNumber: 4,
        title: `Arrive at Destination: ${dept.room_number}`,
        titleHindi: `गंतव्य पर पहुँचे: कक्ष ${dept.room_number}`,
        titleTamil: `இலக்கை அடைந்தீர்கள்: அறை ${dept.room_number}`,
        instruction: `Locate ${dept.name} (${dept.doctor_in_charge}). Landmark: ${dept.landmark}. Check your token on the door screen.`,
        instructionHindi: `${dept.hindi_name} (${dept.doctor_in_charge})। पहचान: ${dept.landmark}। दरवाजे की स्क्रीन पर अपना टोकन देखें।`,
        instructionTamil: `${dept.tamil_name} (${dept.doctor_in_charge}). அடையாளம்: ${dept.landmark}. கதவு திரையில் உங்கள் டோக்கனை சரிபார்க்கவும்.`,
        icon: 'CheckCircle2',
        highlightZone: dept.id
      }
    ];

    res.json({
      success: true,
      department: dept,
      floor,
      ward,
      steps
    });
  } catch (error) {
    console.error('Error in GET /navigation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. GET /api/staff/queues
router.get('/staff/queues', async (req, res) => {
  try {
    const database = await db();

    // Summary stats
    const totalPatients = database.query("SELECT COUNT(*) AS count FROM patients;")[0].count;
    const waitingPatients = database.query("SELECT COUNT(*) AS count FROM patients WHERE status = 'WAITING';")[0].count;
    const activePatients = database.query("SELECT COUNT(*) AS count FROM patients WHERE status = 'CALLED' OR status = 'IN_CONSULTATION';")[0].count;
    const completedPatients = database.query("SELECT COUNT(*) AS count FROM patients WHERE status = 'COMPLETED';")[0].count;
    const emergencyPatients = database.query("SELECT COUNT(*) AS count FROM patients WHERE is_emergency = 1 AND status != 'COMPLETED';")[0].count;

    // All patients list with department and doctor info
    const allPatients = database.query(`
      SELECT p.*, d.name AS dept_name, d.code AS dept_code, d.room_number, d.color AS dept_color, f.name AS floor_name,
             doc.name AS doctor_name, doc.qualification AS doctor_qualification, doc.room_number AS doctor_room
      FROM patients p
      JOIN departments d ON p.department_id = d.id
      JOIN floors f ON d.floor_id = f.id
      LEFT JOIN doctors doc ON p.doctor_id = doc.id
      ORDER BY 
        p.is_emergency DESC,
        CASE p.status
          WHEN 'CALLED' THEN 1
          WHEN 'IN_CONSULTATION' THEN 2
          WHEN 'WAITING' THEN 3
          ELSE 4
        END,
        p.priority_score DESC,
        p.created_at ASC;
    `);

    // Department breakdown
    const departments = database.query(`
      SELECT d.*, f.name AS floor_name, f.level AS floor_level,
        COUNT(CASE WHEN p.status = 'WAITING' THEN 1 END) AS waiting_count,
        COUNT(CASE WHEN p.status = 'CALLED' OR p.status = 'IN_CONSULTATION' THEN 1 END) AS active_count,
        COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) AS completed_count
      FROM departments d
      JOIN floors f ON d.floor_id = f.id
      LEFT JOIN patients p ON d.id = p.department_id
      GROUP BY d.id
      ORDER BY f.level ASC, d.name ASC;
    `);

    const enrichedDepts = departments.map(d => {
      let overcrowding = 'NORMAL';
      if (d.waiting_count >= 8) overcrowding = 'OVERCROWDED';
      else if (d.waiting_count >= 4) overcrowding = 'MODERATE';

      return {
        ...d,
        overcrowding
      };
    });

    res.json({
      success: true,
      stats: {
        total: totalPatients,
        waiting: waitingPatients,
        active: activePatients,
        completed: completedPatients,
        emergency: emergencyPatients,
        hospitalCapacity: Math.min(100, Math.round(((waitingPatients + activePatients) / 30) * 100))
      },
      departments: enrichedDepts,
      patients: allPatients
    });
  } catch (error) {
    console.error('Error in GET /staff/queues:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. PATCH /api/patients/:id/status
router.patch('/patients/:id/status', async (req, res) => {
  try {
    const database = await db();
    const patientId = req.params.id;
    const { status, triage_level, triage_notes, vital_signs } = req.body;

    const patient = database.get('SELECT * FROM patients WHERE id = ?;', [patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    let calledAt = patient.called_at;
    let completedAt = patient.completed_at;

    if (status === 'CALLED' || status === 'IN_CONSULTATION') {
      calledAt = new Date().toISOString();
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      completedAt = new Date().toISOString();
    }

    database.run(`
      UPDATE patients
      SET status = COALESCE(?, status),
          triage_level = COALESCE(?, triage_level),
          triage_notes = COALESCE(?, triage_notes),
          vital_signs = COALESCE(?, vital_signs),
          called_at = ?,
          completed_at = ?
      WHERE id = ?;
    `, [
      status || null,
      triage_level || null,
      triage_notes || null,
      vital_signs || null,
      calledAt,
      completedAt,
      patientId
    ]);

    const updated = database.get('SELECT * FROM patients WHERE id = ?;', [patientId]);
    res.json({ success: true, message: 'Patient status updated successfully', patient: updated });
  } catch (error) {
    console.error('Error in PATCH /patients/:id/status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. POST /api/staff/call-next/:departmentId
router.post('/staff/call-next/:departmentId', async (req, res) => {
  try {
    const database = await db();
    const deptId = req.params.departmentId.toUpperCase();

    // 1. If someone is currently CALLED or IN_CONSULTATION, mark them COMPLETED
    database.run(`
      UPDATE patients
      SET status = 'COMPLETED', completed_at = datetime('now')
      WHERE department_id = ? AND (status = 'CALLED' OR status = 'IN_CONSULTATION');
    `, [deptId]);

    // 2. Find next patient in waiting queue
    const nextPatient = database.get(`
      SELECT * FROM patients
      WHERE department_id = ? AND status = 'WAITING'
      ORDER BY priority_score DESC, created_at ASC
      LIMIT 1;
    `, [deptId]);

    if (!nextPatient) {
      return res.json({ success: true, message: 'No more waiting patients in this queue.', calledPatient: null });
    }

    // 3. Update next patient to CALLED
    database.run(`
      UPDATE patients
      SET status = 'CALLED', called_at = datetime('now')
      WHERE id = ?;
    `, [nextPatient.id]);

    const refreshed = database.get('SELECT * FROM patients WHERE id = ?;', [nextPatient.id]);

    res.json({
      success: true,
      message: `Token ${refreshed.token_number} (${refreshed.name}) called!`,
      calledPatient: refreshed
    });
  } catch (error) {
    console.error('Error in POST /staff/call-next:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. POST /api/simulate/walkins
router.post('/simulate/walkins', async (req, res) => {
  try {
    const database = await db();
    const depts = database.query("SELECT id, code FROM departments WHERE id != 'EMER';");
    const docs = database.query("SELECT id, department_id FROM doctors;");

    const sampleNames = [
      { name: 'Sanjay Deshmukh', age: 48, gender: 'Male', lang: 'hi' },
      { name: 'Anitha Rajendran', age: 62, gender: 'Female', lang: 'ta' },
      { name: 'Deepak Chopra', age: 36, gender: 'Male', lang: 'en' },
      { name: 'Sarita Devi', age: 71, gender: 'Female', lang: 'hi' },
      { name: 'Mohammed Farooq', age: 26, gender: 'Male', lang: 'en' }
    ];

    const added = [];
    for (const s of sampleNames) {
      const randomDept = depts[Math.floor(Math.random() * depts.length)];
      const prefix = randomDept.code;
      const deptDocs = docs.filter(d => d.department_id === randomDept.id);
      const chosenDoc = deptDocs.length > 0 ? deptDocs[Math.floor(Math.random() * deptDocs.length)].id : null;

      const existingTokens = database.query(
        "SELECT token_number FROM patients WHERE token_number LIKE ? ORDER BY id DESC LIMIT 1;",
        [`${prefix}-%`]
      );
      let nextNum = 101;
      if (existingTokens.length > 0) {
        const parts = existingTokens[0].token_number.split('-');
        if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
          nextNum = parseInt(parts[1], 10) + 1;
        }
      }
      const tokenNumber = `${prefix}-${nextNum}`;
      const priorityScore = s.age >= 60 ? 15 : 0;
      const triageLevel = s.age >= 60 ? 'SENIOR' : 'NORMAL';

      database.run(`
        INSERT INTO patients (token_number, name, age, gender, contact, govt_id, department_id, doctor_id, appointment_type, slot_time, is_emergency, preferred_language, status, priority_score, triage_level, triage_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'WALKIN', NULL, 0, ?, 'WAITING', ?, ?, 'Simulated walk-in patient', datetime('now'));
      `, [tokenNumber, s.name, s.age, s.gender, '9800000000', `ABHA-${Math.floor(1000 + Math.random() * 9000)}`, randomDept.id, chosenDoc, s.lang, priorityScore, triageLevel]);

      added.push(tokenNumber);
    }

    res.json({ success: true, message: `Added ${added.length} simulated patients to queues!`, tokens: added });
  } catch (error) {
    console.error('Error in POST /simulate/walkins:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 14. POST /api/reset
router.post('/reset', async (req, res) => {
  try {
    await resetDatabase();
    res.json({ success: true, message: 'OPD SHAATHI Hospital database reset to initial seed state.' });
  } catch (error) {
    console.error('Error in POST /reset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
