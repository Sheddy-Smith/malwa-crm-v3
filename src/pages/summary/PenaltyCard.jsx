import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  User,
  Download,
  Printer,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  FileText,
  DollarSign,
} from 'lucide-react';
import { dbOperations } from '@/lib/db';

const PenaltyCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    console.log('🔍 Fetching comprehensive penalty data...');
    
    try {
      const { startDate, endDate } = dateRange;
      
      // Fetch all required data
      const [
        invoices,
        challans,
        dailyTasks,
        jobs,
        vouchers,
        purchases,
        labourAttendance,
        vendorLedger,
        jobSheets,
        profiles,
        users,
        customers,
        stockMovements,
        gstRecords,
      ] = await Promise.all([
        dbOperations.getAll('invoices').catch(() => []),
        dbOperations.getAll('sell_challans').catch(() => []),
        dbOperations.getAll('daily_tasks').catch(() => []),
        dbOperations.getAll('jobs').catch(() => []),
        dbOperations.getAll('vouchers').catch(() => []),
        dbOperations.getAll('purchases').catch(() => []),
        dbOperations.getAll('labour_attendance').catch(() => []),
        dbOperations.getAll('vendor_ledger_entries').catch(() => []),
        dbOperations.getAll('jobsheets').catch(() => []),
        dbOperations.getAll('profiles').catch(() => []),
        dbOperations.getAll('users').catch(() => []),
        dbOperations.getAll('customers').catch(() => []),
        dbOperations.getAll('stock_movements').catch(() => []),
        dbOperations.getAll('gst_records').catch(() => []),
      ]);

      console.log('📊 Data fetched:', {
        invoices: invoices.length,
        challans: challans.length,
        dailyTasks: dailyTasks.length,
        jobs: jobs.length,
        vouchers: vouchers.length,
      });

      // Build employee map
      const employeeMap = {};
      
      const addToEmployee = (empId, type, item) => {
        if (!employeeMap[empId]) {
          employeeMap[empId] = {
            id: empId,
            name: 'Unknown',
            invoices: [],
            challans: [],
            tasks: [],
            jobs: [],
            vouchers: [],
            purchases: [],
            attendance: [],
            vendorEntries: [],
            jobSheets: [],
          };
        }
        employeeMap[empId][type].push(item);
      };

      // Helper to get employee ID with multiple fallbacks
      const getEmployeeId = (item) => {
        return item.profile_id || 
               item.created_by || 
               item.user_id || 
               item.employee_id ||
               item.assigned_to ||
               'default';
      };

      // Date filter helper
      const inDateRange = (date) => {
        if (!date) return false;
        const d = String(date).slice(0, 10);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      };

      // Check if deal is complete
      const isComplete = (item) => {
        const status = String(item.status || '').toLowerCase();
        const remark = String(item.remark || item.remarks || '').toLowerCase();
        return status.includes('complete') || 
               status.includes('paid') || 
               status.includes('delivered') ||
               remark.includes('complete') ||
               remark.includes('done') ||
               remark.includes('finished');
      };

      // Check for issues
      const hasIssue = (item) => {
        const text = `${item.status || ''} ${item.remark || ''} ${item.remarks || ''} ${item.notes || ''}`.toLowerCase();
        return text.includes('loss') ||
               text.includes('error') ||
               text.includes('late') ||
               text.includes('complaint') ||
               text.includes('delay') ||
               text.includes('issue') ||
               text.includes('problem') ||
               text.includes('pending') ||
               text.includes('overdue') ||
               text.includes('failed');
      };

      // Calculate payment delay in days
      const getPaymentDelay = (item) => {
        if (!item.balance_due || parseFloat(item.balance_due) <= 0) return 0;
        
        const dueDate = item.due_date || item.date;
        if (!dueDate) return 0;
        
        const due = new Date(dueDate);
        const today = new Date();
        const delayDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        
        return delayDays > 0 ? delayDays : 0;
      };

      // Process invoices
      invoices.filter(inv => inDateRange(inv.date)).forEach(inv => {
        const empId = getEmployeeId(inv);
        addToEmployee(empId, 'invoices', {
          ...inv,
          isComplete: isComplete(inv),
          hasIssue: hasIssue(inv),
          paymentDelay: getPaymentDelay(inv),
        });
      });

      // Process challans
      challans.filter(ch => inDateRange(ch.date)).forEach(ch => {
        const empId = getEmployeeId(ch);
        addToEmployee(empId, 'challans', {
          ...ch,
          isComplete: isComplete(ch),
          hasIssue: hasIssue(ch),
          paymentDelay: getPaymentDelay(ch),
        });
      });

      // Process daily tasks
      dailyTasks.filter(task => inDateRange(task.task_date || task.date)).forEach(task => {
        const empId = getEmployeeId(task);
        addToEmployee(empId, 'tasks', task);
      });

      // Process jobs
      jobs.filter(job => inDateRange(job.created_at || job.date)).forEach(job => {
        const empId = getEmployeeId(job);
        addToEmployee(empId, 'jobs', job);
      });

      // Process vouchers
      vouchers.filter(v => inDateRange(v.voucher_date || v.date)).forEach(v => {
        const empId = getEmployeeId(v);
        addToEmployee(empId, 'vouchers', v);
      });

      // Process purchases
      purchases.filter(p => inDateRange(p.invoice_date || p.date)).forEach(p => {
        const empId = getEmployeeId(p);
        addToEmployee(empId, 'purchases', p);
      });

      // Process labour attendance
      labourAttendance.filter(att => inDateRange(att.date)).forEach(att => {
        const empId = getEmployeeId(att);
        addToEmployee(empId, 'attendance', att);
      });

      // Process vendor ledger
      vendorLedger.filter(vl => inDateRange(vl.entry_date || vl.date)).forEach(vl => {
        const empId = getEmployeeId(vl);
        addToEmployee(empId, 'vendorEntries', vl);
      });

      // Process job sheets
      jobSheets.filter(js => inDateRange(js.created_at || js.date)).forEach(js => {
        const empId = getEmployeeId(js);
        addToEmployee(empId, 'jobSheets', js);
      });

      // Set employee names from profiles/users
      Object.keys(employeeMap).forEach(empId => {
        const profile = profiles.find(p => p.id === empId);
        const user = users.find(u => u.id === empId);
        
        if (profile?.name) {
          employeeMap[empId].name = profile.name;
        } else if (user?.name) {
          employeeMap[empId].name = user.name;
        } else if (empId === 'default') {
          employeeMap[empId].name = 'All Employees';
        }
      });

      // Calculate penalties and incentives for each employee
      const results = Object.values(employeeMap).map(emp => {
        // Get all completed deals with amounts
        const completedInvoices = emp.invoices.filter(inv => inv.isComplete && !inv.hasIssue);
        const completedChallans = emp.challans.filter(ch => ch.isComplete && !ch.hasIssue);
        
        const totalDeals = emp.invoices.length + emp.challans.length;
        const completedDeals = completedInvoices.length + completedChallans.length;
        const failedDeals = emp.invoices.filter(inv => inv.hasIssue).length + 
                           emp.challans.filter(ch => ch.hasIssue).length;

        // Calculate total deal amount from completed deals
        const invoiceAmount = completedInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.total || inv.amount || 0), 0
        );
        const challanAmount = completedChallans.reduce((sum, ch) => 
          sum + parseFloat(ch.total || ch.amount || 0), 0
        );
        const totalAmount = invoiceAmount + challanAmount;

        // Base incentive: 1% of completed deal amount
        const baseIncentive = totalAmount * 0.01;

        // Calculate penalties
        const penalties = {
          dailyReports: 0,
          shutdownReports: 0,
          stockReports: 0,
          labourAttendance: 0,
          vendorAccount: 0,
          workPending: 0,
          vouchers: 0,
          jobSheets: 0,
          paymentDelay: 0,
          gstCompliance: 0,
        };

        // Get working days in range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const workingDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // 1. Daily Reports: Missing = 1% per report
        const dailyReportCount = emp.tasks.filter(t => 
          t.category === 'Daily Report' || t.type === 'daily_report'
        ).length;
        const expectedDailyReports = workingDays;
        const missingDailyReports = Math.max(0, expectedDailyReports - dailyReportCount);
        penalties.dailyReports = missingDailyReports * 1;

        // 2. Shutdown Reports: Missing = 1% per day (excluding Sunday)
        const shutdownReportCount = emp.tasks.filter(t => 
          t.category === 'Factory Shutdown Report' || t.type === 'shutdown_report'
        ).length;
        const expectedShutdownReports = Math.max(0, workingDays - Math.floor(workingDays / 7));
        const missingShutdownReports = Math.max(0, expectedShutdownReports - shutdownReportCount);
        penalties.shutdownReports = missingShutdownReports * 1;

        // 3. Stock Reports: Missing weekly = 1% per week
        const stockReportCount = emp.tasks.filter(t => 
          t.category === 'Stock Check' || t.type === 'stock_report'
        ).length;
        const expectedStockReports = Math.max(1, Math.floor(workingDays / 7));
        const missingStockReports = Math.max(0, expectedStockReports - stockReportCount);
        penalties.stockReports = missingStockReports * 1;

        // 4. Labour Attendance: Not updated = 1% per week
        const attendanceWeeks = emp.attendance.length > 0 ? 
          Math.ceil(emp.attendance.length / 7) : 0;
        const expectedAttendanceWeeks = Math.max(1, Math.floor(workingDays / 7));
        const missingAttendanceWeeks = Math.max(0, expectedAttendanceWeeks - attendanceWeeks);
        penalties.labourAttendance = missingAttendanceWeeks * 1;

        // 5. Vendor Account: Not updated with purchases = 1%
        const vendorPurchases = emp.purchases.length;
        const vendorEntries = emp.vendorEntries.length;
        if (vendorPurchases > 0 && vendorEntries < vendorPurchases) {
          penalties.vendorAccount = 1;
        }

        // 6. Work Pending: > 8 days = 1% per job
        const oldJobs = emp.jobs.filter(job => {
          const created = new Date(job.created_at || job.date);
          const daysPending = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
          return daysPending > 8 && !isComplete(job);
        });
        penalties.workPending = oldJobs.length * 1;

        // 7. Vouchers: Missing docs = 1% per 5 vouchers
        const vouchersWithoutDocs = emp.vouchers.filter(v => 
          !v.attachment && !v.document && !v.file_path
        ).length;
        penalties.vouchers = Math.floor(vouchersWithoutDocs / 5) * 1;

        // 8. Job Sheets: Updated late = 1% per sheet
        const lateJobSheets = emp.jobSheets.filter(js => {
          const created = new Date(js.created_at);
          const updated = new Date(js.updated_at || js.created_at);
          const delayHours = Math.floor((updated - created) / (1000 * 60 * 60));
          return delayHours > 24;
        }).length;
        penalties.jobSheets = lateJobSheets * 1;

        // 9. Payment Delay: 1% per 7 days of delay
        const totalPaymentDelayDays = [
          ...emp.invoices,
          ...emp.challans
        ].reduce((sum, item) => sum + (item.paymentDelay || 0), 0);
        const delayWeeks = Math.floor(totalPaymentDelayDays / 7);
        penalties.paymentDelay = delayWeeks * 1;

        // 10. GST Compliance: Not updated with taxable transactions = 1%
        const taxableTransactions = emp.invoices.filter(inv => 
          parseFloat(inv.tax || inv.gst || 0) > 0
        ).length;
        const gstEntriesCount = gstRecords.filter(gst => 
          getEmployeeId(gst) === emp.id
        ).length;
        if (taxableTransactions > 0 && gstEntriesCount < taxableTransactions) {
          penalties.gstCompliance = 1;
        }

        // Calculate total penalty percentage (max 99%)
        const totalPenaltyPercent = Math.min(99, 
          penalties.dailyReports +
          penalties.shutdownReports +
          penalties.stockReports +
          penalties.labourAttendance +
          penalties.vendorAccount +
          penalties.workPending +
          penalties.vouchers +
          penalties.jobSheets +
          penalties.paymentDelay +
          penalties.gstCompliance
        );

        // Calculate penalty amount
        const penaltyAmount = (baseIncentive * totalPenaltyPercent) / 100;

        // Final incentive
        const finalIncentive = baseIncentive - penaltyAmount;

        return {
          employee: emp.name,
          employeeId: emp.id,
          totalDeals,
          completedDeals,
          failedDeals,
          dealAmount: totalAmount,
          baseIncentive,
          penaltyPercent: totalPenaltyPercent,
          penaltyAmount,
          finalIncentive,
          penalties,
          paymentDelayDays: totalPaymentDelayDays,
          details: {
            invoices: emp.invoices.length,
            challans: emp.challans.length,
            tasks: emp.tasks.length,
            jobs: emp.jobs.length,
            vouchers: emp.vouchers.length,
            oldJobs: oldJobs.length,
            missingDailyReports,
            missingShutdownReports,
            missingStockReports,
            missingAttendanceWeeks,
            vouchersWithoutDocs,
            lateJobSheets,
            delayWeeks,
          }
        };
      });

      // Calculate totals
      const totals = results.reduce((acc, emp) => ({
        totalDeals: acc.totalDeals + emp.totalDeals,
        completedDeals: acc.completedDeals + emp.completedDeals,
        failedDeals: acc.failedDeals + emp.failedDeals,
        dealAmount: acc.dealAmount + emp.dealAmount,
        baseIncentive: acc.baseIncentive + emp.baseIncentive,
        penaltyAmount: acc.penaltyAmount + emp.penaltyAmount,
        finalIncentive: acc.finalIncentive + emp.finalIncentive,
      }), {
        totalDeals: 0,
        completedDeals: 0,
        failedDeals: 0,
        dealAmount: 0,
        baseIncentive: 0,
        penaltyAmount: 0,
        finalIncentive: 0,
      });

      console.log('✅ Calculations complete:', { employees: results.length, totals });

      setEmployeeData({ results, totals });
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error('Failed to load penalty card data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (employeeId) => {
    setExpandedRows(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const handleExportCSV = () => {
    if (!employeeData.results || employeeData.results.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Employee',
      'Total Deals',
      'Completed',
      'Failed',
      'Deal Amount (₹)',
      'Base Incentive (₹)',
      'Penalty %',
      'Penalty Amount (₹)',
      'Final Incentive (₹)',
      'Payment Delay (Days)',
    ];

    const rows = employeeData.results.map(emp => [
      emp.employee,
      emp.totalDeals,
      emp.completedDeals,
      emp.failedDeals,
      emp.dealAmount.toFixed(2),
      emp.baseIncentive.toFixed(2),
      emp.penaltyPercent + '%',
      emp.penaltyAmount.toFixed(2),
      emp.finalIncentive.toFixed(2),
      emp.paymentDelayDays,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penalty-card-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();

    toast.success('CSV exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Base & Penalty Card (Static View)"
          subtitle="Loading comprehensive penalty analysis..."
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const { results = [], totals = {} } = employeeData;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Base & Penalty Card (Static View)"
        subtitle="Comprehensive penalty analysis with payment delays and critical metrics"
      />

      {/* Action Buttons */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/summary')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Summary
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span className="text-sm py-1.5">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <div className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Deals</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totals.totalDeals || 0}</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              {totals.completedDeals || 0} Completed, {totals.failedDeals || 0} Failed
            </p>
          </div>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20">
          <div className="text-center">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Total Base Incentive</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              ₹{(totals.baseIncentive || 0).toFixed(2)}
            </p>
            <p className="text-xs text-green-500 dark:text-green-400 mt-1">
              1% of ₹{(totals.dealAmount || 0).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Total Penalties</p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">
              ₹{(totals.penaltyAmount || 0).toFixed(2)}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Deducted from base
            </p>
          </div>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <div className="text-center">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Final Incentive</p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              ₹{(totals.finalIncentive || 0).toFixed(2)}
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              After penalties
            </p>
          </div>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <h3 className="text-lg font-bold mb-4 dark:text-gray-200">Employee Penalty Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-3 text-left font-semibold">Employee</th>
                <th className="p-3 text-center font-semibold">Total Deals</th>
                <th className="p-3 text-center font-semibold">Completed</th>
                <th className="p-3 text-center font-semibold">Failed</th>
                <th className="p-3 text-right font-semibold">Deal Amount</th>
                <th className="p-3 text-right font-semibold bg-green-100 dark:bg-green-900/30">Base (1%)</th>
                <th className="p-3 text-center font-semibold bg-red-100 dark:bg-red-900/30">Penalty %</th>
                <th className="p-3 text-right font-semibold bg-red-100 dark:bg-red-900/30">Penalty ₹</th>
                <th className="p-3 text-center font-semibold">Delay Days</th>
                <th className="p-3 text-right font-semibold bg-purple-100 dark:bg-purple-900/30">Final Incentive</th>
                <th className="p-3 text-center font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((emp) => (
                <>
                  <tr 
                    key={emp.employeeId}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{emp.employee}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{emp.totalDeals}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        {emp.completedDeals}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {emp.failedDeals > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          {emp.failedDeals}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">₹{emp.dealAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                      ₹{emp.baseIncentive.toFixed(2)}
                    </td>
                    <td className="p-3 text-center font-bold bg-red-50 dark:bg-red-900/20">
                      <span className={emp.penaltyPercent > 50 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}>
                        {emp.penaltyPercent}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
                      ₹{emp.penaltyAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {emp.paymentDelayDays > 0 ? (
                        <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Clock className="h-3 w-3" />
                          {emp.paymentDelayDays}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">
                      ₹{emp.finalIncentive.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleRow(emp.employeeId)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {expandedRows[emp.employeeId] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRows[emp.employeeId] && (
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <td colSpan="11" className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Penalty Breakdown */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                              Penalty Breakdown:
                            </h4>
                            {emp.penalties.dailyReports > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Missing Daily Reports ({emp.details.missingDailyReports}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.dailyReports}%</span>
                              </div>
                            )}
                            {emp.penalties.shutdownReports > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Missing Shutdown Reports ({emp.details.missingShutdownReports}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.shutdownReports}%</span>
                              </div>
                            )}
                            {emp.penalties.stockReports > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Missing Stock Reports ({emp.details.missingStockReports}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.stockReports}%</span>
                              </div>
                            )}
                            {emp.penalties.labourAttendance > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Missing Attendance ({emp.details.missingAttendanceWeeks} weeks):</span>
                                <span className="font-medium text-red-600">{emp.penalties.labourAttendance}%</span>
                              </div>
                            )}
                            {emp.penalties.vendorAccount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Vendor Account Not Updated:</span>
                                <span className="font-medium text-red-600">{emp.penalties.vendorAccount}%</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {emp.penalties.workPending > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Pending Jobs &gt; 8 days ({emp.details.oldJobs}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.workPending}%</span>
                              </div>
                            )}
                            {emp.penalties.vouchers > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Vouchers Without Docs ({emp.details.vouchersWithoutDocs}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.vouchers}%</span>
                              </div>
                            )}
                            {emp.penalties.jobSheets > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Late Job Sheets ({emp.details.lateJobSheets}):</span>
                                <span className="font-medium text-red-600">{emp.penalties.jobSheets}%</span>
                              </div>
                            )}
                            {emp.penalties.paymentDelay > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>Payment Delay ({emp.details.delayWeeks} weeks):</span>
                                <span className="font-medium text-red-600">{emp.penalties.paymentDelay}%</span>
                              </div>
                            )}
                            {emp.penalties.gstCompliance > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>GST Compliance:</span>
                                <span className="font-medium text-red-600">{emp.penalties.gstCompliance}%</span>
                              </div>
                            )}
                          </div>

                          {/* Activity Summary */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                              Activity Summary:
                            </h4>
                            <div className="flex justify-between text-xs">
                              <span>Invoices:</span>
                              <span className="font-medium">{emp.details.invoices}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Challans:</span>
                              <span className="font-medium">{emp.details.challans}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Tasks Completed:</span>
                              <span className="font-medium">{emp.details.tasks}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Jobs Handled:</span>
                              <span className="font-medium">{emp.details.jobs}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Vouchers:</span>
                              <span className="font-medium">{emp.details.vouchers}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {/* Total Row */}
              <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                <td className="p-3">TOTAL</td>
                <td className="p-3 text-center">{totals.totalDeals}</td>
                <td className="p-3 text-center">{totals.completedDeals}</td>
                <td className="p-3 text-center">{totals.failedDeals}</td>
                <td className="p-3 text-right">₹{totals.dealAmount?.toFixed(2) || '0.00'}</td>
                <td className="p-3 text-right bg-green-100 dark:bg-green-900/30">₹{totals.baseIncentive?.toFixed(2) || '0.00'}</td>
                <td className="p-3 text-center bg-red-100 dark:bg-red-900/30">-</td>
                <td className="p-3 text-right bg-red-100 dark:bg-red-900/30">₹{totals.penaltyAmount?.toFixed(2) || '0.00'}</td>
                <td className="p-3 text-center">-</td>
                <td className="p-3 text-right bg-purple-100 dark:bg-purple-900/30">₹{totals.finalIncentive?.toFixed(2) || '0.00'}</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comprehensive Penalty Rules */}
      <Card>
        <h3 className="text-lg font-bold mb-4 dark:text-gray-200 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Comprehensive Penalty Rules Applied:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Daily Reports:</strong> Missing/Unassigned = 1% per report</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Shutdown Reports:</strong> Missing = 1% per day (excl. Sunday)</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Stock Reports:</strong> Missing weekly = 1% per week</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Labour Attendance:</strong> Not updated = 1% per week</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Vendor Account:</strong> Not updated with purchases = 1%</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Work Pending:</strong> &gt; 8 days = 1% per job</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Vouchers:</strong> Missing documentation = 1% per 5 vouchers</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Job Sheets:</strong> Updated late (&gt;24h) = 1% per sheet</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Payment Delay:</strong> 1% per 7 days of delay</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>GST Compliance:</strong> Not updated with taxable transactions = 1%</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span><strong>Deals with Issues:</strong> Loss/Error/Late/Complaint/Delay = 0% incentive for that deal</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <span><strong>Mathematical Accumulation:</strong> All penalties add up. Max penalty = 99%</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Data Sources:</strong> Dashboard Daily Tasks, Jobs, Accounts (Invoices, Challans, Vouchers, Purchases), 
            Labour Attendance, Vendor/Supplier/Customer Ledgers, GST Records, Job Sheets, and Stock Movements
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PenaltyCard;
