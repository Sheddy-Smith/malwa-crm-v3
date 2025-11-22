import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Calendar, Download, Printer, RefreshCw, User, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, X, FileText, IndianRupee } from 'lucide-react';
import { dbOperations } from '@/lib/db';

const IncentiveSummary = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [incentiveData, setIncentiveData] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerData, setLedgerData] = useState({ invoices: [], challans: [] });
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyBreakdown, setPenaltyBreakdown] = useState([]);
  const [movementData, setMovementData] = useState([]);
  const [showMovementTable, setShowMovementTable] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [movementFilter, setMovementFilter] = useState('all'); // all, invoice, challan, job, payment, stock, task

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting data fetch...');
      
      // Fetch all required data
      const [
        invoices, 
        challans, 
        profilesData,
        dailyTasks,
        jobs,
        vouchers,
        purchases,
        labourAttendance,
        vendorLedger,
        jobsheets,
        users
      ] = await Promise.all([
        dbOperations.getAll('invoices').catch(() => []),
        dbOperations.getAll('sell_challans').catch(() => []),
        dbOperations.getAll('profiles').catch(() => []),
        dbOperations.getAll('daily_tasks').catch(() => []),
        dbOperations.getAll('jobs').catch(() => []),
        dbOperations.getAll('vouchers').catch(() => []),
        dbOperations.getAll('purchases').catch(() => []),
        dbOperations.getAll('labour_attendance').catch(() => []),
        dbOperations.getAll('vendor_ledger_entries').catch(() => []),
        dbOperations.getAll('jobsheets').catch(() => []),
        dbOperations.getAll('users').catch(() => [])
      ]);

      console.log('📊 Data fetched:', {
        invoices: invoices?.length || 0,
        challans: challans?.length || 0,
        profiles: profilesData?.length || 0,
        users: users?.length || 0,
        dailyTasks: dailyTasks?.length || 0,
        jobs: jobs?.length || 0
      });

      const { startDate, endDate } = dateRange;
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Helper to check if date is in range
      const inRange = (d) => {
        if (!d) return false;
        const ds = String(d).slice(0, 10);
        return ds >= startDate && ds <= endDate;
      };

      // Calculate working days (excluding Sundays)
      let workingDays = 0;
      const workingDates = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        if (currentDate.getDay() !== 0) {
          workingDays++;
          workingDates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('📅 Working days in range:', workingDays);

      // Build employee/profile map
      const employeeMap = {};
      
      // Add users
      (users || []).forEach(u => {
        if (u.id) {
          employeeMap[u.id] = {
            id: u.id,
            name: u.username || u.name || u.email || 'User ' + u.id
          };
        }
      });

      // Add profiles
      (profilesData || []).forEach(p => {
        if (p.id) {
          employeeMap[p.id] = {
            id: p.id,
            name: p.name || p.username || 'Profile ' + p.id
          };
        }
      });

      // If no employees found, create a default one
      if (Object.keys(employeeMap).length === 0) {
        employeeMap['default'] = { id: 'default', name: 'All Employees' };
      }

      console.log('👥 Employees found:', Object.keys(employeeMap).length);
      setProfiles(employeeMap);

      // Get employee ID from record
      const getEmployeeId = (record) => {
        return record.profile_id || 
               record.created_by || 
               record.user_id || 
               record.assigned_to ||
               'default';
      };

      // Filter ALL invoices in date range (regardless of status for initial count)
      const allInvoices = (invoices || []).filter(inv => 
        inRange(inv.invoice_date || inv.date || inv.created_at)
      );

      // Filter ALL challans in date range
      const allChallans = (challans || []).filter(ch => 
        inRange(ch.challan_date || ch.date || ch.created_at)
      );

      console.log('💰 All deals in range:', {
        invoices: allInvoices.length,
        challans: allChallans.length
      });

      // Now filter for COMPLETED deals
      const completedInvoices = allInvoices.filter(inv => {
        const status = String(inv.status || '').toLowerCase();
        const remark = String(inv.remark || inv.remarks || '').toLowerCase();
        return status === 'complete' || 
               status === 'completed' ||
               status === 'paid' ||
               remark.includes('complete') ||
               remark.includes('paid');
      });

      const completedChallans = allChallans.filter(ch => {
        const status = String(ch.status || '').toLowerCase();
        const remark = String(ch.remark || ch.remarks || '').toLowerCase();
        return status === 'complete' || 
               status === 'completed' ||
               status === 'delivered' ||
               remark.includes('complete') ||
               remark.includes('delivered');
      });

      console.log('✅ Completed deals:', {
        invoices: completedInvoices.length,
        challans: completedChallans.length
      });

      // Identify deals with issues
      const dealsWithIssues = new Set();
      
      [...completedInvoices, ...completedChallans].forEach(deal => {
        const status = String(deal.status || '').toLowerCase();
        const remark = String(deal.remark || deal.remarks || '').toLowerCase();
        const paymentStatus = String(deal.payment_status || '').toLowerCase();
        
        const hasIssue = 
          status.includes('late') || 
          status.includes('pending') ||
          status.includes('error') ||
          paymentStatus.includes('delay') ||
          paymentStatus.includes('pending') ||
          paymentStatus.includes('overdue') ||
          remark.includes('loss') ||
          remark.includes('error') ||
          remark.includes('late') ||
          remark.includes('complaint') ||
          remark.includes('delay') ||
          remark.includes('issue') ||
          remark.includes('problem') ||
          deal.has_complaint ||
          deal.has_loss ||
          deal.has_error;
          
        if (hasIssue) {
          dealsWithIssues.add(deal.id);
        }
      });

      console.log('⚠️ Deals with issues:', dealsWithIssues.size);

      // Group data by employee
      const groupedData = {};

      // Process completed invoices
      completedInvoices.forEach(inv => {
        const empId = getEmployeeId(inv);
        
        if (!groupedData[empId]) {
          groupedData[empId] = {
            employeeId: empId,
            employeeName: employeeMap[empId]?.name || 'Unknown',
            totalAmount: 0,
            validAmount: 0,
            invoiceCount: 0,
            challanCount: 0,
            dealsWithIssues: 0,
            penalties: [],
            workingDays: workingDays
          };
        }
        
        const amount = parseFloat(inv.total_amount || inv.grand_total || inv.amount || 0);
        groupedData[empId].totalAmount += amount;
        groupedData[empId].invoiceCount += 1;
        
        if (!dealsWithIssues.has(inv.id)) {
          groupedData[empId].validAmount += amount;
        } else {
          groupedData[empId].dealsWithIssues += 1;
        }
      });

      // Process completed challans
      completedChallans.forEach(ch => {
        const empId = getEmployeeId(ch);
        
        if (!groupedData[empId]) {
          groupedData[empId] = {
            employeeId: empId,
            employeeName: employeeMap[empId]?.name || 'Unknown',
            totalAmount: 0,
            validAmount: 0,
            invoiceCount: 0,
            challanCount: 0,
            dealsWithIssues: 0,
            penalties: [],
            workingDays: workingDays
          };
        }
        
        const amount = parseFloat(ch.total_amount || ch.grand_total || ch.amount || 0);
        groupedData[empId].totalAmount += amount;
        groupedData[empId].challanCount += 1;
        
        if (!dealsWithIssues.has(ch.id)) {
          groupedData[empId].validAmount += amount;
        } else {
          groupedData[empId].dealsWithIssues += 1;
        }
      });

      console.log('👔 Grouped by employees:', Object.keys(groupedData).length);

      // Calculate penalties for each employee
      Object.values(groupedData).forEach(employee => {
        let totalPenalty = 0;
        const penalties = [];

        const empId = employee.employeeId;

        // Get employee-specific tasks
        const empTasks = (dailyTasks || []).filter(t => {
          const taskEmpId = getEmployeeId(t);
          return taskEmpId === empId && inRange(t.date || t.created_at);
        });

        // PENALTY 1: Daily Reports (missing/unsigned)
        const dailyReportTasks = empTasks.filter(t => 
          t.task_type === 'daily_routine' || 
          t.task_type === 'daily_report' ||
          String(t.details || '').toLowerCase().includes('daily')
        );
        
        const signedReports = dailyReportTasks.filter(t => 
          t.status === 'completed' && (t.signed_by_boss || t.boss_signature)
        ).length;
        
        const missingDailyReports = Math.max(0, workingDays - signedReports);
        
        if (missingDailyReports > 0) {
          totalPenalty += missingDailyReports;
          penalties.push({
            type: 'Missing/Unsigned Daily Reports',
            count: missingDailyReports,
            penalty: missingDailyReports
          });
        }

        // PENALTY 2: Shutdown Reports
        const shutdownReports = empTasks.filter(t => 
          t.task_type === 'factory_shutdown' ||
          String(t.details || '').toLowerCase().includes('shutdown')
        );
        
        const completedShutdowns = shutdownReports.filter(t => t.status === 'completed').length;
        const missingShutdowns = Math.max(0, workingDays - completedShutdowns);
        
        if (missingShutdowns > 0) {
          totalPenalty += missingShutdowns;
          penalties.push({
            type: 'Missing Shutdown Reports',
            count: missingShutdowns,
            penalty: missingShutdowns
          });
        }

        // PENALTY 3: Weekly Stock Reports
        const weeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000)) || 1;
        const stockReports = empTasks.filter(t => 
          t.task_type === 'stock_check' ||
          String(t.details || '').toLowerCase().includes('stock')
        ).length;
        
        const missingStock = Math.max(0, weeks - stockReports);
        
        if (missingStock > 0) {
          totalPenalty += missingStock;
          penalties.push({
            type: 'Missing Weekly Stock Reports',
            count: missingStock,
            penalty: missingStock
          });
        }

        // PENALTY 4: Labour Attendance
        const empLabourAtt = (labourAttendance || []).filter(a => {
          const attEmpId = getEmployeeId(a);
          return attEmpId === empId && inRange(a.date || a.created_at);
        });
        
        const labourDays = new Set(empLabourAtt.map(a => 
          String(a.date || a.created_at).slice(0, 10)
        ));
        
        const missingLabourDays = workingDates.filter(d => !labourDays.has(d)).length;
        
        if (missingLabourDays > 5) { // More than a week missing
          totalPenalty += 1;
          penalties.push({
            type: 'Labour Attendance Not Updated',
            count: missingLabourDays,
            penalty: 1
          });
        }

        // PENALTY 5: Vendor Account Updates
        const empPurchases = (purchases || []).filter(p => {
          const pEmpId = getEmployeeId(p);
          return pEmpId === empId && inRange(p.invoice_date || p.date || p.created_at);
        });
        
        const empVendorEntries = (vendorLedger || []).filter(v => {
          const vEmpId = getEmployeeId(v);
          return vEmpId === empId && inRange(v.date || v.created_at);
        });
        
        if (empPurchases.length > 0 && empVendorEntries.length === 0) {
          totalPenalty += 1;
          penalties.push({
            type: 'Vendor Account Not Updated',
            count: empPurchases.length,
            penalty: 1
          });
        }

        // PENALTY 6: Pending Jobs > 8 Days
        const empJobs = (jobs || []).filter(j => {
          const jEmpId = getEmployeeId(j);
          const jStatus = String(j.status || '').toLowerCase();
          return jEmpId === empId && 
                 (jStatus === 'pending' || jStatus === 'in-progress' || jStatus === 'in_progress') &&
                 j.created_at;
        });
        
        const oldJobs = empJobs.filter(j => {
          const daysPending = Math.floor((Date.now() - new Date(j.created_at)) / (1000 * 60 * 60 * 24));
          return daysPending > 8;
        });
        
        if (oldJobs.length > 0) {
          totalPenalty += oldJobs.length;
          penalties.push({
            type: 'Jobs Pending > 8 Days',
            count: oldJobs.length,
            penalty: oldJobs.length
          });
        }

        // PENALTY 7: Vouchers without documentation
        const empVouchers = (vouchers || []).filter(v => {
          const vEmpId = getEmployeeId(v);
          return vEmpId === empId && inRange(v.voucher_date || v.date || v.created_at);
        });
        
        const badVouchers = empVouchers.filter(v => 
          !v.description || !v.voucher_no || String(v.description).trim() === ''
        ).length;
        
        if (badVouchers > 5) {
          const penalty = Math.ceil(badVouchers / 5);
          totalPenalty += penalty;
          penalties.push({
            type: 'Vouchers Without Documentation',
            count: badVouchers,
            penalty: penalty
          });
        }

        // PENALTY 8: Late Job Sheets
        const empJobsheets = (jobsheets || []).filter(j => {
          const jEmpId = getEmployeeId(j);
          return jEmpId === empId && inRange(j.date || j.created_at);
        });
        
        const lateSheets = empJobsheets.filter(j => {
          if (!j.created_at || !j.date) return false;
          const created = new Date(j.created_at);
          const dated = new Date(j.date);
          const diffDays = Math.floor((dated - created) / (1000 * 60 * 60 * 24));
          return diffDays > 1;
        }).length;
        
        if (lateSheets > 0) {
          totalPenalty += lateSheets;
          penalties.push({
            type: 'Job Sheets Updated Late',
            count: lateSheets,
            penalty: lateSheets
          });
        }

        // Add deals with issues to penalties list
        if (employee.dealsWithIssues > 0) {
          penalties.push({
            type: 'Deals with Issues (Loss/Error/Late/Complaint)',
            count: employee.dealsWithIssues,
            penalty: 0,
            note: `${employee.dealsWithIssues} deals excluded from incentive calculation`
          });
        }

        employee.penalties = penalties;
        employee.totalPenaltyPercent = Math.min(totalPenalty, 99);
        employee.totalDeals = employee.invoiceCount + employee.challanCount;
        
        // Calculate incentive (1% of valid amount only)
        const baseIncentive = employee.validAmount * 0.01;
        const penaltyAmount = (baseIncentive * employee.totalPenaltyPercent) / 100;
        
        employee.baseIncentive = baseIncentive;
        employee.penaltyAmount = penaltyAmount;
        employee.finalIncentive = Math.max(0, baseIncentive - penaltyAmount);
      });

      const result = Object.values(groupedData);
      
      console.log('✨ Final result:', {
        employees: result.length,
        totalDeals: result.reduce((s, e) => s + e.totalDeals, 0),
        totalIncentive: result.reduce((s, e) => s + e.finalIncentive, 0)
      });

      setIncentiveData(result);

    } catch (error) {
      console.error('❌ Error fetching incentive data:', error);
      toast.error('Failed to load incentive data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = today;
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenLedger = async () => {
    try {
      const { startDate, endDate } = dateRange;
      
      // Fetch invoices and challans
      const [invoices, challans] = await Promise.all([
        dbOperations.getAll('invoices').catch(() => []),
        dbOperations.getAll('sell_challans').catch(() => []),
      ]);

      // Filter by date range and completed status
      const inRange = (d) => {
        if (!d) return false;
        const ds = String(d).slice(0, 10);
        return ds >= startDate && ds <= endDate;
      };

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

      const filteredInvoices = (invoices || []).filter(inv => 
        inRange(inv.date) && isComplete(inv)
      ).map(inv => ({
        ...inv,
        type: 'Invoice',
        amount: parseFloat(inv.total || inv.amount || 0),
        incentive: parseFloat(inv.total || inv.amount || 0) * 0.01
      }));

      const filteredChallans = (challans || []).filter(ch => 
        inRange(ch.date) && isComplete(ch) && !ch.invoice_id
      ).map(ch => ({
        ...ch,
        type: 'Challan',
        amount: parseFloat(ch.total || ch.amount || 0),
        incentive: parseFloat(ch.total || ch.amount || 0) * 0.01
      }));

      setLedgerData({
        invoices: filteredInvoices,
        challans: filteredChallans
      });
      setShowLedgerModal(true);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      toast.error('Failed to load ledger data');
    }
  };

  const handleOpenPenaltyBreakdown = async () => {
    try {
      const { startDate, endDate } = dateRange;
      
      // Fetch all required data for penalty calculation
      const [
        dailyTasks,
        jobs,
        vouchers,
        purchases,
        labourAttendance,
        vendorLedger,
        jobsheets,
        invoices,
        challans,
      ] = await Promise.all([
        dbOperations.getAll('daily_tasks').catch(() => []),
        dbOperations.getAll('jobs').catch(() => []),
        dbOperations.getAll('vouchers').catch(() => []),
        dbOperations.getAll('purchases').catch(() => []),
        dbOperations.getAll('labour_attendance').catch(() => []),
        dbOperations.getAll('vendor_ledger_entries').catch(() => []),
        dbOperations.getAll('jobsheets').catch(() => []),
        dbOperations.getAll('invoices').catch(() => []),
        dbOperations.getAll('sell_challans').catch(() => []),
      ]);

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();

      // Calculate working days (excluding Sundays)
      let workingDays = 0;
      const workingDates = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        if (currentDate.getDay() !== 0) {
          workingDays++;
          workingDates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const inRange = (d) => {
        if (!d) return false;
        const ds = String(d).slice(0, 10);
        return ds >= startDate && ds <= endDate;
      };

      const breakdown = [];

      // 1. Daily Reports (Missing/Unsigned) - One per day
      const dailyReports = dailyTasks.filter(t => 
        inRange(t.task_date || t.date) && 
        (t.category === 'Daily Report' || t.type === 'daily_report')
      );
      
      // Get unique dates from daily reports
      const dailyReportDates = new Set(
        dailyReports.map(t => String(t.task_date || t.date).slice(0, 10))
      );
      
      // Calculate how many working days don't have daily reports
      const daysWithoutDailyReport = workingDates.filter(date => !dailyReportDates.has(date)).length;
      
      if (daysWithoutDailyReport > 0) {
        breakdown.push({
          category: 'Daily Reports',
          description: 'Missing or unsigned daily reports',
          daysCount: daysWithoutDailyReport,
          penaltyPercent: daysWithoutDailyReport * 1,
          rule: 'Section 2: 1% per missing/unsigned report',
          status: 'critical'
        });
      }

      // 2. Shutdown Reports (Excluding Sunday) - One per day
      const shutdownReports = dailyTasks.filter(t => 
        inRange(t.task_date || t.date) && 
        (t.category === 'Factory Shutdown Report' || t.type === 'shutdown_report')
      );
      
      // Get unique dates from shutdown reports
      const shutdownDates = new Set(
        shutdownReports.map(t => String(t.task_date || t.date).slice(0, 10))
      );
      
      // Calculate how many working days don't have shutdown reports
      const daysWithoutShutdown = workingDates.filter(date => !shutdownDates.has(date)).length;
      
      if (daysWithoutShutdown > 0) {
        breakdown.push({
          category: 'Shutdown Reports',
          description: 'Missing shutdown reports (excluding Sunday)',
          daysCount: daysWithoutShutdown,
          penaltyPercent: daysWithoutShutdown * 1,
          rule: 'Section 3: 1% per missing day',
          status: 'critical'
        });
      }

      // 3. Weekly Stock Reports
      const stockReports = dailyTasks.filter(t => 
        inRange(t.task_date || t.date) && 
        (t.category === 'Stock Check' || t.type === 'stock_report')
      );
      const expectedWeeklyReports = Math.max(1, Math.floor(workingDays / 7));
      const missingStockReports = Math.max(0, expectedWeeklyReports - stockReports.length);
      if (missingStockReports > 0) {
        breakdown.push({
          category: 'Weekly Stock Reports',
          description: 'Missing weekly stock reports',
          daysCount: missingStockReports,
          penaltyPercent: missingStockReports * 1,
          rule: 'Section 4: 1% per missing week',
          status: 'warning'
        });
      }

      // 4. Labour Account Updates
      const labourUpdates = labourAttendance.filter(att => inRange(att.date));
      const expectedLabourWeeks = Math.max(1, Math.floor(workingDays / 7));
      const labourWeeks = labourUpdates.length > 0 ? Math.ceil(labourUpdates.length / 7) : 0;
      const missingLabourWeeks = Math.max(0, expectedLabourWeeks - labourWeeks);
      if (missingLabourWeeks > 0) {
        breakdown.push({
          category: 'Labour Account',
          description: 'Labour account not updated',
          daysCount: missingLabourWeeks,
          penaltyPercent: missingLabourWeeks * 1,
          rule: 'Section 5: 1% per missing week',
          status: 'warning'
        });
      }

      // 5. Vendor Account Updates
      const vendorPurchases = purchases.filter(p => inRange(p.invoice_date || p.date));
      const vendorEntries = vendorLedger.filter(vl => inRange(vl.entry_date || vl.date));
      if (vendorPurchases.length > 0 && vendorEntries.length < vendorPurchases.length) {
        breakdown.push({
          category: 'Vendor Account',
          description: 'Vendor account not updated with purchases',
          daysCount: 1,
          penaltyPercent: 1,
          rule: 'Section 6: 1% penalty',
          status: 'warning'
        });
      }

      // 6. Pending Work > 8 Days
      const oldJobs = jobs.filter(job => {
        const created = new Date(job.created_at || job.date);
        const daysPending = Math.floor((today - created) / (1000 * 60 * 60 * 24));
        const status = String(job.status || '').toLowerCase();
        const isComplete = status.includes('complete') || status.includes('done') || status.includes('delivered');
        return daysPending > 8 && !isComplete && inRange(job.created_at || job.date);
      });
      if (oldJobs.length > 0) {
        breakdown.push({
          category: 'Pending Work (>8 Days)',
          description: 'Jobs pending for more than 8 days',
          daysCount: oldJobs.length,
          penaltyPercent: oldJobs.length * 1,
          rule: 'Section 8: 1% per pending job',
          status: 'critical'
        });
      }

      // 7. Delivery & Payment Confirmation
      const incompleteDeliveries = [...invoices, ...challans].filter(item => {
        if (!inRange(item.date)) return false;
        const status = String(item.status || '').toLowerCase();
        const remark = String(item.remark || item.remarks || '').toLowerCase();
        const hasIssue = remark.includes('late') || remark.includes('delay') || remark.includes('pending');
        return hasIssue;
      });
      if (incompleteDeliveries.length > 0) {
        breakdown.push({
          category: 'Delivery & Payment Issues',
          description: 'Late delivery or payment confirmation pending',
          daysCount: incompleteDeliveries.length,
          penaltyPercent: 0, // Zero incentive for those deals
          rule: 'Section 7: Incentive ZERO for affected deals',
          status: 'critical'
        });
      }

      // 8. Vouchers without Documentation
      const vouchersWithoutDocs = vouchers.filter(v => 
        inRange(v.voucher_date || v.date) && 
        !v.attachment && !v.document && !v.file_path
      );
      const voucherPenalty = Math.floor(vouchersWithoutDocs.length / 5);
      if (voucherPenalty > 0) {
        breakdown.push({
          category: 'Missing Documentation',
          description: 'Vouchers without proper documentation',
          daysCount: vouchersWithoutDocs.length,
          penaltyPercent: voucherPenalty * 1,
          rule: 'Documentation Rule: 1% per 5 vouchers',
          status: 'warning'
        });
      }

      // 9. Late Job Sheet Updates
      const lateJobSheets = jobsheets.filter(js => {
        if (!inRange(js.created_at || js.date)) return false;
        const created = new Date(js.created_at);
        const updated = new Date(js.updated_at || js.created_at);
        const delayHours = Math.floor((updated - created) / (1000 * 60 * 60));
        return delayHours > 24;
      });
      if (lateJobSheets.length > 0) {
        breakdown.push({
          category: 'Late Job Sheet Updates',
          description: 'Job sheets updated after 24 hours',
          daysCount: lateJobSheets.length,
          penaltyPercent: lateJobSheets.length * 1,
          rule: 'Timeliness Rule: 1% per late sheet',
          status: 'warning'
        });
      }

      // Calculate total penalty
      const totalPenalty = Math.min(99, breakdown.reduce((sum, item) => sum + item.penaltyPercent, 0));

      setPenaltyBreakdown({
        items: breakdown,
        totalPenalty,
        workingDays,
        dateRange: { startDate, endDate }
      });
      setShowPenaltyModal(true);
    } catch (error) {
      console.error('Error calculating penalty breakdown:', error);
      toast.error('Failed to load penalty breakdown');
    }
  };

  // NEW: Fetch and aggregate all movements for tracking
  const fetchMovementData = async (employeeId = null) => {
    try {
      const { startDate, endDate } = dateRange;
      
      const [
        invoices,
        challans,
        jobs,
        vouchers,
        payments,
        stockMovements,
        dailyTasks,
        purchases,
        labourAttendance
      ] = await Promise.all([
        dbOperations.getAll('invoices').catch(() => []),
        dbOperations.getAll('sell_challans').catch(() => []),
        dbOperations.getAll('jobs').catch(() => []),
        dbOperations.getAll('vouchers').catch(() => []),
        dbOperations.getAll('payments').catch(() => []),
        dbOperations.getAll('stock_movements').catch(() => []),
        dbOperations.getAll('daily_tasks').catch(() => []),
        dbOperations.getAll('purchases').catch(() => []),
        dbOperations.getAll('labour_attendance').catch(() => [])
      ]);

      const inRange = (d) => {
        if (!d) return false;
        const ds = String(d).slice(0, 10);
        return ds >= startDate && ds <= endDate;
      };

      const getEmployeeId = (record) => {
        return record.profile_id || 
               record.created_by || 
               record.user_id || 
               record.assigned_to ||
               'default';
      };

      const movements = [];

      // INVOICES - Revenue generating movements
      (invoices || []).filter(inv => inRange(inv.invoice_date || inv.date || inv.created_at)).forEach(inv => {
        const empId = getEmployeeId(inv);
        if (!employeeId || empId === employeeId) {
          const amount = parseFloat(inv.total_amount || inv.grand_total || inv.total || inv.amount || 0);
          const status = String(inv.status || '').toLowerCase();
          const isComplete = status.includes('complete') || status.includes('paid');
          
          movements.push({
            id: inv.id,
            type: 'Invoice',
            typeIcon: '📄',
            date: inv.invoice_date || inv.date || inv.created_at,
            reference: inv.invoice_no || inv.id,
            party: inv.customer_name || inv.party_name || 'N/A',
            vehicle: inv.vehicle_no || 'N/A',
            amount: amount,
            status: inv.status || 'Unknown',
            isComplete: isComplete,
            incentiveImpact: isComplete ? amount * 0.01 : 0,
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              paymentReceived: inv.payment_received || 0,
              balanceDue: inv.balance_due || 0,
              items: inv.items || []
            }
          });
        }
      });

      // CHALLANS - Delivery movements
      (challans || []).filter(ch => inRange(ch.challan_date || ch.date || ch.created_at) && !ch.invoice_id).forEach(ch => {
        const empId = getEmployeeId(ch);
        if (!employeeId || empId === employeeId) {
          const amount = parseFloat(ch.total_amount || ch.grand_total || ch.total || ch.amount || 0);
          const status = String(ch.status || '').toLowerCase();
          const isComplete = status.includes('complete') || status.includes('delivered');
          
          movements.push({
            id: ch.id,
            type: 'Challan',
            typeIcon: '📋',
            date: ch.challan_date || ch.date || ch.created_at,
            reference: ch.challan_no || ch.id,
            party: ch.customer_name || ch.party_name || 'N/A',
            vehicle: ch.vehicle_no || 'N/A',
            amount: amount,
            status: ch.status || 'Unknown',
            isComplete: isComplete,
            incentiveImpact: isComplete ? amount * 0.01 : 0,
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              items: ch.items || []
            }
          });
        }
      });

      // JOBS - Work order movements
      (jobs || []).filter(j => inRange(j.created_at || j.job_date || j.date)).forEach(j => {
        const empId = getEmployeeId(j);
        if (!employeeId || empId === employeeId) {
          const status = String(j.status || '').toLowerCase();
          const isComplete = status.includes('complete') || status.includes('invoiced');
          
          movements.push({
            id: j.id,
            type: 'Job',
            typeIcon: '🔧',
            date: j.created_at || j.job_date || j.date,
            reference: j.job_no || j.job_number || j.id,
            party: j.customer_name || 'N/A',
            vehicle: j.vehicle_no || j.vehicle_number || 'N/A',
            amount: parseFloat(j.estimated_amount || j.total_amount || 0),
            status: j.status || 'Unknown',
            isComplete: isComplete,
            incentiveImpact: 0, // Jobs don't directly contribute until invoiced
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              workType: j.work_type || 'General',
              estimatedDays: j.estimated_days || 0
            }
          });
        }
      });

      // PAYMENTS - Cash flow movements
      (payments || []).filter(p => inRange(p.payment_date || p.date || p.created_at)).forEach(p => {
        const empId = getEmployeeId(p);
        if (!employeeId || empId === employeeId) {
          movements.push({
            id: p.id,
            type: 'Payment',
            typeIcon: '💰',
            date: p.payment_date || p.date || p.created_at,
            reference: p.payment_no || p.reference_no || p.id,
            party: p.vendor_name || p.supplier_name || p.party_name || 'N/A',
            vehicle: 'N/A',
            amount: parseFloat(p.amount || 0),
            status: p.status || 'Completed',
            isComplete: true,
            incentiveImpact: 0,
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              paymentMode: p.payment_mode || p.mode || 'N/A',
              category: p.category || 'Expense'
            }
          });
        }
      });

      // STOCK MOVEMENTS - Inventory tracking
      (stockMovements || []).filter(sm => inRange(sm.movement_date || sm.date || sm.created_at)).forEach(sm => {
        const empId = getEmployeeId(sm);
        if (!employeeId || empId === employeeId) {
          movements.push({
            id: sm.id,
            type: 'Stock',
            typeIcon: sm.movement_type === 'in' ? '📥' : '📤',
            date: sm.movement_date || sm.date || sm.created_at,
            reference: sm.reference_no || sm.id,
            party: sm.material_name || sm.item_name || 'N/A',
            vehicle: sm.reference_type || 'N/A',
            amount: parseFloat(sm.quantity || 0),
            status: sm.movement_type === 'in' ? 'Stock In' : 'Stock Out',
            isComplete: true,
            incentiveImpact: 0,
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              movementType: sm.movement_type,
              referenceType: sm.reference_type,
              unit: sm.unit || 'units'
            }
          });
        }
      });

      // DAILY TASKS - Activity tracking
      (dailyTasks || []).filter(dt => inRange(dt.task_date || dt.date || dt.created_at)).forEach(dt => {
        const empId = getEmployeeId(dt);
        if (!employeeId || empId === employeeId) {
          const isComplete = String(dt.status || '').toLowerCase() === 'completed';
          
          movements.push({
            id: dt.id,
            type: 'Task',
            typeIcon: '✓',
            date: dt.task_date || dt.date || dt.created_at,
            reference: dt.task_type || dt.category || 'Daily Task',
            party: dt.details || dt.description || 'N/A',
            vehicle: 'N/A',
            amount: 0,
            status: dt.status || 'Pending',
            isComplete: isComplete,
            incentiveImpact: 0,
            employeeId: empId,
            employeeName: profiles[empId]?.name || 'Unknown',
            details: {
              taskType: dt.task_type,
              signedByBoss: dt.signed_by_boss || false
            }
          });
        }
      });

      // Sort by date (newest first)
      movements.sort((a, b) => new Date(b.date) - new Date(a.date));

      setMovementData(movements);
      return movements;
    } catch (error) {
      console.error('Error fetching movement data:', error);
      toast.error('Failed to load movement data');
      return [];
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Total Deals', 'Invoices', 'Challans', 'Deal Amount', 'Base Incentive (1%)', 'Penalty %', 'Penalty Amount', 'Final Incentive'];
    const rows = incentiveData.map(item => [
      item.employeeName,
      item.totalDeals,
      item.invoiceCount,
      item.challanCount,
      `₹${item.totalAmount.toFixed(2)}`,
      `₹${item.baseIncentive.toFixed(2)}`,
      `${item.totalPenaltyPercent}%`,
      `₹${item.penaltyAmount.toFixed(2)}`,
      `₹${item.finalIncentive.toFixed(2)}`
    ]);

    const csvContent = [
      `Incentive Summary Report`,
      `Period: ${new Date(dateRange.startDate).toLocaleDateString('en-GB')} to ${new Date(dateRange.endDate).toLocaleDateString('en-GB')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,${incentiveData.reduce((s, i) => s + i.totalDeals, 0)},${incentiveData.reduce((s, i) => s + i.invoiceCount, 0)},${incentiveData.reduce((s, i) => s + i.challanCount, 0)},₹${incentiveData.reduce((s, i) => s + i.totalAmount, 0).toFixed(2)},₹${incentiveData.reduce((s, i) => s + i.baseIncentive, 0).toFixed(2)},,₹${incentiveData.reduce((s, i) => s + i.penaltyAmount, 0).toFixed(2)},₹${incentiveData.reduce((s, i) => s + i.finalIncentive, 0).toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incentive_summary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Incentive summary exported to CSV');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Date Range:
              </span>
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text text-sm focus:ring-2 focus:ring-brand-red"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text text-sm focus:ring-2 focus:ring-brand-red"
            />
            <Button onClick={fetchData}>Apply Filter</Button>
            <Button variant="secondary" onClick={() => handleDatePreset('thisMonth')}>
              This Month
            </Button>
            <Button variant="secondary" onClick={() => handleDatePreset('lastMonth')}>
              Last Month
            </Button>
            <Button variant="secondary" onClick={() => handleDatePreset('thisQuarter')}>
              This Quarter
            </Button>
            <Button variant="secondary" onClick={() => handleDatePreset('thisYear')}>
              This Year
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ChevronDown className="h-4 w-4 mr-2 rotate-90" />
              Back to Summary
            </Button>
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
            Incentive Summary (1% of Completed Deals)
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          </div>
        ) : incentiveData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
            No incentive data found for the selected period.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total Deals</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {incentiveData.reduce((s, i) => s + i.totalDeals, 0)}
                </p>
              </div>
              
              {/* Clickable Base Incentive Card */}
              <div 
                onClick={handleOpenLedger}
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Base Incentive</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      ₹{incentiveData.reduce((s, i) => s + i.baseIncentive, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">Click to view ledger</p>
              </div>
              
              {/* Clickable Penalties Card */}
              <div 
                onClick={handleOpenPenaltyBreakdown}
                className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Total Penalties</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                      ₹{incentiveData.reduce((s, i) => s + i.penaltyAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">Click to view penalty breakdown</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Final Incentive</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                  ₹{incentiveData.reduce((s, i) => s + i.finalIncentive, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Employee-wise Incentive Data Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Employee</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Invoices</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Challans</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Total Deals</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Deal Amount</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Base (1%)</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Penalty %</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Penalty ₹</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-right">Final Incentive</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {incentiveData.map((item) => (
                    <>
                      <tr key={item.employeeId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text font-medium">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            {item.employeeName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-dark-text-secondary text-right">
                          {item.invoiceCount}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-dark-text-secondary text-right">
                          {item.challanCount}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right font-medium">
                          {item.totalDeals}
                          {item.dealsWithIssues > 0 && (
                            <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                              ({item.dealsWithIssues} ⚠)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right font-medium">
                          ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400 text-right font-semibold">
                          ₹{item.baseIncentive.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-bold ${item.totalPenaltyPercent > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                            {item.totalPenaltyPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-red-600 dark:text-red-400 text-right font-semibold">
                          ₹{item.penaltyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            ₹{item.finalIncentive.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Employee Movements Button */}
                            <button
                              onClick={async () => {
                                setSelectedEmployee(item.employeeId);
                                await fetchMovementData(item.employeeId);
                                setShowMovementTable(true);
                                // Scroll to movement section
                                setTimeout(() => {
                                  document.querySelector('.movement-tracking-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                              title="View all movements for this employee"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {/* Penalty Breakdown Button */}
                            {item.penalties.length > 0 && (
                              <button
                                onClick={() => {
                                  const row = document.getElementById(`penalties-${item.employeeId}`);
                                  if (row) {
                                    row.classList.toggle('hidden');
                                  }
                                }}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                                title="View penalty breakdown"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Penalty Details Row */}
                      {item.penalties.length > 0 && (
                        <tr id={`penalties-${item.employeeId}`} className="hidden bg-orange-50 dark:bg-orange-900/10">
                          <td colSpan="10" className="py-3 px-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                                Penalty Breakdown:
                              </h4>
                              {item.penalties.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded border border-orange-200 dark:border-orange-800">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-gray-900 dark:text-gray-100">{p.type}</span>
                                    <span className="text-gray-500 dark:text-gray-400">({p.count}x)</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {p.penalty}% penalty
                                    </span>
                                    {p.note && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.note}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">TOTAL</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right">
                      {incentiveData.reduce((sum, item) => sum + item.invoiceCount, 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right">
                      {incentiveData.reduce((sum, item) => sum + item.challanCount, 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right">
                      {incentiveData.reduce((sum, item) => sum + item.totalDeals, 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right">
                      ₹{incentiveData.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400 text-right">
                      ₹{incentiveData.reduce((sum, item) => sum + item.baseIncentive, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text text-right">
                      -
                    </td>
                    <td className="py-3 px-4 text-sm text-red-600 dark:text-red-400 text-right">
                      ₹{incentiveData.reduce((sum, item) => sum + item.penaltyAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-purple-600 dark:text-purple-400 text-right">
                      ₹{incentiveData.reduce((sum, item) => sum + item.finalIncentive, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Penalty Rules Reference */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">📋 Comprehensive Penalty Rules Applied:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Daily Reports:</strong> Missing/Unsigned = 1% per report</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Shutdown Reports:</strong> Missing = 1% per day (excl. Sunday)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Stock Reports:</strong> Missing weekly = 1% per week</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Labour Attendance:</strong> Not updated = 1% per week</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Vendor Account:</strong> Not updated with purchases = 1%</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Work Pending:</strong> {'>'} 8 days = 1% per job</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Vouchers:</strong> Missing documentation = 1% per 5 vouchers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Job Sheets:</strong> Updated late = 1% per sheet</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>GST Ledger:</strong> Not updated with taxable transactions = 1%</span>
                </div>
                <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium"><strong>Deals with Issues:</strong> Loss/Error/Late/Complaint/Payment Delay = 0% incentive for that deal</span>
                </div>
                <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium"><strong>Mathematical Accumulation:</strong> All penalties add up. Max penalty = 99%</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  <strong>Data Sources:</strong> Dashboard Daily Tasks, Jobs, Accounts (Invoices, Challans, Vouchers, Purchases), 
                  Labour Attendance, Vendor/Supplier/Customer Ledgers, GST Records, Job Sheets, and Stock Movements
                </p>
              </div>
            </div>

            {/* Movement Tracking Section */}
            <div className="movement-tracking-section mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    📊 Comprehensive Movement Tracking
                    {selectedEmployee && (
                      <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400">
                        - {profiles[selectedEmployee]?.name || 'Unknown Employee'}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                    Track all business activities: Invoices, Challans, Jobs, Payments, Stock, Tasks
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedEmployee && (
                    <Button 
                      onClick={async () => {
                        setSelectedEmployee(null);
                        await fetchMovementData();
                      }}
                      variant="secondary"
                    >
                      Show All Employees
                    </Button>
                  )}
                  <Button 
                    onClick={async () => {
                      await fetchMovementData(selectedEmployee);
                      setShowMovementTable(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showMovementTable ? 'Refresh' : 'View All Movements'}
                  </Button>
                </div>
              </div>

              {showMovementTable && (
                <div className="space-y-4">
                  {/* Movement Analytics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">📄 Invoices</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Invoice').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">📋 Challans</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Challan').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">🔧 Jobs</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Job').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">💰 Payments</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Payment').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">📦 Stock</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Stock').length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">✓ Tasks</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {movementData.filter(m => m.type === 'Task').length}
                      </p>
                    </div>
                  </div>

                  {/* Movement Filter Buttons */}
                  <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <Button 
                      variant={movementFilter === 'all' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('all')}
                      size="sm"
                    >
                      All Movements
                    </Button>
                    <Button 
                      variant={movementFilter === 'Invoice' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Invoice')}
                      size="sm"
                    >
                      📄 Invoices
                    </Button>
                    <Button 
                      variant={movementFilter === 'Challan' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Challan')}
                      size="sm"
                    >
                      📋 Challans
                    </Button>
                    <Button 
                      variant={movementFilter === 'Job' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Job')}
                      size="sm"
                    >
                      🔧 Jobs
                    </Button>
                    <Button 
                      variant={movementFilter === 'Payment' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Payment')}
                      size="sm"
                    >
                      💰 Payments
                    </Button>
                    <Button 
                      variant={movementFilter === 'Stock' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Stock')}
                      size="sm"
                    >
                      📦 Stock
                    </Button>
                    <Button 
                      variant={movementFilter === 'Task' ? 'primary' : 'secondary'}
                      onClick={() => setMovementFilter('Task')}
                      size="sm"
                    >
                      ✓ Tasks
                    </Button>
                  </div>

                  {/* Movement Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                          <tr>
                            <th className="py-3 px-3 text-left font-semibold">Type</th>
                            <th className="py-3 px-3 text-left font-semibold">Date</th>
                            <th className="py-3 px-3 text-left font-semibold">Reference</th>
                            <th className="py-3 px-3 text-left font-semibold">Party/Item</th>
                            <th className="py-3 px-3 text-left font-semibold">Vehicle</th>
                            <th className="py-3 px-3 text-right font-semibold">Amount/Qty</th>
                            <th className="py-3 px-3 text-center font-semibold">Status</th>
                            <th className="py-3 px-3 text-right font-semibold">Incentive Impact</th>
                            <th className="py-3 px-3 text-left font-semibold">Employee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(movementFilter === 'all' 
                            ? movementData 
                            : movementData.filter(m => m.type === movementFilter)
                          ).map((movement, idx) => (
                            <tr 
                              key={`${movement.type}-${movement.id}-${idx}`}
                              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">
                                  {movement.typeIcon} {movement.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                                {new Date(movement.date).toLocaleDateString('en-IN')}
                              </td>
                              <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                                {movement.reference}
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                                {movement.party}
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                                {movement.vehicle}
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-white">
                                {movement.type === 'Stock' 
                                  ? `${movement.amount} ${movement.details.unit || ''}`
                                  : `₹${movement.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                }
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  movement.isComplete 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}>
                                  {movement.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`font-semibold ${
                                  movement.incentiveImpact > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-gray-400'
                                }`}>
                                  {movement.incentiveImpact > 0 
                                    ? `₹${movement.incentiveImpact.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                    : '-'
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {movement.employeeName}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                          <tr className="font-bold">
                            <td colSpan="5" className="py-3 px-3 text-right">
                              TOTAL:
                            </td>
                            <td className="py-3 px-3 text-right">
                              ₹{(movementFilter === 'all' 
                                ? movementData 
                                : movementData.filter(m => m.type === movementFilter)
                              )
                                .filter(m => m.type !== 'Stock')
                                .reduce((sum, m) => sum + m.amount, 0)
                                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {(movementFilter === 'all' 
                                ? movementData 
                                : movementData.filter(m => m.type === movementFilter)
                              ).filter(m => m.isComplete).length} Complete
                            </td>
                            <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                              ₹{(movementFilter === 'all' 
                                ? movementData 
                                : movementData.filter(m => m.type === movementFilter)
                              )
                                .reduce((sum, m) => sum + m.incentiveImpact, 0)
                                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Empty State */}
                    {movementData.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No movements found for the selected period.</p>
                      </div>
                    )}
                  </div>

                  {/* Movement Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Revenue Movements</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                        ₹{movementData
                          .filter(m => m.type === 'Invoice' || m.type === 'Challan')
                          .reduce((sum, m) => sum + m.amount, 0)
                          .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">Completed Movements</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-300">
                        {movementData.filter(m => m.isComplete).length} / {movementData.length}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ({((movementData.filter(m => m.isComplete).length / movementData.length) * 100).toFixed(1)}%)
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Total Incentive Generated</p>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                        ₹{movementData
                          .reduce((sum, m) => sum + m.incentiveImpact, 0)
                          .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Pending Items</p>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-300">
                        {movementData.filter(m => !m.isComplete).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title="Incentive Ledger - Invoice & Challan Details"
        size="xxl"
      >
        <div className="space-y-4">
          {/* Summary Cards in Modal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Invoices</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{ledgerData.invoices.length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Challans</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-300">{ledgerData.challans.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Incentive</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-300">
                ₹{[...ledgerData.invoices, ...ledgerData.challans].reduce((sum, item) => sum + (item.incentive || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="py-2 px-3 text-left font-semibold">Date</th>
                  <th className="py-2 px-3 text-left font-semibold">Type</th>
                  <th className="py-2 px-3 text-left font-semibold">Party Name</th>
                  <th className="py-2 px-3 text-left font-semibold">Vehicle No</th>
                  <th className="py-2 px-3 text-right font-semibold">Amount</th>
                  <th className="py-2 px-3 text-right font-semibold">Incentive (1%)</th>
                  <th className="py-2 px-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Invoices */}
                {ledgerData.invoices.map((invoice, idx) => (
                  <tr key={`inv-${idx}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 px-3">{invoice.date}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        Invoice
                      </span>
                    </td>
                    <td className="py-2 px-3">{invoice.party_name || invoice.customer_name || 'N/A'}</td>
                    <td className="py-2 px-3">{invoice.vehicle_no || 'N/A'}</td>
                    <td className="py-2 px-3 text-right font-medium">₹{invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">
                      ₹{invoice.incentive.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                        <CheckCircle className="h-3 w-3" />
                        {invoice.status || 'Complete'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Challans */}
                {ledgerData.challans.map((challan, idx) => (
                  <tr key={`ch-${idx}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 px-3">{challan.date}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        Challan
                      </span>
                    </td>
                    <td className="py-2 px-3">{challan.party_name || challan.customer_name || 'N/A'}</td>
                    <td className="py-2 px-3">{challan.vehicle_no || 'N/A'}</td>
                    <td className="py-2 px-3 text-right font-medium">₹{challan.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">
                      ₹{challan.incentive.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                        <CheckCircle className="h-3 w-3" />
                        {challan.status || 'Complete'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-400 dark:border-gray-500">
                  <td colSpan="4" className="py-2 px-3 text-right">TOTAL:</td>
                  <td className="py-2 px-3 text-right">
                    ₹{[...ledgerData.invoices, ...ledgerData.challans].reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                    ₹{[...ledgerData.invoices, ...ledgerData.challans].reduce((sum, item) => sum + item.incentive, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {(ledgerData.invoices.length === 0 && ledgerData.challans.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No completed deals found for the selected period.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setShowLedgerModal(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Penalty Breakdown Modal */}
      <Modal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        title="Penalty Breakdown - Daily Checklist & Pending Actions"
        size="xxl"
      >
        <div className="space-y-4">
          {/* Summary Section */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Date Range</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {penaltyBreakdown.dateRange?.startDate} to {penaltyBreakdown.dateRange?.endDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Working Days</p>
                <p className="text-lg font-bold text-red-900 dark:text-red-200">{penaltyBreakdown.workingDays || 0}</p>
              </div>
            </div>
            <div className="border-t border-red-200 dark:border-red-700 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-800 dark:text-red-200">TOTAL PENALTY:</span>
                <span className="text-3xl font-bold text-red-900 dark:text-red-100">{penaltyBreakdown.totalPenalty || 0}%</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Mathematical Accumulation (Section 10): Max 99%
              </p>
            </div>
          </div>

          {/* Penalty Items Table */}
          <div className="max-h-[450px] overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="py-2 px-3 text-left font-semibold">Category</th>
                  <th className="py-2 px-3 text-left font-semibold">Description</th>
                  <th className="py-2 px-3 text-center font-semibold">Days/Count</th>
                  <th className="py-2 px-3 text-center font-semibold">Penalty %</th>
                  <th className="py-2 px-3 text-left font-semibold">Rule Reference</th>
                </tr>
              </thead>
              <tbody>
                {penaltyBreakdown.items?.length > 0 ? (
                  penaltyBreakdown.items.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-gray-200 dark:border-gray-700 ${
                        item.status === 'critical' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-orange-50 dark:bg-orange-900/10'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {item.status === 'critical' ? (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-gray-100">{item.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold ${
                          item.status === 'critical' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        }`}>
                          {item.daysCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {item.penaltyPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">
                        {item.rule}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">No penalties found!</p>
                      <p className="text-xs mt-1">All tasks completed on time.</p>
                    </td>
                  </tr>
                )}

                {/* Total Row */}
                {penaltyBreakdown.items?.length > 0 && (
                  <tr className="bg-gray-200 dark:bg-gray-700 font-bold border-t-2 border-gray-400 dark:border-gray-500">
                    <td colSpan="3" className="py-3 px-3 text-right">TOTAL PENALTY:</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xl text-red-600 dark:text-red-400">{penaltyBreakdown.totalPenalty}%</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">Section 10</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Agreement Reference */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-2">
              📋 Agreement Reference: Mathematical Penalty Accumulation System
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Every mistake, missing report, pending work = separate 1% penalty</p>
              <p>• 5 mistakes in 1 day = 5% penalty | 10 mistakes in month = 10% penalty</p>
              <p>• All penalties accumulate mathematically (no upper limit except 99%)</p>
              <p>• Daily tasks must be completed within 24 hours with boss signature</p>
              <p>• Back-dated or late signatures are not acceptable</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                const csv = [
                  ['Category', 'Description', 'Days/Count', 'Penalty %', 'Rule'].join(','),
                  ...(penaltyBreakdown.items || []).map(item => 
                    [item.category, item.description, item.daysCount, item.penaltyPercent + '%', item.rule].join(',')
                  ),
                  ['', '', 'TOTAL', penaltyBreakdown.totalPenalty + '%', ''].join(',')
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `penalty-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Penalty breakdown exported');
              }}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => setShowPenaltyModal(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncentiveSummary;
