import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  Download,
  Printer,
  Search,
  RefreshCw,
} from 'lucide-react';
import { dbOperations } from '@/lib/db';
import jsPDF from 'jspdf';
import { subscribeToEntity } from '@/utils/dataSync';

const CustomerLedgerTab = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Add polling for real-time updates every 5 seconds
  useEffect(() => {
    if (!selectedCustomerId) return;

    const pollInterval = setInterval(() => {
      fetchLedgerData();
    }, 5000);

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
      let data = await dbOperations.getByIndex('customer_ledger_entries', 'customer_id', selectedCustomerId);
      data = Array.isArray(data) ? data : [];

      // Apply date filters
      let filteredData = data;
      if (startDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) >= startDate);
      }
      if (endDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) <= endDate);
      }

      // Sort by date
      filteredData.sort((a, b) => {
        const dateCompare = String(a.entry_date).localeCompare(String(b.entry_date));
        if (dateCompare !== 0) return dateCompare;
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      });

      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = filteredData.map(entry => {
        runningBalance += parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
        return { ...entry, balance: runningBalance };
      });

      setLedgerEntries(entriesWithBalance);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
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

  const handlePrint = () => {
    window.print();
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
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              Customer Ledger
            </h2>
          </div>

          {/* Customer Selection and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          {/* Action Buttons */}
          {selectedCustomerId && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button variant="secondary" size="sm" onClick={fetchLedgerData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSavePDF}>
                <Download className="h-4 w-4 mr-2" />
                Save PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          )}

          {/* Customer Info Card */}
          {selectedCustomer && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                  <p className={`font-bold text-lg ${finalBalance > 0 ? 'text-red-600' : finalBalance < 0 ? 'text-green-600' : 'text-gray-900 dark:text-dark-text'}`}>
                    ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {finalBalance > 0 ? ' (Dr)' : finalBalance < 0 ? ' (Cr)' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          {!selectedCustomerId ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Please select a customer to view ledger</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading ledger entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
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
                    <th className="p-3 border-b dark:border-gray-700">Date</th>
                    <th className="p-3 border-b dark:border-gray-700">Type</th>
                    <th className="p-3 border-b dark:border-gray-700">Description</th>
                    <th className="p-3 text-right border-b dark:border-gray-700">Debit (₹)</th>
                    <th className="p-3 text-right border-b dark:border-gray-700">Credit (₹)</th>
                    <th className="p-3 text-right border-b dark:border-gray-700">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id || index}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs ${
                          entry.type === 'invoice' || entry.reference_type === 'invoice' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          entry.type === 'challan' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          entry.type === 'payment' || entry.reference_type === 'payment' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {entry.type || entry.reference_type || 'Entry'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {entry.description}
                        {entry.reference_id && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            (Ref: {entry.reference_id})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-gray-900 dark:text-white font-medium">
                        {entry.debit > 0 ? `₹ ${parseFloat(entry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-3 text-right text-gray-900 dark:text-white font-medium">
                        {entry.credit > 0 ? `₹ ${parseFloat(entry.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        entry.balance > 0 ? 'text-red-600' : 
                        entry.balance < 0 ? 'text-green-600' : 
                        'text-gray-900 dark:text-white'
                      }`}>
                        ₹ {Math.abs(entry.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan="3" className="p-3 border-t dark:border-gray-700 text-right dark:text-dark-text">
                      Totals:
                    </td>
                    <td className="p-3 text-right border-t dark:border-gray-700 dark:text-dark-text">
                      ₹ {totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right border-t dark:border-gray-700 dark:text-dark-text">
                      ₹ {totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right border-t dark:border-gray-700 ${
                      finalBalance > 0 ? 'text-red-600' : 
                      finalBalance < 0 ? 'text-green-600' : 
                      'text-gray-900 dark:text-dark-text'
                    }`}>
                      ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {finalBalance > 0 ? ' (Dr)' : finalBalance < 0 ? ' (Cr)' : ''}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default CustomerLedgerTab;
