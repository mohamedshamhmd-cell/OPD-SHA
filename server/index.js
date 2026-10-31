const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'OPD SHA Hospital - Smart Queue Management & Navigation System',
    timestamp: new Date().toISOString(),
    version: '2.1.0'
  });
});

// API Routes
app.use('/api', apiRoutes);

// Serve built frontend if exists
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback for any non-API route (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>OPD SHA Hospital Portal</title></head>
        <body style="font-family:sans-serif;padding:2rem;text-align:center;">
          <h2>🏥 OPD SHA Hospital Backend Running</h2>
          <p>API endpoints are live at <code>/api/...</code></p>
          <p>Frontend is compiling or building. Run <code>npm run build</code> in the client folder or launch Vite dev server.</p>
        </body>
        </html>
      `);
    }
  });
});

async function startServer() {
  try {
    await getDb(); // ensure DB initialized & seeded
    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🏥 OPD SHA HOSPITAL BACKEND IS READY!`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`📡 API Endpoints at: http://localhost:${PORT}/api/departments`);
      console.log(`👨‍⚕️ Doctors Roster at: http://localhost:${PORT}/api/doctors`);
      console.log(`======================================================\n`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        const altPort = 5001;
        console.warn(`Port ${PORT} in use, attempting ${altPort}...`);
        app.listen(altPort, () => {
          console.log(`Server started on alternative port: http://localhost:${altPort}`);
        });
      } else {
        console.error('Server error:', e);
      }
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
  }
}

startServer();
