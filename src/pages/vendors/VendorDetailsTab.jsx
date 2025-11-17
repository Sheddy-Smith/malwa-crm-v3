import { useState, useEffect } from 'react';
import useVendorStore from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, Download, Printer, Search } from 'lucide-react';

const VendorForm = ({ vendor, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    vendor || {
      name: '',
      phone: '',
      company: '',
      address: '',
      gstin: '',
      vendor_type: '',
      credit_limit: 0,
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required.');
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
          Phone *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          required
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
          Vendor Type
        </label>
        <input
          type="text"
          name="vendor_type"
          value={formData.vendor_type}
          onChange={handleChange}
          placeholder="e.g., Parts Dealer, Painting"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          GSTIN
        </label>
        <input
          type="text"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          maxLength="15"
          placeholder="15 characters"
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
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
        />
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

const VendorDetailsTab = () => {
  const { vendors, fetchVendors, updateVendor, deleteVendor, loading } = useVendorStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleSave = async (vendorData) => {
    try {
      await updateVendor({ ...editingVendor, ...vendorData });
      toast.success('Vendor updated successfully!');
      setIsModalOpen(false);
      setEditingVendor(null);
    } catch (error) {
      toast.error('Failed to update vendor');
    }
  };

  const handleDelete = (vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteVendor(vendorToDelete.id);
      toast.success(`Vendor "${vendorToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setVendorToDelete(null);
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Company', 'Vendor Type', 'GSTIN', 'Current Balance', 'Credit Limit'];
    const csvContent = [
      headers.join(','),
      ...filteredVendors.map((v) =>
        [
          v.name,
          v.phone,
          v.company || '',
          v.vendor_type || '',
          v.gstin || '',
          v.current_balance || 0,
          v.credit_limit || 0,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Vendors exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone?.includes(searchTerm) ||
      v.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading vendors...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Vendor">
        <VendorForm
          vendor={editingVendor}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendorToDelete?.name}"? This action cannot be undone.`}
      />

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
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
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Balance</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">{v.name}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{v.phone}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{v.company || '-'}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{v.vendor_type || '-'}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-medium ${
                          parseFloat(v.current_balance || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        ₹{parseFloat(v.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleEdit(v)}>
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleDelete(v)}>
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
                      <p className="text-lg font-medium">No vendors found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search terms' : 'Add your first vendor to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredVendors.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredVendors.length} of {vendors.length} vendor(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default VendorDetailsTab;
