export interface User {
  username: string;
  createdAt: string;
}

import { BASE_URL } from './api';

// Simple native SHA-256 hashing helper with pure JS fallback for non-secure contexts (e.g. HTTP on local network IP)
async function sha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure JS fallback
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words: number[] = [];
  const asciiLength = text[lengthProperty] * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = 1;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      }
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }
  let ascii = text + '\x80';
  while (ascii[lengthProperty] % 64 - 56) {
    ascii += '\x00';
  }
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) throw new Error('Only ASCII characters supported');
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const s0 = (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3));
        const s1 = (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10));
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const a = hash[0], e = hash[4];
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (S0 + maj) | 0;
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ ((~e) & hash[6]);
      const temp3 = (hash[7] + S1 + ch + k[i] + w[i]) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp3) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp3 + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
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
  register: async (username: string, password: string, email?: string): Promise<void> => {
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

    const targetEmail = email?.trim()?.toLowerCase();
    if (targetEmail) {
      const emailExists = Object.values(users).some((u: any) => u.email?.trim()?.toLowerCase() === targetEmail);
      if (emailExists) {
        throw new Error('Email sudah terdaftar!');
      }
    }

    const passwordHash = await sha256(password);
    users[key] = {
      username: trimmedUser,
      passwordHash,
      createdAt: new Date().toISOString(),
      email: email?.trim() || undefined
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

    let targetUserKey = key;
    let targetUser = users[targetUserKey];

    if (!targetUser) {
      // Fallback: look up by registered email address
      const foundEntry = Object.entries(users).find(([_, u]) => {
        const uEmail = u.email?.trim()?.toLowerCase();
        return uEmail === key;
      });
      if (foundEntry) {
        targetUserKey = foundEntry[0];
        targetUser = foundEntry[1];
      }
    }

    if (!targetUser) {
      throw new Error('Username atau password salah!');
    }

    const passwordHash = await sha256(password);
    if (targetUser.passwordHash !== passwordHash) {
      throw new Error('Username atau password salah!');
    }

    // Update lastOnline timestamp
    targetUser.lastOnline = new Date().toISOString();
    users[targetUserKey] = targetUser;
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {
      console.warn("Failed to sync lastOnline to server", e);
    }

    // 2. Fetch user's data from server and save to localStorage
    try {
      const resData = await fetch(`${BASE_URL}/kuroyomi/user/${targetUserKey}/data`);
      if (resData.ok) {
        const data = await resData.json();
        if (data.library) localStorage.setItem(`kuroyomi_user_${targetUserKey}_library`, data.library);
        if (data.progress) localStorage.setItem(`kuroyomi_user_${targetUserKey}_progress`, data.progress);
        if (data.categories) localStorage.setItem(`kuroyomi_user_${targetUserKey}_categories`, data.categories);
        if (data.settings) localStorage.setItem(`kuroyomi_user_${targetUserKey}_settings`, data.settings);
        if (data.installed_extensions) localStorage.setItem(`kuroyomi_user_${targetUserKey}_installed_extensions`, data.installed_extensions);
        if (data.manga_categories) localStorage.setItem(`kuroyomi_user_${targetUserKey}_manga_categories`, data.manga_categories);
        if (data.history) localStorage.setItem(`kuroyomi_user_${targetUserKey}_history`, data.history);
      }
    } catch (e) {
      console.warn("Failed to sync user data from server during login", e);
    }

    localStorage.setItem('kuroyomi_session', targetUser.username);
    return {
      username: targetUser.username,
      createdAt: targetUser.createdAt
    };
  },

  // Guest login
  guestLogin: (): User => {
    localStorage.setItem('kuroyomi_session', 'Guest');
    const guestKey = 'guest';
    if (!localStorage.getItem(`kuroyomi_user_${guestKey}_library`)) {
      localStorage.setItem(`kuroyomi_user_${guestKey}_library`, JSON.stringify([]));
    }
    return {
      username: 'Guest',
      createdAt: new Date().toISOString()
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
  },

  // Get all users with metadata (admin only)
  getAllUsers: async (): Promise<Array<{ username: string; createdAt: string; lastOnline?: string; email?: string }>> => {
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) users = await res.json();
    } catch (e) {
      const local = localStorage.getItem('kuroyomi_users');
      if (local) users = JSON.parse(local);
    }
    return Object.values(users).map((u: any) => ({
      username: u.username,
      createdAt: u.createdAt || '',
      lastOnline: u.lastOnline || '',
      email: u.email || ''
    }));
  },

  // Update user profile/password (admin only)
  adminUpdateUser: async (targetUsername: string, email: string, password?: string): Promise<void> => {
    const key = targetUsername.toLowerCase();
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) users = await res.json();
    } catch (e) {
      const local = localStorage.getItem('kuroyomi_users');
      if (local) users = JSON.parse(local);
    }
    if (!users[key]) throw new Error(`User "${targetUsername}" tidak ditemukan.`);
    
    users[key].email = email.trim() || undefined;
    if (password && password.trim().length >= 4) {
      users[key].passwordHash = await sha256(password);
    } else if (password && password.trim().length > 0) {
      throw new Error('Password baru minimal 4 karakter!');
    }
    
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {
      console.warn("Failed to sync admin user update to server", e);
    }
  },

  // Delete any user account (admin only — caller must verify they are admin)
  adminDeleteUser: async (targetUsername: string): Promise<void> => {
    const key = targetUsername.toLowerCase();
    let users: Record<string, any> = {};
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) users = await res.json();
    } catch (e) {
      const local = localStorage.getItem('kuroyomi_users');
      if (local) users = JSON.parse(local);
    }
    if (!users[key]) throw new Error(`User "${targetUsername}" tidak ditemukan.`);
    delete users[key];
    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
    // Cleanup user data keys from localStorage
    const dataKeys = ['library','progress','categories','settings','installed_extensions','manga_categories','history'];
    dataKeys.forEach(k => localStorage.removeItem(`kuroyomi_user_${key}_${k}`));
    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
      await fetch(`${BASE_URL}/kuroyomi/user/${key}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (e) {
      console.warn('Failed to sync user deletion to server', e);
    }
  },

  // Get email of the currently logged-in user
  getUserEmail: (): string | null => {
    const user = auth.getCurrentUser();
    if (!user) return null;
    const key = user.toLowerCase();
    const usersJson = localStorage.getItem('kuroyomi_users');
    const users = usersJson ? JSON.parse(usersJson) : {};
    return users[key]?.email || null;
  },

  // Update email of the currently logged-in user
  updateEmail: async (email: string): Promise<void> => {
    const user = auth.getCurrentUser();
    if (!user) throw new Error("Not logged in");
    const key = user.toLowerCase();

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

    if (!users[key]) {
      throw new Error("User not found");
    }

    const targetEmail = email.trim().toLowerCase();
    if (targetEmail) {
      const emailExists = Object.entries(users).some(([uKey, u]) => {
        return uKey !== key && u.email?.trim()?.toLowerCase() === targetEmail;
      });
      if (emailExists) {
        throw new Error('Email sudah terdaftar!');
      }
    }

    users[key].email = email.trim() || undefined;

    localStorage.setItem('kuroyomi_users', JSON.stringify(users));
    try {
      await fetch(`${BASE_URL}/kuroyomi/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {
      console.warn("Failed to sync updated email to server", e);
    }
  },

  // Forgot password verification code request
  forgotPassword: async (identity: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/kuroyomi/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Gagal mengirim token lupa password.');
    }
    return await res.text();
  },

  // Reset password using the code
  resetPassword: async (identity: string, token: string, newPassword: string): Promise<string> => {
    const newPasswordHash = await sha256(newPassword);
    const res = await fetch(`${BASE_URL}/kuroyomi/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, token, newPasswordHash })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Gagal mereset password.');
    }
    return await res.text();
  },

  // Forgot username recovery request
  forgotUsername: async (email: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/kuroyomi/forgot-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Gagal mengirim username recovery.');
    }
    return await res.text();
  }
};
