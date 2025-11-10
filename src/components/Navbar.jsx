import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu, User } from 'lucide-react';
import useUiStore from '@/store/uiStore';
import useAuthStore from '@/store/authStore';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const user = useAuthStore(state => state.user);
  const pageTitle = location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard';
  const formattedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-dark-card/50 backdrop-blur-lg border-b dark:border-gray-700 md:flex items-center justify-between px-4 md:px-6 shrink-0 hidden">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <Menu className="h-6 w-6 text-gray-600 dark:text-dark-text-secondary" />
          </button>
          <motion.div initial={{ opacity:0, x: -10}} animate={{opacity: 1, x: 0}} key={formattedTitle} className="ml-4">
              <h1 className="text-xl font-bold text-brand-dark dark:text-dark-text">{formattedTitle}</h1>
          </motion.div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          <ThemeToggle />
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell className="h-6 w-6 text-gray-600 dark:text-dark-text-secondary" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-brand-red ring-2 ring-white dark:ring-dark-card" />
          </button>
        </div>
      </header>

      <header className="sticky top-0 z-30 h-16 bg-[#1976D2] md:hidden flex items-center justify-between px-4 shrink-0">
        <button onClick={toggleSidebar} className="p-2">
          <Menu className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Malwa CRM</h1>
        <button className="p-2 rounded-full bg-white">
          <User className="h-6 w-6 text-[#1976D2]" />
        </button>
      </header>
    </>
  );
};

export default Navbar;
