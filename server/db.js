const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'hospital.sqlite');

let dbInstance = null;

// Helper to convert sql.js exec result to array of objects
function resultToObjects(res) {
  if (!res || res.length === 0) return [];
  const { columns, values } = res[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

async function getDb() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from disk.');
    } catch (err) {
      console.warn('Failed reading existing DB, initializing fresh:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory SQLite database instance.');
  }

  const dbWrapper = {
    rawDb: db,
    save() {
      try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_FILE, buffer);
      } catch (e) {
        console.error('Error saving SQLite database to disk:', e);
      }
    },
    query(sql, params = []) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    get(sql, params = []) {
      const rows = this.query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    },
    run(sql, params = []) {
      db.run(sql, params);
      this.save();
      // Return last insert id
      const res = db.exec('SELECT last_insert_rowid() AS id;');
      if (res && res[0] && res[0].values && res[0].values[0]) {
        return { lastInsertRowid: res[0].values[0][0] };
      }
      return { lastInsertRowid: null };
    }
  };

  dbInstance = dbWrapper;
  await initSchemaAndSeed(dbWrapper);
  return dbWrapper;
}

async function initSchemaAndSeed(db) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS floors (
      id TEXT PRIMARY KEY,
      level INTEGER NOT NULL,
      name TEXT NOT NULL,
      hindi_name TEXT,
      tamil_name TEXT,
      description TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wards (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hindi_name TEXT,
      tamil_name TEXT,
      wing TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (floor_id) REFERENCES floors(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      hindi_name TEXT NOT NULL,
      tamil_name TEXT NOT NULL,
      floor_id TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      room_number TEXT NOT NULL,
      doctor_in_charge TEXT NOT NULL,
      avg_service_time_mins INTEGER DEFAULT 8,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      directions_text TEXT NOT NULL,
      directions_hindi TEXT NOT NULL,
      directions_tamil TEXT NOT NULL,
      landmark TEXT NOT NULL,
      FOREIGN KEY (floor_id) REFERENCES floors(id),
      FOREIGN KEY (ward_id) REFERENCES wards(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      name TEXT NOT NULL,
      qualification TEXT NOT NULL,
      designation TEXT NOT NULL,
      room_number TEXT NOT NULL,
      availability_status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'IN_CONSULTATION', 'ON_ROUND', 'BREAK'
      opd_timing TEXT NOT NULL,
      experience_years INTEGER DEFAULT 10,
      gender TEXT DEFAULT 'Male',
      languages TEXT DEFAULT 'English, Hindi',
      rating REAL DEFAULT 4.8,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT,
      contact TEXT,
      govt_id TEXT,
      department_id TEXT NOT NULL,
      doctor_id TEXT,
      appointment_type TEXT DEFAULT 'WALKIN', -- 'WALKIN', 'APPOINTMENT'
      slot_time TEXT,
      is_emergency INTEGER DEFAULT 0,
      preferred_language TEXT DEFAULT 'en',
      status TEXT DEFAULT 'WAITING', -- 'WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'
      priority_score INTEGER DEFAULT 0,
      triage_level TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'SENIOR', 'CRITICAL', 'URGENT'
      triage_notes TEXT,
      vital_signs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      called_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );
  `);

  // Check if doctors table is populated
  const existingDocs = db.query('SELECT COUNT(*) AS count FROM doctors;');
  if (existingDocs[0].count === 0) {
    seedData(db);
  }
}

function seedData(db) {
  console.log('Seeding OPD SHAATHI Hospital data...');

  // Clear existing if any
  db.run('DELETE FROM patients;');
  db.run('DELETE FROM doctors;');
  db.run('DELETE FROM departments;');
  db.run('DELETE FROM wards;');
  db.run('DELETE FROM floors;');

  // 1. Floors (Ground, 1st, 2nd)
  const floors = [
    { id: 'GF', level: 0, name: 'Ground Floor', hindi_name: 'भू-तल (ग्राउंड फ्लोर)', tamil_name: 'தரை தளம்', description: 'Emergency, Registration, General Medicine, Pharmacy & Diagnostics' },
    { id: 'F1', level: 1, name: 'First Floor', hindi_name: 'प्रथम तल (पहली मंजिल)', tamil_name: 'முதல் தளம்', description: 'Cardiology, Pediatrics & Minor OT' },
    { id: 'F2', level: 2, name: 'Second Floor', hindi_name: 'द्वितीय तल (दूसरी मंजिल)', tamil_name: 'இரண்டாம் தளம்', description: 'Orthopedics, Gynecology & Physiotherapy' }
  ];

  for (const f of floors) {
    db.run(
      'INSERT INTO floors (id, level, name, hindi_name, tamil_name, description) VALUES (?, ?, ?, ?, ?, ?);',
      [f.id, f.level, f.name, f.hindi_name, f.tamil_name, f.description]
    );
  }

  // 2. 8 Wards / Areas
  const wards = [
    { id: 'W-EMER', floor_id: 'GF', name: 'Emergency & Red Trauma Zone', hindi_name: 'आपातकालीन एवं ट्रॉमा वार्ड', tamil_name: 'அவசர சிகிச்சை பிரிவு', wing: 'East Wing', code: 'EMER-01', description: 'Rapid resuscitation and triage' },
    { id: 'W-REG', floor_id: 'GF', name: 'Central Lobby & Help Desk', hindi_name: 'केंद्रीय लॉबी एवं सहायता केंद्र', tamil_name: 'மத்திய வரவேற்பு அரங்கம்', wing: 'Central Atrium', code: 'LOBBY-01', description: 'Main OPD registration and help desk' },
    { id: 'W-MED', floor_id: 'GF', name: 'General Medicine Wing', hindi_name: 'सामान्य चिकित्सा वार्ड', tamil_name: 'பொது மருத்துவ பிரிவு', wing: 'West Wing', code: 'MED-01', description: 'Adult outpatient consultation' },
    { id: 'W-DIAG', floor_id: 'GF', name: 'Diagnostics & Radiology', hindi_name: 'जांच एवं रेडियोलॉजी विभाग', tamil_name: 'பரிசோதனை மற்றும் கதிரியக்கவியல்', wing: 'North Wing', code: 'DIAG-01', description: 'X-Ray, Ultrasound and Sample Collection' },
    { id: 'W-CARD', floor_id: 'F1', name: 'Cardiology & Chest Clinic', hindi_name: 'हृदय रोग विभाग (कार्डियोलॉजी)', tamil_name: 'இதயவியல் பிரிவு', wing: 'East Wing', code: 'CARD-01', description: 'ECG, Echocardiography and Heart Specialist OPD' },
    { id: 'W-PED', floor_id: 'F1', name: 'Pediatrics & Child Care Ward', hindi_name: 'बाल रोग विभाग (पीडियाट्रिक्स)', tamil_name: 'குழந்தைகள் நல பிரிவு', wing: 'West Wing', code: 'PED-01', description: 'Immunization, child health and neonatology' },
    { id: 'W-ORTH', floor_id: 'F2', name: 'Orthopedics & Bone Health', hindi_name: 'अस्थि रोग विभाग (ऑर्थोपेडिक्स)', tamil_name: 'எலும்பியல் பிரிவு', wing: 'East Wing', code: 'ORTH-01', description: 'Joint pain, fractures and plaster room' },
    { id: 'W-GYN', floor_id: 'F2', name: 'Obstetrics & Gynecology OPD', hindi_name: 'प्रसूति एवं स्त्री रोग विभाग', tamil_name: 'மகளிர் மற்றும் மகப்பேறு பிரிவு', wing: 'West Wing', code: 'GYN-01', description: 'Antenatal checkup and maternal welfare' }
  ];

  for (const w of wards) {
    db.run(
      'INSERT INTO wards (id, floor_id, name, hindi_name, tamil_name, wing, code, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [w.id, w.floor_id, w.name, w.hindi_name, w.tamil_name, w.wing, w.code, w.description]
    );
  }

  // 3. Departments
  const departments = [
    {
      id: 'EMER',
      code: 'EMER',
      name: 'Emergency & Trauma Care',
      hindi_name: 'आपातकालीन चिकित्सा',
      tamil_name: 'அவசர சிகிச்சை',
      floor_id: 'GF',
      ward_id: 'W-EMER',
      room_number: 'Bay 1 (Red Zone)',
      doctor_in_charge: 'Dr. Vikram Singhania',
      avg_service_time_mins: 5,
      color: '#ef4444',
      icon: 'Activity',
      directions_text: 'From Main Entrance, immediately turn LEFT into the Red Corridor. Do not use stairs. Proceed directly to Trauma Bay 1.',
      directions_hindi: 'मुख्य प्रवेश द्वार से तुरंत बाएँ लाल गलियारे में जाएँ। सीढ़ियों का उपयोग न करें। सीधे ट्रॉमा बे 1 पर जाएँ।',
      directions_tamil: 'முக்கிய நுழைவாயிலில் இருந்து உடனே இடதுபுறம் உள்ள சிவப்பு பாதை வழியாக செல்லவும். நேராக ட்ராமா பே 1-க்கு செல்லவும்.',
      landmark: 'Next to Ambulance Bay, Follow Red Floor Line'
    },
    {
      id: 'GENMED',
      code: 'GEN',
      name: 'General Medicine OPD',
      hindi_name: 'सामान्य चिकित्सा (ओ.पी.डी)',
      tamil_name: 'பொது மருத்துவம்',
      floor_id: 'GF',
      ward_id: 'W-MED',
      room_number: 'Room 012',
      doctor_in_charge: 'Dr. Anita Verma',
      avg_service_time_mins: 7,
      color: '#10b981',
      icon: 'Stethoscope',
      directions_text: 'From Central Registration, walk straight 30 meters down West Hallway. Follow Green Floor Line to Room 012 on the right.',
      directions_hindi: 'केंद्रीय पंजीकरण से पश्चिम हॉलवे में 30 मीटर सीधे चलें। हरे रंग की लाइन का पालन कर दाईं ओर कक्ष 012 पर जाएँ।',
      directions_tamil: 'மத்திய பதிவிலிருந்து மேற்கு நடைபாதையில் 30 மீட்டர் நேராக செல்லவும். பச்சை கோட்டைப் பின்பற்றி அறை 012-ஐ அடையவும்.',
      landmark: 'Opposite Drinking Water Station, Ground Floor'
    },
    {
      id: 'CARD',
      code: 'CARD',
      name: 'Cardiology OPD',
      hindi_name: 'हृदय रोग विभाग (ओ.पी.डी)',
      tamil_name: 'இதயவியல் பிரிவு',
      floor_id: 'F1',
      ward_id: 'W-CARD',
      room_number: 'Room 104',
      doctor_in_charge: 'Dr. Rajesh Mehta',
      avg_service_time_mins: 10,
      color: '#3b82f6',
      icon: 'HeartPulse',
      directions_text: 'Take Lift A or Central Stairs to Floor 1. Turn RIGHT into East Wing, follow Blue Line to Cardiology Room 104.',
      directions_hindi: 'लिफ्ट ए या मुख्य सीढ़ियों से पहली मंजिल (Floor 1) पर जाएँ। दाईं ओर मुड़ें और नीली लाइन का पालन कर कक्ष 104 पर पहुँचें।',
      directions_tamil: 'லிஃப்ட் ஏ அல்லது படிகள் மூலம் முதல் தளத்திற்கு செல்லவும். வலதுபுறம் திரும்பி நீல நிற கோட்டைப் பின்பற்றி அறை 104-க்கு செல்லவும்.',
      landmark: 'First Floor East Wing, next to ECG Lab'
    },
    {
      id: 'PEDI',
      code: 'PEDI',
      name: 'Pediatrics & Child OPD',
      hindi_name: 'बाल रोग विभाग (ओ.पी.डी)',
      tamil_name: 'குழந்தைகள் நல பிரிவு',
      floor_id: 'F1',
      ward_id: 'W-PED',
      room_number: 'Room 112',
      doctor_in_charge: 'Dr. Meenakshi Sundaram',
      avg_service_time_mins: 8,
      color: '#f59e0b',
      icon: 'Baby',
      directions_text: 'Take Lift A to Floor 1. Turn LEFT into West Wing, follow Yellow Line past immunization lounge to Room 112.',
      directions_hindi: 'लिफ्ट ए से पहली मंजिल पर जाएँ। बाईं ओर पश्चिम विंग में मुड़ें और पीली लाइन का पालन कर कक्ष 112 तक पहुँचें।',
      directions_tamil: 'லிஃப்ட் ஏ வழியாக முதல் தளத்திற்கு சென்று, இடதுபுறம் திரும்பி மஞ்சள் கோட்டைப் பின்பற்றி அறை 112-க்கு செல்லவும்.',
      landmark: 'Next to Child Play & Immunization Area'
    },
    {
      id: 'ORTH',
      code: 'ORTH',
      name: 'Orthopedics & Joint Clinic',
      hindi_name: 'हड्डी एवं जोड़ रोग (ओ.पी.डी)',
      tamil_name: 'எலும்பியல் பிரிவு',
      floor_id: 'F2',
      ward_id: 'W-ORTH',
      room_number: 'Room 204',
      doctor_in_charge: 'Dr. Arun Saxena',
      avg_service_time_mins: 9,
      color: '#8b5cf6',
      icon: 'Bone',
      directions_text: 'Take Lift B (Accessible Lift) directly to Floor 2. Turn RIGHT into East Wing, follow Purple Line to Room 204.',
      directions_hindi: 'लिफ्ट बी (सुलभ लिफ्ट) से सीधे दूसरी मंजिल पर जाएँ। दाईं ओर मुड़ें और बैंगनी लाइन का पालन करते हुए कक्ष 204 पर पहुँचें।',
      directions_tamil: 'லிஃப்ட் பி வழியாக இரண்டாம் தளத்திற்கு செல்லவும். வலதுபுறம் திரும்பி ஊதா நிற கோட்டைப் பின்பற்றி அறை 204-க்கு செல்லவும்.',
      landmark: 'Second Floor East Wing, adjacent to Plaster Room'
    },
    {
      id: 'GYN',
      code: 'GYN',
      name: 'Obstetrics & Gynecology OPD',
      hindi_name: 'स्त्री एवं प्रसूति रोग विभाग',
      tamil_name: 'மகளிர் நல பிரிவு',
      floor_id: 'F2',
      ward_id: 'W-GYN',
      room_number: 'Room 215',
      doctor_in_charge: 'Dr. Kavita Deshmukh',
      avg_service_time_mins: 8,
      color: '#ec4899',
      icon: 'Flower2',
      directions_text: 'Take Lift B to Floor 2. Turn LEFT into West Wing, follow Pink Line to Antenatal OPD Room 215.',
      directions_hindi: 'लिफ्ट बी से दूसरी मंजिल पर जाएँ। बाईं ओर मुड़ें और गुलाबी लाइन का पालन कर कक्ष 215 तक पहुँचें।',
      directions_tamil: 'லிஃப்ட் பி வழியாக இரண்டாம் தளத்திற்கு சென்று, இடதுபுறம் திரும்பி இளஞ்சிவப்பு கோட்டைப் பின்பற்றி அறை 215-க்கு செல்லவும்.',
      landmark: 'Second Floor West Wing, Quiet Maternity Corridor'
    },
    {
      id: 'RADIO',
      code: 'RAD',
      name: 'Radiology, X-Ray & Ultrasound',
      hindi_name: 'रेडियोलॉजी एवं एक्स-रे विभाग',
      tamil_name: 'கதிரியக்கவியல் & எக்ஸ்-ரே',
      floor_id: 'GF',
      ward_id: 'W-DIAG',
      room_number: 'Room 018',
      doctor_in_charge: 'Dr. Suresh Reddy',
      avg_service_time_mins: 6,
      color: '#06b6d4',
      icon: 'ScanLine',
      directions_text: 'From Registration, take the North Corridor straight ahead. Follow Cyan Line to Diagnostics Desk Room 018.',
      directions_hindi: 'पंजीकरण से सीधे उत्तर गलियारे में जाएँ। स्यान (हल्का नीला) लाइन का पालन कर कक्ष 018 पर पहुँचें।',
      directions_tamil: 'பதிவு மையத்திலிருந்து நேராக வடக்கு நடைபாதை வழியாக சென்று, சியான் கோட்டைப் பின்பற்றி அறை 018-ஐ அடையவும்.',
      landmark: 'Ground Floor North Corridor, next to Blood Bank'
    }
  ];

  for (const d of departments) {
    db.run(
      `INSERT INTO departments (id, code, name, hindi_name, tamil_name, floor_id, ward_id, room_number, doctor_in_charge, avg_service_time_mins, color, icon, directions_text, directions_hindi, directions_tamil, landmark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [d.id, d.code, d.name, d.hindi_name, d.tamil_name, d.floor_id, d.ward_id, d.room_number, d.doctor_in_charge, d.avg_service_time_mins, d.color, d.icon, d.directions_text, d.directions_hindi, d.directions_tamil, d.landmark]
    );
  }

  // 4. Detailed Doctors List for Each Department
  const doctors = [
    // Cardiology Doctors
    { id: 'DOC-CARD-1', department_id: 'CARD', name: 'Dr. Rajesh Mehta', qualification: 'MBBS, MD, DM (Cardiology)', designation: 'Senior Consultant & HOD', room_number: 'Room 104-A', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 01:00 PM', experience_years: 18, gender: 'Male', languages: 'English, Hindi, Gujarati', rating: 4.9 },
    { id: 'DOC-CARD-2', department_id: 'CARD', name: 'Dr. Sunita Kulkarni', qualification: 'MBBS, MD, FACC (Interventional)', designation: 'Associate Professor & Cardiologist', room_number: 'Room 104-B', availability_status: 'AVAILABLE', opd_timing: '10:00 AM - 02:00 PM', experience_years: 14, gender: 'Female', languages: 'English, Hindi, Marathi', rating: 4.8 },
    { id: 'DOC-CARD-3', department_id: 'CARD', name: 'Dr. Arvind Swaminathan', qualification: 'MBBS, DNB (Cardiology), FESC', designation: 'Cardiac Electrophysiologist', room_number: 'Room 104-C', availability_status: 'ON_ROUND', opd_timing: '01:00 PM - 05:00 PM', experience_years: 11, gender: 'Male', languages: 'English, Hindi, Tamil', rating: 4.7 },

    // Orthopedics Doctors
    { id: 'DOC-ORTH-1', department_id: 'ORTH', name: 'Dr. Arun Saxena', qualification: 'MBBS, MS (Orthopedics), M.Ch', designation: 'Chief Joint Replacement Surgeon', room_number: 'Room 204-A', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 01:30 PM', experience_years: 20, gender: 'Male', languages: 'English, Hindi', rating: 4.9 },
    { id: 'DOC-ORTH-2', department_id: 'ORTH', name: 'Dr. Manisha Gupta', qualification: 'MBBS, DNB (Ortho), Fellowship Spine', designation: 'Consultant Spine & Trauma', room_number: 'Room 204-B', availability_status: 'AVAILABLE', opd_timing: '11:00 AM - 04:00 PM', experience_years: 12, gender: 'Female', languages: 'English, Hindi, Punjabi', rating: 4.8 },

    // Pediatrics Doctors
    { id: 'DOC-PED-1', department_id: 'PEDI', name: 'Dr. Meenakshi Sundaram', qualification: 'MBBS, MD (Pediatrics), FIAP', designation: 'Head of Pediatric Services', room_number: 'Room 112-A', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 02:00 PM', experience_years: 16, gender: 'Female', languages: 'English, Hindi, Tamil', rating: 4.9 },
    { id: 'DOC-PED-2', department_id: 'PEDI', name: 'Dr. Rohan Varma', qualification: 'MBBS, DCH, Fellowship Neonatology', designation: 'Consultant Pediatrician', room_number: 'Room 112-B', availability_status: 'AVAILABLE', opd_timing: '12:00 PM - 05:00 PM', experience_years: 9, gender: 'Male', languages: 'English, Hindi', rating: 4.7 },

    // General Medicine Doctors
    { id: 'DOC-MED-1', department_id: 'GENMED', name: 'Dr. Anita Verma', qualification: 'MBBS, MD (Internal Medicine)', designation: 'Senior Physician & Diabetologist', room_number: 'Room 012-A', availability_status: 'AVAILABLE', opd_timing: '08:30 AM - 01:30 PM', experience_years: 17, gender: 'Female', languages: 'English, Hindi', rating: 4.9 },
    { id: 'DOC-MED-2', department_id: 'GENMED', name: 'Dr. Pradeep Joshi', qualification: 'MBBS, DNB (Family Medicine)', designation: 'Consultant General Physician', room_number: 'Room 012-B', availability_status: 'AVAILABLE', opd_timing: '10:00 AM - 03:00 PM', experience_years: 13, gender: 'Male', languages: 'English, Hindi, Marathi', rating: 4.8 },
    { id: 'DOC-MED-3', department_id: 'GENMED', name: 'Dr. Deepa Nambiar', qualification: 'MBBS, MD (General Medicine)', designation: 'Assistant Professor of Medicine', room_number: 'Room 012-C', availability_status: 'BREAK', opd_timing: '01:00 PM - 05:30 PM', experience_years: 8, gender: 'Female', languages: 'English, Hindi, Malayalam', rating: 4.7 },

    // Obstetrics & Gynecology Doctors
    { id: 'DOC-GYN-1', department_id: 'GYN', name: 'Dr. Kavita Deshmukh', qualification: 'MBBS, MS (OB-GYN), FICOG', designation: 'Chief Gynecologist & Obstetrician', room_number: 'Room 215-A', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 01:00 PM', experience_years: 19, gender: 'Female', languages: 'English, Hindi, Marathi', rating: 4.9 },
    { id: 'DOC-GYN-2', department_id: 'GYN', name: 'Dr. Shalini Sen', qualification: 'MBBS, DGO, Fellowship Maternal Health', designation: 'Consultant High-Risk Pregnancy', room_number: 'Room 215-B', availability_status: 'AVAILABLE', opd_timing: '11:30 AM - 04:30 PM', experience_years: 11, gender: 'Female', languages: 'English, Hindi, Bengali', rating: 4.8 },

    // Radiology & Diagnostics Doctors
    { id: 'DOC-RAD-1', department_id: 'RADIO', name: 'Dr. Suresh Reddy', qualification: 'MBBS, MD (Radiodiagnosis)', designation: 'HOD & Senior Radiologist', room_number: 'Room 018-A', availability_status: 'AVAILABLE', opd_timing: '08:00 AM - 02:00 PM', experience_years: 15, gender: 'Male', languages: 'English, Hindi, Telugu', rating: 4.8 },
    { id: 'DOC-RAD-2', department_id: 'RADIO', name: 'Dr. Ananya Das', qualification: 'MBBS, DMRD (Ultrasound Specialist)', designation: 'Consultant Sonologist', room_number: 'Room 018-B', availability_status: 'AVAILABLE', opd_timing: '10:00 AM - 04:00 PM', experience_years: 10, gender: 'Female', languages: 'English, Hindi', rating: 4.7 },

    // Emergency & Trauma Doctors
    { id: 'DOC-EMER-1', department_id: 'EMER', name: 'Dr. Vikram Singhania', qualification: 'MBBS, MS, M.Ch (Trauma & Resuscitation)', designation: 'Head of Emergency & Critical Care', room_number: 'Bay 1 (Red Zone)', availability_status: 'AVAILABLE', opd_timing: '24x7 Emergency Shifts', experience_years: 22, gender: 'Male', languages: 'English, Hindi', rating: 5.0 },
    { id: 'DOC-EMER-2', department_id: 'EMER', name: 'Dr. Farhan Akhtar', qualification: 'MBBS, MD (Emergency Medicine)', designation: 'Emergency Physician (Senior Registrar)', room_number: 'Bay 2 (Trauma)', availability_status: 'AVAILABLE', opd_timing: '24x7 Emergency Shifts', experience_years: 9, gender: 'Male', languages: 'English, Hindi, Urdu', rating: 4.8 }
  ];

  for (const doc of doctors) {
    db.run(
      `INSERT INTO doctors (id, department_id, name, qualification, designation, room_number, availability_status, opd_timing, experience_years, gender, languages, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [doc.id, doc.department_id, doc.name, doc.qualification, doc.designation, doc.room_number, doc.availability_status, doc.opd_timing, doc.experience_years, doc.gender, doc.languages, doc.rating]
    );
  }

  // 5. Sample Patients
  const samplePatients = [
    { token: 'EMER-001', name: 'Rameshwar Lal', age: 58, gender: 'Male', contact: '9876543210', govt_id: 'ABHA-9821-4321', dept: 'EMER', doctor: 'DOC-EMER-1', appt_type: 'WALKIN', slot: null, is_emer: 1, lang: 'hi', status: 'IN_CONSULTATION', priority: 100, triage: 'CRITICAL', notes: 'Severe chest tightness and dyspnea. Immediate oxygen therapy started.' },
    { token: 'CARD-101', name: 'Devendra Kumar', age: 67, gender: 'Male', contact: '9845123456', govt_id: 'ABHA-1122-3344', dept: 'CARD', doctor: 'DOC-CARD-1', appt_type: 'APPOINTMENT', slot: '09:30 AM - 10:00 AM', is_emer: 0, lang: 'hi', status: 'CALLED', priority: 10, triage: 'SENIOR', notes: 'Follow-up hypertension' },
    { token: 'CARD-102', name: 'Lakshmi Narayanan', age: 52, gender: 'Female', contact: '9876501234', govt_id: 'AADHAAR-8901', dept: 'CARD', doctor: 'DOC-CARD-2', appt_type: 'WALKIN', slot: null, is_emer: 0, lang: 'ta', status: 'WAITING', priority: 0, triage: 'NORMAL', notes: 'Routine cardiac evaluation' },
    { token: 'CARD-103', name: 'Amitabh Sen', age: 44, gender: 'Male', contact: '9822334455', govt_id: 'ABHA-5544-3322', dept: 'CARD', doctor: 'DOC-CARD-1', appt_type: 'APPOINTMENT', slot: '10:30 AM - 11:00 AM', is_emer: 0, lang: 'en', status: 'WAITING', priority: 0, triage: 'NORMAL', notes: 'Palpitations review' },
    { token: 'ORTH-101', name: 'Kusum Devi', age: 63, gender: 'Female', contact: '9711223344', govt_id: 'AADHAAR-4411', dept: 'ORTH', doctor: 'DOC-ORTH-1', appt_type: 'WALKIN', slot: null, is_emer: 0, lang: 'hi', status: 'CALLED', priority: 10, triage: 'SENIOR', notes: 'Right knee osteoarthritis' },
    { token: 'ORTH-102', name: 'John Mathew', age: 34, gender: 'Male', contact: '9944556677', govt_id: 'ABHA-6677-8899', dept: 'ORTH', doctor: 'DOC-ORTH-2', appt_type: 'APPOINTMENT', slot: '11:30 AM - 12:00 PM', is_emer: 0, lang: 'en', status: 'WAITING', priority: 0, triage: 'NORMAL', notes: 'Sprained left ankle' },
    { token: 'GEN-101', name: 'Pooja Sharma', age: 29, gender: 'Female', contact: '9811224466', govt_id: 'ABHA-3344-5566', dept: 'GENMED', doctor: 'DOC-MED-1', appt_type: 'WALKIN', slot: null, is_emer: 0, lang: 'hi', status: 'CALLED', priority: 0, triage: 'NORMAL', notes: 'Viral fever day 3' },
    { token: 'GEN-102', name: 'Mohan Lal', age: 48, gender: 'Male', contact: '9833445566', govt_id: 'AADHAAR-1092', dept: 'GENMED', doctor: 'DOC-MED-2', appt_type: 'APPOINTMENT', slot: '10:00 AM - 10:30 AM', is_emer: 0, lang: 'hi', status: 'WAITING', priority: 0, triage: 'NORMAL', notes: 'Gastric discomfort' },
    { token: 'PEDI-101', name: 'Master Aarav Gupta', age: 5, gender: 'Male', contact: '9810987654', govt_id: 'ABHA-7788-9900', dept: 'PEDI', doctor: 'DOC-PED-1', appt_type: 'WALKIN', slot: null, is_emer: 0, lang: 'en', status: 'CALLED', priority: 10, triage: 'NORMAL', notes: 'Annual booster vaccination' },
    { token: 'PEDI-102', name: 'Baby Ananya', age: 2, gender: 'Female', contact: '9819876543', govt_id: 'ABHA-1234-5678', dept: 'PEDI', doctor: 'DOC-PED-2', appt_type: 'APPOINTMENT', slot: '01:00 PM - 01:30 PM', is_emer: 0, lang: 'hi', status: 'WAITING', priority: 10, triage: 'NORMAL', notes: 'Earache and mild fever' },
    { token: 'GYN-101', name: 'Sunita Patel', age: 31, gender: 'Female', contact: '9870123456', govt_id: 'ABHA-4455-6677', dept: 'GYN', doctor: 'DOC-GYN-1', appt_type: 'WALKIN', slot: null, is_emer: 0, lang: 'hi', status: 'CALLED', priority: 0, triage: 'NORMAL', notes: 'Antenatal ultrasound review' }
  ];

  for (const p of samplePatients) {
    db.run(
      `INSERT INTO patients (token_number, name, age, gender, contact, govt_id, department_id, doctor_id, appointment_type, slot_time, is_emergency, preferred_language, status, priority_score, triage_level, triage_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 minutes'));`,
      [p.token, p.name, p.age, p.gender, p.contact, p.govt_id, p.dept, p.doctor, p.appt_type, p.slot, p.is_emer, p.lang, p.status, p.priority, p.triage, p.notes]
    );
  }

  console.log('Database seeded successfully with OPD SHAATHI Hospital doctors, slots, and active patient queues.');
}

function resetDatabase() {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  dbInstance = null;
  return getDb();
}

module.exports = {
  getDb,
  resetDatabase
};
