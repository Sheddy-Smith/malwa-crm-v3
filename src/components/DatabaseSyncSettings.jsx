import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Database, HardDrive, RefreshCw, Download, Upload, Settings, Check, X, FolderOpen } from 'lucide-react';
import enhancedDbOperations from '@/utils/enhancedDbOperations';
import { toast } from 'sonner';

const DatabaseSyncSettings = () => {
  const [syncInfo, setSyncInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backupFiles, setBackupFiles] = useState([]);

  useEffect(() => {
    loadSyncInfo();
    loadBackupFiles();
  }, []);

  const loadSyncInfo = async () => {
    try {
      const info = await enhancedDbOperations.sync.getInfo();
      setSyncInfo(info);
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  };

  const loadBackupFiles = async () => {
    try {
      const files = await enhancedDbOperations.sync.listFiles();
      setBackupFiles(files.filter(f => f.name.includes('backup') || f.name.includes('data.json')));
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  };

  const handleForceBackup = async () => {
    setLoading(true);
    try {
      const result = await enhancedDbOperations.sync.backup();
      if (result && result.success) {
        toast.success(`Backup completed successfully!`);
        await loadBackupFiles();
      } else {
        toast.error('Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Backup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileName) => {
    if (!confirm(`Are you sure you want to restore from "${fileName}"? This will replace all current data.`)) {
      return;
    }

    setLoading(true);
    try {
      await enhancedDbOperations.sync.restore(fileName);
      toast.success('Restore completed! Page will refresh.');
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Restore failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!enhancedDbOperations?.sync?.isAvailable?.()) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Database className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-dark-text">Database Sync</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              File system sync is only available in the desktop application.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <HardDrive className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-dark-text">Database File System Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Data is automatically backed up to: C:/malwa_crm/data-base/
              </p>
            </div>
          </div>
          <Button
            onClick={handleForceBackup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Force Backup
          </Button>
        </div>

        {syncInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium dark:text-dark-text">Status</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Auto-sync enabled
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium dark:text-dark-text">Location</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                {syncInfo.customDbPath}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium dark:text-dark-text">Last Sync</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {syncInfo.lastSyncTime ? formatDate(syncInfo.lastSyncTime) : 'Never'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Backup Files */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-dark-text">Backup Files</h3>
          <Button
            onClick={loadBackupFiles}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {backupFiles.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No backup files found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backupFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium dark:text-dark-text">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.modified)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleRestore(file.name)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Information */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              How Database Sync Works
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Data is automatically backed up every 30 seconds when changes are detected</li>
              <li>• All data is stored in C:/malwa_crm/data-base/ directory</li>
              <li>• On startup, the app will restore data from the latest backup if available</li>
              <li>• You can manually create backups and restore from any backup file</li>
              <li>• Individual module data files are also maintained for easier access</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DatabaseSyncSettings;