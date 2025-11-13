import { useState, useEffect } from 'react';
import TabbedPage from '@/components/TabbedPage';
import CustomerDetailsTab from './customer/CustomerDetailsTab';
import CustomerLedgerTab from './customer/CustomerLedgerTab';
import SalesHistoryTab from './customer/SalesHistoryTab';
import Button from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import useCustomerStore from '@/store/customerStore';
import { toast } from 'sonner';

const CustomerForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        address: '',
        gstin: '',
        credit_limit: 0,
        credit_days: 30,
        opening_balance: 0
    });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!formData.name || !formData.phone) return toast.error("Name and Phone are required.");
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Name *</label>
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
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Company</label>
                <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Phone *</label>
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
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Address</label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">GSTIN</label>
                <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Credit Limit (₹)</label>
                    <input
                        type="number"
                        name="credit_limit"
                        value={formData.credit_limit}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Credit Days</label>
                    <input
                        type="number"
                        name="credit_days"
                        value={formData.credit_days}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Opening Balance (₹)</label>
                <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                    Enter positive value if customer owes you money
                </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Customer</Button>
            </div>
        </form>
    );
};

const tabs = [
  { id: 'details', label: 'Customer Details', component: CustomerDetailsTab },
  { id: 'ledger', label: 'Customer Ledger', component: CustomerLedgerTab },
  { id: 'sales', label: 'Sales History', component: SalesHistoryTab },
];

const Customer = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addCustomer, fetchCustomers } = useCustomerStore();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSave = async (data) => {
        try {
            await addCustomer(data);
            toast.success("New customer added successfully!");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to add customer");
        }
    };
    const headerActions = (
        <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Add Customer</Button>
    );

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer">
                <CustomerForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <TabbedPage tabs={tabs} title="Customer Management" headerActions={headerActions} />
        </>
    );
};
export default Customer;




// // src/store/customerStore.js
// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { v4 as uuidv4 } from 'uuid';

// const useCustomerStore = create(
//   persist(
//     (set, get) => ({ // Add 'get' here to read state inside actions
//       customers: [],
//       addCustomer: (customer) => set((state) => ({
//         customers: [...state.customers, { id: uuidv4(), ledger: [], ...customer }], // Initialize ledger array
//       })),
//       updateCustomer: (updatedCustomer) => set((state) => ({
//         customers: state.customers.map((c) => c.id === updatedCustomer.id ? updatedCustomer : c),
//       })),
//       deleteCustomer: (customerId) => set((state) => ({
//         customers: state.customers.filter((c) => c.id !== customerId),
//       })),

//       // --- New Function for Ledger ---
//       addLedgerEntry: (customerId, entry) => set((state) => {
//         const customers = state.customers.map(customer => {
//           if (customer.id === customerId) {
//             // Add entry and sort ledger by date (newest first for running balance calculation later)
//             const updatedLedger = [...customer.ledger, { ...entry, entryId: uuidv4(), date: entry.date || new Date().toISOString() }]
//               .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first initially

//             // Recalculate running balances (start from oldest)
//             let currentBalance = 0;
//             const ledgerWithBalance = updatedLedger.reverse().map(e => { // Reverse to calculate from oldest
//               const debit = parseFloat(e.debit || 0);
//               const credit = parseFloat(e.credit || 0);
//               currentBalance += (debit - credit);
//               return { ...e, balance: currentBalance };
//             }).reverse(); // Reverse back to newest first for display

//             return { ...customer, ledger: ledgerWithBalance };
//           }
//           return customer;
//         });
//         return { customers };
//       }),
//       // --- (Optional) Function to delete a ledger entry ---
//       deleteLedgerEntry: (customerId, entryId) => set((state) => {
//          const customers = state.customers.map(customer => {
//            if (customer.id === customerId) {
//               const updatedLedger = customer.ledger.filter(e => e.entryId !== entryId)
//                  .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort

//               // Recalculate balances
//                let currentBalance = 0;
//                const ledgerWithBalance = updatedLedger.reverse().map(e => {
//                  const debit = parseFloat(e.debit || 0);
//                  const credit = parseFloat(e.credit || 0);
//                  currentBalance += (debit - credit);
//                  return { ...e, balance: currentBalance };
//                }).reverse();

//                return { ...customer, ledger: ledgerWithBalance };
//            }
//            return customer;
//          });
//          return { customers };
//       }),

//     }),
//     { name: 'customer-storage' }
//   )
// );
// export default useCustomerStore;