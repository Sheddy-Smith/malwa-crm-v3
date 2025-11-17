import { useState, useEffect } from 'react';
import useLabourStore from '@/store/labourStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, Download, Printer, Search } from 'lucide-react';

const LabourForm = ({ labour, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    labour || {
      name: '',
      phone: '',
      skill_type: '',
      daily_rate: 0,
      address: '',
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.daily_rate) {
      toast.error('Name and Rate are required.');
      return;
    }
    if (!formData.skill_type) {
      toast.error('Skill/Trade is required.');
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
          Skill/Trade *
        </label>
        <input
          type="text"
          name="skill_type"
          value={formData.skill_type}
          onChange={handleChange}
          placeholder="e.g., Welder, Painter, Mechanic"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Rate (₹ per day/hr) *
        </label>
        <input
          type="number"
          name="daily_rate"
          value={formData.daily_rate}
          onChange={handleChange}
          step="0.01"
          min="0"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red focus:border-transparent"
          required
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

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

const LabourDetailsTab = () => {
  const { labour: labours, fetchLabour, updateLabour, deleteLabour, loading } = useLabourStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabour, setEditingLabour] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [labourToDelete, setLabourToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLabour();
  }, [fetchLabour]);

  const handleEdit = (labour) => {
    setEditingLabour(labour);
    setIsModalOpen(true);
  };

  const handleSave = async (labourData) => {
    try {
      await updateLabour({ ...editingLabour, ...labourData });
      toast.success('Labour updated successfully!');
      setIsModalOpen(false);
      setEditingLabour(null);
    } catch (error) {
      toast.error('Failed to update labour');
    }
  };

  const handleDelete = (labour) => {
    setLabourToDelete(labour);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteLabour(labourToDelete.id);
      toast.success(`Labour "${labourToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setLabourToDelete(null);
    } catch (error) {
      toast.error('Failed to delete labour');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Skill/Trade', 'Daily Rate', 'Current Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredLabours.map((l) =>
        [
          l.name,
          l.phone || '',
          l.skill_type || '',
          l.daily_rate || 0,
          l.current_balance || 0,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labour_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Labour list exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredLabours = (labours || []).filter(
    (l) =>
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm) ||
      l.skill_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading labour records...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Labour">
        <LabourForm
          labour={editingLabour}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Labour"
        message={`Are you sure you want to delete "${labourToDelete?.name}"? This action cannot be undone.`}
      />

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or skill..."
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
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Skill/Role</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Rate (₹)</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Balance</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabours.length > 0 ? (
                filteredLabours.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">{l.name}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{l.phone || '-'}</td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{l.skill_type || '-'}</td>
                    <td className="p-3 text-right text-gray-900 dark:text-dark-text font-medium">
                      ₹{parseFloat(l.daily_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-medium ${
                          parseFloat(l.current_balance || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        ₹{parseFloat(l.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleEdit(l)}>
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleDelete(l)}>
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
                      <p className="text-lg font-medium">No labour records found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search terms' : 'Add your first labour record to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredLabours.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredLabours.length} of {labours.length} labour record(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default LabourDetailsTab;
