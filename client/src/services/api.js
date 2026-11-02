// API Service client for OPD SHA Hospital
// Supports both dynamic backend (via VITE_API_BASE or /api proxy)
// and seamless client-side standalone execution for GitHub Pages static hosting!

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Fallback seed departments for GitHub Pages static deployment
const FALLBACK_DEPARTMENTS = [
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
    landmark: 'Next to Ambulance Bay, Follow Red Floor Line',
    active_count: 2,
    waiting_count: 1,
    floor_name: 'Ground Floor',
    ward_name: 'Emergency & Red Trauma Zone',
    ward_wing: 'East Wing',
    doctor_count: 2
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
    landmark: 'Opposite Drinking Water Station, Ground Floor',
    active_count: 3,
    waiting_count: 2,
    floor_name: 'Ground Floor',
    ward_name: 'General Medicine Wing',
    ward_wing: 'West Wing',
    doctor_count: 2
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
    landmark: 'First Floor East Wing, next to ECG Lab',
    active_count: 4,
    waiting_count: 2,
    floor_name: 'First Floor',
    ward_name: 'Cardiology & Chest Clinic',
    ward_wing: 'East Wing',
    doctor_count: 2
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
    landmark: 'Next to Child Play & Immunization Area',
    active_count: 2,
    waiting_count: 1,
    floor_name: 'First Floor',
    ward_name: 'Pediatrics & Child Care Ward',
    ward_wing: 'West Wing',
    doctor_count: 2
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
    landmark: 'Second Floor East Wing, adjacent to Plaster Room',
    active_count: 3,
    waiting_count: 1,
    floor_name: 'Second Floor',
    ward_name: 'Orthopedics & Bone Health',
    ward_wing: 'East Wing',
    doctor_count: 2
  },
  {
    id: 'GYN',
    code: 'GYN',
    name: 'Obstetrics & Gynecology OPD',
    hindi_name: 'स्त्री एवं प्रसूति रोग विभाग',
    tamil_name: 'மகளிர் நல பிரிவு',
    floor_id: 'F2',
    ward_id: 'W-GYN',
    room_number: 'Room 214',
    doctor_in_charge: 'Dr. Sunita Kulkarni',
    avg_service_time_mins: 10,
    color: '#ec4899',
    icon: 'HeartHandshake',
    directions_text: 'Take Lift B to Floor 2. Turn LEFT into West Wing, follow Pink Line to Room 214.',
    directions_hindi: 'लिफ्ट बी से दूसरी मंजिल पर जाएँ। बाईं ओर पश्चिम विंग में मुड़ें और गुलाबी लाइन का पालन करते हुए कक्ष 214 पर पहुँचें।',
    directions_tamil: 'லிஃப்ட் பி வழியாக இரண்டாம் தளத்திற்கு சென்று, இடதுபுறம் திரும்பி இளஞ்சிவப்பு கோட்டைப் பின்பற்றி அறை 214-க்கு செல்லவும்.',
    landmark: 'Second Floor West Wing, Ante-natal Clinic',
    active_count: 2,
    waiting_count: 1,
    floor_name: 'Second Floor',
    ward_name: 'Obstetrics & Gynecology OPD',
    ward_wing: 'West Wing',
    doctor_count: 2
  }
];

