import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

const Gstledger = () => {
  const [entries, setEntries] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            GST Ledger
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => toast.info('Export feature - Coming Soon')}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => toast.info('Print feature - Coming Soon')}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Input GST</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹0.00</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Output GST</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹0.00</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Net GST</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹0.00</p>
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No GST entries found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            GST entries will appear here from your transactions
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Gstledger;
