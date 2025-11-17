import { useState } from 'react';
import useCompanyStore from '@/store/companyStore';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { Building, Mail, Phone, Globe, MapPin, Banknote, Plus, Trash2, User } from 'lucide-react';

const CompanyMasterTab = () => {
    const { companyDetails, updateCompanyDetails, updateContactPerson, updateBankDetails, addService, removeService, addTermsCondition, removeTermsCondition } = useCompanyStore();
    const [formData, setFormData] = useState(companyDetails);
    const [newService, setNewService] = useState('');
    const [newTerm, setNewTerm] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleContactChange = (role, field, value) => {
        setFormData({
            ...formData,
            [role]: { ...formData[role], [field]: value }
        });
    };

    const handleBankChange = (field, value) => {
        setFormData({
            ...formData,
            bankDetails: { ...formData.bankDetails, [field]: value }
        });
    };

    const handleSave = () => {
        updateCompanyDetails(formData);
        toast.success('Company details updated successfully!');
    };

    const handleAddService = () => {
        if (newService.trim()) {
            addService(newService.trim());
            setNewService('');
            toast.success('Service added!');
        }
    };

    const handleAddTerm = () => {
        if (newTerm.trim()) {
            addTermsCondition(newTerm.trim());
            setNewTerm('');
            toast.success('Terms & Condition added!');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold dark:text-dark-text">Company Master Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your company information for documents</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5 text-brand-red" />
                    Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Company Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Industry</label>
                        <input
                            type="text"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Established Year</label>
                        <input
                            type="text"
                            name="established"
                            value={formData.established}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Business Type</label>
                        <input
                            type="text"
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">GSTIN *</label>
                        <input
                            type="text"
                            name="gstin"
                            value={formData.gstin}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Website</label>
                        <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand-red" />
                    Address Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Address Line *</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">City *</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">State *</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Pincode *</label>
                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Country</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-brand-red" />
                    Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Primary Phone *</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Primary Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Working Hours</label>
                        <input
                            type="text"
                            name="workingHours"
                            value={formData.workingHours}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Working Days</label>
                        <input
                            type="text"
                            name="workingDays"
                            value={formData.workingDays}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['director', 'projectManager', 'marketingManager'].map((role) => (
                    <div key={role} className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                        <h4 className="text-md font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-brand-red" />
                            {role === 'director' ? 'Director' : role === 'projectManager' ? 'Project Manager' : 'Marketing Manager'}
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Name</label>
                                <input
                                    type="text"
                                    value={formData[role]?.name || ''}
                                    onChange={(e) => handleContactChange(role, 'name', e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Phone</label>
                                <input
                                    type="text"
                                    value={formData[role]?.phone || ''}
                                    onChange={(e) => handleContactChange(role, 'phone', e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Email</label>
                                <input
                                    type="email"
                                    value={formData[role]?.email || ''}
                                    onChange={(e) => handleContactChange(role, 'email', e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-brand-red" />
                    Bank Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Bank Name</label>
                        <input
                            type="text"
                            value={formData.bankDetails?.bankName || ''}
                            onChange={(e) => handleBankChange('bankName', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Account Number</label>
                        <input
                            type="text"
                            value={formData.bankDetails?.accountNumber || ''}
                            onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">IFSC Code</label>
                        <input
                            type="text"
                            value={formData.bankDetails?.ifscCode || ''}
                            onChange={(e) => handleBankChange('ifscCode', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Account Holder Name</label>
                        <input
                            type="text"
                            value={formData.bankDetails?.accountHolderName || ''}
                            onChange={(e) => handleBankChange('accountHolderName', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-dark-text">Branch</label>
                        <input
                            type="text"
                            value={formData.bankDetails?.branch || ''}
                            onChange={(e) => handleBankChange('branch', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4">Services Offered</h4>
                <div className="space-y-2 mb-4">
                    {companyDetails.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm dark:text-dark-text">{service}</span>
                            <button
                                onClick={() => { removeService(index); toast.success('Service removed'); }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Add new service..."
                        className="flex-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                    />
                    <Button onClick={handleAddService}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-md font-bold dark:text-dark-text mb-4">Terms & Conditions</h4>
                <div className="space-y-2 mb-4">
                    {companyDetails.termsAndConditions.map((term, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm dark:text-dark-text">{term}</span>
                            <button
                                onClick={() => { removeTermsCondition(index); toast.success('Term removed'); }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        placeholder="Add new term..."
                        className="flex-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                    />
                    <Button onClick={handleAddTerm}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="px-8">Save All Changes</Button>
            </div>
        </div>
    );
};

export default CompanyMasterTab;
