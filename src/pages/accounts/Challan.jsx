import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Download, Printer, Search, TruckIcon } from 'lucide-react';

const ChallanForm = ({ challan, suppliers, inventoryItems, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    challan || {
      challan_no: '',
      challan_date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      item_id: '',
      quantity: 0,
      rate: 0,
      source: '',
      vehicle_no: '',
      payment_status: 'pending',
      notes: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.challan_no) {
      toast.error('Challan number is required');
      return;
    }
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }
    if (!formData.item_id) {
      toast.error('Please select an item');
      return;
    }
    if (parseFloat(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (parseFloat(formData.rate) <= 0) {
      toast.error('Rate must be greater than 0');
      return;
    }

    const amount = parseFloat(formData.quantity) * parseFloat(formData.rate);
    onSave({ ...formData, amount });
  };

  const amount = parseFloat(formData.quantity || 0) * parseFloat(formData.rate || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Challan No *
          </label>
          <input
            type="text"
            name="challan_no"
            value={formData.challan_no}
            onChange={handleChange}
            placeholder="e.g., CH-001"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Challan Date *
          </label>
          <input
            type="date"
            name="challan_date"
            value={formData.challan_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Supplier *
        </label>
        <select
          name="supplier_id"
          value={formData.supplier_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="">Select Supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name} {supplier.company ? `(${supplier.company})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Item *
        </label>
        <select
          name="item_id"
          value={formData.item_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="">Select Item</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.item_name || item.name} ({item.unit})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Rate per Unit (₹) *
          </label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
          Total Amount: <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Source/Location
          </label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="e.g., Warehouse A"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Vehicle Number
          </label>
          <input
            type="text"
            name="vehicle_no"
            value={formData.vehicle_no}
            onChange={handleChange}
            placeholder="e.g., MH12AB1234"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Payment Status
        </label>
        <select
          name="payment_status"
          value={formData.payment_status}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Additional notes..."
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{challan ? 'Update Challan' : 'Save Challan'}</Button>
      </div>
    </form>
  );
};

const Challan = () => {
  const [challans, setChallans] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchInventoryItems();
    fetchChallans();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, company')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, item_name, name, unit')
        .order('item_name');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast.error('Failed to load inventory items');
    }
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_challans')
        .select(`
          *,
          supplier:suppliers(id, name, company),
          item:inventory_items(id, item_name, name, unit)
        `)
        .order('challan_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallans(data || []);
    } catch (error) {
      console.error('Error fetching challans:', error);
      toast.error('Failed to load purchase challans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChallan = async (challanData) => {
    try {
      const { error } = await supabase
        .from('purchase_challans')
        .insert([challanData]);

      if (error) throw error;

      toast.success('Purchase challan created successfully!');
      setIsModalOpen(false);
      fetchChallans();
    } catch (error) {
      console.error('Error adding challan:', error);
      toast.error('Failed to create purchase challan');
    }
  };

  const handleUpdateChallan = async (challanData) => {
    try {
      const { error } = await supabase
        .from('purchase_challans')
        .update(challanData)
        .eq('id', editingChallan.id);

      if (error) throw error;

      toast.success('Purchase challan updated successfully!');
      setIsModalOpen(false);
      setEditingChallan(null);
      fetchChallans();
    } catch (error) {
      console.error('Error updating challan:', error);
      toast.error('Failed to update purchase challan');
    }
  };

  const handleDeleteChallan = async () => {
    try {
      const { error } = await supabase
        .from('purchase_challans')
        .delete()
        .eq('id', challanToDelete.id);

      if (error) throw error;

      toast.success('Purchase challan deleted successfully');
      setIsDeleteModalOpen(false);
      setChallanToDelete(null);
      fetchChallans();
    } catch (error) {
      console.error('Error deleting challan:', error);
      toast.error('Failed to delete purchase challan');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Challan No',
      'Date',
      'Supplier',
      'Item',
      'Quantity',
      'Rate',
      'Amount',
      'Source',
      'Vehicle No',
      'Payment Status',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredChallans.map((challan) =>
        [
          challan.challan_no,
          challan.challan_date,
          challan.supplier?.name || '',
          challan.item?.item_name || challan.item?.name || '',
          challan.quantity,
          challan.rate,
          challan.amount,
          challan.source || '',
          challan.vehicle_no || '',
          challan.payment_status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_challans_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Purchase challans exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredChallans = challans.filter((challan) => {
    const matchesSearch =
      challan.challan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.item?.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.item?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || challan.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading purchase challans...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChallan(null);
        }}
        title={editingChallan ? 'Edit Purchase Challan' : 'Add Purchase Challan'}
      >
        <ChallanForm
          challan={editingChallan}
          suppliers={suppliers}
          inventoryItems={inventoryItems}
          onSave={editingChallan ? handleUpdateChallan : handleAddChallan}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingChallan(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteChallan}
        title="Delete Purchase Challan"
        message={`Are you sure you want to delete challan "${challanToDelete?.challan_no}"? This action cannot be undone.`}
      />

      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">Purchase Challans</h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
              Track delivery challans received from suppliers
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Challan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by challan no, supplier, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Challan No</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Item</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Quantity</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Rate</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Amount</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.length > 0 ? (
                filteredChallans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {challan.challan_no}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {new Date(challan.challan_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      <div>
                        <div className="font-medium">{challan.supplier?.name}</div>
                        {challan.supplier?.company && (
                          <div className="text-xs text-gray-500">{challan.supplier.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {challan.item?.item_name || challan.item?.name}
                    </td>
                    <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                      {parseFloat(challan.quantity).toFixed(2)} {challan.item?.unit}
                    </td>
                    <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                      ₹{parseFloat(challan.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900 dark:text-dark-text">
                      ₹{parseFloat(challan.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          challan.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : challan.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {challan.payment_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setEditingChallan(challan);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setChallanToDelete(challan);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center p-12">
                    <div className="flex flex-col items-center text-gray-500 dark:text-dark-text-secondary">
                      <TruckIcon className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No purchase challans found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter
                          ? 'Try adjusting your filters'
                          : 'Add your first purchase challan to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredChallans.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredChallans.length} of {challans.length} challan(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default Challan;
