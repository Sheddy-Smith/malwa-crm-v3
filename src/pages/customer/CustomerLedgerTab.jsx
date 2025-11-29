import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import {
  Download,
  Printer,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Wallet,
  Trash2,
  X,
  Eye,
  FileText,
  Edit,
} from 'lucide-react';
import { dbOperations } from '@/lib/db';
import { jsPDF } from 'jspdf';
import { subscribeToEntity, broadcastDataChange } from '@/utils/dataSync';
import { openPrintPreview, PRINT_PRESETS } from '@/utils/printHelpers';

const CustomerLedgerTab = () => {
  const [searchParams] = useSearchParams();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [challanLoading, setChallanLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDebit: 0,
    totalCredit: 0,
    outstandingCredit15Plus: 0,
    monthlyData: [],
  });

  // Handle URL query param for customer_id (from Cash Receipt redirect)
  useEffect(() => {
    const customerIdFromUrl = searchParams.get('customer_id');
    if (customerIdFromUrl && customerIdFromUrl !== selectedCustomerId) {
      setSelectedCustomerId(customerIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchLedgerData();
      loadSelectedCustomer();
    } else {
      setLedgerEntries([]);
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, startDate, endDate]);

  // Auto-refresh when page becomes visible or focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedCustomerId) {
        fetchLedgerData();
        loadSelectedCustomer();
      }
    };

    const handleFocus = () => {
      if (selectedCustomerId) {
        fetchLedgerData();
        loadSelectedCustomer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedCustomerId, startDate, endDate]);

  // Listen for cash receipt changes from Accounts module
  useEffect(() => {
    const unsubscribe = subscribeToEntity('cash_receipt', ({ action, data }) => {
      console.log('[CustomerLedger] Cash receipt event received:', action, data);
      if (data?.customer_id === selectedCustomerId) {
        console.log('[CustomerLedger] Cash receipt change detected for current customer, refreshing...');
        // Immediate refresh
        setTimeout(() => {
          fetchLedgerData();
          loadSelectedCustomer();
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Listen for customer ledger entry changes
  useEffect(() => {
    const unsubscribe = subscribeToEntity('customer_ledger_entries', ({ action, data }) => {
      console.log('[CustomerLedger] Ledger entry event received:', action, data);
      if (data?.customer_id === selectedCustomerId) {
        console.log('[CustomerLedger] Ledger entry change detected for current customer, refreshing...');
        setTimeout(() => {
          fetchLedgerData();
          loadSelectedCustomer();
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Listen for job changes (jobs create ledger entries)
  useEffect(() => {
    const unsubscribe = subscribeToEntity('jobs', ({ action, data }) => {
      console.log('[CustomerLedger] Job event received:', action, data);
      if (data?.customer_id === selectedCustomerId) {
        console.log('[CustomerLedger] Job change detected for current customer, refreshing...');
        setTimeout(() => {
          fetchLedgerData();
          loadSelectedCustomer();
        }, 500); // Slightly longer delay for ledger entry creation
      }
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Listen for customer changes
  useEffect(() => {
    const unsubscribe = subscribeToEntity('customers', ({ action, data }) => {
      console.log('[CustomerLedger] Customer event received:', action, data);
      if (data?.id === selectedCustomerId) {
        console.log('[CustomerLedger] Current customer updated, refreshing...');
        setTimeout(() => {
          loadSelectedCustomer();
        }, 100);
      }
      // Refresh customer list if any customer is added/deleted
      if (action === 'add' || action === 'delete') {
        fetchCustomers();
      }
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Add polling for real-time updates every 3 seconds (reduced from 5)
  useEffect(() => {
    if (!selectedCustomerId) return;

    const pollInterval = setInterval(() => {
      fetchLedgerData();
    }, 3000); // More frequent polling for real-time feel

    return () => clearInterval(pollInterval);
  }, [selectedCustomerId, startDate, endDate]);

  const fetchCustomers = async () => {
    try {
      const data = await dbOperations.getAll('customers') || [];
      const sorted = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCustomers(sorted);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadSelectedCustomer = async () => {
    try {
      const customer = await dbOperations.getById('customers', selectedCustomerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      let data = [];
      
      try {
        // Try to get data using index first
        data = await dbOperations.getByIndex('customer_ledger_entries', 'customer_id', selectedCustomerId);
      } catch (indexError) {
        // If index doesn't exist, fall back to getting all entries and filtering
        console.warn('customer_id index not found, using fallback method');
        const allEntries = await dbOperations.getAll('customer_ledger_entries');
        data = allEntries.filter(entry => entry.customer_id === selectedCustomerId);
      }
      
      data = Array.isArray(data) ? data : [];

      // Apply date filters
      let filteredData = data;
      if (startDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) >= startDate);
      }
      if (endDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) <= endDate);
      }

      // Sort by date (recent first)
      filteredData.sort((a, b) => {
        const dateCompare = String(b.entry_date).localeCompare(String(a.entry_date));
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = filteredData.map(entry => {
        runningBalance += parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
        return { ...entry, balance: runningBalance };
      });

      setLedgerEntries(entriesWithBalance);
      calculateStats(entriesWithBalance);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast.error('Failed to load ledger data');
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entries) => {
    const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
    
    // Find debit entries older than 15 days that are still outstanding
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    // Calculate outstanding debit (receivables) older than 15 days
    // We need to check all debit entries older than 15 days and see how much is still unpaid
    let outstandingDebit15Plus = 0;
    
    // Get all entries sorted by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.entry_date) - new Date(b.entry_date)
    );
    
    // Calculate running balance to find outstanding amount
    let runningDebitOld = 0;
    sortedEntries.forEach(e => {
      const entryDate = new Date(e.entry_date);
      const debitAmt = parseFloat(e.debit || 0);
      const creditAmt = parseFloat(e.credit || 0);
      
      // If entry is older than 15 days and is a debit (sale), add to old debit
      if (entryDate < fifteenDaysAgo && debitAmt > 0) {
        runningDebitOld += debitAmt;
      }
      // Subtract any credit (payment) from running old debit
      if (creditAmt > 0 && runningDebitOld > 0) {
        runningDebitOld -= creditAmt;
        if (runningDebitOld < 0) runningDebitOld = 0;
      }
    });
    
    outstandingDebit15Plus = runningDebitOld;
    
    setStats({
      totalDebit,
      totalCredit,
      outstandingCredit15Plus: outstandingDebit15Plus,
      monthlyData: [],
    });
  };

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return ledgerEntries;

    const term = searchTerm.toLowerCase();
    return ledgerEntries.filter(entry =>
      entry.description?.toLowerCase().includes(term) ||
      entry.reference_type?.toLowerCase().includes(term) ||
      entry.reference_id?.toLowerCase().includes(term) ||
      entry.debit?.toString().includes(term) ||
      entry.credit?.toString().includes(term)
    );
  }, [ledgerEntries, searchTerm]);

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => ({
        debit: acc.debit + parseFloat(entry.debit || 0),
        credit: acc.credit + parseFloat(entry.credit || 0),
      }),
      { debit: 0, credit: 0 }
    );
  }, [filteredEntries]);

  const finalBalance = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].balance : 0;

  const handleExportCSV = () => {
    if (!selectedCustomer) return;

    const csvRows = [
      ['Customer Ledger Statement'],
      [`Customer: ${selectedCustomer.name || ''}`],
      [`Phone: ${selectedCustomer.phone || ''}`],
      [`Period: ${startDate || 'Start'} to ${endDate || 'End'}`],
      [],
      ['Date', 'Type', 'Description', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
    ];

    filteredEntries.forEach(entry => {
      csvRows.push([
        new Date(entry.entry_date).toLocaleDateString('en-GB'),
        entry.type || entry.reference_type || '',
        entry.description || '',
        entry.debit || 0,
        entry.credit || 0,
        entry.balance,
      ]);
    });

    csvRows.push([]);
    csvRows.push(['Total', '', '', totals.debit.toFixed(2), totals.credit.toFixed(2), finalBalance.toFixed(2)]);

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_ledger_${selectedCustomer.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Ledger exported to CSV');
  };

  // Cleanup duplicate payment entries for current customer
  const handleCleanupDuplicates = async () => {
    if (!selectedCustomerId) return;
    
    try {
      const allEntries = await dbOperations.getAll('customer_ledger_entries');
      const customerEntries = allEntries.filter(e => e.customer_id === selectedCustomerId);
      
      // Group payment entries by challan_no + vehicle_no
      const paymentGroups = {};
      const entriesToDelete = [];
      
      customerEntries.forEach(entry => {
        if (entry.type === 'payment') {
          // Extract challan info from description or fields
          let key = '';
          if (entry.challan_no && entry.vehicle_no) {
            key = `${entry.vehicle_no}|${entry.challan_no}`;
          } else if (entry.description) {
            // Try to extract from description patterns
            const vhMatch = entry.description.match(/VH:([^|]+)/);
            const chnMatch = entry.description.match(/CHN:([^|\s)]+)/);
            const challanMatch = entry.description.match(/Challan:\s*([^\s(]+)/);
            
            if (vhMatch && chnMatch) {
              key = `${vhMatch[1]}|${chnMatch[1]}`;
            } else if (challanMatch) {
              key = `challan_${challanMatch[1]}`;
            }
          }
          
          if (key) {
            if (!paymentGroups[key]) {
              paymentGroups[key] = [];
            }
            paymentGroups[key].push(entry);
          }
        }
      });
      
      // For each group with duplicates, keep the one with highest amount and delete rest
      Object.keys(paymentGroups).forEach(key => {
        const group = paymentGroups[key];
        if (group.length > 1) {
          // Sort by credit amount descending
          group.sort((a, b) => parseFloat(b.credit || 0) - parseFloat(a.credit || 0));
          // Keep first (highest), mark rest for deletion
          for (let i = 1; i < group.length; i++) {
            entriesToDelete.push(group[i]);
          }
        }
      });
      
      if (entriesToDelete.length === 0) {
        toast.info('No duplicate entries found');
        return;
      }
      
      // Delete duplicate entries
      for (const entry of entriesToDelete) {
        await dbOperations.delete('customer_ledger_entries', entry.id);
        broadcastDataChange('customer_ledger_entries', 'delete', { id: entry.id, customer_id: entry.customer_id });
      }
      
      // Save to backend
      if (window.electron?.fs?.writeFile) {
        const updatedLedger = await dbOperations.getAll('customer_ledger_entries');
        await window.electron.fs.writeFile(
          'C:/malwa-crm/Data_base/customer/Ledger.json',
          JSON.stringify(updatedLedger, null, 2)
        );
      }
      
      toast.success(`Removed ${entriesToDelete.length} duplicate payment entries`);
      fetchLedgerData();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup duplicates');
    }
  };

  // View Challan details from ledger entry
  const handleViewChallan = async (entry) => {
    if (!entry.challan_no && !entry.reference_id && !entry.vehicle_no) {
      toast.info('No challan details available for this entry');
      return;
    }
    
    setChallanLoading(true);
    setChallanModalOpen(true);
    
    try {
      // Try to find challan in multiple tables
      let challan = null;
      
      // Search in challans table first
      try {
        const allChallans = await dbOperations.getAll('challans');
        if (entry.challan_no) {
          challan = allChallans.find(c => 
            c.challan_no === entry.challan_no || 
            c.challanNo === entry.challan_no
          );
        }
        if (!challan && entry.reference_id) {
          challan = allChallans.find(c => c.id === entry.reference_id);
        }
        if (!challan && entry.vehicle_no) {
          challan = allChallans.find(c => 
            (c.vehicle_no === entry.vehicle_no || c.vehicleNo === entry.vehicle_no) &&
            c.date === entry.entry_date
          );
        }
      } catch (err) {
        console.log('Challans table not found, trying jobs');
      }
      
      // If not found in challans, try jobs table
      if (!challan) {
        try {
          const allJobs = await dbOperations.getAll('jobs');
          if (entry.challan_no) {
            challan = allJobs.find(j => 
              j.challanNo === entry.challan_no || 
              j.challan_no === entry.challan_no
            );
          }
          if (!challan && entry.reference_id) {
            challan = allJobs.find(j => j.id === entry.reference_id);
          }
          if (!challan && entry.vehicle_no) {
            challan = allJobs.find(j => 
              (j.vehicleNo === entry.vehicle_no || j.vehicle_no === entry.vehicle_no) &&
              j.date === entry.entry_date
            );
          }
        } catch (err) {
          console.log('Jobs table error:', err);
        }
      }
      
      // Try sell_challans table
      if (!challan) {
        try {
          const sellChallans = await dbOperations.getAll('sell_challans');
          if (entry.challan_no) {
            challan = sellChallans.find(c => 
              c.challan_no === entry.challan_no || 
              c.challanNo === entry.challan_no
            );
          }
          if (!challan && entry.vehicle_no) {
            challan = sellChallans.find(c => 
              (c.vehicle_no === entry.vehicle_no || c.vehicleNo === entry.vehicle_no)
            );
          }
        } catch (err) {
          console.log('Sell challans table not found');
        }
      }
      
      if (challan) {
        console.log('Found challan:', challan);
        setSelectedChallan(challan);
      } else {
        // If no challan found, show entry data as fallback
        console.log('No challan found, showing entry data:', entry);
        // Create a challan-like object from the ledger entry
        const fallbackChallan = {
          challanNo: entry.challan_no || 'N/A',
          date: entry.entry_date,
          vehicleNo: entry.vehicle_no || 'N/A',
          partyName: selectedCustomer?.name || 'N/A',
          grandTotal: entry.debit || 0,
          items: [],
          note: 'Challan details from ledger entry'
        };
        setSelectedChallan(fallbackChallan);
      }
    } catch (error) {
      console.error('Error fetching challan:', error);
      toast.error('Failed to load challan details');
      setChallanModalOpen(false);
    } finally {
      setChallanLoading(false);
    }
  };


  const handleSavePDF = () => {
    if (!selectedCustomer) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Customer Ledger Statement', 14, 15);
    
    // Customer Info
    doc.setFontSize(10);
    doc.text(`Customer: ${selectedCustomer.name || ''}`, 14, 25);
    doc.text(`Phone: ${selectedCustomer.phone || ''}`, 14, 30);
    doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 35);
    
    // Table Header
    let yPos = 45;
    doc.setFontSize(9);
    doc.text('Date', 14, yPos);
    doc.text('Type', 40, yPos);
    doc.text('Description', 70, yPos);
    doc.text('Debit', 130, yPos);
    doc.text('Credit', 155, yPos);
    doc.text('Balance', 180, yPos);
    
    yPos += 5;
    
    // Table Data
    filteredEntries.forEach((entry) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(new Date(entry.entry_date).toLocaleDateString('en-GB'), 14, yPos);
      doc.text((entry.type || entry.reference_type || '').substring(0, 15), 40, yPos);
      doc.text((entry.description || '').substring(0, 30), 70, yPos);
      doc.text((entry.debit || 0).toFixed(2), 130, yPos);
      doc.text((entry.credit || 0).toFixed(2), 155, yPos);
      doc.text(entry.balance.toFixed(2), 180, yPos);
      
      yPos += 5;
    });
    
    // Totals
    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 70, yPos);
    doc.text(totals.debit.toFixed(2), 130, yPos);
    doc.text(totals.credit.toFixed(2), 155, yPos);
    doc.text(finalBalance.toFixed(2), 180, yPos);
    
    doc.save(`customer_ledger_${selectedCustomer.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF saved successfully');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filters and Actions */}
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                Customer Ledger
              </h2>
              {selectedCustomerId && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={fetchLedgerData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleSavePDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCleanupDuplicates}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    title="Remove duplicate payment entries"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Fix Duplicates
                  </Button>
                </div>
              )}
            </div>

            {/* Customer Selection and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Select Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                >
                  <option value="">Choose a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search entries..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Colorful Metric Blocks */}
        {selectedCustomerId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Debit */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Debit (Sales)</p>
                  <p className="text-2xl font-bold">₹{(stats.totalDebit / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Total Credit */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Credit (Payments)</p>
                  <p className="text-2xl font-bold">₹{(stats.totalCredit / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingDown className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Outstanding 15+ Days */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Credit 15+ Days Old</p>
                  <p className="text-2xl font-bold">₹{(stats.outstandingCredit15Plus / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <AlertCircle className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Current Balance</p>
                  <p className="text-2xl font-bold">
                    ₹{(Math.abs(parseFloat(selectedCustomer?.opening_balance || 0) + stats.totalDebit - stats.totalCredit) / 1000).toFixed(1)}K
                    <span className="text-sm ml-1">{(parseFloat(selectedCustomer?.opening_balance || 0) + stats.totalDebit - stats.totalCredit) > 0 ? '(Dr)' : (parseFloat(selectedCustomer?.opening_balance || 0) + stats.totalDebit - stats.totalCredit) < 0 ? '(Cr)' : ''}</span>
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Previous Balance (Opening Balance) */}
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">Previous Balance</p>
                  <p className="text-2xl font-bold">
                    ₹{(Math.abs(parseFloat(selectedCustomer?.opening_balance || 0)) / 1000).toFixed(1)}K
                    <span className="text-sm ml-1">{parseFloat(selectedCustomer?.opening_balance || 0) > 0 ? '(Dr)' : parseFloat(selectedCustomer?.opening_balance || 0) < 0 ? '(Cr)' : ''}</span>
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Wallet className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Summary Table */}
        {/* Removed - Monthly summary table deleted as per requirements */}

        {/* Customer Info Card */}
        {selectedCustomer && (
          <Card>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer Name</p>
                  <p className="font-semibold dark:text-dark-text">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-semibold dark:text-dark-text">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold dark:text-dark-text">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</p>
                  <p className="font-semibold dark:text-dark-text">
                    ₹{parseFloat(selectedCustomer.opening_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Ledger Table */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
              Ledger Entries
            </h3>

            {!selectedCustomerId ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">Please select a customer to view ledger</p>
            </div>
          ) : loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading ledger entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">
                No ledger entries found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Entries will appear when you create invoices or challans for this customer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800 text-left">
                  <tr>
                    <th className="px-2 py-0.5 border-b dark:border-gray-700">Date</th>
                    <th className="px-2 py-0.5 border-b dark:border-gray-700">Type</th>
                    <th className="px-2 py-0.5 border-b dark:border-gray-700">Description</th>
                    <th className="px-2 py-0.5 text-right border-b dark:border-gray-700">Debit (₹)</th>
                    <th className="px-2 py-0.5 text-right border-b dark:border-gray-700">Credit (₹)</th>
                    <th className="px-2 py-0.5 text-right border-b dark:border-gray-700">Balance (₹)</th>
                    <th className="px-2 py-0.5 text-center border-b dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id || index}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-2 py-0.5 text-gray-700 dark:text-gray-300">
                        {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-2 py-0.5 text-gray-700 dark:text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs ${
                          entry.type === 'invoice' || entry.reference_type === 'invoice' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          entry.type === 'challan' || entry.type === 'sale' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          entry.type === 'payment' || entry.reference_type === 'payment' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          entry.type === 'discount' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {entry.type || entry.reference_type || 'Entry'}
                        </span>
                      </td>
                      <td className="px-2 py-0.5 text-gray-700 dark:text-gray-300">
                        {entry.description}
                      </td>
                      <td className="px-2 py-0.5 text-right text-gray-900 dark:text-white font-medium">
                        {entry.debit > 0 ? `₹ ${parseFloat(entry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-2 py-0.5 text-right text-gray-900 dark:text-white font-medium">
                        {entry.credit > 0 ? `₹ ${parseFloat(entry.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-bold ${
                        entry.balance > 0 ? 'text-red-600' : 
                        entry.balance < 0 ? 'text-green-600' : 
                        'text-gray-900 dark:text-white'
                      }`}>
                        ₹ {Math.abs(entry.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-0.5 text-center">
                        {(entry.type === 'sale' || entry.type === 'challan' || entry.type === 'invoice' || entry.reference_type === 'challan') && (
                          <button
                            onClick={() => handleViewChallan(entry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View Challan Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan="3" className="px-2 py-0.5 border-t dark:border-gray-700 text-right dark:text-dark-text">
                      Totals:
                    </td>
                    <td className="py-1 px-2 text-right border-t dark:border-gray-700 dark:text-dark-text">
                      ₹ {totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1 px-2 text-right border-t dark:border-gray-700 dark:text-dark-text">
                      ₹ {totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-1 px-2 text-right border-t dark:border-gray-700 ${
                      finalBalance > 0 ? 'text-red-600' : 
                      finalBalance < 0 ? 'text-green-600' : 
                      'text-gray-900 dark:text-dark-text'
                    }`}>
                      ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {finalBalance > 0 ? ' (Dr)' : finalBalance < 0 ? ' (Cr)' : ''}
                    </td>
                    <td className="py-1 px-2 border-t dark:border-gray-700"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* Challan Details Modal */}
      <Modal
        isOpen={challanModalOpen}
        onClose={() => {
          setChallanModalOpen(false);
          setSelectedChallan(null);
        }}
        title={`Challan Details - ${selectedChallan?.challanNo || selectedChallan?.challan_no || ''}`}
        size="xl"
      >
        {challanLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedChallan ? (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex justify-end gap-2 pb-4 border-b dark:border-gray-700">
              <Button variant="outline" size="sm" onClick={() => {
                // Print challan
                const printContent = `
                  <html>
                  <head>
                    <title>Challan - ${selectedChallan.challanNo || selectedChallan.challan_no}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f5f5f5; }
                      .header { margin-bottom: 20px; }
                      .totals { margin-top: 20px; text-align: right; }
                      .text-right { text-align: right; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2>Challan: ${selectedChallan.challanNo || selectedChallan.challan_no || 'N/A'}</h2>
                      <p>Date: ${selectedChallan.date ? new Date(selectedChallan.date).toLocaleDateString('en-GB') : 'N/A'}</p>
                      <p>Vehicle No: ${selectedChallan.vehicleNo || selectedChallan.vehicle_no || 'N/A'}</p>
                      <p>Party Name: ${selectedChallan.partyName || selectedChallan.party_name || 'N/A'}</p>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Item Name</th>
                          <th>HSN</th>
                          <th class="text-right">Qty</th>
                          <th class="text-right">Rate</th>
                          <th class="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(selectedChallan.items || []).map((item, idx) => `
                          <tr>
                            <td>${idx + 1}</td>
                            <td>${item.name || item.itemName || item.productName || '-'}</td>
                            <td>${item.hsn || '-'}</td>
                            <td class="text-right">${item.quantity || item.qty || 0}</td>
                            <td class="text-right">₹${parseFloat(item.rate || 0).toFixed(2)}</td>
                            <td class="text-right">₹${parseFloat(item.amount || (item.quantity || item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div class="totals">
                      <p><strong>Subtotal:</strong> ₹${parseFloat(selectedChallan.subtotal || selectedChallan.subTotal || 0).toFixed(2)}</p>
                      ${(selectedChallan.discount || 0) > 0 ? `<p><strong>Discount:</strong> -₹${parseFloat(selectedChallan.discount || 0).toFixed(2)}</p>` : ''}
                      <p style="font-size: 18px;"><strong>Grand Total:</strong> ₹${parseFloat(selectedChallan.grandTotal || selectedChallan.total || selectedChallan.finalTotal || 0).toFixed(2)}</p>
                    </div>
                  </body>
                  </html>
                `;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.print();
              }}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>

              <Button variant="outline" size="sm" onClick={() => {
                // Save PDF
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text('Challan Details', 14, 15);
                doc.setFontSize(10);
                doc.text(`Challan No: ${selectedChallan.challanNo || selectedChallan.challan_no || 'N/A'}`, 14, 25);
                doc.text(`Date: ${selectedChallan.date ? new Date(selectedChallan.date).toLocaleDateString('en-GB') : 'N/A'}`, 14, 32);
                doc.text(`Vehicle No: ${selectedChallan.vehicleNo || selectedChallan.vehicle_no || 'N/A'}`, 14, 39);
                doc.text(`Party Name: ${selectedChallan.partyName || selectedChallan.party_name || 'N/A'}`, 14, 46);
                doc.text(`Grand Total: Rs.${parseFloat(selectedChallan.grandTotal || selectedChallan.total || 0).toFixed(2)}`, 14, 53);
                
                const vehicleNo = (selectedChallan.vehicleNo || selectedChallan.vehicle_no || 'no-vehicle').replace(/[^a-zA-Z0-9]/g, '-');
                doc.save(`Challan_${vehicleNo}_${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('PDF saved successfully');
              }}>
                <Download className="h-4 w-4 mr-1" />
                Save PDF
              </Button>
            </div>

            {/* Challan Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Challan No</label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedChallan.challanNo || selectedChallan.challan_no || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedChallan.date ? new Date(selectedChallan.date).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle No</label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedChallan.vehicleNo || selectedChallan.vehicle_no || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Party Name</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedChallan.partyName || selectedChallan.party_name || selectedCustomer?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Items Table */}
            {selectedChallan.items && selectedChallan.items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items</h3>
                <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-2 text-left border-b dark:border-gray-700">S.No</th>
                      <th className="p-2 text-left border-b dark:border-gray-700">Product Name</th>
                      <th className="p-2 text-left border-b dark:border-gray-700">HSN</th>
                      <th className="p-2 text-right border-b dark:border-gray-700">Quantity</th>
                      <th className="p-2 text-right border-b dark:border-gray-700">Rate</th>
                      <th className="p-2 text-right border-b dark:border-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items.map((item, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{item.productName || item.name || item.itemName || item.item_name || 'N/A'}</td>
                        <td className="p-2">{item.hsn || '-'}</td>
                        <td className="p-2 text-right">{item.qty || item.quantity || 0}</td>
                        <td className="p-2 text-right">₹{parseFloat(item.rate || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">₹{parseFloat(item.amount || ((item.qty || item.quantity || 0) * (item.rate || 0))).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Details */}
            <div className="flex justify-end">
              <div className="w-96 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</label>
                    <p className="text-gray-900 dark:text-white">₹{parseFloat(selectedChallan.subtotal || selectedChallan.subTotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax</label>
                    <p className="text-gray-900 dark:text-white">₹{parseFloat(selectedChallan.tax || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Discount</label>
                    <p className="text-gray-900 dark:text-white">₹{parseFloat(selectedChallan.discount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Advance Payment</label>
                    <p className="text-gray-900 dark:text-white">₹{parseFloat(selectedChallan.advance_payment || selectedChallan.advancePayment || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</label>
                    <p className="text-gray-900 dark:text-white font-bold text-lg">₹{parseFloat(selectedChallan.grandTotal || selectedChallan.total || selectedChallan.finalTotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Received</label>
                    <p className="text-gray-900 dark:text-white font-medium">₹{parseFloat(selectedChallan.manualPayment || selectedChallan.payment_received || 0).toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance Due</label>
                    <p className="font-bold text-red-600 dark:text-red-400">
                      ₹{(parseFloat(selectedChallan.grandTotal || selectedChallan.total || selectedChallan.finalTotal || 0) - parseFloat(selectedChallan.manualPayment || selectedChallan.payment_received || selectedChallan.advance_payment || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Challan details not found</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CustomerLedgerTab;
