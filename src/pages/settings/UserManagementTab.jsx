import { useState } from 'react';
import useUserManagementStore from '@/store/userManagementStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Edit, Trash2, PlusCircle, KeyRound, Lock, Unlock, Eye, EyeOff, Shield, User as UserIcon, Mail, Building, Calendar, Clock } from 'lucide-react';

const UserForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user || {
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Employee',
        branch: 'Head Office'
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role) {
            return toast.error("Name, Email and Role are required.");
        }
        if (!user && !formData.password) {
            return toast.error("Password is required for new users.");
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Full Name *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Email *</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Auto-generated from email"
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to auto-generate from email</p>
            </div>

            {!user && (
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Password *</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text pr-10"
                            required={!user}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default: Pass@123 (if not provided)</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Role *</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                >
                    <option>Super Admin</option>
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Accountant</option>
                    <option>Employee</option>
                    <option>Read Only</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-text">Branch</label>
                <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                >
                    <option>Head Office</option>
                    <option>Branch A</option>
                    <option>Branch B</option>
                    <option>Branch C</option>
                </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{user ? 'Update User' : 'Create User'}</Button>
            </div>
        </form>
    );
};

const PasswordResetModal = ({ isOpen, onClose, user, onReset }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords don't match!");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters!");
        }
        onReset(newPassword);
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reset Password - ${user?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">New Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-dark-text">Confirm Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red dark:text-dark-text"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Reset Password</Button>
                </div>
            </form>
        </Modal>
    );
};

const UserDetailsModal = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    const getRoleColor = (role) => {
        const colors = {
            'Super Admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'Admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Accountant': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Employee': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            'Read Only': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };
        return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Details">
            <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
                    <div className="h-16 w-16 rounded-full bg-brand-red/10 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-brand-red" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-dark-text">{user.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getRoleColor(user.role)}`}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm font-medium">Email</span>
                        </div>
                        <p className="text-sm dark:text-dark-text">{user.email}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <UserIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">Username</span>
                        </div>
                        <p className="text-sm dark:text-dark-text">{user.username}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <Building className="h-4 w-4" />
                            <span className="text-sm font-medium">Branch</span>
                        </div>
                        <p className="text-sm dark:text-dark-text">{user.branch}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">Status</span>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {user.status}
                        </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Created</span>
                        </div>
                        <p className="text-sm dark:text-dark-text">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Last Login</span>
                        </div>
                        <p className="text-sm dark:text-dark-text">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>

                {user.permissions && (
                    <div className="mt-4">
                        <h4 className="font-bold mb-3 dark:text-dark-text flex items-center gap-2">
                            <Shield className="h-5 w-5 text-brand-red" />
                            Access Permissions
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(user.permissions).map(([module, perms]) => (
                                <div key={module} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <p className="font-medium dark:text-dark-text capitalize mb-1">{module}</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {perms.view && <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded text-xs">View</span>}
                                        {perms.create && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded text-xs">Create</span>}
                                        {perms.edit && <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded text-xs">Edit</span>}
                                        {perms.delete && <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded text-xs">Delete</span>}
                                        {!perms.view && !perms.create && !perms.edit && !perms.delete && <span className="text-gray-400 text-xs">No Access</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

const UserManagementTab = () => {
    const { users, addUser, updateUser, deleteUser, blockUser, unblockUser, resetPassword } = useUserManagementStore();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    const handleAdd = () => {
        setEditingUser(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsFormModalOpen(true);
    };

    const handleSave = (data) => {
        if (editingUser) {
            updateUser({ ...editingUser, ...data });
            toast.success("User updated successfully!");
        } else {
            addUser(data);
            toast.success("New user created successfully!");
        }
        setIsFormModalOpen(false);
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        deleteUser(userToDelete.id);
        toast.success(`User "${userToDelete.name}" deleted successfully.`);
        setIsDeleteModalOpen(false);
    };

    const handleBlock = (user) => {
        blockUser(user.id);
        toast.success(`User "${user.name}" has been blocked.`);
    };

    const handleUnblock = (user) => {
        unblockUser(user.id);
        toast.success(`User "${user.name}" has been unblocked.`);
    };

    const handlePasswordReset = (user) => {
        setUserToReset(user);
        setIsPasswordResetOpen(true);
    };

    const confirmPasswordReset = (newPassword) => {
        resetPassword(userToReset.id, newPassword);
        toast.success(`Password reset successfully for "${userToReset.name}"`);
        setIsPasswordResetOpen(false);
        setUserToReset(null);
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All' || user.role === filterRole;
        const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleColor = (role) => {
        const colors = {
            'Super Admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'Admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Accountant': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Employee': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            'Read Only': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };
        return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <div>
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingUser ? "Edit User" : "Add New User"}>
                <UserForm user={editingUser} onSave={handleSave} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone.`}
            />

            <PasswordResetModal
                isOpen={isPasswordResetOpen}
                onClose={() => setIsPasswordResetOpen(false)}
                user={userToReset}
                onReset={confirmPasswordReset}
            />

            <UserDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                user={selectedUser}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold dark:text-dark-text">User Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage users, roles, and permissions</p>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by name, email or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                >
                    <option>All</option>
                    <option>Super Admin</option>
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Accountant</option>
                    <option>Employee</option>
                    <option>Read Only</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                >
                    <option>All</option>
                    <option>Active</option>
                    <option>Blocked</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm dark:text-dark-text-secondary">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                        <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Branch</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Last Login</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <tr key={u.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="p-3">
                                    <div>
                                        <p className="font-medium dark:text-dark-text">{u.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                        <p className="text-xs text-gray-400">@{u.username}</p>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-3 dark:text-dark-text">{u.branch}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        u.status === 'Active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-3 text-xs dark:text-dark-text-secondary">
                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            className="p-2 h-auto"
                                            onClick={() => handleViewDetails(u)}
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="p-2 h-auto"
                                            onClick={() => handleEdit(u)}
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="p-2 h-auto"
                                            onClick={() => handlePasswordReset(u)}
                                            title="Reset Password"
                                        >
                                            <KeyRound className="h-4 w-4 text-orange-600" />
                                        </Button>
                                        {u.status === 'Active' ? (
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-auto"
                                                onClick={() => handleBlock(u)}
                                                title="Block User"
                                            >
                                                <Lock className="h-4 w-4 text-red-600" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="p-2 h-auto"
                                                onClick={() => handleUnblock(u)}
                                                title="Unblock User"
                                            >
                                                <Unlock className="h-4 w-4 text-green-600" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="p-2 h-auto"
                                            onClick={() => handleDelete(u)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
            </div>
        </div>
    );
};

export default UserManagementTab;
