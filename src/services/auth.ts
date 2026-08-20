export interface User {
  username: string;
  createdAt: string;
}

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

    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};
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

    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
  },

  // Login user
  login: async (username: string, password: string): Promise<User> => {
    const trimmedUser = username.trim();
    const key = trimmedUser.toLowerCase();

    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};

    if (!users[key]) {
      throw new Error('Username atau password salah!');
    }

    const passwordHash = await sha256(password);
    if (users[key].passwordHash !== passwordHash) {
      throw new Error('Username atau password salah!');
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
    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};

    if (!users[key]) throw new Error('Pengguna tidak ditemukan!');

    const oldHash = await sha256(oldPassword);
    if (users[key].passwordHash !== oldHash) {
      throw new Error('Password lama salah!');
    }

    users[key].passwordHash = await sha256(newPassword);
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
  },

  // Delete Account
  deleteAccount: async (password: string): Promise<void> => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) throw new Error('Tidak ada sesi aktif!');

    const key = currentUser.toLowerCase();
    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};

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

    // Remove from users list
    delete users[key];
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));

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
