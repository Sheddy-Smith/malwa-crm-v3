import { useState, useEffect } from 'react';
import { syncManager } from '@/utils/jobSyncManager';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Button from './ui/Button';

const SyncStatusIndicator = () => {
  const [syncStatus, setSyncStatus] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    conflict: 0,
    isProcessing: false
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update sync status periodically
    const updateStatus = async () => {
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    await syncManager.processQueue();
    const status = await syncManager.getSyncStatus();
    setSyncStatus(status);
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-gray-500 dark:text-gray-400';
    if (syncStatus.failed > 0 || syncStatus.conflict > 0) return 'text-red-500';
    if (syncStatus.pending > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-5 w-5" />;
    if (syncStatus.isProcessing) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (syncStatus.failed > 0 || syncStatus.conflict > 0) return <AlertTriangle className="h-5 w-5" />;
    if (syncStatus.pending > 0) return <Clock className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.isProcessing) return 'Syncing...';
    if (syncStatus.pending > 0) return `${syncStatus.pending} pending`;
    if (syncStatus.failed > 0) return `${syncStatus.failed} failed`;
    if (syncStatus.conflict > 0) return `${syncStatus.conflict} conflicts`;
    return 'Synced';
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {syncStatus.total > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {syncStatus.completed}/{syncStatus.total} synced
        </div>
      )}

      {(syncStatus.pending > 0 || syncStatus.failed > 0) && isOnline && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleManualSync}
          disabled={syncStatus.isProcessing}
        >
          <RefreshCw className={`h-4 w-4 ${syncStatus.isProcessing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
