import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLabourStore from '@/store/labourStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Calendar, Receipt, FileText, CheckCircle, XCircle, AlertCircle, FileDown, Printer, Edit, X, Save, DollarSign } from 'lucide-react';
import { dbOperations } from '@/lib/db';
import { subscribeToEntity } from '@/utils/dataSync';
import { broadcastDataChange } from '@/utils/dataSync';

const getWeekDates = (date) => {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay();
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(curr);
    day.setDate(first + i);
    weekDates.push(day.toISOString().split('T')[0]);
  }
  
  return weekDates;
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `Week ${weekNo}, ${d.getFullYear()}`;
};

const AttendanceMarkModal = ({ employee, date, onSave, onCancel }) => {
  const hourlyRate = (employee?.daily_rate || 0) / 9;
  
  const [formData, setFormData] = useState({
    status: 'present',
    hours_worked: 9,
    overtime_hours: 0,
    payment_amount: employee?.daily_rate || 0,
    notes: '',
  });

  // Auto-calculate payment when hours or OT changes
  const handleHoursChange = (field, value) => {
    const newValue = parseFloat(value) || 0;
    const updatedData = { ...formData, [field]: newValue };
    
    // Calculate payment: (hours × hourly_rate) + (OT hours × hourly_rate)
    const regularHours = field === 'hours_worked' ? newValue : formData.hours_worked;
    const otHours = field === 'overtime_hours' ? newValue : formData.overtime_hours;
    const calculatedPayment = (regularHours * hourlyRate) + (otHours * hourlyRate);
    
    setFormData({
      ...updatedData,
      payment_amount: parseFloat(calculatedPayment.toFixed(2))
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-dark-text">
          Attendance Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
          required
        >
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="half_day">Half Day</option>
          <option value="sick">Sick Leave</option>
          <option value="leave">Leave</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>

      {formData.status === 'present' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-dark-text">
                Hours Worked
              </label>
              <input
                type="number"
                value={formData.hours_worked}
                onChange={(e) => handleHoursChange('hours_worked', e.target.value)}
                step="0.5"
                min="0"
                max="24"
                className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-dark-text">
                Overtime Hours
              </label>
              <input
                type="number"
                value={formData.overtime_hours}
                onChange={(e) => handleHoursChange('overtime_hours', e.target.value)}
                step="0.5"
                min="0"
                className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-text">
              Daily Payment (₹)
            </label>
            <input
              type="number"
              value={formData.payment_amount}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ({formData.hours_worked}h × ₹{hourlyRate.toFixed(2)}) + ({formData.overtime_hours}h OT × ₹{hourlyRate.toFixed(2)}) = ₹{formData.payment_amount}
            </p>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-dark-text">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows="2"
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark Attendance
        </Button>
      </div>
    </form>
  );
};

const VoucherPaymentModal = ({ employee, weekData, onSave, onCancel }) => {
  const weekTotal = weekData.reduce((sum, day) => sum + (parseFloat(day.payment_amount) || 0), 0);
  const [amount, setAmount] = useState(weekTotal);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ amount: parseFloat(amount), paymentMode, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">Week Total Payable</p>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
          ₹{weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-dark-text">
          Payment Amount (₹) *
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-dark-text">
          Payment Mode *
        </label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
          required
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-dark-text">
          Notes/Voucher Details
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="2"
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
          placeholder="Voucher number, payment details..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <DollarSign className="h-4 w-4 mr-1" />
          Process Payment
        </Button>
      </div>
    </form>
  );
};

const LabourLedgerTab = () => {
  const navigate = useNavigate();
  const { labour: employees, fetchLabour } = useLabourStore();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date().toISOString().split('T')[0]);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekBalance, setWeekBalance] = useState({ advance: 0, balance: 0, payment_made: 0 });
  const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [labourVouchers, setLabourVouchers] = useState([]);
  const [dateRangeMode, setDateRangeMode] = useState('week'); // 'week' or 'custom'
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  const weekDates = getWeekDates(currentWeekStart);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Get dates based on mode (week or custom range)
  const getActiveDateRange = () => {
    if (dateRangeMode === 'custom') {
      const dates = [];
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      // Ensure start is not after end
      if (start > end) return [];
      
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }
    return weekDates;
  };

  const activeDates = getActiveDateRange();

  useEffect(() => {
    fetchLabour();
  }, [fetchLabour]);

  useEffect(() => {
    if (selectedEmployeeId && activeDates.length > 0) {
      // Clear old data first
      setWeekAttendance([]);
      setLabourVouchers([]);
      
      // Then fetch fresh data
      fetchWeekAttendance();
      fetchPreviousWeekBalance();
      fetchLabourVouchers();
    } else {
      // Clear data when no employee selected
      setWeekAttendance([]);
      setWeekBalance({ advance: 0, balance: 0, payment_made: 0 });
      setLabourVouchers([]);
    }
  }, [selectedEmployeeId, currentWeekStart, dateRangeMode, customStartDate, customEndDate]);

  // Auto-refresh when page becomes visible or focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedEmployeeId) {
        fetchWeekAttendance();
        fetchPreviousWeekBalance();
        fetchLabourVouchers();
      }
    };

    const handleFocus = () => {
      if (selectedEmployeeId) {
        fetchWeekAttendance();
        fetchPreviousWeekBalance();
        fetchLabourVouchers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedEmployeeId, currentWeekStart]);

  // Listen for voucher changes from other modules
  useEffect(() => {
    const unsubscribe = subscribeToEntity('voucher', ({ action, data }) => {
      console.log('[LabourLedger] Voucher event received:', action, data);
      // Refresh if the voucher is for the currently selected employee
      if (data?.payee_type === 'labour' && (data?.payee_id === selectedEmployeeId || !data?.payee_id)) {
        console.log('[LabourLedger] Voucher change detected for current employee, refreshing balance...');
        setTimeout(() => {
          fetchPreviousWeekBalance();
          fetchWeekAttendance();
        }, 50);
      }
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  // Listen for labour_ledger_entries changes
  useEffect(() => {
    const unsubscribe = subscribeToEntity('labour_ledger_entries', ({ action, data }) => {
      console.log('[LabourLedger] Ledger entry event received:', action, data);
      if (data?.labour_id === selectedEmployeeId) {
        console.log('[LabourLedger] Ledger entry change detected for current labour, refreshing...');
        setTimeout(() => {
          fetchPreviousWeekBalance();
          fetchWeekAttendance();
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  // Listen for labour_attendance changes
  useEffect(() => {
    const unsubscribe = subscribeToEntity('labour_attendance', ({ action, data }) => {
      console.log('[LabourLedger] Attendance event received:', action, data);
      if (data?.labour_id === selectedEmployeeId) {
        console.log('[LabourLedger] Attendance change detected for current labour, refreshing...');
        setTimeout(() => fetchWeekAttendance(), 100);
      }
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  // Listen for labour changes
  useEffect(() => {
    const unsubscribe = subscribeToEntity('labour', ({ action, data }) => {
      console.log('[LabourLedger] Labour event received:', action, data);
      if (data?.id === selectedEmployeeId && action === 'update') {
        console.log('[LabourLedger] Current labour updated, refreshing...');
        setTimeout(() => fetchPreviousWeekBalance(), 100);
      }
    });

    return () => unsubscribe();
  }, [selectedEmployeeId]);

  // Add polling for real-time updates every 2 seconds when employee is selected
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const pollInterval = setInterval(() => {
      console.log('[LabourLedger] Polling refresh...');
      fetchWeekAttendance();
      fetchPreviousWeekBalance();
      fetchLabourVouchers();
    }, 2000); // Poll every 2 seconds for faster updates

    return () => clearInterval(pollInterval);
  }, [selectedEmployeeId, currentWeekStart]);

  const fetchWeekAttendance = async () => {
    try {
      const allAttendance = await dbOperations.getAll('labour_attendance');
      const weekData = allAttendance.filter(
        a => a.labour_id === selectedEmployeeId && activeDates.includes(a.attendance_date)
      );
      setWeekAttendance(weekData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchPreviousWeekBalance = async () => {
    try {
      // Get opening balance from labour master
      const selectedLabour = employees.find(l => l.id === selectedEmployeeId);
      const openingBalance = parseFloat(selectedLabour?.opening_balance || 0);
      
      console.log('[Previous Balance Debug]', {
        selectedLabourId: selectedEmployeeId,
        selectedLabour,
        openingBalance
      });
      
      const firstDate = activeDates.length > 0 ? activeDates[0] : new Date().toISOString().split('T')[0];
      
      // Get all attendance and vouchers before current week
      const [allAttendance, allVouchers] = await Promise.all([
        dbOperations.getAll('labour_attendance'),
        dbOperations.getAll('vouchers')
      ]);
      
      // Calculate previous payments (from attendance table)
      const previousAttendance = allAttendance.filter(
        a => a.labour_id === selectedEmployeeId && a.attendance_date < firstDate
      );
      const totalPreviousPayments = previousAttendance.reduce(
        (sum, a) => sum + (parseFloat(a.payment_amount) || 0), 0
      );
      
      // Calculate previous vouchers
      const previousVouchers = allVouchers.filter(
        v => v.payee_type === 'labour' && 
             v.payee_id === selectedEmployeeId && 
             v.voucher_date < firstDate
      );
      const totalPreviousVouchers = previousVouchers.reduce(
        (sum, v) => sum + (parseFloat(v.amount) || 0), 0
      );
      
      console.log('[Previous Balance Calculation]', {
        firstDate,
        previousAttendanceCount: previousAttendance.length,
        totalPreviousPayments,
        previousVouchersCount: previousVouchers.length,
        totalPreviousVouchers,
        formula: `${openingBalance} + ${totalPreviousPayments} - ${totalPreviousVouchers}`
      });
      
      // Previous Balance = Opening Balance + Previous Payments - Previous Vouchers
      const balance = openingBalance + totalPreviousPayments - totalPreviousVouchers;
      
      console.log('[Previous Balance Result]', {
        balance,
        advance: balance < 0 ? Math.abs(balance) : 0,
        positiveBalance: balance > 0 ? balance : 0
      });
      
      setWeekBalance({
        advance: balance < 0 ? Math.abs(balance) : 0,
        balance: balance > 0 ? balance : 0,
        payment_made: 0, // Will be calculated from current period vouchers
      });
    } catch (error) {
      console.error('Error fetching previous balance:', error);
    }
  };

  const fetchLabourVouchers = async () => {
    try {
      const allVouchers = await dbOperations.getAll('vouchers');
      // Filter vouchers for this labour within the current date range
      const labourWeekVouchers = allVouchers.filter(
        v => v.payee_type === 'labour' && 
             v.payee_id === selectedEmployeeId &&
             activeDates.includes(v.voucher_date)
      );
      setLabourVouchers(labourWeekVouchers);
    } catch (error) {
      console.error('Error fetching labour vouchers:', error);
    }
  };

  const getVoucherForDate = (date) => {
    return labourVouchers.filter(v => v.voucher_date === date);
  };

  const handleMarkAttendance = async (data) => {
    try {
      const existingAttendance = weekAttendance.find(a => a.attendance_date === selectedDate);
      
      const attendanceData = {
        labour_id: selectedEmployeeId,
        attendance_date: selectedDate,
        status: data.status,
        hours_worked: data.hours_worked || 0,
        overtime_hours: data.overtime_hours || 0,
        payment_amount: data.payment_amount || 0,
        notes: data.notes || '',
      };

      if (existingAttendance) {
        // Update attendance
        await dbOperations.update('labour_attendance', existingAttendance.id, attendanceData);
        
        // Update corresponding ledger entry
        const allLedger = await dbOperations.getAll('labour_ledger_entries');
        const existingLedgerEntry = allLedger.find(
          e => e.labour_id === selectedEmployeeId && 
          e.entry_date === selectedDate && 
          e.entry_type === 'daily_earning'
        );
        
        if (existingLedgerEntry && data.payment_amount > 0) {
          await dbOperations.update('labour_ledger_entries', existingLedgerEntry.id, {
            ...existingLedgerEntry,
            debit_amount: parseFloat(data.payment_amount),
            particulars: `Daily Earning - ${data.status === 'present' ? data.hours_worked + 'h' : data.status}`,
            notes: data.notes,
          });
        } else if (existingLedgerEntry && data.payment_amount === 0) {
          // Remove ledger entry if payment is 0
          await dbOperations.delete('labour_ledger_entries', existingLedgerEntry.id);
          broadcastDataChange('labour_ledger_entries', 'delete', { id: existingLedgerEntry.id, labour_id: selectedEmployeeId });
        } else if (!existingLedgerEntry && data.payment_amount > 0) {
          // Create new ledger entry
          const newLedgerEntry = await dbOperations.insert('labour_ledger_entries', {
            labour_id: selectedEmployeeId,
            entry_date: selectedDate,
            particulars: `Daily Earning - ${data.status === 'present' ? data.hours_worked + 'h' : data.status}`,
            debit_amount: parseFloat(data.payment_amount),
            credit_amount: 0,
            payment_mode: '',
            notes: data.notes || '',
            entry_type: 'daily_earning',
          });
          broadcastDataChange('labour_ledger_entries', 'add', { ...newLedgerEntry, labour_id: selectedEmployeeId });
        }
      } else {
        // Create new attendance
        await dbOperations.insert('labour_attendance', attendanceData);
        
        // Create ledger entry for earning (debit)
        if (data.payment_amount > 0) {
          const newLedgerEntry = await dbOperations.insert('labour_ledger_entries', {
            labour_id: selectedEmployeeId,
            entry_date: selectedDate,
            particulars: `Daily Earning - ${data.status === 'present' ? data.hours_worked + 'h' : data.status}`,
            debit_amount: parseFloat(data.payment_amount),
            credit_amount: 0,
            payment_mode: '',
            notes: data.notes || '',
            entry_type: 'daily_earning',
          });
          broadcastDataChange('labour_ledger_entries', 'add', { ...newLedgerEntry, labour_id: selectedEmployeeId });
        }
      }

      toast.success('Attendance marked successfully!');
      
      // Broadcast data change
      broadcastDataChange('labour_attendance', existingAttendance ? 'updated' : 'created', {
        labour_id: selectedEmployeeId,
        attendance_date: selectedDate,
        payment_amount: data.payment_amount
      });
      
      setIsAttendanceModalOpen(false);
      fetchWeekAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleVoucherPayment = async (paymentData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const ledgerEntryId = `lle_${Date.now()}`;
      const voucherId = `lv_${Date.now()}`;
      
      // Generate voucher number
      const allVouchers = await dbOperations.getAll('vouchers');
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const existing = allVouchers.filter(v => v.voucher_no?.startsWith(`V${year}${month}`));
      const sequence = existing.length + 1;
      const voucherNo = `V${year}${month}${sequence.toString().padStart(4, '0')}`;
      
      // 1. Create voucher record in vouchers table
      await dbOperations.insert('vouchers', {
        id: voucherId,
        voucher_date: today,
        voucher_no: voucherNo,
        payee_type: 'labour',
        payee_id: selectedEmployeeId,
        payee_name: selectedEmployee?.name || '',
        amount: parseFloat(paymentData.amount),
        payment_mode: paymentData.paymentMode,
        cheque_no: '',
        bank_name: '',
        particulars: `Labour Payment - ${selectedEmployee?.name} - ${paymentData.notes || 'Week Payment'}`,
        notes: paymentData.notes || `Week ${getWeekNumber(currentWeekStart)}`,
        created_at: new Date().toISOString(),
      });
      
      // 2. Save payment to labour ledger as credit (payment made)
      await dbOperations.insert('labour_ledger_entries', {
        id: ledgerEntryId,
        labour_id: selectedEmployeeId,
        entry_date: today,
        particulars: `Payment Voucher - ${voucherNo}`,
        debit_amount: 0,
        credit_amount: parseFloat(paymentData.amount),
        payment_mode: paymentData.paymentMode,
        notes: paymentData.notes || `Week ${getWeekNumber(currentWeekStart)}`,
        entry_type: 'payment',
        reference_type: 'voucher',
        reference_id: voucherId,
        reference_no: voucherNo,
      });

      toast.success(`Payment voucher ${voucherNo} created successfully!`);
      
      // Broadcast data change
      broadcastDataChange('voucher', 'created', {
        voucher_id: voucherId,
        payee_type: 'labour',
        payee_id: selectedEmployeeId,
        amount: parseFloat(paymentData.amount)
      });
      
      setIsVoucherModalOpen(false);
      
      // Force immediate refresh of all data
      await fetchPreviousWeekBalance();
      await fetchWeekAttendance();
      await fetchLabourVouchers();
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast.error('Failed to create payment voucher');
    }
  };

  const getAttendanceStatus = (date) => {
    const attendance = weekAttendance.find(a => a.attendance_date === date);
    return attendance;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'absent': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'half_day': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'sick': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'leave': return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'holiday': return <Calendar className="h-5 w-5 text-purple-600" />;
      default: return null;
    }
  };

  const handleExportCard = () => {
    setIsCardPreviewOpen(true);
    setIsEditMode(false);
  };

  const handleSavePDF = () => {
    setIsCardPreviewOpen(true);
    setIsEditMode(false);
    setTimeout(() => {
      const printContent = document.getElementById('attendance-card-preview');
      if (printContent) {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write('<html><head><title>Attendance Card</title>');
        printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }, 100);
  };

  const handleEditCard = () => {
    setIsCardPreviewOpen(true);
    setIsEditMode(true);
  };

  const handlePrintCard = () => {
    setIsCardPreviewOpen(true);
    setIsEditMode(false);
    setTimeout(() => window.print(), 100);
  };

  const weekTotal = weekAttendance.reduce((sum, day) => sum + (parseFloat(day.payment_amount) || 0), 0);
  const presentDays = weekAttendance.filter(a => a.status === 'present').length;
  const currentPeriodPayments = labourVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const netBalance = (weekBalance.balance - weekBalance.advance) + weekTotal - currentPeriodPayments;

  return (
    <div className="space-y-6">
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Mark Attendance"
      >
        <AttendanceMarkModal
          employee={selectedEmployee}
          date={selectedDate}
          onSave={handleMarkAttendance}
          onCancel={() => setIsAttendanceModalOpen(false)}
        />
      </Modal>

      {/* Card Preview Modal */}
      <Modal
        isOpen={isCardPreviewOpen}
        onClose={() => {
          setIsCardPreviewOpen(false);
          setIsEditMode(false);
        }}
        title=""
        size="xxl"
      >
        <div className="space-y-4">
          {/* Modal Header with Actions */}
          <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-dark-text">
              Weekly Attendance Card - {selectedEmployee?.name}
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant="secondary"
                className="p-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.print()}
                variant="secondary"
                className="p-2"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    const element = document.getElementById('attendance-card-preview');
                    if (!element) {
                      toast.error('Card content not found');
                      return;
                    }

                    // Capture the card as canvas
                    const canvas = await html2canvas(element, {
                      scale: 2,
                      backgroundColor: '#ffffff',
                      logging: false,
                      useCORS: true,
                    });

                    // Convert to blob and download
                    canvas.toBlob((blob) => {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      const fileName = `Attendance_Card_${selectedEmployee?.name?.replace(/\s+/g, '_')}_${dateRangeMode === 'week' ? getWeekNumber(currentWeekStart).replace(/\s+/g, '_') : `${activeDates[0]}_to_${activeDates[activeDates.length - 1]}`}.png`;
                      link.href = url;
                      link.download = fileName;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success('Card saved successfully!');
                    });
                  } catch (error) {
                    console.error('Error saving card:', error);
                    toast.error('Failed to save card');
                  }
                }}
                variant="primary"
                className="p-2"
              >
                <Save className="h-4 w-4" />
              </Button>
              <button
                onClick={() => {
                  setIsCardPreviewOpen(false);
                  setIsEditMode(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5 dark:text-dark-text" />
              </button>
            </div>
          </div>

          {/* Card Preview Content */}
          <div id="attendance-card-preview" className="space-y-4">
            {/* Employee Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-semibold dark:text-dark-text">{selectedEmployee?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-semibold dark:text-dark-text">{selectedEmployee?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Aadhaar</p>
                  <p className="font-semibold dark:text-dark-text">{selectedEmployee?.aadhaar_number || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Daily Rate</p>
                  <p className="font-semibold dark:text-dark-text">
                    ₹{parseFloat(selectedEmployee?.daily_rate || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Week Info */}
            <div className="text-center">
              <h3 className="text-lg font-bold dark:text-dark-text">
                {dateRangeMode === 'week'
                  ? getWeekNumber(currentWeekStart)
                  : `Attendance Card (${activeDates.length} days)`
                }
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeDates.length > 0 && (
                  <>
                    {new Date(activeDates[0]).toLocaleDateString('en-GB')} - {new Date(activeDates[activeDates.length - 1]).toLocaleDateString('en-GB')}
                  </>
                )}
              </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center">
                <p className="text-xs text-green-600 dark:text-green-400">Present Days</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">{presentDays}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400">Week Total</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                  ₹{weekTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400">Week Payments</p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                  ₹{currentPeriodPayments.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Previous Balance</p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                  ₹{weekBalance.balance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 text-center">
                <p className="text-xs text-red-600 dark:text-red-400">Advance</p>
                <p className="text-xl font-bold text-red-900 dark:text-red-300">
                  ₹{weekBalance.advance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Net Balance</p>
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                  ₹{netBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold border dark:border-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-3 py-2 text-left font-semibold border dark:border-gray-600 dark:text-gray-300">Day</th>
                    <th className="px-3 py-2 text-center font-semibold border dark:border-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-3 py-2 text-right font-semibold border dark:border-gray-600 dark:text-gray-300">Hours</th>
                    <th className="px-3 py-2 text-right font-semibold border dark:border-gray-600 dark:text-gray-300">OT Hours</th>
                    <th className="px-3 py-2 text-right font-semibold border dark:border-gray-600 dark:text-gray-300">Payment</th>
                    {isEditMode && <th className="px-3 py-2 text-center font-semibold border dark:border-gray-600 dark:text-gray-300">Edit</th>}
                  </tr>
                </thead>
                <tbody>
                  {activeDates.map((date) => {
                    const attendance = getAttendanceStatus(date);
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <tr key={date} className="border dark:border-gray-700">
                        <td className="px-3 py-2 border dark:border-gray-600 dark:text-dark-text">
                          {new Date(date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-2 border dark:border-gray-600 dark:text-dark-text font-semibold">{dayName}</td>
                        <td className="px-3 py-2 border dark:border-gray-600 text-center">
                          {attendance ? (
                            <span className="text-xs capitalize dark:text-dark-text px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                              {attendance.status.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border dark:border-gray-600 text-right dark:text-dark-text font-semibold">
                          {attendance?.hours_worked || '-'}
                        </td>
                        <td className="px-3 py-2 border dark:border-gray-600 text-right dark:text-dark-text font-semibold">
                          {attendance?.overtime_hours || '-'}
                        </td>
                        <td className="px-3 py-2 border dark:border-gray-600 text-right font-bold dark:text-dark-text">
                          {attendance?.payment_amount ? `₹${parseFloat(attendance.payment_amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        {isEditMode && (
                          <td className="px-3 py-2 border dark:border-gray-600 text-center">
                            <button
                              onClick={() => {
                                setSelectedDate(date);
                                setIsAttendanceModalOpen(true);
                                setIsCardPreviewOpen(false);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 border dark:border-gray-600 dark:text-dark-text">Total</td>
                    <td className="px-3 py-2 border dark:border-gray-600 text-right dark:text-dark-text">
                      {weekAttendance.reduce((sum, a) => sum + (parseFloat(a.hours_worked) || 0), 0)}
                    </td>
                    <td className="px-3 py-2 border dark:border-gray-600 text-right dark:text-dark-text">
                      {weekAttendance.reduce((sum, a) => sum + (parseFloat(a.overtime_hours) || 0), 0)}
                    </td>
                    <td className="px-3 py-2 border dark:border-gray-600 text-right text-green-600 dark:text-green-400">
                      ₹{weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {isEditMode && <td className="border dark:border-gray-600"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Notes */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Employee Selection */}
      <Card>
        <div className="space-y-4">
          {/* Date Range Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-dark-text">
              Date Range Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="week"
                  checked={dateRangeMode === 'week'}
                  onChange={(e) => setDateRangeMode(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm dark:text-dark-text">Weekly View</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="custom"
                  checked={dateRangeMode === 'custom'}
                  onChange={(e) => setDateRangeMode(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm dark:text-dark-text">Custom Date Range</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Select Employee *
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.skill_type ? `(${emp.skill_type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {dateRangeMode === 'week' ? (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                  Week Starting
                </label>
                <input
                  type="date"
                  value={currentWeekStart}
                  onChange={(e) => setCurrentWeekStart(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedEmployee && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-semibold dark:text-dark-text">{selectedEmployee.name}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-semibold dark:text-dark-text">{selectedEmployee.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Aadhaar</p>
                <p className="font-semibold dark:text-dark-text">{selectedEmployee.aadhaar_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Daily Rate</p>
                <p className="font-semibold dark:text-dark-text">
                  ₹{parseFloat(selectedEmployee.daily_rate || 0).toLocaleString('en-IN')}
                  {selectedEmployee.hourly_rate && ` / ₹${selectedEmployee.hourly_rate}/hr`}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {selectedEmployeeId && (
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-dark-text">
                {dateRangeMode === 'week' 
                  ? `${getWeekNumber(currentWeekStart)} - Weekly Attendance Card`
                  : `Attendance Card (${new Date(customStartDate).toLocaleDateString('en-GB')} - ${new Date(customEndDate).toLocaleDateString('en-GB')})`
                }
              </h3>
              <div className="flex gap-2">
                {/* Card Generate Button */}
                <Button
                  onClick={() => setIsCardPreviewOpen(true)}
                  variant="secondary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Card Generate
                </Button>
                <Button
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Voucher
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">Present Days</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">{presentDays}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">Week Total</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                  ₹{weekTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400">Week Payments</p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                  ₹{currentPeriodPayments.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Previous Balance</p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                  ₹{weekBalance.balance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400">Advance</p>
                <p className="text-xl font-bold text-red-900 dark:text-red-300">
                  ₹{weekBalance.advance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Net Balance</p>
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                  ₹{netBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold dark:text-gray-300">Date</th>
                    <th className="px-3 py-2 text-left font-semibold dark:text-gray-300">Day</th>
                    <th className="px-3 py-2 text-center font-semibold dark:text-gray-300">Status</th>
                    <th className="px-3 py-2 text-right font-semibold dark:text-gray-300">Hours</th>
                    <th className="px-3 py-2 text-right font-semibold dark:text-gray-300">OT Hours</th>
                    <th className="px-3 py-2 text-right font-semibold dark:text-gray-300">Payment</th>
                    <th className="px-3 py-2 text-right font-semibold dark:text-gray-300">Voucher</th>
                    <th className="px-3 py-2 text-center font-semibold dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDates.map((date, idx) => {
                    const attendance = getAttendanceStatus(date);
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <tr key={date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 dark:text-dark-text">
                          {new Date(date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-2 dark:text-dark-text">{dayName}</td>
                        <td className="px-3 py-2 text-center">
                          {attendance ? (
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(attendance.status)}
                              <span className="text-xs capitalize dark:text-dark-text">
                                {attendance.status.replace('_', ' ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Not Marked</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right dark:text-dark-text">
                          {attendance?.hours_worked || '-'}
                        </td>
                        <td className="px-3 py-2 text-right dark:text-dark-text">
                          {attendance?.overtime_hours || '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold dark:text-dark-text">
                          {attendance?.payment_amount ? `₹${parseFloat(attendance.payment_amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right dark:text-dark-text">
                          {(() => {
                            const dayVouchers = getVoucherForDate(date);
                            if (dayVouchers.length === 0) return '-';
                            if (dayVouchers.length === 1) {
                              return (
                                <button
                                  onClick={() => navigate('/accounts/voucher')}
                                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline font-medium"
                                  title={`Voucher: ${dayVouchers[0].voucher_no}`}
                                >
                                  ₹{parseFloat(dayVouchers[0].amount).toLocaleString('en-IN')}
                                </button>
                              );
                            }
                            const total = dayVouchers.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
                            return (
                              <button
                                onClick={() => navigate('/accounts/voucher')}
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline font-medium"
                                title={`${dayVouchers.length} vouchers`}
                              >
                                ₹{total.toLocaleString('en-IN')} ({dayVouchers.length})
                              </button>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            variant="ghost"
                            className="p-1"
                            onClick={() => {
                              setSelectedDate(date);
                              setIsAttendanceModalOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 font-semibold dark:text-dark-text">Total</td>
                    <td className="px-3 py-2 text-right font-semibold dark:text-dark-text">
                      {weekAttendance.reduce((sum, a) => sum + (parseFloat(a.hours_worked) || 0), 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold dark:text-dark-text">
                      {weekAttendance.reduce((sum, a) => sum + (parseFloat(a.overtime_hours) || 0), 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-green-600 dark:text-green-400">
                      ₹{weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-purple-600 dark:text-purple-400">
                      ₹{labourVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>
      )}

      {!selectedEmployeeId && (
        <Card>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Select an employee to view their weekly attendance card
            </p>
          </div>
        </Card>
      )}

      {/* Payment Voucher Modal */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Add Payment Voucher"
      >
        <VoucherPaymentModal
          employee={selectedEmployee}
          weekData={weekAttendance}
          onSave={handleVoucherPayment}
          onCancel={() => setIsVoucherModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default LabourLedgerTab;
