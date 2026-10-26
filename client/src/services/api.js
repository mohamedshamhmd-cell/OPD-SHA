// API Service client for hospital backend

const API_BASE = '/api';

export async function fetchDepartments() {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error('Failed to load departments');
  return res.json();
}

export async function fetchDoctors(departmentId = null) {
  const url = departmentId 
    ? `${API_BASE}/doctors?department_id=${encodeURIComponent(departmentId)}`
    : `${API_BASE}/doctors`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load doctors');
  return res.json();
}

export async function fetchDoctorDetails(id) {
  const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load doctor details');
  return res.json();
}

export async function fetchAppointmentSlots(departmentId) {
  const res = await fetch(`${API_BASE}/appointment-slots/${encodeURIComponent(departmentId)}`);
  if (!res.ok) throw new Error('Failed to load appointment slots');
  return res.json();
}

export async function fetchFloors() {
  const res = await fetch(`${API_BASE}/floors`);
  if (!res.ok) throw new Error('Failed to load floors');
  return res.json();
}

export async function registerPatient(formData) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function fetchSlip(token) {
  const res = await fetch(`${API_BASE}/slips/${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Slip not found');
  return data;
}

export async function fetchQueueStatus(token) {
  const res = await fetch(`${API_BASE}/queue/${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Queue status not found');
  return data;
}

export async function fetchNavigation(deptId) {
  const res = await fetch(`${API_BASE}/navigation/${encodeURIComponent(deptId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Navigation details not found');
  return data;
}

export async function fetchStaffQueues() {
  const res = await fetch(`${API_BASE}/staff/queues`);
  if (!res.ok) throw new Error('Failed to load staff queues');
  return res.json();
}

export async function updatePatientStatus(id, updateData) {
  const res = await fetch(`${API_BASE}/patients/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update status');
  return data;
}

export async function callNextPatient(deptId) {
  const res = await fetch(`${API_BASE}/staff/call-next/${encodeURIComponent(deptId)}`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to call next patient');
  return data;
}

export async function simulateWalkins() {
  const res = await fetch(`${API_BASE}/simulate/walkins`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to simulate walk-ins');
  return data;
}

export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset database');
  return data;
}
