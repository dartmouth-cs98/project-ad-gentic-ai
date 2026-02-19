const USERS_KEY = 'adgentic_users';
const CURRENT_USER_KEY = 'adgentic_current_user';

export interface User {
  email: string;
  password: string;
  name?: string;
  createdAt: string;
}

function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Seed demo user on first load
export function seedDemoUser() {
  const users = getUsers();
  const demoExists = users.some((u) => u.email === 'demo@adgentic.ai');
  if (!demoExists) {
    users.push({
      email: 'demo@adgentic.ai',
      password: 'password123',
      name: 'Demo User',
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }
}

export function signUp(
email: string,
password: string)
: {success: boolean;error?: string;} {
  const users = getUsers();
  const exists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return {
      success: false,
      error: 'An account with this email already exists. Try signing in.'
    };
  }
  users.push({
    email: email.toLowerCase(),
    password,
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
  setCurrentUser(email);
  return { success: true };
}

export function signIn(
email: string,
password: string)
: {success: boolean;error?: string;} {
  const users = getUsers();
  const user = users.find(
    (u) =>
    u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    return {
      success: false,
      error: 'Invalid email or password. Try demo@adgentic.ai / password123'
    };
  }
  setCurrentUser(user.email);
  return { success: true };
}

export function setCurrentUser(email: string) {
  localStorage.setItem(CURRENT_USER_KEY, email);
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function signOut() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Auto-seed on import
seedDemoUser();