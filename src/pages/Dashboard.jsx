import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, FileText, Wrench, Truck, Receipt, 
  UserPlus, Users, BookOpen, Store, Book, 
  HardHat, ClipboardList, Package, BookOpenText, 
  Boxes, Tag, ShoppingCart, Ticket, FileDigit, 
  Scroll, Landmark, Calendar, Search, RefreshCw,
  TrendingUp, TrendingDown, DollarSign, Activity,
  AlertTriangle, AlertCircle, UserX, CheckSquare, 
  Clock, FileCheck, Factory, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { dbOperations } from '@/lib/db';
import Button from '@/components/ui/Button';

const METRICS_CONFIG = [
  {
    category: "Jobs",
    items: [
      { label: "Vehicle Inspection", table: "inspections", dateField: "date", icon: ClipboardCheck, color: "bg-blue-500", path: "/jobs" },
      { label: "Estimate", table: "estimates", dateField: "date", icon: FileText, color: "bg-indigo-500", path: "/jobs" },
      { label: "Job Sheet", table: "jobsheets", dateField: "date", icon: Wrench, color: "bg-purple-500", path: "/jobs" },
      { label: "Chalan", table: "sell_challans", dateField: "challan_date", icon: Truck, color: "bg-pink-500", path: "/jobs" },
      { label: "Invoice", table: "invoices", dateField: "date", icon: Receipt, color: "bg-rose-500", path: "/accounts" },
    ]
  },
  {
    category: "Customer",
    items: [
      { label: "Leads", table: "customers", dateField: "created_at", filter: (i) => i.type === 'lead', icon: UserPlus, color: "bg-orange-500", path: "/customer" },
      { label: "Contacts", table: "customers", dateField: "created_at", filter: (i) => i.type !== 'lead', icon: Users, color: "bg-amber-500", path: "/customer" },
      { label: "Customer Ledger", table: "customer_ledger_entries", dateField: "date", icon: BookOpen, color: "bg-yellow-500", path: "/customer" },
    ]
  },
  {
    category: "Vendors",
    items: [
      { label: "Vendor Details", table: "vendors", dateField: "created_at", icon: Store, color: "bg-lime-500", path: "/vendors" },
      { label: "Vendor Ledger", table: "vendor_ledger_entries", dateField: "date", icon: Book, color: "bg-green-500", path: "/vendors" },
    ]
  },
  {
    category: "Labour",
    items: [
      { label: "Labour Details", table: "labour", dateField: "created_at", icon: HardHat, color: "bg-emerald-500", path: "/labour" },
      { label: "Labour Ledger", table: "labour_attendance", dateField: "date", icon: ClipboardList, color: "bg-teal-500", path: "/labour" },
    ]
  },
  {
    category: "Supplier",
    items: [
      { label: "Supplier Details", table: "suppliers", dateField: "created_at", icon: Package, color: "bg-cyan-500", path: "/supplier" },
      { label: "Supplier Ledger", table: "supplier_ledger_entries", dateField: "date", icon: BookOpenText, color: "bg-sky-500", path: "/supplier" },
    ]
  },
  {
    category: "Inventory",
    items: [
      { label: "Stock", table: "inventory_items", dateField: "created_at", icon: Boxes, color: "bg-blue-600", path: "/inventory" },
      { label: "Add Category", table: "inventory_categories", dateField: "created_at", icon: Tag, color: "bg-indigo-600", path: "/inventory" },
    ]
  },
  {
    category: "Accounts",
    items: [
      { label: "Purchase", table: "purchases", dateField: "invoice_date", icon: ShoppingCart, color: "bg-violet-600", path: "/accounts" },
      { label: "Voucher", table: "vouchers", dateField: "date", icon: Ticket, color: "bg-purple-600", path: "/accounts" },
      { label: "Invoice", table: "invoices", dateField: "date", icon: FileDigit, color: "bg-fuchsia-600", path: "/accounts" },
      { label: "Challan", table: "purchase_challans", dateField: "challan_date", icon: Scroll, color: "bg-pink-600", path: "/accounts" },
      { label: "GST Ledger", table: "gst_ledger", dateField: "date", icon: Landmark, color: "bg-rose-600", path: "/accounts" },
    ]
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [counts, setCounts] = useState({});
  const [operationalStats, setOperationalStats] = useState({
    pending: {
      dailyReports: 0,
      jobSheetUpdates: 0,
      weeklyStockReports: 0,
      labourAccounts: 0,
      vendorAccounts: 0,
      deliveryPayment: 0,
      factoryShutdown: 0,
      overtimeHours: 0
    },
    running: {
      activeJobs: 0,
      presentLabour: 0
    }
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);
    const newCounts = {};
    const activityData = [];
    
    try {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      // Fetch all necessary data
      const [
        jobs, 
        invoices, 
        labour, 
        attendance, 
        vendors, 
        vendorLedger,
        stockMovements,
        jobReports
      ] = await Promise.all([
        dbOperations.getAll('jobs'),
        dbOperations.getAll('invoices'),
        dbOperations.getAll('labour'),
        dbOperations.getAll('labour_attendance'),
        dbOperations.getAll('vendors'),
        dbOperations.getAll('vendor_ledger_entries'),
        dbOperations.getAll('stock_movements').catch(() => []),
        dbOperations.getAll('job_reports').catch(() => []) // Assuming table exists
      ]);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // --- Calculate "Running" (Jo chal raha hai) ---
      const activeJobs = jobs.filter(j => j.status === 'in-progress').length;
      
      // Present Labour Today
      const presentLabour = attendance.filter(a => 
        a.date && a.date.startsWith(todayStr) && a.status === 'present'
      ).length;

      // --- Calculate "Pending" (Jo pending hai) ---
      
      // 1. Daily Report & Signature (Count for today)
      const dailyReportsCount = jobReports.filter(r => 
        r.date && r.date.startsWith(todayStr)
      ).length;

      // 2. Job Sheet Updates (Count for today)
      const jobSheets = await dbOperations.getAll('jobsheets').catch(() => []);
      const jobSheetUpdatesCount = jobSheets.filter(j => 
        j.date && j.date.startsWith(todayStr)
      ).length;

      // 3. Weekly Stock Report (Count for this week)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weeklyStockReportsCount = stockMovements.filter(m => 
        new Date(m.date || m.created_at) >= startOfWeek
      ).length;

      // 4. Labour Accounts (Inactive Labour - no attendance in last 30 days)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const activeLabourIds = new Set(
        attendance
          .filter(a => new Date(a.date) >= thirtyDaysAgo)
          .map(a => a.labour_id)
      );
      const labourAccountsCount = labour.filter(l => !activeLabourIds.has(l.id)).length; 

      // 5. Vendor Accounts (Inactive Vendors - no ledger activity in last 30 days)
      const activeVendorIds = new Set(
        vendorLedger
          .filter(v => new Date(v.date) >= thirtyDaysAgo)
          .map(v => v.vendor_id)
      );
      const vendorAccountsCount = vendors.filter(v => !activeVendorIds.has(v.id)).length;

      // 6. Delivery & Payment Check Confirmation
      // Logic: Jobs completed but payment not 'paid'
      const deliveryPaymentCount = jobs.filter(j => 
        j.status === 'complete' && j.payment_status !== 'paid'
      ).length;

      // 7. Factory Shutdown Report (Placeholder)
      const factoryShutdownCount = 0; // Placeholder

      // 8. Overtime Hours (Today)
      const overtimeHours = attendance
        .filter(a => a.date && a.date.startsWith(todayStr))
        .reduce((sum, a) => sum + (parseFloat(a.overtime_hours) || 0), 0);

      setOperationalStats({
        pending: {
          dailyReports: dailyReportsCount,
          jobSheetUpdates: jobSheetUpdatesCount,
          weeklyStockReports: weeklyStockReportsCount,
          labourAccounts: labourAccountsCount,
          vendorAccounts: vendorAccountsCount,
          deliveryPayment: deliveryPaymentCount,
          factoryShutdown: factoryShutdownCount,
          overtimeHours: overtimeHours
        },
        running: {
          activeJobs,
          presentLabour
        }
      });

      // Helper to check date range
      const isInRange = (record, dateField) => {
        const recordDateStr = record[dateField] || record.created_at || record.date;
        if (!recordDateStr) return false;
        const recordDate = new Date(recordDateStr);
        return recordDate >= fromDate && recordDate <= toDate;
      };

      for (const category of METRICS_CONFIG) {
        let categoryCount = 0;
        for (const item of category.items) {
          try {
            const data = await dbOperations.getAll(item.table);
            const filtered = data.filter(record => {
              const inRange = isInRange(record, item.dateField);
              if (item.filter) return inRange && item.filter(record);
              return inRange;
            });
            
            const count = filtered.length;
            newCounts[`${category.category}-${item.label}`] = count;
            categoryCount += count;

          } catch (err) {
            console.warn(`Failed to fetch count for ${item.label}:`, err);
            newCounts[`${category.category}-${item.label}`] = 0;
          }
        }
        activityData.push({
          name: category.category,
          count: categoryCount
        });
      }
      
      setCounts(newCounts);
      setChartData(activityData);

    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [dateRange]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
            Live Activity Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time activity tracking</p>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">From:</span>
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">To:</span>
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={fetchCounts}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live Operations (Jo chal raha hai) */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          Live Operations (Running)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs (In Progress)</p>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {operationalStats.running.activeJobs}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Labour Present Today</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {operationalStats.running.presentLabour}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pending Actions / Daily Checklist (Jo pending hai) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Daily Checklist & Pending Actions
          </h2>
          <Button 
            variant="secondary"
            onClick={() => navigate('/daily-tasks')}
            size="sm"
          >
            Manage Tasks
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Report & Signature */}
          <div 
            onClick={() => navigate('/daily-tasks')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Report</span>
              <FileCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.dailyReports}</span>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          </div>

          {/* Job Sheet Updated */}
          <div 
            onClick={() => navigate('/daily-tasks')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Sheet Updated</span>
              <Wrench className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.jobSheetUpdates}</span>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          </div>

          {/* Weekly Stock Report */}
          <div 
            onClick={() => navigate('/daily-tasks')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Stock Report</span>
              <Boxes className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.weeklyStockReports}</span>
              <span className="text-xs text-gray-400">This Week</span>
            </div>
          </div>

          {/* Labour Accounts */}
          <div 
            onClick={() => navigate('/labour')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Labour Accounts</span>
              <HardHat className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.labourAccounts}</span>
              <span className="text-xs text-gray-400">InActive Staff</span>
            </div>
          </div>

          {/* Vendor Accounts */}
          <div 
            onClick={() => navigate('/vendors')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor Accounts</span>
              <Store className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.vendorAccounts}</span>
              <span className="text-xs text-gray-400">InActive Vendors</span>
            </div>
          </div>

          {/* Delivery & Payment Check */}
          <div 
            onClick={() => navigate('/daily-tasks')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery & Payment</span>
              <CheckSquare className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.deliveryPayment}</span>
              <span className="text-xs text-gray-400">Pending Confirm</span>
            </div>
          </div>

          {/* Factory Shutdown Report */}
          <div 
            onClick={() => navigate('/daily-tasks')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Factory Shutdown</span>
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.factoryShutdown}</span>
              <span className="text-xs text-gray-400">Reports</span>
            </div>
          </div>

          {/* Overtime Hours */}
          <div 
            onClick={() => navigate('/labour')}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Overtime Hours</span>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{operationalStats.pending.overtimeHours}</span>
              <span className="text-xs text-gray-400">Hours Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Activity Overview
          </h2>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-600 dark:stroke-gray-400" opacity={0.1} />
              <XAxis dataKey="name" className="stroke-gray-500 dark:stroke-gray-400" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis className="stroke-gray-500 dark:stroke-gray-400" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tw-colors-white)', 
                  border: '1px solid var(--tw-colors-gray-200)', 
                  borderRadius: '8px', 
                  color: 'var(--tw-colors-gray-900)' 
                }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="count" fill="var(--tw-colors-brand-red)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {METRICS_CONFIG.map((category) => (
          <div key={category.category} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              {category.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {category.items.map((item) => (
                <motion.div 
                  key={item.label} 
                  variants={itemAnim}
                  onClick={() => navigate(item.path)}
                  className="cursor-pointer"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group hover:-translate-y-1">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                          {counts[`${category.category}-${item.label}`] || 0}
                        </h3>
                      </div>
                      <div className={`p-3 rounded-full ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className={`h-1 w-full ${item.color} opacity-50`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Dashboard;