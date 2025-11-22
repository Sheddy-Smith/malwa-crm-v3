import { Users, Shield, UserCircle, Clock, Database, UserPlus, X, Eye, EyeOff, CheckCircle, Edit, Trash2, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import useAuthStore from '@/store/authStore';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dbOperations } from '@/lib/db';

const UserManagementTab = () => {
  const { user, profile } = useAuthStore();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadAllUsers();
  }, []);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Accountant',
    status: 'Active',
    pageAccess: {
      dashboard: true,
      jobs: { enabled: true, subPages: { vehicleInspection: true, estimate: true, jobSheet: true, chalan: true, invoice: true } },
      customer: { enabled: true, subPages: { leads: true, contacts: true, customerLedger: true } },
      vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
      labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
      supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
      inventory: { enabled: true, subPages: { stock: true, addCategory: true } },
      accounts: { enabled: true, subPages: { purchaseInvoice: true, voucher: true, otherExpenses: true, sellInvoice: true, purchaseChallan: true, sellChallan: true, cashReceipt: true, gstLedger: true } },
      summary: true,
      dailyTasks: true,
      settings: { enabled: false, subPages: { myProfile: false, general: false, companyMaster: false, multiplierSettings: false, rateListMemory: false, userManagement: false, security: false, backupRestore: false, auditLogs: false, about: false } }
    }
  });

  // Page access configuration with display names
  const pageAccessConfig = [
    { key: 'dashboard', label: 'Dashboard', subPages: [] },
    { 
      key: 'jobs', 
      label: 'Jobs', 
      subPages: [
        { key: 'vehicleInspection', label: 'Vehicle Inspection' },
        { key: 'estimate', label: 'Estimate' },
        { key: 'jobSheet', label: 'Job Sheet' },
        { key: 'chalan', label: 'Chalan' },
        { key: 'invoice', label: 'Invoice' }
      ]
    },
    { 
      key: 'customer', 
      label: 'Customer', 
      subPages: [
        { key: 'leads', label: 'Leads' },
        { key: 'contacts', label: 'Contacts' },
        { key: 'customerLedger', label: 'Customer Ledger' }
      ]
    },
    { 
      key: 'vendors', 
      label: 'Vendors', 
      subPages: [
        { key: 'vendorDetails', label: 'Vendor Details' },
        { key: 'vendorLedger', label: 'Vendor Ledger' }
      ]
    },
    { 
      key: 'labour', 
      label: 'Labour', 
      subPages: [
        { key: 'labourDetails', label: 'Labour Details' },
        { key: 'labourLedger', label: 'Labour Ledger' }
      ]
    },
    { 
      key: 'supplier', 
      label: 'Supplier', 
      subPages: [
        { key: 'supplierDetails', label: 'Supplier Details' },
        { key: 'supplierLedger', label: 'Supplier Ledger' }
      ]
    },
    { 
      key: 'inventory', 
      label: 'Inventory', 
      subPages: [
        { key: 'stock', label: 'Stock' },
        { key: 'addCategory', label: 'Add Category' }
      ]
    },
    { 
      key: 'accounts', 
      label: 'Accounts', 
      subPages: [
        { key: 'purchaseInvoice', label: 'Purchase-Invoice' },
        { key: 'voucher', label: 'Voucher' },
        { key: 'otherExpenses', label: 'Other Expenses' },
        { key: 'sellInvoice', label: 'Sell-Invoice' },
        { key: 'purchaseChallan', label: 'Purchase-Challan' },
        { key: 'sellChallan', label: 'Sell-Challan' },
        { key: 'cashReceipt', label: 'Cash Receipt' },
        { key: 'gstLedger', label: 'GST Ledger' }
      ]
    },
    { key: 'summary', label: 'Summary', subPages: [] },
    { key: 'dailyTasks', label: 'Daily Tasks', subPages: [] },
    { 
      key: 'settings', 
      label: 'Settings', 
      subPages: [
        { key: 'myProfile', label: 'My Profile' },
        { key: 'general', label: 'General' },
        { key: 'companyMaster', label: 'Company Master' },
        { key: 'multiplierSettings', label: 'Multiplier Settings' },
        { key: 'rateListMemory', label: 'Rate List Memory' },
        { key: 'userManagement', label: 'User Management' },
        { key: 'security', label: 'Security' },
        { key: 'backupRestore', label: 'Backup & Restore' },
        { key: 'auditLogs', label: 'Audit Logs' },
        { key: 'about', label: 'About' }
      ]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle main module access
  const handleModuleToggle = (moduleKey) => {
    setFormData(prev => {
      const newPageAccess = { ...prev.pageAccess };
      const currentValue = newPageAccess[moduleKey];
      
      if (typeof currentValue === 'boolean') {
        // Simple module (no subpages)
        newPageAccess[moduleKey] = !currentValue;
      } else {
        // Module with subpages
        const newEnabled = !currentValue.enabled;
        newPageAccess[moduleKey] = {
          enabled: newEnabled,
          subPages: Object.keys(currentValue.subPages).reduce((acc, key) => {
            acc[key] = newEnabled;
            return acc;
          }, {})
        };
      }
      
      return { ...prev, pageAccess: newPageAccess };
    });
  };

  // Toggle subpage access
  const handleSubPageToggle = (moduleKey, subPageKey) => {
    setFormData(prev => {
      const newPageAccess = { ...prev.pageAccess };
      const currentModule = newPageAccess[moduleKey];
      
      if (currentModule && typeof currentModule === 'object' && currentModule.subPages) {
        newPageAccess[moduleKey] = {
          ...currentModule,
          subPages: {
            ...currentModule.subPages,
            [subPageKey]: !currentModule.subPages[subPageKey]
          }
        };
        
        // Auto-enable parent if any subpage is enabled
        const anySubPageEnabled = Object.values(newPageAccess[moduleKey].subPages).some(val => val);
        newPageAccess[moduleKey].enabled = anySubPageEnabled;
      }
      
      return { ...prev, pageAccess: newPageAccess };
    });
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let updatedAccess = { ...formData.pageAccess };

    // Auto-assign page access based on role
    if (role === 'Super Admin' || role === 'Admin') {
      updatedAccess = {
        dashboard: true,
        jobs: { enabled: true, subPages: { vehicleInspection: true, estimate: true, jobSheet: true, chalan: true, invoice: true } },
        customer: { enabled: true, subPages: { leads: true, contacts: true, customerLedger: true } },
        vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
        labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
        supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
        inventory: { enabled: true, subPages: { stock: true, addCategory: true } },
        accounts: { enabled: true, subPages: { purchaseInvoice: true, voucher: true, otherExpenses: true, sellInvoice: true, purchaseChallan: true, sellChallan: true, cashReceipt: true, gstLedger: true } },
        summary: true,
        dailyTasks: true,
        settings: { enabled: true, subPages: { myProfile: true, general: true, companyMaster: true, multiplierSettings: true, rateListMemory: true, userManagement: true, security: true, backupRestore: true, auditLogs: true, about: true } }
      };
    } else if (role === 'Read Only') {
      updatedAccess = {
        dashboard: true,
        jobs: { enabled: true, subPages: { vehicleInspection: false, estimate: false, jobSheet: false, chalan: false, invoice: false } },
        customer: { enabled: true, subPages: { leads: false, contacts: true, customerLedger: true } },
        vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
        labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
        supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
        inventory: { enabled: true, subPages: { stock: true, addCategory: false } },
        accounts: { enabled: true, subPages: { purchaseInvoice: false, voucher: false, otherExpenses: false, sellInvoice: false, purchaseChallan: false, sellChallan: false, cashReceipt: false, gstLedger: true } },
        summary: true,
        dailyTasks: true,
        settings: { enabled: false, subPages: { myProfile: true, general: false, companyMaster: false, multiplierSettings: false, rateListMemory: false, userManagement: false, security: false, backupRestore: false, auditLogs: false, about: true } }
      };
    }

    setFormData(prev => ({ ...prev, role, pageAccess: updatedAccess }));
  };

  // Validation removed - users can enter any format

  // Validation removed - users can enter any format

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.username || !formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // All validations removed - accept any input

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      // Removed uniqueness check - allow duplicate usernames

      // Hash password
      const encoder = new TextEncoder();
      const data = encoder.encode(formData.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Generate user ID
      const userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const timestamp = new Date().toISOString();

      // Create user
      await dbOperations.insert('users', {
        id: userId,
        email: formData.username,
        password: hashedPassword,
        created_at: timestamp
      });

      // Create profile
      await dbOperations.insert('profiles', {
        id: userId,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        status: formData.status,
        permissions: {
          dashboard: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          jobs: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : formData.role === 'Read Only' ? 'read' : 'full',
          customer: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          vendors: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          labour: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          supplier: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          inventory: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : formData.role === 'Read Only' ? 'read' : 'full',
          accounts: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : formData.role === 'Read Only' ? 'read' : 'full',
          summary: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'read',
          settings: formData.role === 'Super Admin' || formData.role === 'Admin' ? 'full' : 'none'
        },
        created_at: timestamp,
        last_login: null
      });

      // Save page visibility
      await dbOperations.insert('user_page_visibility', {
        userId: userId,
        pageAccess: formData.pageAccess,
        created_at: timestamp,
        updated_at: timestamp
      });

      // Create audit log
      await dbOperations.insert('audit_logs', {
        id: 'log_' + Date.now(),
        action: 'USER_CREATED',
        performedBy: user?.id || 'system',
        targetUser: userId,
        details: {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role
        },
        timestamp: timestamp
      });

      toast.success('User created successfully!');
      setIsAddUserModalOpen(false);
      loadAllUsers(); // Reload users to update statistics
      setFormData({
        username: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Accountant',
        status: 'Active',
        pageAccess: {
          dashboard: true,
          jobs: { enabled: true, subPages: { vehicleInspection: true, estimate: true, jobSheet: true, chalan: true, invoice: true } },
          customer: { enabled: true, subPages: { leads: true, contacts: true, customerLedger: true } },
          vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
          labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
          supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
          inventory: { enabled: true, subPages: { stock: true, addCategory: true } },
          accounts: { enabled: true, subPages: { purchaseInvoice: true, voucher: true, otherExpenses: true, sellInvoice: true, purchaseChallan: true, sellChallan: true, cashReceipt: true, gstLedger: true } },
          summary: true,
          dailyTasks: true,
          settings: { enabled: false, subPages: { myProfile: false, general: false, companyMaster: false, multiplierSettings: false, rateListMemory: false, userManagement: false, security: false, backupRestore: false, auditLogs: false, about: false } }
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  // Load all users
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await dbOperations.getAll('users');
      const profiles = await dbOperations.getAll('profiles');
      const visibilityRecords = await dbOperations.getAll('user_page_visibility');

      const usersWithDetails = users.map(u => {
        const userProfile = profiles.find(p => p.id === u.id);
        const visibility = visibilityRecords.find(v => v.userId === u.id);
        return {
          ...u,
          profile: userProfile,
          pageAccess: visibility?.pageAccess
        };
      });

      setAllUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from users table
      await dbOperations.delete('users', userId);
      
      // Delete from profiles table
      await dbOperations.delete('profiles', userId);
      
      // Delete from user_page_visibility table
      const visibilityRecords = await dbOperations.getAll('user_page_visibility');
      const userVisibility = visibilityRecords.find(v => v.userId === userId);
      if (userVisibility) {
        await dbOperations.delete('user_page_visibility', userVisibility.id);
      }

      // Create audit log
      await dbOperations.insert('audit_logs', {
        id: 'log_' + Date.now(),
        action: 'USER_DELETED',
        performedBy: user?.id || 'system',
        targetUser: userId,
        details: { userId },
        timestamp: new Date().toISOString()
      });

      toast.success('User deleted successfully!');
      loadAllUsers(); // Reload users
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Open edit modal
  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      username: userToEdit.email,
      name: userToEdit.profile?.name || '',
      email: userToEdit.profile?.email || '',
      password: '',
      confirmPassword: '',
      role: userToEdit.profile?.role || 'Accountant',
      status: userToEdit.profile?.status || 'Active',
      pageAccess: userToEdit.pageAccess || {
        dashboard: true,
        jobs: { enabled: true, subPages: { vehicleInspection: true, estimate: true, jobSheet: true, chalan: true, invoice: true } },
        customer: { enabled: true, subPages: { leads: true, contacts: true, customerLedger: true } },
        vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
        labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
        supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
        inventory: { enabled: true, subPages: { stock: true, addCategory: true } },
        accounts: { enabled: true, subPages: { purchaseInvoice: true, voucher: true, otherExpenses: true, sellInvoice: true, purchaseChallan: true, sellChallan: true, cashReceipt: true, gstLedger: true } },
        summary: true,
        dailyTasks: true,
        settings: { enabled: false, subPages: { myProfile: false, general: false, companyMaster: false, multiplierSettings: false, rateListMemory: false, userManagement: false, security: false, backupRestore: false, auditLogs: false, about: false } }
      }
    });
    setIsEditUserModalOpen(true);
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      const timestamp = new Date().toISOString();

      // Update profile
      await dbOperations.update('profiles', selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        updated_at: timestamp
      });

      // Update page visibility
      const visibilityRecords = await dbOperations.getAll('user_page_visibility');
      const userVisibility = visibilityRecords.find(v => v.userId === selectedUser.id);
      
      if (userVisibility) {
        await dbOperations.update('user_page_visibility', userVisibility.id, {
          pageAccess: formData.pageAccess,
          updated_at: timestamp
        });
      } else {
        await dbOperations.insert('user_page_visibility', {
          userId: selectedUser.id,
          pageAccess: formData.pageAccess,
          created_at: timestamp,
          updated_at: timestamp
        });
      }

      // Update password if provided
      if (formData.password && formData.password.length > 0) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        // Hash new password
        const encoder = new TextEncoder();
        const data = encoder.encode(formData.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await dbOperations.update('users', selectedUser.id, {
          password: hashedPassword
        });
      }

      // Create audit log
      await dbOperations.insert('audit_logs', {
        id: 'log_' + Date.now(),
        action: 'USER_UPDATED',
        performedBy: user?.id || 'system',
        targetUser: selectedUser.id,
        details: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        },
        timestamp: timestamp
      });

      toast.success('User updated successfully!');
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      loadAllUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.profile?.name?.toLowerCase().includes(query) ||
      u.profile?.email?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.profile?.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Manage Users Modal */}
      <Modal isOpen={isManageUsersModalOpen} onClose={() => setIsManageUsersModalOpen(false)} title="Manage Users" size="2xl">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white font-bold mr-3">
                            {u.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium dark:text-dark-text">{u.profile?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{u.profile?.email || u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {u.profile?.role || 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.profile?.status === 'Active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {u.profile?.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete User"
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Users: {allUsers.length} | Active: {allUsers.filter(u => u.profile?.status === 'Active').length}
            </p>
            <Button variant="secondary" onClick={() => setIsManageUsersModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="Edit User" size="xl">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                placeholder="Enter email or identifier"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                required
              >
                <option value="Accountant">Accountant</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Employee">Employee</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Account Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              >
                <option value="Active">✅ Active</option>
                <option value="Inactive">⛔ Inactive</option>
              </select>
            </div>

            {/* New Password (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                New Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Page Access Checklist */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">Page Access Checklist</h4>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 mb-4">
              ✅ <strong>Checked</strong> = visible in sidebar & pages + usable with full function<br />
              ⛔ <strong>Unchecked</strong> = hidden from UI + route & flow blocked
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {pageAccessConfig.map((module) => {
                const moduleAccess = formData.pageAccess[module.key];
                const isModuleEnabled = typeof moduleAccess === 'boolean' ? moduleAccess : moduleAccess?.enabled;
                
                return (
                  <div key={module.key} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    {/* Main Module Checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isModuleEnabled}
                        onChange={() => handleModuleToggle(module.key)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />
                      <span className={`font-semibold text-sm ${isModuleEnabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isModuleEnabled ? '✅' : '⛔'} {module.label}
                      </span>
                    </label>
                    
                    {/* Sub-pages if exist */}
                    {module.subPages.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1.5 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                        {module.subPages.map((subPage) => {
                          const isSubPageEnabled = moduleAccess?.subPages?.[subPage.key] || false;
                          
                          return (
                            <label key={subPage.key} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isSubPageEnabled}
                                onChange={() => handleSubPageToggle(module.key, subPage.key)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className={`text-xs ${isSubPageEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                {subPage.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditUserModalOpen(false);
                setSelectedUser(null);
              }}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add New User" size="xl">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                placeholder="Enter username"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Any format allowed</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                placeholder="Enter full name"
                required
                minLength={2}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                required
              >
                <option value="Accountant">Accountant</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Employee">Employee</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Any format allowed
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-dark-text">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium dark:text-dark-text">Account Status</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active users can log in immediately</p>
            </div>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            >
              <option value="Active">✅ Active</option>
              <option value="Inactive">⛔ Inactive</option>
            </select>
          </div>

          {/* Page Access Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">Page Access Checklist</h4>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 mb-4">
              ✅ <strong>Checked</strong> = visible in sidebar & pages + usable with full function<br />
              ⛔ <strong>Unchecked</strong> = hidden from UI + route & flow blocked
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {pageAccessConfig.map((module) => {
                const moduleAccess = formData.pageAccess[module.key];
                const isModuleEnabled = typeof moduleAccess === 'boolean' ? moduleAccess : moduleAccess?.enabled;
                
                return (
                  <div key={module.key} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    {/* Main Module Checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isModuleEnabled}
                        onChange={() => handleModuleToggle(module.key)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />
                      <span className={`font-semibold text-sm ${isModuleEnabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isModuleEnabled ? '✅' : '⛔'} {module.label}
                      </span>
                    </label>
                    
                    {/* Sub-pages if exist */}
                    {module.subPages.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1.5 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                        {module.subPages.map((subPage) => {
                          const isSubPageEnabled = moduleAccess?.subPages?.[subPage.key] || false;
                          
                          return (
                            <label key={subPage.key} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isSubPageEnabled}
                                onChange={() => handleSubPageToggle(module.key, subPage.key)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className={`text-xs ${isSubPageEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                {subPage.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddUserModalOpen(false);
                setFormData({
                  username: '',
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  role: 'Accountant',
                  status: 'Active',
                  pageAccess: {
                    dashboard: true,
                    jobs: { enabled: true, subPages: { vehicleInspection: true, estimate: true, jobSheet: true, chalan: true, invoice: true } },
                    customer: { enabled: true, subPages: { leads: true, contacts: true, customerLedger: true } },
                    vendors: { enabled: true, subPages: { vendorDetails: true, vendorLedger: true } },
                    labour: { enabled: true, subPages: { labourDetails: true, labourLedger: true } },
                    supplier: { enabled: true, subPages: { supplierDetails: true, supplierLedger: true } },
                    inventory: { enabled: true, subPages: { stock: true, addCategory: true } },
                    accounts: { enabled: true, subPages: { purchaseInvoice: true, voucher: true, otherExpenses: true, sellInvoice: true, purchaseChallan: true, sellChallan: true, cashReceipt: true, gstLedger: true } },
                    summary: true,
                    dailyTasks: true,
                    settings: { enabled: false, subPages: { myProfile: false, general: false, companyMaster: false, multiplierSettings: false, rateListMemory: false, userManagement: false, security: false, backupRestore: false, auditLogs: false, about: false } }
                  }
                });
              }}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </form>
      </Modal>
      {/* Super Admin Powers Card */}
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-100 dark:border-red-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="text-brand-red" size={28} />
              <div>
                <h2 className="text-xl font-bold text-brand-red">Super Admin Powers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highest level access - All modules unlocked</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Full Access Active</span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{allUsers.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{allUsers.filter(u => u.profile?.status === 'Active').length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">Never</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Last Backup</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">v13</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Database Version</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-base font-bold text-brand-red mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
              <Button 
                onClick={() => {
                  loadAllUsers();
                  setIsManageUsersModalOpen(true);
                }}
                className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md">
                <Shield className="w-4 h-4 mr-2" />
                Manage Permissions
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md">
                <Database className="w-4 h-4 mr-2" />
                System Settings
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md">
                <Clock className="w-4 h-4 mr-2" />
                Audit Logs
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* User Profile Card */}
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Shield className="text-brand-red" size={32} />
          <div>
            <h2 className="text-2xl font-bold dark:text-dark-text">My Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View your account information</p>
          </div>
        </div>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</label>
              <p className="mt-1 text-lg font-semibold dark:text-dark-text">{profile?.name || 'Super Admin'}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email / Username</label>
              <p className="mt-1 text-lg font-semibold dark:text-dark-text">{profile?.email || user?.email || 'admin@malwa.com'}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</label>
              <div className="mt-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Shield className="w-4 h-4" />
                  {profile?.role || 'Super Admin'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
              <div className="mt-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {profile?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Access Information */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-brand-red" size={24} />
          <h3 className="text-xl font-bold dark:text-dark-text">Access Permissions</h3>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-lg p-6 border border-red-100 dark:border-red-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="w-8 h-8 text-brand-red" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">Full Access Active</h4>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                You have complete access to all modules and features in the system.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Dashboard', 'Jobs', 'Customer', 'Vendors', 'Labour', 'Supplier', 'Inventory', 'Accounts'].map((module) => (
                  <div key={module} className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {module}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-dark-text">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-dark-text">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-dark-text">v13</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Database Version</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserManagementTab;
