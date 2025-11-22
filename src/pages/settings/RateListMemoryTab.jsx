import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, History, TrendingUp } from 'lucide-react';
import { dbOperations } from '@/lib/db';

const RateHistoryModal = ({ item, onClose, rateType }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [item]);

  const loadHistory = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      const allHistory = await dbOperations.getAll('rate_history') || [];
      const itemHistory = allHistory
        .filter(h => h.item_name === item.item_name && h.category_id === item.category_id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setHistory(itemHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load rate history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{item?.item_name} - Rate History</h3>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No rate history found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">{rateType === 'purchase' ? 'Vendor/Supplier' : 'Customer'}</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3">{new Date(record.date).toLocaleDateString('en-GB')}</td>
                  <td className="p-3">{record.vendor_name || '-'}</td>
                  <td className="p-3 text-right font-medium">₹{parseFloat(record.rate).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      record.source === 'purchase' ? 'bg-green-100 text-green-800' :
                      record.source === 'purchase_challan' ? 'bg-blue-100 text-blue-800' :
                      record.source === 'sell_invoice' ? 'bg-purple-100 text-purple-800' :
                      record.source === 'sell_challan' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.source === 'purchase' ? 'Purchase Invoice' :
                       record.source === 'purchase_challan' ? 'Purchase Challan' :
                       record.source === 'sell_invoice' ? 'Sell Invoice' :
                       record.source === 'sell_challan' ? 'Sell Challan' : 'Manual'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{record.reference_no || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

const ManualRateModal = ({ item, onClose, onSave, rateType }) => {
  const [formData, setFormData] = useState({
    vendor_name: '',
    rate: item?.current_rate || '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Manual {rateType === 'purchase' ? 'Purchase' : 'Sell'} Rate - {item?.item_name}</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">{rateType === 'purchase' ? 'Vendor/Supplier Name' : 'Customer Name'}</label>
        <input
          type="text"
          value={formData.vendor_name}
          onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          placeholder={rateType === 'purchase' ? 'Enter vendor name' : 'Enter customer name'}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Rate (₹) *</label>
        <input
          type="number"
          step="0.01"
          value={formData.rate}
          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          placeholder="Enter rate"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          rows="3"
          placeholder="Optional notes"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Rate</Button>
      </div>
    </form>
  );
};

const RateListMemoryTab = () => {
  const [rateList, setRateList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rateType, setRateType] = useState('purchase'); // 'purchase' or 'sell'
  const [categories, setCategories] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showManualRateModal, setShowManualRateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadCategories();
    loadRateList();
  }, [rateType]);

  const loadCategories = async () => {
    try {
      const data = await dbOperations.getAll('inventory_categories') || [];
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRateList = async () => {
    setLoading(true);
    try {
      const allHistory = await dbOperations.getAll('rate_history') || [];
      
      // Filter by rate type (purchase or sell)
      const filteredHistory = allHistory.filter(record => {
        if (rateType === 'purchase') {
          return record.source === 'purchase' || record.source === 'purchase_challan' || 
                 (record.source === 'manual' && record.rate_type === 'purchase');
        } else {
          return record.source === 'sell_invoice' || record.source === 'sell_challan' || 
                 (record.source === 'manual' && record.rate_type === 'sell');
        }
      });
      
      // Group by item_name and category_id to get latest rates
      const rateMap = new Map();
      
      filteredHistory.forEach(record => {
        const key = `${record.item_name}_${record.category_id}`;
        if (!rateMap.has(key)) {
          rateMap.set(key, {
            item_name: record.item_name,
            category_id: record.category_id,
            current_rate: record.rate,
            last_vendor: record.vendor_name,
            last_updated: record.date,
            last_source: record.source,
            history_count: 1
          });
        } else {
          const existing = rateMap.get(key);
          if (new Date(record.date) > new Date(existing.last_updated)) {
            existing.current_rate = record.rate;
            existing.last_vendor = record.vendor_name;
            existing.last_updated = record.date;
            existing.last_source = record.source;
          }
          existing.history_count++;
        }
      });
      
      const rateArray = Array.from(rateMap.values());
      setRateList(rateArray);
    } catch (error) {
      console.error('Error loading rate list:', error);
      toast.error('Failed to load rate list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualRate = async (formData) => {
    try {
      await dbOperations.insert('rate_history', {
        id: `rate_manual_${Date.now()}`,
        item_name: selectedItem.item_name,
        category_id: selectedItem.category_id,
        rate: parseFloat(formData.rate),
        vendor_name: formData.vendor_name || 'Manual Entry',
        source: 'manual',
        rate_type: rateType, // 'purchase' or 'sell'
        date: new Date().toISOString(),
        notes: formData.notes,
        created_at: new Date().toISOString()
      });
      
      toast.success('Manual rate added successfully');
      setShowManualRateModal(false);
      setSelectedItem(null);
      loadRateList();
    } catch (error) {
      console.error('Error adding manual rate:', error);
      toast.error('Failed to add manual rate');
    }
  };

  const filteredRateList = rateList.filter(item => {
    const matchesSearch = !searchTerm || 
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Rate List Memory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track {rateType === 'purchase' ? 'purchase' : 'selling'} rates from invoices, challans, and manual entries
            </p>
          </div>
          
          {/* Rate Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={rateType === 'purchase' ? 'primary' : 'secondary'}
              onClick={() => setRateType('purchase')}
            >
              Purchase Rates
            </Button>
            <Button
              variant={rateType === 'sell' ? 'primary' : 'secondary'}
              onClick={() => setRateType('sell')}
            >
              Sell Rates
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Rate List Table */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredRateList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No rate history found</p>
            <p className="text-sm mt-2">Rates will be automatically saved when you create purchase invoices or challans</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Item Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Current Rate (₹)</th>
                  <th className="p-3 text-left">{rateType === 'purchase' ? 'Last Vendor' : 'Last Customer'}</th>
                  <th className="p-3 text-left">Last Updated</th>
                  <th className="p-3 text-center">Records</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRateList.map((item, idx) => {
                  const category = categories.find(c => c.id === item.category_id);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-medium">{item.item_name}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        ₹{parseFloat(item.current_rate).toFixed(2)}
                      </td>
                      <td className="p-3">{item.last_vendor || '-'}</td>
                      <td className="p-3">{new Date(item.last_updated).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {item.history_count}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowHistoryModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowManualRateModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                            title="Add Manual Rate"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            How Rate List Memory Works
          </h4>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Rates are automatically saved when you create purchase invoices or purchase challans</li>
            <li>• Each item's rate history is tracked with vendor name, date, and source</li>
            <li>• You can add manual rates for items at any time</li>
            <li>• The current rate shows the most recent rate for each item</li>
            <li>• Click the history icon to view all past rates for an item</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedItem(null);
        }}
        size="xl"
        title="Rate History"
      >
        {selectedItem && (
          <RateHistoryModal
            item={selectedItem}
            rateType={rateType}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={showManualRateModal}
        onClose={() => {
          setShowManualRateModal(false);
          setSelectedItem(null);
        }}
        title="Add Manual Rate"
      >
        {selectedItem && (
          <ManualRateModal
            item={selectedItem}
            rateType={rateType}
            onClose={() => {
              setShowManualRateModal(false);
              setSelectedItem(null);
            }}
            onSave={handleAddManualRate}
          />
        )}
      </Modal>
    </Card>
  );
};

export default RateListMemoryTab;
