import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Download, Printer, Search, AlertTriangle } from 'lucide-react';

const StockItemForm = ({ item, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    item || {
      code: '',
      name: '',
      category_id: '',
      unit: 'pcs',
      initial_stock: 0,
      reorder_level: 0,
      cost_price: 0,
      selling_price: 0,
      location: '',
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Item name is required.');
      return;
    }
    if (!formData.category_id) {
      toast.error('Category is required.');
      return;
    }
    if (!formData.unit) {
      toast.error('Unit is required.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Item Code
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Auto-generated if empty"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Item Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Category *
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Unit *
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          >
            <option value="pcs">Pieces (pcs)</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="ltr">Liter (ltr)</option>
            <option value="mtr">Meter (mtr)</option>
            <option value="box">Box</option>
            <option value="set">Set</option>
          </select>
        </div>
      </div>

      {!item && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Initial Stock Quantity
          </label>
          <input
            type="number"
            name="initial_stock"
            value={formData.initial_stock}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Opening stock quantity (will create a stock movement record)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Reorder Level
          </label>
          <input
            type="number"
            name="reorder_level"
            value={formData.reorder_level}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Warehouse A, Shelf 3"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Cost Price (₹)
          </label>
          <input
            type="number"
            name="cost_price"
            value={formData.cost_price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Selling Price (₹)
          </label>
          <input
            type="number"
            name="selling_price"
            value={formData.selling_price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{item ? 'Update Item' : 'Add Item'}</Button>
      </div>
    </form>
  );
};

const StockAdjustmentForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    adjustment_quantity: 0,
    adjustment_type: 'add',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(formData.adjustment_quantity) === 0) {
      toast.error('Adjustment quantity must be greater than 0.');
      return;
    }
    onSave(formData);
  };

  const newStock =
    formData.adjustment_type === 'add'
      ? parseFloat(item.current_stock || 0) + parseFloat(formData.adjustment_quantity || 0)
      : parseFloat(item.current_stock || 0) - parseFloat(formData.adjustment_quantity || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
          Current Stock: <span className="font-bold text-gray-900 dark:text-dark-text">{item.current_stock} {item.unit}</span>
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mt-1">
          Item: <span className="font-bold text-gray-900 dark:text-dark-text">{item.name}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Adjustment Type *
        </label>
        <select
          name="adjustment_type"
          value={formData.adjustment_type}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="add">Add Stock (Increase)</option>
          <option value="subtract">Remove Stock (Decrease)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Adjustment Quantity *
        </label>
        <input
          type="number"
          name="adjustment_quantity"
          value={formData.adjustment_quantity}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Notes/Reason
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="e.g., Stock take adjustment, Damaged items"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
          New Stock After Adjustment: <span className={`font-bold ${newStock >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {newStock.toFixed(2)} {item.unit}
          </span>
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Apply Adjustment</Button>
      </div>
    </form>
  );
};

const StockTab = () => {
  const [stockItems, setStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchCategories();
    fetchStockItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchStockItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories(id, name)
        `)
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      const initialStock = parseFloat(itemData.initial_stock || 0);
      delete itemData.initial_stock;

      const { data: newItem, error: itemError } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single();

      if (itemError) throw itemError;

      if (initialStock > 0) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            item_id: newItem.id,
            movement_type: 'in',
            quantity: initialStock,
            movement_date: new Date().toISOString().split('T')[0],
            reference_type: 'opening',
            reference_no: 'OPENING',
            notes: 'Opening stock',
          }]);

        if (movementError) throw movementError;
      }

      toast.success('Stock item added successfully!');
      setIsModalOpen(false);
      fetchStockItems();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add stock item');
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Stock item updated successfully!');
      setIsModalOpen(false);
      setEditingItem(null);
      fetchStockItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update stock item');
    }
  };

  const handleStockAdjustment = async (adjustmentData) => {
    try {
      const quantity = parseFloat(adjustmentData.adjustment_quantity);
      const movementType = adjustmentData.adjustment_type === 'add' ? 'in' : 'out';

      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: adjustingItem.id,
          movement_type: movementType,
          quantity: quantity,
          movement_date: new Date().toISOString().split('T')[0],
          reference_type: 'adjustment',
          reference_no: `ADJ-${Date.now()}`,
          notes: adjustmentData.notes || 'Manual stock adjustment',
        }]);

      if (error) throw error;

      toast.success('Stock adjustment applied successfully!');
      setIsAdjustmentModalOpen(false);
      setAdjustingItem(null);
      fetchStockItems();
    } catch (error) {
      console.error('Error applying adjustment:', error);
      toast.error('Failed to apply stock adjustment');
    }
  };

  const handleDeleteItem = async () => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success(`"${itemToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchStockItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. It may be referenced in transactions.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Cost Price', 'Selling Price', 'Valuation', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map((item) =>
        [
          item.code || '',
          item.name,
          item.category?.name || '',
          item.current_stock || 0,
          item.unit,
          item.reorder_level || 0,
          item.cost_price || 0,
          item.selling_price || 0,
          (parseFloat(item.current_stock || 0) * parseFloat(item.cost_price || 0)).toFixed(2),
          item.location || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_list_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Stock list exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category_id === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && parseFloat(item.current_stock || 0) <= parseFloat(item.reorder_level || 0)) ||
      (stockFilter === 'zero' && parseFloat(item.current_stock || 0) === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValuation = filteredItems.reduce(
    (sum, item) => sum + parseFloat(item.current_stock || 0) * parseFloat(item.cost_price || 0),
    0
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading stock items...</span>
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
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
      >
        <StockItemForm
          item={editingItem}
          categories={categories}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setAdjustingItem(null);
        }}
        title="Stock Adjustment"
      >
        {adjustingItem && (
          <StockAdjustmentForm
            item={adjustingItem}
            onSave={handleStockAdjustment}
            onCancel={() => {
              setIsAdjustmentModalOpen(false);
              setAdjustingItem(null);
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Stock Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">Stock List</h3>
          <Button
            onClick={() => {
              if (categories.length === 0) {
                toast.error('Please add categories first in the "Manage Categories" tab');
                return;
              }
              setIsModalOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Stock Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock (Below Reorder)</option>
            <option value="zero">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Total Valuation: <span className="font-bold text-green-600 dark:text-green-400">
              ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Item Code</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Item Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Current Stock</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Reorder Level</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Cost Price</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Valuation</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isLowStock = parseFloat(item.current_stock || 0) <= parseFloat(item.reorder_level || 0);
                  const isOutOfStock = parseFloat(item.current_stock || 0) === 0;
                  const valuation = parseFloat(item.current_stock || 0) * parseFloat(item.cost_price || 0);

                  return (
                    <tr
                      key={item.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                        {item.code || '-'}
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-dark-text">
                        {item.name}
                        {isOutOfStock && (
                          <AlertTriangle className="inline h-4 w-4 ml-2 text-red-500" title="Out of Stock" />
                        )}
                        {!isOutOfStock && isLowStock && (
                          <AlertTriangle className="inline h-4 w-4 ml-2 text-orange-500" title="Low Stock" />
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {item.category?.name || '-'}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-medium ${isOutOfStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-dark-text'}`}>
                        {parseFloat(item.current_stock || 0).toFixed(2)} {item.unit}
                      </td>
                      <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                        {parseFloat(item.reorder_level || 0).toFixed(2)} {item.unit}
                      </td>
                      <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                        ₹{parseFloat(item.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">
                        ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button
                            variant="ghost"
                            className="p-2 h-auto"
                            onClick={() => {
                              setAdjustingItem(item);
                              setIsAdjustmentModalOpen(true);
                            }}
                            title="Adjust Stock"
                          >
                            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Adjust</span>
                          </Button>
                          <Button
                            variant="ghost"
                            className="p-2 h-auto"
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="p-2 h-auto"
                            onClick={() => {
                              setItemToDelete(item);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-12">
                    <div className="flex flex-col items-center text-gray-500 dark:text-dark-text-secondary">
                      <p className="text-lg font-medium">No stock items found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || categoryFilter || stockFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add your first stock item to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredItems.length} of {stockItems.length} item(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockTab;
