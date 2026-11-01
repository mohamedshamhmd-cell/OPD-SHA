// Auth service for OPD SHA Hospital
// localStorage-based authentication with demo credentials

const DEMO_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Hospital Administrator',
    department: 'Administration',
    avatar: '👨‍💼',
  },
  doctor: {
    username: 'dr.vikram',
    password: 'doc123',
    role: 'doctor',
    name: 'Dr. Vikram Sharma',
    department: 'General Medicine',
    avatar: '👨‍⚕️',
  },
  nurse: {
    username: 'nurse.sarah',
    password: 'nurse123',
    role: 'nurse',
    name: 'Nurse Sarah Khan',
    department: 'OPD Ward',
    avatar: '👩‍⚕️',
  },
};

/**
 * Authenticate a user with username/password.
 * For patient role, username = token number, password = mobile.
 * Returns { success, user, error }
 */
export async function login(username, password, role = 'admin') {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

  if (!username || !password) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  // Patient login: token number + mobile (any non-empty values accepted for demo)
  if (role === 'patient') {
    if (username.trim().length < 2 || password.trim().length < 4) {
      return { success: false, error: 'Invalid token number or mobile number.' };
    }
    const user = {
      username: username.trim(),
      role: 'patient',
      name: `Patient ${username.trim()}`,
      department: 'OPD',
      avatar: '🧑',
      token: username.trim(),
      loginTime: new Date().toISOString(),
    };
    try {
      localStorage.setItem('hospital_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to persist auth:', e);
    }
    return { success: true, user };
  }

  // Staff login: match against demo credentials
  const demoUser = DEMO_USERS[role];
  if (!demoUser) {
    return { success: false, error: 'Invalid role selected.' };
  }

  if (username.trim() === demoUser.username && password === demoUser.password) {
    const user = {
      ...demoUser,
      loginTime: new Date().toISOString(),
    };
    try {
      localStorage.setItem('hospital_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to persist auth:', e);
    }
    return { success: true, user };
  }

  return { success: false, error: 'Invalid username or password. Please check your credentials.' };
}

/**
 * Get the currently logged-in user from localStorage.
 */
export function getCurrentUser() {
  try {
    const data = localStorage.getItem('hospital_auth_user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to read auth:', e);
    return null;
  }
}

/**
 * Log out the current user.
 */
export function logout() {
  try {
    localStorage.removeItem('hospital_auth_user');
  } catch (e) {
    console.error('Failed to clear auth:', e);
  }
}
