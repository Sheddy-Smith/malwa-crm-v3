import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import useSettingsStore from '@/store/settingsStore';
import useAuthStore from '@/store/authStore';
import { Shield, Lock, Eye, EyeOff, Clock, FileCheck, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SecuritySettingsTab = () => {
  const { securitySettings, updateSecuritySettings } = useSettingsStore();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(securitySettings);
  const [showPin, setShowPin] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if user is Super Admin
    if (user?.role === 'Super Admin' || user?.role === 'Director') {
      setIsSuperAdmin(true);
    }
  }, [user]);

  const handleSave = () => {
    updateSecuritySettings(settings);
    toast.success('Security settings saved successfully!');
  };

  const handleResetDatabase = async () => {
    if (!adminPassword) {
      toast.error('Please enter your Super Admin password');
      return;
    }

    try {
      // Verify admin password
      const { authService } = await import('@/lib/auth');
      const result = await authService.signIn({
        email: user.email,
        password: adminPassword
      });

      if (result.error) {
        toast.error('Invalid Super Admin password');
        setAdminPassword('');
        return;
      }

      // Proceed with reset
      if (window.resetSuperAdmin) {
        const success = await window.resetSuperAdmin();
        if (success) {
          toast.success('Database reset successful! Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          toast.error('Failed to reset database. Check console for details.');
        }
      } else {
        toast.error('Reset function not available. Please refresh the page.');
      }
    } catch (error) {
      toast.error('Error resetting database: ' + error.message);
      console.error(error);
    } finally {
      setAdminPassword('');
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">App Security</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Lock className="inline mr-2" size={16} />
              App PIN Lock
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={settings.appPinLock}
                onChange={(e) => setSettings({ ...settings, appPinLock: e.target.value })}
                className="w-full p-2 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                placeholder="Enter 4-6 digit PIN"
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to disable PIN lock
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="inline mr-2" size={16} />
              Auto-lock After Inactivity (minutes)
            </label>
            <select
              value={settings.autoLockMinutes}
              onChange={(e) => setSettings({ ...settings, autoLockMinutes: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileCheck className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Data Privacy</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <div>
              <span className="font-medium block">Encrypt Local Data Files</span>
              <span className="text-sm text-gray-500">Use AES encryption for stored data</span>
            </div>
            <input
              type="checkbox"
              checked={settings.encryptLocalData}
              onChange={(e) => setSettings({ ...settings, encryptLocalData: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <div>
              <span className="font-medium block">Mask Amounts for Viewer Roles</span>
              <span className="text-sm text-gray-500">Hide sensitive financial data from viewers</span>
            </div>
            <input
              type="checkbox"
              checked={settings.maskAmounts}
              onChange={(e) => setSettings({ ...settings, maskAmounts: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <div>
              <span className="font-medium block">Enable Audit Trail</span>
              <span className="text-sm text-gray-500">Record who changed what and when</span>
            </div>
            <input
              type="checkbox"
              checked={settings.auditTrailEnabled}
              onChange={(e) => setSettings({ ...settings, auditTrailEnabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700">
        <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Security Recommendations</h4>
        <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>• Enable PIN lock for sensitive data protection</li>
          <li>• Use auto-lock when away from computer</li>
          <li>• Enable audit trail for accountability</li>
          <li>• Regular backups protect against data loss</li>
          <li>• Keep your application updated</li>
        </ul>
      </Card>

      {isSuperAdmin && (
        <Card className="p-6 border-red-300 dark:border-red-700">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                <strong>⚠️ Warning:</strong> Resetting the database will permanently delete ALL data including:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 ml-6 list-disc">
                <li>All customers, vendors, suppliers, and labour records</li>
                <li>All jobs, invoices, and transactions</li>
                <li>All inventory and stock data</li>
                <li>All users (except Super Admin will be recreated)</li>
                <li>All settings and configurations</li>
              </ul>
            </div>

            {!showResetConfirm ? (
              <Button 
                onClick={() => setShowResetConfirm(true)} 
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={18} /> Reset Database (Delete All Data)
              </Button>
            ) : (
              <div className="space-y-4 p-4 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <p className="font-bold text-red-600">Confirm Database Reset</p>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter Your Super Admin Password:
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Super Admin Password"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleResetDatabase}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 size={18} /> Confirm Reset
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowResetConfirm(false);
                      setAdminPassword('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save size={18} /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettingsTab;
