import { useState, useEffect } from 'react';
import TabbedPage from '@/components/TabbedPage';
import VendorDetailsTab from './vendors/VendorDetailsTab';
import VendorLedgerTab from './vendors/VendorLedgerTab';
import useVendorStore from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

const VendorForm = ({ vendor, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    vendor || {
      name: '',
      phone: '',
      company: '',
      address: '',
      gstin: '',
      vendor_type: '',
      opening_balance: 0,
      credit_limit: 0,
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required.');
      return;
    }
    try {
      await onSave(formData);
    } catch (error) {
      toast.error('Failed to save vendor');
    }
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
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
          placeholder="e.g., Parts Dealer, Painting Specialist"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
          placeholder="15 characters"
          maxLength="15"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Opening Balance (₹)
          </label>
          <input
            type="number"
            name="opening_balance"
            value={formData.opening_balance}
            onChange={handleChange}
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
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
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {vendor ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  );
};

const tabs = [
  { id: 'details', label: 'Vendor Details', component: VendorDetailsTab },
  { id: 'ledger', label: 'Vendor Ledger', component: VendorLedgerTab },
];

const Vendors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addVendor, fetchVendors } = useVendorStore();

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSave = async (vendorData) => {
    try {
      await addVendor(vendorData);
      toast.success('Vendor added successfully!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to add vendor');
      console.error('Error adding vendor:', error);
    }
  };

  const headerActions = (
    <Button onClick={() => setIsModalOpen(true)}>
      <PlusCircle className="h-4 w-4 mr-2" />
      Add Vendor
    </Button>
  );

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Vendor"
      >
        <VendorForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <TabbedPage
        tabs={tabs}
        title="Vendor Management"
        headerActions={headerActions}
      />
    </>
  );
};

export default Vendors;
