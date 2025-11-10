import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import {
  Download,
  Printer,
  CheckSquare,
  Search,
  RefreshCw,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const AllocationModal = ({ receipt, onClose, onSave }) => {
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutstandingInvoices();
  }, [receipt]);

  const fetchOutstandingInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', receipt.customer_id)
        .neq('payment_status', 'paid')
        .order('invoice_date', { ascending: true });

      if (error) throw error;
      setOutstandingInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load outstanding invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (invoiceId, amount) => {
    const numAmount = parseFloat(amount) || 0;
    setAllocations(prev => ({
      ...prev,
      [invoiceId]: numAmount,
    }));
  };

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
  }, [allocations]);

  const remaining = parseFloat(receipt.amount) - totalAllocated;

  const handleAutoAllocate = () => {
    let remainingAmount = parseFloat(receipt.amount);
    const newAllocations = {};

    for (const invoice of outstandingInvoices) {
      if (remainingAmount <= 0) break;

      const outstanding = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
      const allocateAmount = Math.min(outstanding, remainingAmount);

      newAllocations[invoice.id] = allocateAmount;
      remainingAmount -= allocateAmount;
    }

    setAllocations(newAllocations);
  };

  const handleClear = () => {
    setAllocations({});
  };

  const handleSave = () => {
    if (totalAllocated > parseFloat(receipt.amount)) {
      toast.error('Total allocated cannot exceed receipt amount');
      return;
    }

    const allocationArray = Object.entries(allocations)
      .filter(([_, amount]) => amount > 0)
      .map(([invoice_id, allocated_amount]) => ({
        invoice_id,
        allocated_amount,
        allocation_date: new Date().toISOString().split('T')[0],
      }));

    onSave(allocationArray);
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-4 dark:border-gray-700">
        <h3 className="text-xl font-bold dark:text-dark-text">Allocate Receipt</h3>
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
          {receipt.receipt_no} - ₹ {parseFloat(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button variant="secondary" size="sm" onClick={handleAutoAllocate}>
            Auto-Allocate Oldest
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear}>
            Clear
          </Button>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Total Allocated:{' '}
            <span className="font-bold text-brand-red">
              ₹ {totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Remaining:{' '}
            <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹ {remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
          Loading invoices...
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm border dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="p-2 text-left border dark:border-gray-600">Invoice No</th>
                <th className="p-2 text-right border dark:border-gray-600">Date</th>
                <th className="p-2 text-right border dark:border-gray-600">Total</th>
                <th className="p-2 text-right border dark:border-gray-600">Paid</th>
                <th className="p-2 text-right border dark:border-gray-600">Outstanding</th>
                <th className="p-2 text-right border dark:border-gray-600">Allocate</th>
              </tr>
            </thead>
            <tbody>
              {outstandingInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500 dark:text-dark-text-secondary">
                    No outstanding invoices
                  </td>
                </tr>
              ) : (
                outstandingInvoices.map((invoice) => {
                  const outstanding = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
                  return (
                    <tr key={invoice.id} className="border-b dark:border-gray-700">
                      <td className="p-2 border dark:border-gray-600 dark:text-dark-text">
                        {invoice.invoice_no}
                      </td>
                      <td className="p-2 text-right border dark:border-gray-600 dark:text-dark-text">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-2 text-right border dark:border-gray-600 dark:text-dark-text">
                        ₹ {parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right border dark:border-gray-600 dark:text-dark-text">
                        ₹ {parseFloat(invoice.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right border dark:border-gray-600 font-medium text-brand-red">
                        ₹ {outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border dark:border-gray-600">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={outstanding}
                          value={allocations[invoice.id] || ''}
                          onChange={(e) => handleAllocationChange(invoice.id, e.target.value)}
                          className="w-full p-1 border rounded bg-transparent dark:border-gray-600 dark:text-dark-text text-right"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {remaining < 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-300">
            Total allocated exceeds receipt amount. Please adjust allocations.
          </p>
        </div>
      )}

      {remaining > 0 && totalAllocated > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ₹ {remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remains unapplied. Consider keeping as customer advance.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={totalAllocated === 0 || remaining < 0}>
          Save Allocation
        </Button>
      </div>
    </div>
  );
};

const CustomerLedgerTab = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [agingData, setAgingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [density, setDensity] = useState('comfortable');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchLedgerData();
      fetchAgingData();
    }
  }, [selectedCustomerId, startDate, endDate]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('customer_ledger_entries')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (startDate) query = query.gte('entry_date', startDate);
      if (endDate) query = query.lte('entry_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      let runningBalance = 0;
      const entriesWithBalance = (data || []).map(entry => {
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

  const fetchAgingData = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_aging_analysis')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .maybeSingle();

      if (error) throw error;
      setAgingData(data);
    } catch (error) {
      console.error('Error fetching aging data:', error);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return ledgerEntries;

    const term = searchTerm.toLowerCase();
    return ledgerEntries.filter(entry =>
      entry.particulars?.toLowerCase().includes(term) ||
      entry.ref_no?.toLowerCase().includes(term) ||
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

  const handleAllocateClick = async (entry) => {
    if (entry.ref_type !== 'receipt') {
      toast.error('Only receipts can be allocated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', entry.ref_id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedReceipt({ ...data, customer_id: selectedCustomerId });
        setIsAllocationModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Failed to load receipt details');
    }
  };

  const handleSaveAllocation = async (allocations) => {
    try {
      const { error } = await supabase.rpc('allocate_receipt_to_invoices', {
        p_receipt_id: selectedReceipt.id,
        p_allocations: allocations,
      });

      if (error) throw error;

      toast.success('Allocation saved successfully');
      setIsAllocationModalOpen(false);
      setSelectedReceipt(null);
      fetchLedgerData();
      fetchAgingData();
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast.error('Failed to save allocation');
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Customer Ledger Statement'],
      [`Customer: ${selectedCustomer?.name || ''}`],
      [`Period: ${startDate || 'Start'} to ${endDate || 'End'}`],
      [],
      ['Date', 'Ref Type', 'Ref No', 'Description', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
    ];

    filteredEntries.forEach(entry => {
      csvRows.push([
        new Date(entry.entry_date).toLocaleDateString('en-IN'),
        entry.ref_type || '',
        entry.ref_no || '',
        entry.particulars,
        entry.debit || 0,
        entry.credit || 0,
        entry.balance,
      ]);
    });

    csvRows.push([]);
    csvRows.push(['', '', '', 'Totals:', totals.debit.toFixed(2), totals.credit.toFixed(2), finalBalance.toFixed(2)]);

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${selectedCustomer?.name}-${Date.now()}.csv`;
    link.click();

    toast.success('CSV exported successfully');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog');
  };

  const agingChartData = agingData
    ? [
        { name: '0-30', value: parseFloat(agingData.aging_0_30 || 0) },
        { name: '31-60', value: parseFloat(agingData.aging_31_60 || 0) },
        { name: '61-90', value: parseFloat(agingData.aging_61_90 || 0) },
        { name: '90+', value: parseFloat(agingData.aging_90_plus || 0) },
      ].filter(item => item.value > 0)
    : [];

  const COLORS = ['#4CAF50', '#FFC107', '#FF9800', '#F44336'];

  return (
    <>
      <Modal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        title=""
      >
        <AllocationModal
          receipt={selectedReceipt}
          onClose={() => setIsAllocationModalOpen(false)}
          onSave={handleSaveAllocation}
        />
      </Modal>

      <div className="space-y-6">
        <Card>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="flex-1 w-full lg:w-auto">
              <label className="block text-sm font-medium mb-1 dark:text-dark-text">
                Select Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              >
                <option value="">Search customer — name / code / phone</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `- ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedCustomerId && (
            <>
              <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by description, ref no, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <div className="flex border rounded-lg dark:border-gray-600">
                    <button
                      onClick={() => setDensity('compact')}
                      className={`p-2 ${density === 'compact' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      title="Compact"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDensity('comfortable')}
                      className={`p-2 ${density === 'comfortable' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      title="Comfortable"
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                  Loading ledger...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm border dark:border-gray-700 ${density === 'compact' ? 'text-xs' : ''}`}>
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-left border dark:border-gray-600`}>Date</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-left border dark:border-gray-600`}>Ref Type</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-left border dark:border-gray-600`}>Ref No</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-left border dark:border-gray-600`}>Description</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600`}>Debit (₹)</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600`}>Credit (₹)</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600`}>Balance (₹)</th>
                        <th className={`${density === 'compact' ? 'p-1' : 'p-3'} text-center border dark:border-gray-600`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                            {selectedCustomerId ? 'No ledger entries found' : 'Please select a customer'}
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr key={entry.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} border dark:border-gray-600 dark:text-dark-text`}>
                              {new Date(entry.entry_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} border dark:border-gray-600 dark:text-dark-text capitalize`}>
                              {entry.ref_type || '-'}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} border dark:border-gray-600`}>
                              {entry.ref_no ? (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{entry.ref_no}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} border dark:border-gray-600 dark:text-dark-text`}>
                              {entry.particulars}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600 dark:text-dark-text`}>
                              {entry.debit > 0
                                ? `₹ ${parseFloat(entry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600 dark:text-dark-text`}>
                              {entry.credit > 0
                                ? `₹ ${parseFloat(entry.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} text-right border dark:border-gray-600 font-medium ${entry.balance > 0 ? 'text-red-600' : entry.balance === 0 ? 'text-green-600' : 'text-dark-text'}`}>
                              ₹ {Math.abs(entry.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`${density === 'compact' ? 'p-1' : 'p-3'} text-center border dark:border-gray-600`}>
                              {entry.ref_type === 'receipt' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAllocateClick(entry)}
                                  className="p-1"
                                  title="Allocate"
                                >
                                  <CheckSquare className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredEntries.length > 0 && (
                      <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                        <tr>
                          <td colSpan="4" className="p-3 border dark:border-gray-600 text-right dark:text-dark-text">
                            Totals:
                          </td>
                          <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                            ₹ {totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                            ₹ {totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right border dark:border-gray-600 ${finalBalance > 0 ? 'text-red-600' : finalBalance === 0 ? 'text-green-600' : 'text-dark-text'}`}>
                            ₹ {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 border dark:border-gray-600"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </>
          )}
        </Card>

        {selectedCustomerId && agingData && (
          <Card>
            <h3 className="text-lg font-bold mb-4 dark:text-dark-text">Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">0-30 Days</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ₹ {parseFloat(agingData.aging_0_30 || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">31-60 Days</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  ₹ {parseFloat(agingData.aging_31_60 || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">61-90 Days</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  ₹ {parseFloat(agingData.aging_61_90 || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">90+ Days</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  ₹ {parseFloat(agingData.aging_90_plus || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold mb-3 dark:text-dark-text">Outstanding by Aging</h4>
                {agingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={agingChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ₹${entry.value.toLocaleString('en-IN')}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {agingChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-dark-text-secondary">
                    No outstanding amounts
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 dark:text-dark-text">Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm dark:text-dark-text-secondary">Current Balance</span>
                    <span className="font-bold text-lg text-brand-red">
                      ₹ {parseFloat(agingData.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm dark:text-dark-text-secondary">Credit Limit</span>
                    <span className="font-medium dark:text-dark-text">
                      ₹ {parseFloat(agingData.credit_limit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm dark:text-dark-text-secondary">Pending Invoices</span>
                    <span className="font-medium dark:text-dark-text">{agingData.pending_invoices || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm dark:text-dark-text-secondary">Overdue Invoices</span>
                    <span className="font-medium text-red-600">{agingData.overdue_invoices || 0}</span>
                  </div>
                  {agingData.on_hold && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Credit limit exceeded — customer on hold
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default CustomerLedgerTab;
