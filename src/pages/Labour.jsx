import { useState, useEffect } from 'react';
import TabbedPage from '@/components/TabbedPage';
import LabourDetailsTab from './labour/LabourDetailsTab';
import LabourLedgerTab from './labour/LabourLedgerTab';
import LabourLedgerView from './labour/LabourLedgerView';
import useLabourStore from '@/store/labourStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

const LabourForm = ({ labour, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    labour || {
      name: '',
      phone: '',
      address: '',
      aadhaar_number: '',
      skill_type: '',
      hourly_rate: 0,
      daily_rate: 0,
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Employee name is required.');
      return;
    }
    if (!formData.daily_rate && !formData.hourly_rate) {
      toast.error('Either hourly rate or daily rate is required.');
      return;
    }
    try {
      await onSave(formData);
    } catch (error) {
      toast.error('Failed to save employee');
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
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
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
          Aadhaar Number
        </label>
        <input
          type="text"
          name="aadhaar_number"
          value={formData.aadhaar_number}
          onChange={handleChange}
          placeholder="XXXX XXXX XXXX"
          maxLength="14"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Skill/Trade
        </label>
        <input
          type="text"
          name="skill_type"
          value={formData.skill_type}
          onChange={handleChange}
          placeholder="e.g., Welder, Painter, Mechanic"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Hourly Rate (₹/hr)
          </label>
          <input
            type="number"
            name="hourly_rate"
            value={formData.hourly_rate}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="Per hour"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Daily Rate (₹/day) *
          </label>
          <input
            type="number"
            name="daily_rate"
            value={formData.daily_rate}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="Per day"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          />
        </div>
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

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {labour ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
};

const tabs = [
  { id: 'details', label: 'Employee Details', component: LabourDetailsTab },
  { id: 'attendance', label: 'Weekly Attendance Card', component: LabourLedgerTab },
];

const Labour = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addLabour, fetchLabour } = useLabourStore();

  useEffect(() => {
    fetchLabour();
  }, [fetchLabour]);

  const handleSave = async (labourData) => {
    try {
      await addLabour(labourData);
      toast.success('Employee added successfully!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to add employee');
      console.error('Error adding employee:', error);
    }
  };

  const headerActions = (
    <Button onClick={() => setIsModalOpen(true)}>
      <PlusCircle className="h-4 w-4 mr-2" />
      Add Employee
    </Button>
  );

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Employee"
      >
        <LabourForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <TabbedPage
        tabs={tabs}
        title="Employee Management"
        headerActions={headerActions}
      />
    </>
  );
};

export default Labour;
