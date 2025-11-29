import { useState } from 'react';
import useCustomerStore from '@/store/customerStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, UserCheck } from 'lucide-react';

const LeadForm = ({ lead, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
        lead || { name: '', phone: '', address: '', company: '', email: '', source: '', notes: '', vehicles: [] }
    );
    const [vehicleInput, setVehicleInput] = useState('');
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleAddVehicle = () => {
        if (vehicleInput.trim()) {
            setFormData(prev => ({
                ...prev,
                vehicles: [...(prev.vehicles || []), vehicleInput.trim()]
            }));
            setVehicleInput('');
        }
    };

    const handleRemoveVehicle = (index) => {
        setFormData(prev => ({
            ...prev,
            vehicles: prev.vehicles.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!formData.name || !formData.phone){
            toast.error("Lead name and phone are required.");
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
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Source</label>
                <select name="source" value={formData.source} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text">
                    <option value="">Select Source</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="social_media">Social Media</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="phone">Phone Call</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Vehicles</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={vehicleInput} 
                        onChange={(e) => setVehicleInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVehicle())}
                        placeholder="Vehicle Number (e.g., MP 09 HH 2550)"
                        className="flex-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" 
                    />
                    <Button type="button" onClick={handleAddVehicle}>Add</Button>
                </div>
                {formData.vehicles && formData.vehicles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {formData.vehicles.map((vehicle, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                                {vehicle}
                                <button type="button" onClick={() => handleRemoveVehicle(index)} className="hover:text-red-600">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full mt-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text" placeholder="Additional notes about this lead..." />
            </div>
            
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Lead</Button>
            </div>
        </form>
    )
}

const LeadsTab = () => {
    const { leads = [], addLead, updateLead, deleteLead, convertLeadToCustomer } = useCustomerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState(null);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [leadToConvert, setLeadToConvert] = useState(null);

    const handleAdd = () => {
        setEditingLead(null);
        setIsModalOpen(true);
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setIsModalOpen(true);
    };

    const handleSave = async (leadData) => {
        try {
            if (editingLead) {
                await updateLead({ ...editingLead, ...leadData });
                toast.success("Lead updated!");
            } else {
                await addLead(leadData);
                toast.success("New lead added!");
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to save lead");
        }
    };

    const handleDelete = (lead) => {
        setLeadToDelete(lead);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteLead(leadToDelete.id);
            toast.success(`Lead "${leadToDelete.name}" deleted.`);
            setIsDeleteModalOpen(false);
            setLeadToDelete(null);
        } catch (error) {
            toast.error("Failed to delete lead");
        }
    }

    const handleConvert = (lead) => {
        setLeadToConvert(lead);
        setIsConvertModalOpen(true);
    };

    const confirmConvert = async () => {
        try {
            await convertLeadToCustomer(leadToConvert.id);
            toast.success(`Lead "${leadToConvert.name}" converted to customer!`);
            setIsConvertModalOpen(false);
            setLeadToConvert(null);
        } catch (error) {
            toast.error("Failed to convert lead");
        }
    };

    return (
        <div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLead ? "Edit Lead" : "Add New Lead"}>
                <LeadForm lead={editingLead} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Lead"
                message={`Are you sure you want to delete ${leadToDelete?.name}? This action cannot be undone.`}
            />
            <ConfirmModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                onConfirm={confirmConvert}
                title="Convert to Customer"
                message={`Convert ${leadToConvert?.name} to a customer? This will move them to the Customer Details tab.`}
            />

            <div className="mb-4">
                <Button onClick={handleAdd}>Add Lead</Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm dark:text-dark-text-secondary">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                        <tr>
                            <th className="px-2 py-1">Name</th>
                            <th className="px-2 py-1">Company</th>
                            <th className="px-2 py-1">Phone</th>
                            <th className="px-2 py-1">Email</th>
                            <th className="px-2 py-1">Source</th>
                            <th className="px-2 py-1">Vehicles</th>
                            <th className="px-2 py-1 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? leads.map(lead => (
                            <tr key={lead.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/50">
                                <td className="px-2 py-0.5 font-medium dark:text-dark-text">{lead.name}</td>
                                <td className="px-2 py-0.5">{lead.company || '-'}</td>
                                <td className="px-2 py-0.5">{lead.phone}</td>
                                <td className="px-2 py-0.5">{lead.email || '-'}</td>
                                <td className="px-2 py-0.5 capitalize">{lead.source || '-'}</td>
                                <td className="px-2 py-0.5">
                                    {lead.vehicles && lead.vehicles.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {lead.vehicles.map((vehicle, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                                                    {vehicle}
                                                </span>
                                            ))}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-2 py-0.5 text-right space-x-1">
                                    <Button
                                        variant="ghost"
                                        className="p-1 h-auto"
                                        onClick={() => handleConvert(lead)}
                                        title="Convert to Customer"
                                    >
                                        <UserCheck className="h-4 w-4 text-green-600"/>
                                    </Button>
                                    <Button variant="ghost" className="p-1 h-auto" onClick={() => handleEdit(lead)}>
                                        <Edit className="h-4 w-4 text-blue-600"/>
                                    </Button>
                                    <Button variant="ghost" className="p-1 h-auto" onClick={() => handleDelete(lead)}>
                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                                    <p>No leads found.</p>
                                    <p className="text-xs mt-1">Click "Add Lead" to get started.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default LeadsTab;