// Fallback seed doctors
const FALLBACK_DOCTORS = [
  { id: 'DOC-EMER-1', department_id: 'EMER', dept_name: 'Emergency & Trauma Care', dept_color: '#ef4444', name: 'Dr. Vikram Singhania', qualification: 'MD (Emergency Medicine), Fellowship Trauma', designation: 'Chief Trauma Consultant', room_number: 'Bay 1 (Red Zone)', availability_status: 'AVAILABLE', opd_timing: '24 Hours Emergency Shift', experience_years: 16, gender: 'Male', languages: 'English, Hindi, Punjabi', rating: 4.9, active_patients_count: 2 },
  { id: 'DOC-EMER-2', department_id: 'EMER', dept_name: 'Emergency & Trauma Care', dept_color: '#ef4444', name: 'Dr. Farhan Akhtar', qualification: 'MBBS, MEM (Emergency)', designation: 'Senior Emergency Medical Officer', room_number: 'Bay 2 (Rapid Triage)', availability_status: 'AVAILABLE', opd_timing: '24 Hours Emergency Shift', experience_years: 9, gender: 'Male', languages: 'English, Hindi, Urdu', rating: 4.7, active_patients_count: 1 },
  { id: 'DOC-MED-1', department_id: 'GENMED', dept_name: 'General Medicine OPD', dept_color: '#10b981', name: 'Dr. Anita Verma', qualification: 'MD (Internal Medicine)', designation: 'Head of Department - Medicine', room_number: 'Room 012', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 02:00 PM', experience_years: 18, gender: 'Female', languages: 'English, Hindi', rating: 4.9, active_patients_count: 3 },
  { id: 'DOC-MED-2', department_id: 'GENMED', dept_name: 'General Medicine OPD', dept_color: '#10b981', name: 'Dr. Suresh Patil', qualification: 'MBBS, DNB (Medicine)', designation: 'Consultant Physician', room_number: 'Room 014', availability_status: 'IN_CONSULTATION', opd_timing: '10:00 AM - 04:00 PM', experience_years: 11, gender: 'Male', languages: 'English, Hindi, Marathi', rating: 4.8, active_patients_count: 2 },
  { id: 'DOC-CARD-1', department_id: 'CARD', dept_name: 'Cardiology OPD', dept_color: '#3b82f6', name: 'Dr. Rajesh Mehta', qualification: 'DM (Cardiology), FACC', designation: 'Senior Interventional Cardiologist', room_number: 'Room 104', availability_status: 'AVAILABLE', opd_timing: '09:30 AM - 01:30 PM', experience_years: 21, gender: 'Male', languages: 'English, Hindi, Gujarati', rating: 5.0, active_patients_count: 3 },
  { id: 'DOC-CARD-2', department_id: 'CARD', dept_name: 'Cardiology OPD', dept_color: '#3b82f6', name: 'Dr. Sneha Raghavan', qualification: 'MD, DNB (Cardiology)', designation: 'Associate Cardiologist & Echo Specialist', room_number: 'Room 106', availability_status: 'AVAILABLE', opd_timing: '11:00 AM - 03:00 PM', experience_years: 12, gender: 'Female', languages: 'English, Hindi, Tamil', rating: 4.9, active_patients_count: 2 },
  { id: 'DOC-PED-1', department_id: 'PEDI', dept_name: 'Pediatrics & Child OPD', dept_color: '#f59e0b', name: 'Dr. Meenakshi Sundaram', qualification: 'MD (Pediatrics), FIAP', designation: 'Senior Pediatrician & Neonatologist', room_number: 'Room 112', availability_status: 'AVAILABLE', opd_timing: '09:00 AM - 01:00 PM', experience_years: 17, gender: 'Female', languages: 'English, Hindi, Tamil', rating: 4.9, active_patients_count: 2 },
  { id: 'DOC-ORTH-1', department_id: 'ORTH', dept_name: 'Orthopedics & Joint Clinic', dept_color: '#8b5cf6', name: 'Dr. Arun Saxena', qualification: 'MS (Orthopedics), MCh (Joint Replacement)', designation: 'Senior Consultant Orthopedic Surgeon', room_number: 'Room 204', availability_status: 'AVAILABLE', opd_timing: '10:00 AM - 02:00 PM', experience_years: 19, gender: 'Male', languages: 'English, Hindi', rating: 4.8, active_patients_count: 2 },
  { id: 'DOC-GYN-1', department_id: 'GYN', dept_name: 'Obstetrics & Gynecology OPD', dept_color: '#ec4899', name: 'Dr. Sunita Kulkarni', qualification: 'MD (Obstetrics & Gynaecology), DGO', designation: 'Senior Consultant Gynecologist', room_number: 'Room 214', availability_status: 'AVAILABLE', opd_timing: '09:30 AM - 02:30 PM', experience_years: 15, gender: 'Female', languages: 'English, Hindi, Marathi', rating: 4.9, active_patients_count: 2 }
];

// Fallback seed patients queue
const INITIAL_MOCK_PATIENTS = [
  { id: 1, token_number: 'EMER-001', name: 'Rameshwar Lal', age: 68, gender: 'Male', contact: '9811223344', govt_id: 'ABHA-1102', department_id: 'EMER', doctor_id: 'DOC-EMER-1', doctor_name: 'Dr. Vikram Singhania', doctor_room: 'Bay 1 (Red Zone)', assigned_nurse: 'Nurse Sarah Jenkins', appointment_type: 'WALKIN', is_emergency: 1, status: 'IN_CONSULTATION', priority_score: 1000, triage_level: 'RED', triage_notes: 'Severe acute chest tightness, diaphoresis. Immediate ECG and cardiac monitor.', created_at: new Date(Date.now() - 35 * 60000).toISOString(), dept_name: 'Emergency & Trauma Care' },
  { id: 2, token_number: 'EMER-002', name: 'Zaid Al-Harbi', age: 24, gender: 'Male', contact: '9822334455', govt_id: 'MED-9921', department_id: 'EMER', doctor_id: 'DOC-EMER-2', doctor_name: 'Dr. Farhan Akhtar', doctor_room: 'Bay 2 (Rapid Triage)', assigned_nurse: 'Nurse Fatima Al-Hassan', appointment_type: 'WALKIN', is_emergency: 1, status: 'ANNOUNCED', priority_score: 900, triage_level: 'RED', triage_notes: 'Severe trauma laceration, active bleeding.', created_at: new Date(Date.now() - 15 * 60000).toISOString(), dept_name: 'Emergency & Trauma Care' },
  { id: 3, token_number: 'CARD-102', name: 'Devaki Ammal', age: 72, gender: 'Female', contact: '9844556677', govt_id: 'AADHAAR-8822', department_id: 'CARD', doctor_id: 'DOC-CARD-1', doctor_name: 'Dr. Rajesh Mehta', doctor_room: 'Room 104', assigned_nurse: 'Nurse Anita Sharma', appointment_type: 'WALKIN', is_emergency: 0, status: 'WAITING', priority_score: 500, triage_level: 'SENIOR', triage_notes: 'Hypertension follow-up and chronic dyspnea on exertion.', created_at: new Date(Date.now() - 25 * 60000).toISOString(), dept_name: 'Cardiology OPD' },
  { id: 4, token_number: 'ORTH-101', name: 'Kusum Devi', age: 65, gender: 'Female', contact: '9711223344', govt_id: 'AADHAAR-4411', department_id: 'ORTH', doctor_id: 'DOC-ORTH-1', doctor_name: 'Dr. Arun Saxena', doctor_room: 'Room 204', assigned_nurse: 'Caretaker Ramesh Kumar', appointment_type: 'WALKIN', is_emergency: 0, status: 'WAITING', priority_score: 500, triage_level: 'SENIOR', triage_notes: 'Right knee osteoarthritis, requires wheelchair escort', created_at: new Date(Date.now() - 22 * 60000).toISOString(), dept_name: 'Orthopedics & Joint Clinic' },
  { id: 5, token_number: 'GEN-104', name: 'Mohit Sharma', age: 34, gender: 'Male', contact: '9877889900', govt_id: null, department_id: 'GENMED', doctor_id: 'DOC-MED-1', doctor_name: 'Dr. Anita Verma', doctor_room: 'Room 012', assigned_nurse: null, appointment_type: 'WALKIN', is_emergency: 0, status: 'WAITING', priority_score: 100, triage_level: 'GREEN', triage_notes: 'Seasonal viral fever, headache, dehydration', created_at: new Date(Date.now() - 18 * 60000).toISOString(), dept_name: 'General Medicine OPD' },
  { id: 6, token_number: 'PEDI-102', name: 'Baby Anaya (Mother: Pooja)', age: 4, gender: 'Female', contact: '9899001122', govt_id: 'ABHA-3399', department_id: 'PEDI', doctor_id: 'DOC-PED-1', doctor_name: 'Dr. Meenakshi Sundaram', doctor_room: 'Room 112', assigned_nurse: 'Nurse Priya Nair', appointment_type: 'APPOINTMENT', slot_time: '10:00 AM - 10:30 AM', is_emergency: 0, status: 'WAITING', priority_score: 100, triage_level: 'YELLOW', triage_notes: 'High fever (102°F) and persistent dry cough for 3 days', created_at: new Date(Date.now() - 10 * 60000).toISOString(), dept_name: 'Pediatrics & Child OPD' }
];

// In-browser mock storage state
function getStoredPatients() {
  try {
    const raw = localStorage.getItem('opd_sha_mock_patients');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_MOCK_PATIENTS];
}

function saveStoredPatients(patients) {
  try {
    localStorage.setItem('opd_sha_mock_patients', JSON.stringify(patients));
  } catch {}
}

export async function fetchDepartments() {
  try {
    const res = await fetch(`${API_BASE}/departments`);
    if (res.ok) return await res.json();
  } catch {}
  return { success: true, departments: FALLBACK_DEPARTMENTS };
}

export async function fetchDoctors(departmentId = null) {
  try {
    const url = departmentId 
      ? `${API_BASE}/doctors?department_id=${encodeURIComponent(departmentId)}`
      : `${API_BASE}/doctors`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch {}
  const filtered = departmentId 
    ? FALLBACK_DOCTORS.filter(d => d.department_id === departmentId)
    : FALLBACK_DOCTORS;
  return { success: true, doctors: filtered };
}

export async function fetchDoctorDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}`);
    if (res.ok) return await res.json();
  } catch {}
  const doc = FALLBACK_DOCTORS.find(d => d.id === id) || FALLBACK_DOCTORS[0];
  return { success: true, doctor: doc };
}

export async function fetchAppointmentSlots(departmentId) {
  try {
    const res = await fetch(`${API_BASE}/appointment-slots/${encodeURIComponent(departmentId)}`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    success: true,
    department_id: departmentId,
    slots: [
      { time: '09:00 AM - 09:30 AM', shift: 'Morning', available: true },
      { time: '09:30 AM - 10:00 AM', shift: 'Morning', available: true },
      { time: '10:00 AM - 10:30 AM', shift: 'Morning', available: true },
      { time: '10:30 AM - 11:00 AM', shift: 'Morning', available: true },
      { time: '11:30 AM - 12:00 PM', shift: 'Morning', available: true },
      { time: '02:00 PM - 02:30 PM', shift: 'Afternoon', available: true },
      { time: '02:30 PM - 03:00 PM', shift: 'Afternoon', available: true },
      { time: '03:00 PM - 03:30 PM', shift: 'Afternoon', available: true }
    ]
  };
}

export async function fetchFloors() {
  try {
    const res = await fetch(`${API_BASE}/floors`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    success: true,
    floors: [
      { id: 'GF', level: 0, name: 'Ground Floor', wards: ['Emergency & Red Trauma Zone', 'General Medicine Wing', 'Central Lobby'] },
      { id: 'F1', level: 1, name: 'First Floor', wards: ['Cardiology & Chest Clinic', 'Pediatrics & Child Care Ward'] },
      { id: 'F2', level: 2, name: 'Second Floor', wards: ['Orthopedics & Bone Health', 'Obstetrics & Gynecology OPD'] }
    ]
  };
}

export async function registerPatient(formData) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback in-memory patient registration for static GitHub Pages
  const patients = getStoredPatients();
  const dept = FALLBACK_DEPARTMENTS.find(d => d.id === formData.department_id) || FALLBACK_DEPARTMENTS[1];
  const isEmer = Boolean(formData.is_emergency);
  const tokenPrefix = isEmer ? 'EMER' : dept.code;
  const count = patients.filter(p => p.department_id === dept.id).length + 101;
  const token = `${tokenPrefix}-${count}`;

  const assignedDoc = FALLBACK_DOCTORS.find(d => d.id === formData.doctor_id) || 
                      FALLBACK_DOCTORS.find(d => d.department_id === dept.id) || 
                      FALLBACK_DOCTORS[0];

  const newPatient = {
    id: Date.now(),
    token_number: token,
    name: formData.name,
    age: Number(formData.age) || 30,
    gender: formData.gender || 'Not specified',
    contact: formData.contact || '',
    govt_id: formData.govt_id || '',
    department_id: dept.id,
    dept_name: dept.name,
    doctor_id: assignedDoc.id,
    doctor_name: assignedDoc.name,
    doctor_room: assignedDoc.room_number,
    assigned_nurse: isEmer ? 'Nurse Fatima Al-Hassan' : (Number(formData.age) >= 60 ? 'Caretaker Ramesh Kumar' : null),
    appointment_type: formData.appointment_type || 'WALKIN',
    slot_time: formData.slot_time || null,
    is_emergency: isEmer ? 1 : 0,
    status: isEmer ? 'ANNOUNCED' : 'WAITING',
    priority_score: isEmer ? 1000 : (Number(formData.age) >= 60 ? 500 : 100),
    created_at: new Date().toISOString()
  };

  patients.unshift(newPatient);
  saveStoredPatients(patients);

  return {
    success: true,
    token,
    patient: newPatient,
    estimatedWaitMins: isEmer ? 0 : 15,
    department: dept
  };
}

export async function fetchSlip(token) {
  try {
    const res = await fetch(`${API_BASE}/slips/${encodeURIComponent(token)}`);
    if (res.ok) return await res.json();
  } catch {}

  const patients = getStoredPatients();
  const patient = patients.find(p => p.token_number === token) || patients[0];
  const dept = FALLBACK_DEPARTMENTS.find(d => d.id === patient.department_id) || FALLBACK_DEPARTMENTS[0];

  return {
    success: true,
    token: patient.token_number,
    patient: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      govt_id: patient.govt_id,
      appointment_type: patient.appointment_type,
      slot_time: patient.slot_time,
      is_emergency: patient.is_emergency,
      status: patient.status,
      doctor_name: patient.doctor_name,
      doctor_room: patient.doctor_room,
      triage_level: patient.is_emergency ? 'RED' : (patient.age >= 60 ? 'SENIOR' : 'GREEN'),
      created_at: patient.created_at
    },
    department: dept,
    queue: {
      position: 1,
      patientsAhead: 0,
      estimatedWaitMins: patient.is_emergency ? 0 : 12,
      currentServingToken: 'ACTIVE'
    },
    directions: {
      text: dept.directions_text,
      landmark: dept.landmark,
      floor: dept.floor_name,
      ward: dept.ward_name,
      room: dept.room_number,
      color: dept.color
    }
  };
}

export async function fetchQueueStatus(token) {
  try {
    const res = await fetch(`${API_BASE}/queue/${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return data;
    }
  } catch {}

  const patients = getStoredPatients();
  const searchToken = (token || '').trim().toUpperCase();
  const patient = patients.find(p => (p.token_number || '').toUpperCase() === searchToken) || patients[0];
  const dept = FALLBACK_DEPARTMENTS.find(d => d.id === patient?.department_id) || FALLBACK_DEPARTMENTS[0];

  const pos = patient?.is_emergency ? 1 : 2;
  const isEmergency = Boolean(patient?.is_emergency);

  return {
    success: true,
    tokenNumber: patient?.token_number || searchToken || 'CARD-102',
    patientName: patient?.name || 'Ramesh Kumar',
    patientAge: patient?.age || 45,
    status: patient?.status || 'WAITING',
    appointmentType: patient?.appointment_type || 'WALKIN',
    slotTime: patient?.slot_time || '10:30 AM',
    isEmergency,
    patient,
    department: {
      id: dept.id,
      name: dept.name,
      roomNumber: dept.room_number,
      doctor: dept.doctor_in_charge,
      floor: dept.floor_name,
      color: dept.color
    },
    queue: {
      position: pos,
      aheadCount: pos - 1,
      estimatedWaitMins: isEmergency ? 0 : 10,
      isNearTurn: true,
      currentlyActiveToken: 'EMER-001',
      totalWaitingInDept: 4,
      overcrowding: 'NORMAL',
      totalPatients: 12
    },
    alert: {
      message: isEmergency 
        ? 'EMERGENCY: Immediate treatment bay active.' 
        : `Token ${patient?.token_number || 'CARD-102'} is currently in queue. Please proceed towards ${dept.room_number}.`,
      hindi: isEmergency 
        ? 'आपातकालीन: तुरंत ट्रॉमा बे में जाएँ।' 
        : `टोकन ${patient?.token_number || 'CARD-102'} कतार में है। कृपया ${dept.room_number} की ओर बढ़ें।`,
      tamil: isEmergency 
        ? 'அவசர சிகிச்சை நெறிமுறை: உடனடியாக அறைக்கு செல்லவும்.' 
        : `டோக்கன் ${patient?.token_number || 'CARD-102'} வரிசையில் உள்ளது. தயவுசெய்து ${dept.room_number} நோக்கி செல்லவும்.`,
      isUrgent: isEmergency
    },
    directions: {
      text: dept.directions_text,
      landmark: dept.landmark,
      room_number: dept.room_number,
      floor_name: dept.floor_name,
      ward_name: dept.ward_name,
      color: dept.color
    }
  };
}

