import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import useCustomerStore from '@/store/customerStore';
import { Edit } from 'lucide-react';

const EditProfileForm = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    company: customer.company || '',
    phone: customer.phone || '',
    address: customer.address || '',
    gstin: customer.gstin || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <label className="block text-sm font-medium dark:text-dark-text mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium dark:text-dark-text mb-1">
          Company
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div>
        <label className="block text-sm font-medium dark:text-dark-text mb-1">
          Phone *
        </label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium dark:text-dark-text mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div>
        <label className="block text-sm font-medium dark:text-dark-text mb-1">
          GSTIN
        </label>
        <input
          type="text"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

const ProfileDetailsTab = ({ customer }) => {
  const { updateCustomer } = useCustomerStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = (updatedData) => {
    updateCustomer({ ...customer, ...updatedData });
    toast.success('Customer profile updated successfully!');
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Profile"
      >
        <EditProfileForm
          customer={customer}
          onSave={handleSave}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      <Card>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold dark:text-dark-text">Customer Details</h3>
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Name
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              {customer.name || '-'}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Company
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              {customer.company || '-'}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Phone
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              {customer.phone || '-'}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              GST Number
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              {customer.gstin || '-'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Address
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              {customer.address || '-'}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Opening Balance
            </label>
            <p className="text-lg font-medium dark:text-dark-text mt-1">
              ₹ {customer.opening_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Current Balance
            </label>
            <p className="text-lg font-bold text-brand-red mt-1">
              ₹ {customer.current_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ProfileDetailsTab;
