import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChevronDown, LogOut, Settings, Truck, Users, Building, HardHat, Package, Warehouse, Landmark, BarChart, ClipboardList } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import usePermissionStore from '@/store/permissionStore';
import useUiStore from '@/store/uiStore';
import useCompanyStore from '@/store/companyStore';
import { usePageAccess } from '@/hooks/usePageAccess';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmModal from './ui/ConfirmModal';

const sidebarNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: 'DASHBOARD_VIEW', pageKey: 'dashboard' },
  { title: "Jobs", href: "/jobs", icon: Truck, permission: 'JOBS_VIEW', pageKey: 'jobs', children: [
      { title: "Vehicle Inspection", href: "/jobs?step=inspection", subPageKey: 'vehicleInspection' }, 
      { title: "Estimate", href: "/jobs?step=estimate", subPageKey: 'estimate' },
      { title: "Job Sheet", href: "/jobs?step=jobsheet", subPageKey: 'jobSheet' }, 
      { title: "Chalan", href: "/jobs?step=chalan", subPageKey: 'chalan' }, 
      { title: "Invoice", href: "/jobs?step=invoice", subPageKey: 'invoice' },
  ]},
  { title: "Customer", href: "/customer", icon: Users, permission: 'CUSTOMER_VIEW', pageKey: 'customer', children: [
      { title: "Leads", href: "/customer?tab=leads", subPageKey: 'leads' }, 
      { title: "Contacts", href: "/customer?tab=contacts", subPageKey: 'contacts' },
      { title: "Customer Ledger", href: "/customer?tab=ledger", subPageKey: 'customerLedger' },
  ]},
  { title: "Vendors", href: "/vendors", icon: Building, permission: 'VENDOR_VIEW', pageKey: 'vendors', children: [
      { title: "Vendor Details", href: "/vendors?tab=details", subPageKey: 'vendorDetails' },
      { title: "Vendor Ledger", href: "/vendors?tab=ledger", subPageKey: 'vendorLedger' },
  ]},
  { title: "Labour", href: "/labour", icon: HardHat, permission: 'LABOUR_VIEW', pageKey: 'labour', children: [
      { title: "Labour Details", href: "/labour?tab=details", subPageKey: 'labourDetails' },
      { title: "Labour Ledger", href: "/labour?tab=ledger", subPageKey: 'labourLedger' },
  ]},
  { title: "Supplier", href: "/supplier", icon: Package, permission: 'SUPPLIER_VIEW', pageKey: 'supplier', children: [
      { title: "Supplier Details", href: "/supplier?tab=details", subPageKey: 'supplierDetails' }, 
      { title: "Supplier Ledger", href: "/supplier?tab=ledger", subPageKey: 'supplierLedger' },
  ]},
  { title: "Inventory", href: "/inventory", icon: Warehouse, permission: 'INVENTORY_VIEW', pageKey: 'inventory', children: [
      { title: "Stock", href: "/inventory?tab=stock", subPageKey: 'stock' }, 
      { title: "Add Category", href: "/inventory?tab=categories", subPageKey: 'addCategory' },
  ]},
  { title: "Accounts", href: "/accounts", icon: Landmark, permission: 'ACCOUNTS_VIEW', pageKey: 'accounts', children: [
      { title: "Purchase-Invoice", href: "/accounts?tab=purchase", subPageKey: 'purchaseInvoice' }, 
      { title: "Voucher", href: "/accounts?tab=voucher", subPageKey: 'voucher' },
      { title: "Other Expenses", href: "/accounts?tab=expenses", subPageKey: 'otherExpenses' },
      { title: "Sell-Invoice", href: "/accounts?tab=sell-invoice", subPageKey: 'sellInvoice' },
      { title: "Purchase-Challan", href: "/accounts?tab=purchase-challan", subPageKey: 'purchaseChallan' },
      { title: "Sell-Challan", href: "/accounts?tab=challan", subPageKey: 'sellChallan' },
      { title: "Cash Receipt", href: "/accounts?tab=cash-receipt", subPageKey: 'cashReceipt' },
      { title: "GST Ledger", href: "/accounts?tab=GST", subPageKey: 'gstLedger' },
  ]},
  { title: "Summary", href: "/summary", icon: BarChart, permission: 'SUMMARY_VIEW', pageKey: 'summary' },
  { title: "Daily Tasks", href: "/daily-tasks", icon: ClipboardList, permission: 'DAILY_TASKS_VIEW', pageKey: 'dailyTasks' },
];

const SidebarContent = ({ onLinkClick }) => {
  const { user, logout } = useAuthStore();
  const { can } = usePermissionStore();
  const { hasAccess, loading: pageAccessLoading } = usePageAccess();
  const { companyDetails } = useCompanyStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({});
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Filter menu items based on permissions AND page visibility
  const allowedNavItems = sidebarNavItems.filter(item => {
    // Check permission first
    if (item.permission && !can(item.permission)) return false;
    
    // Check page visibility from user_page_visibility
    if (item.pageKey && !pageAccessLoading) {
      const hasPageAccess = hasAccess(item.pageKey);
      if (!hasPageAccess) return false;
    }
    
    return true;
  }).map(item => {
    // Filter children based on subpage visibility
    if (item.children && item.pageKey && !pageAccessLoading) {
      const visibleChildren = item.children.filter(child => {
        if (child.subPageKey) {
          return hasAccess(item.pageKey, child.subPageKey);
        }
        return true;
      });
      
      return { ...item, children: visibleChildren };
    }
    
    return item;
  });

  useEffect(() => {
    const activeParent = allowedNavItems.find(item => location.pathname.startsWith(item.href));
    if (activeParent) {
      setOpenSections(prev => ({ ...prev, [activeParent.title]: true }));
    }
  }, [location.pathname, allowedNavItems]);

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
          <img src={companyDetails.logo || "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUspgoCiiYzdVTGXzZ_eGuIJ4DFg467VMmQwkaQgCwek_y_BYYegfR67o1gk2bXxPaWd6VhJoR-7npqySIzyK8IV7EY67YDAgviRmXwOA5FzauC4kmjeqe4C-y9Du6u5aOsZiPvRBv0xnoKb6Pi5KGlDs3KxoeyMT5oQYY5ffMBD9s412M4KrDevShgOw/s320/logo.png"} alt="Company Logo" className="h-16 w-auto" />
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
          {allowedNavItems.map((item) => {
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