export async function fetchNavigation(deptId) {
  try {
    const res = await fetch(`${API_BASE}/navigation/${encodeURIComponent(deptId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.steps) return data;
    }
  } catch {}

  const dept = FALLBACK_DEPARTMENTS.find(d => d.id === deptId) || FALLBACK_DEPARTMENTS[0];
  return {
    success: true,
    floor: { name: dept.floor_name || 'Ground Floor', id: dept.floor_id || 'GF' },
    ward: { name: dept.ward_name || 'Central Clinical Wing', wing: 'East Wing' },
    department: {
      name: dept.name,
      floor: dept.floor_name,
      ward: dept.ward_name,
      room: dept.room_number,
      directions: dept.directions_text,
      landmark: dept.landmark,
      color: dept.color
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Start at Main Registration',
        titleHindi: 'मुख्य पंजीकरण से शुरू करें',
        titleTamil: 'முதன்மை பதிவிலிருந்து தொடங்கவும்',
        instruction: 'From the main lobby entrance, face the central reception counter.',
        instructionHindi: 'मुख्य प्रवेश द्वार से केंद्रीय स्वागत काउंटर की ओर बढ़ें।',
        instructionTamil: 'முக்கிய நுழைவாயிலில் இருந்து வரவேற்பு கவுண்ட்டரை நோக்கி செல்லவும்.'
      },
      {
        stepNumber: 2,
        title: 'Follow Floor Direction Line',
        titleHindi: 'गलियारे की लाइन का पालन करें',
        titleTamil: 'தரை வண்ணக் கோட்டைப் பின்தொடரவும்',
        instruction: dept.directions_text,
        instructionHindi: dept.directions_hindi,
        instructionTamil: dept.directions_tamil
      },
      {
        stepNumber: 3,
        title: `Arrive at ${dept.room_number}`,
        titleHindi: `कक्ष ${dept.room_number} पर पहुँचें`,
        titleTamil: `அறை ${dept.room_number}-க்கு சென்றடையவும்`,
        instruction: `Locate ${dept.room_number}. Check-in with the nurse station right beside the consultation room door.`,
        instructionHindi: `${dept.room_number} पर जाएँ और नर्स स्टेशन पर रिपोर्ट करें।`,
        instructionTamil: `${dept.room_number}-ல் உள்ள செவிலியர் மையத்தில் டோக்கனை சமர்ப்பிக்கவும்.`
      }
    ]
  };
}

export async function fetchStaffQueues() {
  try {
    const res = await fetch(`${API_BASE}/staff/queues`);
    if (res.ok) return await res.json();
  } catch {}

  const patients = getStoredPatients();
  const waiting = patients.filter(p => p.status === 'WAITING');
  const emergency = patients.filter(p => p.is_emergency);
  const elderly = patients.filter(p => !p.is_emergency && p.age >= 60);

  return {
    success: true,
    patients,
    stats: {
      total: patients.length,
      waiting: waiting.length,
      active: 1,
      completed: 1,
      emergency: emergency.length,
      elderly: elderly.length,
      assignedDoctor: patients.filter(p => p.doctor_id).length,
      awaitingCollection: patients.filter(p => p.status === 'ANNOUNCED').length,
      inConsultation: patients.filter(p => p.status === 'IN_CONSULTATION').length,
      hospitalCapacity: 25
    }
  };
}

export async function updatePatientStatus(id, updateData) {
  try {
    const res = await fetch(`${API_BASE}/patients/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (res.ok) return await res.json();
  } catch {}

  const patients = getStoredPatients();
  const idx = patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    patients[idx] = { ...patients[idx], ...updateData };
    saveStoredPatients(patients);
    return { success: true, patient: patients[idx] };
  }
  return { success: true };
}

