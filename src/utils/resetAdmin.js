import { dbOperations } from '@/lib/db';
import { authService } from '@/lib/auth';

export const resetSuperAdmin = async () => {
  try {
    console.log('🔄 Resetting Super Admin...');

    // Clear users and profiles
    await dbOperations.clear('users');
    await dbOperations.clear('profiles');

    console.log('✅ Cleared users and profiles');

    // Create new Super Admin
    const result = await authService.signUp({
      email: 'Shahidmultaniii',
      password: 'S#d_8224',
      name: 'Super Admin',
      role: 'Super Admin'
    });

    if (result.error) {
      console.error('❌ Failed:', result.error);
      return false;
    }

    console.log('✅ Super Admin created!');
    console.log('📧 User ID: Shahidmultaniii');
    console.log('🔑 Password: S#d_8224');
    console.log('🔄 Please refresh the page and try logging in');

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
};

// Attach to window
window.resetSuperAdmin = resetSuperAdmin;

console.log('Reset utility loaded: window.resetSuperAdmin()');
