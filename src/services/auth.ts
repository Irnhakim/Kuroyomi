export interface User {
  username: string;
  createdAt: string;
}

const isDev = window.location.port === '5173' || window.location.port === '5174';
const SERVER_ORIGIN = isDev ? 'http://localhost:4567' : window.location.origin;
const BASE_URL = `${SERVER_ORIGIN}/api/v1`;

// Simple native SHA-256 hashing helper
async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const auth = {
  // Get active session
  getCurrentUser: (): string | null => {
    return localStorage.getItem('kuroyomi_session');
  },

  // Check if logged in
  isLoggedIn: (): boolean => {
    return !!auth.getCurrentUser();
  },

  // Register new user
  register: async (username: string, password: string): Promise<void> => {
    const trimmedUser = username.trim();
    if (!trimmedUser || password.length < 4) {
      throw new Error('Username valid dan password minimal 4 karakter!');
    }

    // 1. Fetch latest users from backend
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) {
        users = await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch users from server during register, using local fallback", e);
      const localUsers = localStorage.getItem('kuroyomi_users');
      if (localUsers) users = JSON.parse(localUsers);
    }

    const key = trimmedUser.toLowerCase();
    if (users[key]) {
      throw new Error('Username sudah terdaftar!');
    }

    const passwordHash = await sha256(password);
    users[key] = {
      username: trimmedUser,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    // 2. Save users back to backend and localStorage
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
      // Initialize empty user data file on server
      await fetch(`${BASE_URL}/kuroyomi/user/${key}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (e) {
      console.warn("Failed to sync registered user to server", e);
    }
  },

  // Login user
  login: async (username: string, password: string): Promise<User> => {
    const trimmedUser = username.trim();
    const key = trimmedUser.toLowerCase();

    // 1. Fetch latest users from backend
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) {
        users = await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch users from server during login, using local fallback", e);
      const localUsers = localStorage.getItem('kuroyomi_users');
      if (localUsers) users = JSON.parse(localUsers);
    }

    if (!users[key]) {
      throw new Error('Username atau password salah!');
    }

    const passwordHash = await sha256(password);
    if (users[key].passwordHash !== passwordHash) {
      throw new Error('Username atau password salah!');
    }

    // 2. Fetch user's data from server and save to localStorage
    try {
      const resData = await fetch(`${BASE_URL}/kuroyomi/user/${key}/data`);
      if (resData.ok) {
        const data = await resData.json();
        if (data.library) localStorage.setItem(`kuroyomi_user_${key}_library`, data.library);
        if (data.progress) localStorage.setItem(`kuroyomi_user_${key}_progress`, data.progress);
        if (data.categories) localStorage.setItem(`kuroyomi_user_${key}_categories`, data.categories);
        if (data.settings) localStorage.setItem(`kuroyomi_user_${key}_settings`, data.settings);
        if (data.installed_extensions) localStorage.setItem(`kuroyomi_user_${key}_installed_extensions`, data.installed_extensions);
        if (data.manga_categories) localStorage.setItem(`kuroyomi_user_${key}_manga_categories`, data.manga_categories);
      }
    } catch (e) {
      console.warn("Failed to sync user data from server during login", e);
    }

    localStorage.setItem('kuroyomi_session', users[key].username);
    return {
      username: users[key].username,
      createdAt: users[key].createdAt
    };
  },

  // Logout
  logout: () => {
    localStorage.removeItem('kuroyomi_session');
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) throw new Error('Tidak ada sesi aktif!');

    if (newPassword.length < 4) {
      throw new Error('Password baru minimal 4 karakter!');
    }

    const key = currentUser.toLowerCase();
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) {
        users = await res.json();
      }
    } catch (e) {
      const localUsers = localStorage.getItem('kuroyomi_users');
      if (localUsers) users = JSON.parse(localUsers);
    }

    if (!users[key]) throw new Error('Pengguna tidak ditemukan!');

    const oldHash = await sha256(oldPassword);
    if (users[key].passwordHash !== oldHash) {
      throw new Error('Password lama salah!');
    }

    users[key].passwordHash = await sha256(newPassword);
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));

    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {
      console.warn("Failed to sync password change to server", e);
    }
  },

  // Delete Account
  deleteAccount: async (password: string): Promise<void> => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) throw new Error('Tidak ada sesi aktif!');

    const key = currentUser.toLowerCase();
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) {
        users = await res.json();
      }
    } catch (e) {
      const localUsers = localStorage.getItem('kuroyomi_users');
      if (localUsers) users = JSON.parse(localUsers);
    }

    if (!users[key]) throw new Error('Pengguna tidak ditemukan!');

    const hash = await sha256(password);
    if (users[key].passwordHash !== hash) {
      throw new Error('Password salah!');
    }

    // Clean up user specific data
    localStorage.removeItem(`kuroyomi_user_${key}_library`);
    localStorage.removeItem(`kuroyomi_user_${key}_progress`);
    localStorage.removeItem(`kuroyomi_user_${key}_categories`);
    localStorage.removeItem(`kuroyomi_user_${key}_settings`);
    localStorage.removeItem(`kuroyomi_user_${key}_installed_extensions`);
    localStorage.removeItem(`kuroyomi_user_${key}_manga_categories`);

    // Remove from users list
    delete users[key];
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));

    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
      // Clear data file on server
      await fetch(`${BASE_URL}/kuroyomi/user/${key}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (e) {
      console.warn("Failed to sync account deletion to server", e);
    }

    // Clear session
    auth.logout();
  },

  // Get list of all usernames (for account management/switching)
  getRegisteredUsernames: (): string[] => {
    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};
    return Object.values(users).map((u: any) => u.username);
  }
};
