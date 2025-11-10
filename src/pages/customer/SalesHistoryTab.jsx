import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Download, Filter } from 'lucide-react';

const SalesHistoryTab = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchInvoices();
    }
  }, [selectedCustomerId, startDate, endDate, statusFilter]);

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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .order('invoice_date', { ascending: false });

      if (startDate) query = query.gte('invoice_date', startDate);
      if (endDate) query = query.lte('invoice_date', endDate);
      if (statusFilter !== 'all') query = query.eq('payment_status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;

    const term = searchTerm.toLowerCase();
    return invoices.filter(inv =>
      inv.invoice_no?.toLowerCase().includes(term) ||
      inv.total_amount?.toString().includes(term)
    );
  }, [invoices, searchTerm]);

  const totals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => ({
        total: acc.total + parseFloat(inv.total_amount || 0),
        paid: acc.paid + parseFloat(inv.paid_amount || 0),
        outstanding: acc.outstanding + (parseFloat(inv.total_amount || 0) - parseFloat(inv.paid_amount || 0)),
      }),
      { total: 0, paid: 0, outstanding: 0 }
    );
  }, [filteredInvoices]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Sales History Report'],
      [`Customer: ${customers.find(c => c.id === selectedCustomerId)?.name || ''}`],
      [`Period: ${startDate || 'Start'} to ${endDate || 'End'}`],
      [],
      ['Invoice No', 'Date', 'Total Amount', 'Paid Amount', 'Outstanding', 'Status'],
    ];

    filteredInvoices.forEach(inv => {
      csvRows.push([
        inv.invoice_no,
        new Date(inv.invoice_date).toLocaleDateString('en-IN'),
        inv.total_amount,
        inv.paid_amount,
        parseFloat(inv.total_amount) - parseFloat(inv.paid_amount),
        inv.payment_status,
      ]);
    });

    csvRows.push([]);
    csvRows.push(['', 'Totals:', totals.total.toFixed(2), totals.paid.toFixed(2), totals.outstanding.toFixed(2), '']);

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-history-${Date.now()}.csv`;
    link.click();

    toast.success('Sales history exported successfully');
  };

  return (
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
              <option value="">Select a customer...</option>
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
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-dark-text">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {selectedCustomerId && (
          <>
            <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by invoice no or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text"
                />
              </div>

              <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                Loading invoices...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Invoiced</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      ₹ {totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Paid</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      ₹ {totals.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      ₹ {totals.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border dark:border-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="p-3 text-left border dark:border-gray-600">Invoice No</th>
                        <th className="p-3 text-left border dark:border-gray-600">Date</th>
                        <th className="p-3 text-right border dark:border-gray-600">Total Amount</th>
                        <th className="p-3 text-right border dark:border-gray-600">Paid Amount</th>
                        <th className="p-3 text-right border dark:border-gray-600">Outstanding</th>
                        <th className="p-3 text-left border dark:border-gray-600">Due Date</th>
                        <th className="p-3 text-center border dark:border-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                            No invoices found
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => {
                          const outstanding = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
                          return (
                            <tr key={invoice.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3 border dark:border-gray-600 font-medium text-blue-600 dark:text-blue-400">
                                {invoice.invoice_no}
                              </td>
                              <td className="p-3 border dark:border-gray-600 dark:text-dark-text">
                                {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                                ₹ {parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                                ₹ {parseFloat(invoice.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right border dark:border-gray-600 font-medium text-brand-red">
                                ₹ {outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 border dark:border-gray-600 dark:text-dark-text">
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '-'}
                              </td>
                              <td className="p-3 text-center border dark:border-gray-600">
                                {getStatusBadge(invoice.payment_status)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredInvoices.length > 0 && (
                      <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                        <tr>
                          <td colSpan="2" className="p-3 border dark:border-gray-600 text-right dark:text-dark-text">
                            Totals:
                          </td>
                          <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                            ₹ {totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                            ₹ {totals.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right border dark:border-gray-600 text-brand-red">
                            ₹ {totals.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2" className="p-3 border dark:border-gray-600"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default SalesHistoryTab;
