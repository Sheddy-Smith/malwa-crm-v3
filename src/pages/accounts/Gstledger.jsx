import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { Download, Printer, Search, FileText, ChevronDown, ChevronRight } from 'lucide-react';

const GSTLedger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => {
    fetchGSTEntries();
  }, []);

  const fetchGSTEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gst_ledger')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching GST entries:', error);
      toast.error('Failed to load GST ledger');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.document_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || entry.transaction_type === typeFilter;
    const matchesEntryType = !entryTypeFilter || entry.entry_type === entryTypeFilter;
    return matchesSearch && matchesType && matchesEntryType;
  });

  const groupedByMonth = filteredEntries.reduce((acc, entry) => {
    const month = entry.transaction_date ? entry.transaction_date.slice(0, 7) : 'Unknown';
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(entry);
    return acc;
  }, {});

  const calculateMonthTotals = (monthEntries) => {
    return monthEntries.reduce(
      (totals, entry) => {
        totals.taxable += parseFloat(entry.taxable_amount || 0);
        totals.cgst += parseFloat(entry.cgst_amount || 0);
        totals.sgst += parseFloat(entry.sgst_amount || 0);
        totals.igst += parseFloat(entry.igst_amount || 0);
        totals.total += parseFloat(entry.total_gst || 0);

        if (entry.entry_type === 'input_credit') {
          totals.inputCredit += parseFloat(entry.total_gst || 0);
        } else if (entry.entry_type === 'output_tax') {
          totals.outputTax += parseFloat(entry.total_gst || 0);
        }

        return totals;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, inputCredit: 0, outputTax: 0 }
    );
  };

  const calculateGrandTotals = () => {
    return filteredEntries.reduce(
      (totals, entry) => {
        totals.taxable += parseFloat(entry.taxable_amount || 0);
        totals.cgst += parseFloat(entry.cgst_amount || 0);
        totals.sgst += parseFloat(entry.sgst_amount || 0);
        totals.igst += parseFloat(entry.igst_amount || 0);
        totals.total += parseFloat(entry.total_gst || 0);

        if (entry.entry_type === 'input_credit') {
          totals.inputCredit += parseFloat(entry.total_gst || 0);
        } else if (entry.entry_type === 'output_tax') {
          totals.outputTax += parseFloat(entry.total_gst || 0);
        }

        return totals;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, inputCredit: 0, outputTax: 0 }
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Document No',
      'Party Name',
      'Taxable Amount',
      'CGST',
      'SGST',
      'IGST',
      'Total GST',
      'Entry Type',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map((entry) =>
        [
          entry.transaction_date,
          entry.transaction_type,
          entry.document_no,
          entry.party_name,
          entry.taxable_amount,
          entry.cgst_amount,
          entry.sgst_amount,
          entry.igst_amount,
          entry.total_gst,
          entry.entry_type,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('GST Ledger exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const grandTotals = calculateGrandTotals();
  const netGSTLiability = grandTotals.outputTax - grandTotals.inputCredit;

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading GST ledger...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-2">GST Ledger</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Consolidated view of all GST transactions (read-only)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by document no or party name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="sale">Sale</option>
          </select>

          <select
            value={entryTypeFilter}
            onChange={(e) => setEntryTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Entry Types</option>
            <option value="input_credit">Input Credit</option>
            <option value="output_tax">Output Tax</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Input Credit</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₹{grandTotals.inputCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Output Tax</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ₹{grandTotals.outputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total GST</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              ₹{grandTotals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              netGSTLiability >= 0
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-green-50 dark:bg-green-900/20'
            }`}
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net GST Liability</p>
            <p
              className={`text-lg font-bold ${
                netGSTLiability >= 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              ₹{Math.abs(netGSTLiability).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 mb-4">
          <Button variant="secondary" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="space-y-4">
          {Object.keys(groupedByMonth).length > 0 ? (
            Object.keys(groupedByMonth)
              .sort()
              .reverse()
              .map((month) => {
                const monthEntries = groupedByMonth[month];
                const monthTotals = calculateMonthTotals(monthEntries);
                const isExpanded = expandedMonth === month;

                return (
                  <div key={month} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMonth(isExpanded ? null : month)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-dark-text">
                            {new Date(month + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {monthEntries.length} transaction(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <div className="text-right">
                          <p className="text-gray-600 dark:text-gray-400">Input Credit</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            ₹{monthTotals.inputCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 dark:text-gray-400">Output Tax</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            ₹{monthTotals.outputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 dark:text-gray-400">Net</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            ₹
                            {(monthTotals.outputTax - monthTotals.inputCredit).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-700 text-left">
                            <tr>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Document No</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Party</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                                Taxable
                              </th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">CGST</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">SGST</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">IGST</th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                                Total GST
                              </th>
                              <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Entry Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthEntries.map((entry) => (
                              <tr
                                key={entry.id}
                                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                                  {new Date(entry.transaction_date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      entry.transaction_type === 'purchase'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }`}
                                  >
                                    {entry.transaction_type?.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                                  {entry.document_no}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                                  {entry.party_name}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                                  ₹{parseFloat(entry.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                                  ₹{parseFloat(entry.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                                  ₹{parseFloat(entry.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                                  ₹{parseFloat(entry.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right font-medium text-gray-900 dark:text-dark-text">
                                  ₹{parseFloat(entry.total_gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      entry.entry_type === 'input_credit'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    }`}
                                  >
                                    {entry.entry_type === 'input_credit' ? 'INPUT' : 'OUTPUT'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center p-12 border border-gray-200 dark:border-gray-700 rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium text-gray-500 dark:text-dark-text-secondary">
                No GST entries found
              </p>
              <p className="text-sm mt-1 text-gray-400">
                {searchTerm || typeFilter || entryTypeFilter
                  ? 'Try adjusting your filters'
                  : 'GST entries will appear here when you create purchase or sales invoices'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GSTLedger;
