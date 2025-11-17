import { dbOperations } from './db';

const AUTH_KEY = 'malwa_erp_auth';
const SESSION_KEY = 'malwa_erp_session';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const authService = {
  async signUp({ email, password, name, role = 'Accountant' }) {
    try {
      const existingUsers = await dbOperations.getByIndex('users', 'email', email);
      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }

      const hashedPassword = await hashPassword(password);
      const userId = generateUUID();

      const user = await dbOperations.insert('users', {
        id: userId,
        email,
        password: hashedPassword,
        created_at: new Date().toISOString()
      });

      const isSuperAdmin = role === 'Super Admin' || role === 'Admin' || role === 'Director';

      await dbOperations.insert('profiles', {
        id: userId,
        name: name || email,
        email,
        role,
        permissions: {
          dashboard: 'full',
          jobs: 'full',
          customer: 'full',
          vendors: 'full',
          labour: 'full',
          supplier: 'full',
          inventory: 'full',
          accounts: 'full',
          summary: 'full',
          settings: isSuperAdmin ? 'full' : 'none'
        },
        status: 'Active'
      });

      return { user: { id: userId, email }, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async signIn({ email, password }) {
    try {
      console.log('Login attempt for:', email);
      const users = await dbOperations.getByIndex('users', 'email', email);
      console.log('Users found:', users.length);

      if (users.length === 0) {
        console.error('User not found');
        throw new Error('Invalid email or password');
      }

      const user = users[0];
      const hashedPassword = await hashPassword(password);

      if (user.password !== hashedPassword) {
        console.error('Password mismatch');
        throw new Error('Invalid email or password');
      }

      const profile = await dbOperations.getById('profiles', user.id);
      console.log('Login successful for:', profile?.name);

      const session = {
        user: {
          id: user.id,
          email: user.email
        },
        profile,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      return { user: session.user, profile, error: null };
    } catch (error) {
      console.error('Login failed:', error.message);
      return { user: null, profile: null, error };
    }
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY);
    return { error: null };
  },

  getSession() {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async getUser() {
    const session = this.getSession();
    if (!session) return null;

    return session.user;
  },

  async getProfile() {
    const session = this.getSession();
    if (!session) return null;

    const profile = await dbOperations.getById('profiles', session.user.id);
    return profile;
  },

  isAuthenticated() {
    return this.getSession() !== null;
  },

  onAuthStateChange(callback) {
    const checkAuth = () => {
      const session = this.getSession();
      if (session) {
        callback('SIGNED_IN', session);
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    checkAuth();

    const interval = setInterval(checkAuth, 1000);

    return {
      unsubscribe: () => clearInterval(interval)
    };
  }
};

export const seedDefaultUser = async () => {
  try {
    console.log('🔍 Checking for existing users...');
    const userCount = await dbOperations.count('users');
    console.log('📊 User count:', userCount);

    if (userCount > 0) {
      console.log('ℹ️ Users already exist, skipping seed');
      return;
    }

    console.log('👤 Creating Super Admin...');
    const result = await authService.signUp({
      email: 'Shahidmultaniii',
      password: 'S#d_8224',
      name: 'Super Admin',
      role: 'Super Admin'
    });

    if (result.error) {
      console.error('❌ Failed to create Super Admin:', result.error);
    } else {
      console.log('✅ Super Admin created successfully!');
      console.log('📧 User ID: Shahidmultaniii');
      console.log('🔑 Password: S#d_8224');
    }
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
  }
};
