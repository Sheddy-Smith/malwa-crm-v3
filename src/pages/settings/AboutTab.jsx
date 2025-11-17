import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import useSettingsStore from '@/store/settingsStore';
import { Info, Mail, Phone, ExternalLink, Heart, Code } from 'lucide-react';

const AboutTab = () => {
  const { appInfo } = useSettingsStore();

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Code size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Malwa CRM</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Professional Workshop Management System
          </p>
          <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
            Version {appInfo.version}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Info className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">System Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Application Version</p>
            <p className="font-semibold text-lg">{appInfo.version}</p>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Build Date</p>
            <p className="font-semibold text-lg">{appInfo.buildDate}</p>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Developer</p>
            <p className="font-semibold text-lg">{appInfo.developer}</p>
          </div>

          <div className="p-4 border rounded-lg dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Platform</p>
            <p className="font-semibold text-lg">React + Vite</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Phone className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Support & Contact</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Mail className="text-blue-600" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Email Support</p>
              <p className="font-medium">support@malwacrm.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Phone className="text-green-600" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Phone Support</p>
              <p className="font-medium">+91 XXXXX XXXXX</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <ExternalLink className="text-purple-600" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Website</p>
              <p className="font-medium">www.malwacrm.com</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Customer Management',
            'Vendor & Supplier Tracking',
            'Job Sheet Management',
            'Inventory Control',
            'Invoice Generation',
            'Ledger Management',
            'GST Compliance',
            'Multi-user Support',
            'Data Backup & Restore',
            'Print & Export',
            'Dark Mode',
            'Mobile Responsive',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900 dark:to-red-900">
        <div className="text-center">
          <Heart className="text-red-500 mx-auto mb-3" size={32} />
          <p className="text-lg font-medium">
            Made with ❤️ for Indian Automotive Workshops
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Thank you for choosing Malwa CRM
          </p>
        </div>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline">
          <ExternalLink size={18} /> Documentation
        </Button>
        <Button variant="outline">
          Report Issue
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Check for Updates
        </Button>
      </div>
    </div>
  );
};

export default AboutTab;
