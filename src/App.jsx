import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Jobs from '@/pages/Jobs';
import Customer from '@/pages/Customer';
import Vendors from '@/pages/Vendors';
import Labour from '@/pages/Labour';
import Supplier from '@/pages/Supplier';
import Inventory from '@/pages/Inventory';
import Accounts from '@/pages/Accounts';
import Summary from '@/pages/Summary';
import IncentiveSummary from '@/pages/summary/IncentiveSummary';
import PenaltyCard from '@/pages/summary/PenaltyCard';
import DailyTasks from '@/pages/DailyTasks';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageAccessGuard from '@/components/PageAccessGuard';
import useAuthStore from './store/authStore';
import usePermissionStore from './store/permissionStore';
import CashRecipt from "./pages/CashRecipt";
import { localDB } from '@/utils/localDatabase';
import { initDB, dbOperations } from '@/lib/db';
import { syncManager } from '@/utils/jobSyncManager';
import { authService } from '@/lib/auth';
import useMultiplierStore from '@/store/multiplierStore';
import dbSyncManager from '@/utils/databaseSyncManager';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { loadPermissions, initialized: permissionsInitialized } = usePermissionStore();
  const [dbReady, setDbReady] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [autoLoginComplete, setAutoLoginComplete] = useState(false);

  // Load permissions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && dbReady && !permissionsInitialized) {
      console.log('🔐 Loading user permissions...');
      loadPermissions(user.id);
    }
  }, [isAuthenticated, user, dbReady, permissionsInitialized, loadPermissions]);

  // Initialize database on app startup (before authentication)
  useEffect(() => {
    if (dbInitialized) return; // Prevent double initialization
    
    const initializeDatabase = async () => {
      try {
        console.log('🔄 Initializing IndexedDB...');
        
        // Log database configuration if available
        if (window.electron?.getDbConfig) {
          const config = await window.electron.getDbConfig();
          console.log('📁 Database Configuration:', config);
        }
        
        setDbInitialized(true);
        
        await initDB();
        console.log('✅ IndexedDB initialized successfully');
        
        // Initialize database sync manager (Electron only)
        if (window.electron && window.electron.fs) {
          console.log('🔄 Initializing Database Sync Manager...');
          await dbSyncManager.initialize();
          console.log('✅ Database Sync Manager initialized');
        } else {
          console.log('ℹ️ Running in browser mode - file system sync disabled');
        }
        
        // Check if any users exist, if not create default super admin
        const users = await dbOperations.getAll('users');
        if (!users || users.length === 0) {
          console.log('🔄 No users found, creating default Super Admin...');
          const result = await authService.signUp({
            email: 'Shahidmultaniii',
            password: 'S#d_8224',
            name: 'Super Admin',
            role: 'Super Admin'
          });
          
          if (!result.error) {
            console.log('✅ Default Super Admin created!');
            console.log('📧 User ID: Shahidmultaniii');
            console.log('🔑 Password: S#d_8224');
            
            // Force save after creating default admin
            if (window.electron && window.electron.fs) {
              await dbSyncManager.forceSave();
            }
          } else {
            console.error('❌ Failed to create default admin:', result.error);
          }
        } else {
          console.log(`✅ Found ${users.length} existing user(s)`);
        }
        
        setDbReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        setDbInitialized(false); // Allow retry
        toast.error('Database initialization failed. Please refresh the page.');
      }
    };

    initializeDatabase();
  }, [dbInitialized]);

  useEffect(() => {
    const initLocalDatabase = async () => {
      if (!dbReady) return;
      
      try {        
        // Initialize legacy localDB
        await localDB.init();
        console.log('✅ Local IndexedDB initialized');

        // Start sync manager for offline operations
        syncManager.startAutoSync(30000); // Sync every 30 seconds
        console.log('✅ Job sync manager started');
        
      } catch (error) {
        console.error('Failed to initialize local database:', error);
      }
    };

    if (isAuthenticated && dbReady) {
      initLocalDatabase();
    }

    return () => {
      // Cleanup sync manager on unmount
      if (isAuthenticated) {
        syncManager.stopAutoSync();
      }
      
      // Cleanup database sync manager
      if (window.electron && window.electron.fs) {
        dbSyncManager.destroy();
      }
    };
  }, [isAuthenticated, dbReady]);

  // Auto sign-in for dev/testing to skip login page
  useEffect(() => {
    const maybeAutoSignin = async () => {
      if (!dbReady) return;
      
      try {
        const store = useAuthStore.getState();
        if (store.isAuthenticated) {
          setAutoLoginComplete(true);
          return;
        }

        // Always auto-login during dev/testing
        const allowAuto = true; // Set to false when you want login page back

        if (!allowAuto) {
          setAutoLoginComplete(true);
          return;
        }

        console.log('🔄 Starting auto-login...');

        // Ensure default user exists
        const users = await dbOperations.getAll('users');
        if (!users || users.length === 0) {
          console.log('Creating default user...');
          await authService.signUp({
            email: 'Shahidmultaniii',
            password: 'S#d_8224',
            name: 'Super Admin',
            role: 'Super Admin',
          });
        }

        // Perform login
        console.log('Attempting auto-login...');
        const success = await store.login('Shahidmultaniii', 'S#d_8224');
        if (success) {
          console.log('✅ Auto-login successful');
        } else {
          console.error('❌ Auto-login failed');
        }
        
        setAutoLoginComplete(true);
      } catch (e) {
        console.error('Auto sign-in error:', e);
        setAutoLoginComplete(true);
      }
    };
    
    // Add small delay to ensure DB is ready
    const timer = setTimeout(() => {
      maybeAutoSignin();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [dbReady]);

  // Show loading while database initializes or auto-login is in progress
  if (!dbReady || !autoLoginComplete) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {!dbReady ? 'Initializing application...' : 'Logging in...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={
            <PageAccessGuard pageKey="dashboard">
              <Dashboard />
            </PageAccessGuard>
          } />
          <Route path="jobs" element={
            <PageAccessGuard pageKey="jobs">
              <Jobs />
            </PageAccessGuard>
          } />
          <Route path="customer" element={
            <PageAccessGuard pageKey="customer">
              <Customer />
            </PageAccessGuard>
          } />
          <Route path="vendors" element={
            <PageAccessGuard pageKey="vendors">
              <Vendors />
            </PageAccessGuard>
          } />
          <Route path="labour" element={
            <PageAccessGuard pageKey="labour">
              <Labour />
            </PageAccessGuard>
          } />
          <Route path="supplier" element={
            <PageAccessGuard pageKey="supplier">
              <Supplier />
            </PageAccessGuard>
          } />
          <Route path="inventory" element={
            <PageAccessGuard pageKey="inventory">
              <Inventory />
            </PageAccessGuard>
          } />
          <Route path="accounts" element={
            <PageAccessGuard pageKey="accounts">
              <Accounts />
            </PageAccessGuard>
          } />
          <Route path="summary" element={
            <PageAccessGuard pageKey="summary">
              <Summary />
            </PageAccessGuard>
          } />
          <Route path="summary/incentive-summary" element={
            <PageAccessGuard pageKey="summary">
              <IncentiveSummary />
            </PageAccessGuard>
          } />
          <Route path="summary/penalty-card" element={
            <PageAccessGuard pageKey="summary">
              <PenaltyCard />
            </PageAccessGuard>
          } />
          <Route path="daily-tasks" element={
            <PageAccessGuard pageKey="dailyTasks">
              <DailyTasks />
            </PageAccessGuard>
          } />
          <Route path="CashRecipt" element={
            <PageAccessGuard pageKey="accounts" subPageKey="cashReceipt">
              <CashRecipt />
            </PageAccessGuard>
          } />

          <Route path="settings" element={
            <PageAccessGuard pageKey="settings">
              <Settings />
            </PageAccessGuard>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
         <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