export async function assignPatientPersonnel(id, assignmentData) {
  try {
    const res = await fetch(`${API_BASE}/patients/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData)
    });
    if (res.ok) return await res.json();
  } catch {}

  const patients = getStoredPatients();
  const idx = patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    const doc = FALLBACK_DOCTORS.find(d => d.id === assignmentData.doctor_id);
    patients[idx] = {
      ...patients[idx],
      doctor_id: assignmentData.doctor_id || patients[idx].doctor_id,
      doctor_name: doc ? doc.name : patients[idx].doctor_name,
      doctor_room: assignmentData.doctor_room || patients[idx].doctor_room,
      assigned_nurse: assignmentData.assigned_nurse || patients[idx].assigned_nurse,
      status: assignmentData.status || 'ANNOUNCED'
    };
    saveStoredPatients(patients);
    return { success: true, patient: patients[idx] };
  }
  return { success: true };
}

export async function callNextPatient(deptId) {
  try {
    const res = await fetch(`${API_BASE}/staff/call-next/${encodeURIComponent(deptId)}`, {
      method: 'POST'
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: true, message: 'Next patient called' };
}

export async function simulateWalkins() {
  try {
    const res = await fetch(`${API_BASE}/simulate/walkins`, {
      method: 'POST'
    });
    if (res.ok) return await res.json();
  } catch {}

  const patients = getStoredPatients();
  const sampleNames = ['Suresh Raina', 'Fatima Sheikh', 'Lakshmi Narayanan', 'Amit Trivedi', 'Kavita Das'];
  const newPatients = sampleNames.map((name, i) => {
    const dept = FALLBACK_DEPARTMENTS[i % FALLBACK_DEPARTMENTS.length];
    return {
      id: Date.now() + i,
      token_number: `${dept.code}-${Math.floor(200 + Math.random() * 100)}`,
      name,
      age: 25 + i * 12,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      contact: '980000000' + i,
      department_id: dept.id,
      dept_name: dept.name,
      doctor_id: FALLBACK_DOCTORS[i % FALLBACK_DOCTORS.length].id,
      doctor_name: FALLBACK_DOCTORS[i % FALLBACK_DOCTORS.length].name,
      doctor_room: FALLBACK_DOCTORS[i % FALLBACK_DOCTORS.length].room_number,
      assigned_nurse: null,
      appointment_type: 'WALKIN',
      is_emergency: i === 0 ? 1 : 0,
      status: 'WAITING',
      priority_score: i === 0 ? 1000 : ((25 + i * 12) >= 60 ? 500 : 100),
      created_at: new Date().toISOString()
    };
  });

  const combined = [...newPatients, ...patients];
  saveStoredPatients(combined);
  return { success: true, count: 5, addedPatients: newPatients };
}

export async function resetDatabase() {
  try {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST'
    });
    if (res.ok) return await res.json();
  } catch {}
  saveStoredPatients([...INITIAL_MOCK_PATIENTS]);
  return { success: true, message: 'Data reset to defaults' };
}
