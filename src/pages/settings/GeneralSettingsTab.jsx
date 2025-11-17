import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import useSettingsStore from '@/store/settingsStore';
import { Sun, Moon, Monitor, Globe, Calendar, Clock, Layout, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';

const GeneralSettingsTab = () => {
  const { generalSettings, updateGeneralSettings } = useSettingsStore();
  const [settings, setSettings] = useState(generalSettings);

  const handleSave = () => {
    updateGeneralSettings(settings);
    toast.success('General settings saved successfully!');
  };

  const handleReset = () => {
    const defaults = {
      themeMode: 'system',
      language: 'English',
      financialYear: 'Apr-Mar',
      autoLogoutTime: 30,
      startupPage: 'Dashboard',
      notificationsEnabled: true,
      soundAlerts: true,
      autoSaveInterval: 5,
    };
    setSettings(defaults);
    updateGeneralSettings(defaults);
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sun className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">Theme & Appearance</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, themeMode: value })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    settings.themeMode === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Language & Regional</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Punjabi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="inline mr-2" size={16} />
              Financial Year Format
            </label>
            <select
              value={settings.financialYear}
              onChange={(e) => setSettings({ ...settings, financialYear: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option>Apr-Mar</option>
              <option>Jan-Dec</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Layout className="text-purple-600" size={24} />
          <h3 className="text-xl font-bold">Application Behavior</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="inline mr-2" size={16} />
              Auto-logout Time (minutes)
            </label>
            <select
              value={settings.autoLogoutTime}
              onChange={(e) => setSettings({ ...settings, autoLogoutTime: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Startup Page</label>
            <select
              value={settings.startupPage}
              onChange={(e) => setSettings({ ...settings, startupPage: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option>Dashboard</option>
              <option>Customer</option>
              <option>Jobs</option>
              <option>Inventory</option>
              <option>Accounts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Auto Save Interval (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.autoSaveInterval}
              onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-orange-600" size={24} />
          <h3 className="text-xl font-bold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="font-medium">Enable Desktop Notifications</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="font-medium">Sound Alerts</span>
            <input
              type="checkbox"
              checked={settings.soundAlerts}
              onChange={(e) => setSettings({ ...settings, soundAlerts: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button onClick={handleReset} variant="outline">
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save size={18} /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;
