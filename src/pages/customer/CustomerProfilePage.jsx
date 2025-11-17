import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProfileDetailsTab from './ProfileDetailsTab';
import CustomerLedgerTab from './CustomerLedgerTab';
import JobHistoryTab from './JobHistoryTab';
import useCustomerStore from '@/store/customerStore';
import { motion } from 'framer-motion';

const CustomerProfilePage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { customers } = useCustomerStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const foundCustomer = customers.find(c => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
    } else {
      navigate('/customer');
    }
  }, [customerId, customers, navigate]);

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-dark-text-secondary">Loading customer...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Details', component: ProfileDetailsTab },
    { id: 'ledger', label: 'Ledger', component: CustomerLedgerTab },
    { id: 'jobs', label: 'Job History', component: JobHistoryTab },
  ];

  const ActiveTabComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-card dark:shadow-dark-card border border-gray-100 dark:border-gray-700"
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>

        <div className="border-b dark:border-gray-700 pb-4">
          <h1 className="text-3xl font-bold dark:text-dark-text mb-2">
            {customer.name}
          </h1>
          <div className="text-xl font-semibold text-brand-red">
            Current Balance: ₹ {customer.current_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
      </div>

      <div className="border-b dark:border-gray-700 mb-6">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-red text-brand-red dark:text-brand-red'
                  : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-brand-dark dark:hover:text-dark-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {ActiveTabComponent && <ActiveTabComponent customer={customer} />}
      </div>
    </motion.div>
  );
};

export default CustomerProfilePage;
