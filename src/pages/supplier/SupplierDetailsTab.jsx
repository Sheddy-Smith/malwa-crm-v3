import { useState, useEffect } from 'react';
import useSupplierStore from '@/store/supplierStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, Download, Printer, Search } from 'lucide-react';
import { dbOperations } from '@/lib/db';

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    supplier || {
      name: '',
      phone: '',
      company: '',
      category: '',
      address: '',
      gstin: '',
      credit_limit: 0,
    }
  );
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await dbOperations.getAll('inventory_categories');
        const sorted = (data || []).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setCategories(sorted);
        // Set first category as default if no category selected and not editing
        if (!supplier && sorted.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: sorted[0].name }));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Supplier name is required.');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Company
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="2"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            GSTIN
          </label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="15 characters"
            maxLength="15"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Credit Limit (₹)
          </label>
          <input
            type="number"
            name="credit_limit"
            value={formData.credit_limit}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

const SupplierDetailsTab = () => {
  const { suppliers, fetchSuppliers, updateSupplier, deleteSupplier, loading } = useSupplierStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchSuppliers();
    loadCategories();
  }, [fetchSuppliers]);

  const loadCategories = async () => {
    try {
      const data = await dbOperations.getAll('inventory_categories');
      const sorted = (data || []).sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setCategories(sorted);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async (supplierData) => {
    try {
      await updateSupplier({ ...editingSupplier, ...supplierData });
      toast.success('Supplier updated successfully!');
      setIsModalOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      toast.error('Failed to update supplier');
    }
  };

  const handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSupplier(supplierToDelete.id);
      toast.success(`Supplier "${supplierToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Company', 'Category', 'GSTIN', 'Credit Limit', 'Current Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredSuppliers.map((s) =>
        [
          s.name,
          s.phone || '',
          s.company || '',
          s.category || '',
          s.gstin || '',
          s.credit_limit || 0,
          s.current_balance || 0,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Supplier list exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm) ||
      s.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading suppliers...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Supplier">
        <SupplierForm
          supplier={editingSupplier}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? This action cannot be undone.`}
      />

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, company, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
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
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Company</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Balance</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">{s.name}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{s.phone || '-'}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{s.company || '-'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-medium ${
                          parseFloat(s.current_balance || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        ₹{parseFloat(s.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleEdit(s)}>
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleDelete(s)}>
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-12">
                    <div className="flex flex-col items-center text-gray-500 dark:text-dark-text-secondary">
                      <p className="text-lg font-medium">No suppliers found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || categoryFilter
                          ? 'Try adjusting your filters'
                          : 'Add your first supplier to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredSuppliers.length} of {suppliers.length} supplier(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default SupplierDetailsTab;
