import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import useSettingsStore from '@/store/settingsStore';
import { Database, Download, Upload, FolderOpen, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const BackupSettingsTab = () => {
  const { backupSettings, updateBackupSettings, exportSettings } = useSettingsStore();
  const [settings, setSettings] = useState(backupSettings);

  const handleSave = () => {
    updateBackupSettings(settings);
    toast.success('Backup settings saved successfully!');
  };

  const handleCreateBackup = () => {
    const allData = {
      customers: JSON.parse(localStorage.getItem('customers') || '[]'),
      suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]'),
      vendors: JSON.parse(localStorage.getItem('vendors') || '[]'),
      inventory: JSON.parse(localStorage.getItem('inventory') || '[]'),
      jobs: JSON.parse(localStorage.getItem('jobs') || '[]'),
      settings: exportSettings(),
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `malwa-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    updateBackupSettings({ ...settings, lastBackupDate: new Date().toISOString() });
    toast.success('Backup created successfully!');
  };

  const handleExportCSV = () => {
    toast.info('CSV export functionality coming soon!');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">Backup Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Auto Backup Frequency</label>
            <select
              value={settings.autoBackup}
              onChange={(e) => setSettings({ ...settings, autoBackup: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <select
              value={settings.exportFormat}
              onChange={(e) => setSettings({ ...settings, exportFormat: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option>JSON</option>
              <option>CSV</option>
              <option>SQL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Data Retention Period (years)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.dataRetentionYears}
              onChange={(e) => setSettings({ ...settings, dataRetentionYears: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <p className="text-sm text-gray-500 mt-1">
              Automatically purge data older than this period
            </p>
          </div>

          {settings.lastBackupDate && (
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <p className="text-sm font-medium">Last Backup:</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(settings.lastBackupDate).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Backup Actions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleCreateBackup}
            className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Create Backup Now
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Export as CSV
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => document.getElementById('restore-file').click()}
          >
            <FolderOpen size={18} />
            Restore from Backup
          </Button>
          <input
            id="restore-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
                    if (data.suppliers) localStorage.setItem('suppliers', JSON.stringify(data.suppliers));
                    if (data.vendors) localStorage.setItem('vendors', JSON.stringify(data.vendors));
                    if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory));
                    if (data.jobs) localStorage.setItem('jobs', JSON.stringify(data.jobs));
                    toast.success('Backup restored successfully! Please refresh the page.');
                  } catch (error) {
                    toast.error('Failed to restore backup. Invalid file format.');
                  }
                };
                reader.readAsText(file);
              }
            }}
          />

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => {
              if (confirm('Are you sure you want to clear all cache? This cannot be undone.')) {
                localStorage.clear();
                toast.success('Cache cleared! Please refresh the page.');
              }
            }}
          >
            Clear All Cache
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save size={18} /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default BackupSettingsTab;
