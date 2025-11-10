import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileSidebar from './MobileSidebar';
import MobileBottomNav from './MobileBottomNav';
import FloatingActionButton from './FloatingActionButton';
import { useEffect } from 'react';
import useUiStore from '@/store/uiStore';

const Layout = () => {
    const location = useLocation();
    const isSidebarOpen = useUiStore(state => state.isSidebarOpen);

    // Scroll to top on page change
    useEffect(() => {
        document.querySelector('main')?.scrollTo(0, 0);
    }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-background font-sans">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <MobileSidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-background p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <FloatingActionButton />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
