import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomerStore from '@/store/customerStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, Eye } from 'lucide-react';

const CustomerForm = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
        customer || { name: '', phone: '', address: '', gstin: '', company: '', credit_limit: 0, credit_days: 30 }
    );
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!formData.name || !formData.phone){
            toast.error("Customer name and phone are required.");
            return;
        }
        onSave(formData);
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" required />
            </div>
             <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
            </div>
             <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Phone *</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" required />
            </div>
             <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
            </div>
             <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">GSTIN</label>
                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Credit Limit (₹)</label>
                    <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Credit Days</label>
                    <input type="number" name="credit_days" value={formData.credit_days} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
                </div>
            </div>
             <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Customer</Button>
            </div>
        </form>
    )
}

const CustomerDetailsTab = () => {
    const navigate = useNavigate();
    const { customers, updateCustomer, deleteCustomer } = useCustomerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSave = async (customerData) => {
        try {
            await updateCustomer({ ...editingCustomer, ...customerData });
            toast.success("Customer updated!");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to update customer");
        }
    };

    const handleDelete = (customer) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteCustomer(customerToDelete.id);
            toast.success(`Customer "${customerToDelete.name}" deleted.`);
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
        } catch (error) {
            toast.error("Failed to delete customer");
        }
    }

    return (
        <div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Customer">
                <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
            />

             <div className="overflow-x-auto">
                <table className="w-full text-sm dark:text-dark-text-secondary">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Company</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2">Address</th>
                            <th className="p-2">GSTIN</th>
                            <th className="p-2 text-right">Credit Limit</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length > 0 ? customers.map(c => (
                            <tr key={c.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/50">
                                <td
                                    className="p-2 font-medium dark:text-dark-text cursor-pointer hover:text-brand-red transition-colors"
                                    onClick={() => navigate(`/customer/profile/${c.id}`)}
                                >
                                    {c.name}
                                </td>
                                <td className="p-2">{c.company || '-'}</td>
                                <td className="p-2">{c.phone}</td>
                                <td className="p-2">{c.address || '-'}</td>
                                <td className="p-2">{c.gstin || '-'}</td>
                                <td className="p-2 text-right">₹ {parseFloat(c.credit_limit || 0).toLocaleString('en-IN')}</td>
                                <td className="p-2 text-center">
                                    {c.on_hold ? (
                                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                            On Hold
                                        </span>
                                    ) : c.preferred ? (
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            Preferred
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="p-2 text-right space-x-1">
                                    <Button
                                        variant="ghost"
                                        className="p-1 h-auto"
                                        onClick={() => navigate(`/customer/profile/${c.id}`)}
                                        title="View Profile"
                                    >
                                        <Eye className="h-4 w-4 text-green-600"/>
                                    </Button>
                                    <Button variant="ghost" className="p-1 h-auto" onClick={() => handleEdit(c)}><Edit className="h-4 w-4 text-blue-600"/></Button>
                                     <Button variant="ghost" className="p-1 h-auto" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                </td>
                            </tr>
                        )) : (
                           <tr><td colSpan="8" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                                <p>No customers found.</p>
                                <p className="text-xs mt-1">Click "Add Customer" to get started.</p>
                           </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerDetailsTab;
