import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChevronDown, LogOut, Settings, Truck, Users, Building, HardHat, Package, Warehouse, Landmark, BarChart } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useUiStore from '@/store/uiStore';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmModal from './ui/ConfirmModal';

const sidebarNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", icon: Truck, children: [
      { title: "Vehicle Inspection", href: "/jobs?step=inspection" }, { title: "Estimate", href: "/jobs?step=estimate" },
      { title: "Job Sheet", href: "/jobs?step=jobsheet" }, { title: "Chalan", href: "/jobs?step=chalan" }, { title: "Invoice", href: "/jobs?step=invoice" },
  ]},
  { title: "Customer", href: "/customer", icon: Users, children: [
      { title: "Leads", href: "/customer?tab=leads" }, { title: "Contacts", href: "/customer?tab=contacts" },
      { title: "Customer Ledger", href: "/customer?tab=ledger" },
  ]},
  { title: "Vendors", href: "/vendors", icon: Building, children: [
      { title: "Vendor Details", href: "/vendors?tab=details" },
      { title: "Vendor Ledger", href: "/vendors?tab=ledger" },
  ]},
  { title: "Labour", href: "/labour", icon: HardHat, children: [
      { title: "Labour Details", href: "/labour?tab=details" },
      { title: "Labour Ledger", href: "/labour?tab=ledger" },
  ]},
  { title: "Supplier", href: "/supplier", icon: Package, children: [
      { title: "Supplier Details", href: "/supplier?tab=details" }, { title: "Supplier Ledger", href: "/supplier?tab=ledger" },
  ]},
  { title: "Inventory", href: "/inventory", icon: Warehouse, children: [
      { title: "Stock", href: "/inventory?tab=stock" }, { title: "Add Category", href: "/inventory?tab=categories" },
  ]},
  { title: "Accounts", href: "/accounts", icon: Landmark, children: [
      { title: "Purchase", href: "/accounts?tab=purchase" }, { title: "Voucher", href: "/accounts?tab=voucher" },
      { title: "Invoice", href: "/accounts?tab=invoice" }, { title: "Challan", href: "/accounts?tab=challan" },
      { title: "GST Ledger", href: "/accounts?tab=GST" },
  ]},
  { title: "Summary", href: "/summary", icon: BarChart },
];

const SidebarContent = ({ onLinkClick }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({});
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const activeParent = sidebarNavItems.find(item => location.pathname.startsWith(item.href));
    if (activeParent) {
      setOpenSections(prev => ({ ...prev, [activeParent.title]: true }));
    }
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleSection = (title) => setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  const handleNavigate = (href) => {
    navigate(href);
    if(onLinkClick) onLinkClick();
  }
  
  const isLinkActive = (item) => location.pathname.startsWith(item.href);

  return (
    <>
      <ConfirmModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogout} title="Confirm Logout" message="Are you sure you want to log out?" />
      <div className="flex flex-col h-full bg-sidebar text-white">
        <div className="h-24 flex items-center justify-center p-4 border-b border-blue-800 shrink-0 bg-brand-blue cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUspgoCiiYzdVTGXzZ_eGuIJ4DFg467VMmQwkaQgCwek_y_BYYegfR67o1gk2bXxPaWd6VhJoR-7npqySIzyK8IV7EY67YDAgviRmXwOA5FzauC4kmjeqe4C-y9Du6u5aOsZiPvRBv0xnoKb6Pi5KGlDs3KxoeyMT5oQYY5ffMBD9s412M4KrDevShgOw/s320/logo.png" alt="Malwa CRM Logo" className="h-16 w-auto" />
        </div>
        
        <div className="p-4 border-b border-blue-800 shrink-0">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center font-bold text-xl shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="ml-3 truncate">
              <p className="font-semibold text-white truncate">{user?.name || 'Malwa User'}</p>
              <p className="text-xs text-blue-300 font-bold">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarNavItems.map((item) => {
            const isActive = isLinkActive(item);
            return (
              <div key={item.title}>
                <div className={`flex items-center justify-between p-2 rounded-lg text-blue-100 hover:bg-blue-800 cursor-pointer transition-colors duration-200 ${isActive && !item.children ? 'bg-brand-red font-semibold' : ''}`} onClick={() => item.children ? toggleSection(item.title) : handleNavigate(item.href)}>
                  <div className={`flex items-center relative`}>
                     {isActive && <div className="absolute -left-2 w-1 h-full bg-brand-gold rounded-r-full"></div>}
                    <item.icon className="h-5 w-5" />
                    <span className="ml-3 font-medium">{item.title}</span>
                  </div>
                  {item.children && <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections[item.title] ? 'rotate-180' : ''}`} />}
                </div>
                <AnimatePresence>
                {openSections[item.title] && item.children && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="overflow-hidden">
                    <div className="pl-6 pt-2 space-y-1">
                      {item.children.map((child) => (
                        <NavLink key={child.title} to={child.href} onClick={onLinkClick} className={({ isActive: isChildActive }) => `flex items-center p-2 text-sm rounded-lg hover:bg-blue-800 transition-colors duration-200 relative ${ isChildActive ? 'bg-blue-900/50 text-white font-semibold' : 'text-blue-200' }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-4"></span>
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
          )})}
        </nav>

        <div className="p-4 border-t border-blue-800 space-y-2 shrink-0">
          <NavLink to="/settings" className="flex items-center justify-center w-full p-2 text-sm font-medium text-white rounded-lg hover:bg-blue-800">
            <Settings className="h-5 w-5 mr-2" /> Settings
          </NavLink>
          <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center justify-center w-full p-2 text-sm font-medium text-white bg-brand-red rounded-lg hover:bg-brand-red-dark">
            <LogOut className="h-5 w-5 mr-2" /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

const Sidebar = () => {
    const isSidebarOpen = useUiStore(state => state.isSidebarOpen);
    return (
        <aside className={`fixed top-0 left-0 h-full z-40 md:flex flex-col w-64 shrink-0 transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <SidebarContent />
        </aside>
    );
};

export { SidebarContent };
export default Sidebar;
