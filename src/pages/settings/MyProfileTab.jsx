import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Lock, Eye, EyeOff, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import useAuthStore from '@/store/authStore';
import { dbOperations } from '@/lib/db';

const MyProfileTab = () => {
  const { user, profile: authProfile, updateProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Profile edit state
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
    role: '',
  });

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast.error('User not found');
        return;
      }

      const userProfile = await dbOperations.getById('profiles', user.id);
      if (userProfile) {
        setProfile(userProfile);
        setEditedProfile({
          name: userProfile.name || '',
          email: userProfile.email || user.email || '',
          role: userProfile.role || 'Accountant',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!editedProfile.name.trim()) {
        toast.error('Name is required');
        return;
      }

      if (!editedProfile.email.trim()) {
        toast.error('Email is required');
        return;
      }

      // Update profile in database
      await dbOperations.update('profiles', user.id, {
        ...profile,
        name: editedProfile.name,
        email: editedProfile.email,
        updated_at: new Date().toISOString(),
      });

      // Update auth store
      updateProfile({
        name: editedProfile.name,
        email: editedProfile.email,
      });

      setProfile({
        ...profile,
        name: editedProfile.name,
        email: editedProfile.email,
      });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      name: profile?.name || '',
      email: profile?.email || user?.email || '',
      role: profile?.role || 'Accountant',
    });
    setIsEditing(false);
  };

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleChangePassword = async () => {
    try {
      // Validation
      if (!passwordForm.currentPassword) {
        toast.error('Current password is required');
        return;
      }

      if (!passwordForm.newPassword) {
        toast.error('New password is required');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Verify current password
      const userRecord = await dbOperations.getById('users', user.id);
      const currentPasswordHash = await hashPassword(passwordForm.currentPassword);

      if (userRecord.password !== currentPasswordHash) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update password
      const newPasswordHash = await hashPassword(passwordForm.newPassword);
      await dbOperations.update('users', user.id, {
        ...userRecord,
        password: newPasswordHash,
        updated_at: new Date().toISOString(),
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Director':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Manager':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold">Profile Information</h3>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit2 size={16} />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h4 className="text-2xl font-bold">{profile?.name || 'User'}</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile?.role)}`}>
                  <Shield className="inline mr-1" size={14} />
                  {profile?.role || 'Accountant'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline mr-2" size={16} />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {profile?.name || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline mr-2" size={16} />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Enter your email"
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {profile?.email || user?.email || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Shield className="inline mr-2" size={16} />
                Role
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
                {profile?.role || 'Accountant'}
                <span className="text-xs ml-2">(Cannot be changed)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline mr-2" size={16} />
                Member Since
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={handleCancelEdit} variant="outline" className="flex items-center gap-2">
                <X size={18} />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <Check size={18} />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Security Settings Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="text-red-600" size={24} />
            <h3 className="text-xl font-bold">Security Settings</h3>
          </div>
        </div>

        {!showPasswordForm ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Keep your account secure by using a strong password and changing it regularly.
            </p>
            <Button
              onClick={() => setShowPasswordForm(true)}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <Lock size={18} />
              Change Password
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full p-3 pr-12 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-3 pr-12 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-3 pr-12 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Lock size={18} />
                Update Password
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Account Status Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Account Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
            <div className="text-lg font-bold text-green-600 mt-1">
              {profile?.status || 'Active'}
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last Login</div>
            <div className="text-lg font-bold text-blue-600 mt-1">
              {profile?.last_login
                ? new Date(profile.last_login).toLocaleDateString('en-IN')
                : 'Just now'}
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">User ID</div>
            <div className="text-sm font-mono text-purple-600 mt-1 truncate">
              {user?.id || 'N/A'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MyProfileTab;
