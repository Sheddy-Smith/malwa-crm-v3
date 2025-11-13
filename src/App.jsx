import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
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
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from './store/authStore';
import CashRecipt from "./pages/CashRecipt";
import { localDB } from '@/utils/localDatabase';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const initLocalDatabase = async () => {
      try {
        await localDB.init();
        console.log('✅ Local IndexedDB initialized');
      } catch (error) {
        console.error('Failed to initialize local database:', error);
      }
    };

    initLocalDatabase();
  }, [isAuthenticated, user]);

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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="customer" element={<Customer />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="labour" element={<Labour />} />
          <Route path="supplier" element={<Supplier />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="summary" element={<Summary />} />
           <Route path="CashRecipt" element={<CashRecipt/>} />

          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
         <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
