import { dbOperations } from '@/lib/db';
import { PERMISSION_CATALOG, ROLE_PRESETS } from './permissionCatalog';

// Permission Check Functions
export const hasPermission = (userPermissions, permissionCode) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(permissionCode);
};

export const hasAnyPermission = (userPermissions, permissionCodes) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return permissionCodes.some(code => userPermissions.includes(code));
};

export const hasAllPermissions = (userPermissions, permissionCodes) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return permissionCodes.every(code => userPermissions.includes(code));
};

// Get user permissions from database
export const getUserPermissions = async (userId) => {
  try {
    const profile = await dbOperations.getById('profiles', userId);
    if (!profile) return [];
    
    // If user has permissions array, return it
    if (profile.permissions && Array.isArray(profile.permissions)) {
      return profile.permissions;
    }
    
    // Legacy support: convert old permission object format
    if (profile.permissions && typeof profile.permissions === 'object') {
      return convertLegacyPermissions(profile.permissions, profile.role);
    }
    
    // Fallback to role-based permissions
    return getRolePermissions(profile.role);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

// Convert legacy permission object to new format
const convertLegacyPermissions = (legacyPerms, role) => {
  const permissions = [];
  
  // Map legacy format to new permission codes
  const mapping = {
    dashboard: ['DASHBOARD_VIEW'],
    jobs: ['JOBS_VIEW', 'JOBS_CREATE', 'JOBS_EDIT', 'JOBS_DELETE', 'INSPECTION_VIEW', 'INSPECTION_CREATE', 'ESTIMATE_VIEW', 'ESTIMATE_CREATE', 'JOBSHEET_VIEW', 'JOBSHEET_CREATE', 'CHALLAN_VIEW', 'CHALLAN_CREATE', 'INVOICE_VIEW', 'INVOICE_CREATE'],
    customer: ['CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE', 'CUSTOMER_LEDGER_VIEW'],
    vendors: ['VENDOR_VIEW', 'VENDOR_CREATE', 'VENDOR_EDIT', 'VENDOR_DELETE', 'VENDOR_LEDGER_VIEW'],
    labour: ['LABOUR_VIEW', 'LABOUR_CREATE', 'LABOUR_EDIT', 'LABOUR_DELETE', 'LABOUR_LEDGER_VIEW'],
    supplier: ['SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_EDIT', 'SUPPLIER_DELETE', 'SUPPLIER_LEDGER_VIEW'],
    inventory: ['INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_EDIT', 'INVENTORY_DELETE'],
    accounts: ['ACCOUNTS_VIEW', 'PURCHASE_VIEW', 'PURCHASE_CREATE', 'VOUCHER_VIEW', 'VOUCHER_CREATE', 'GST_VIEW', 'PAYMENT_VIEW'],
    summary: ['SUMMARY_VIEW', 'SUMMARY_EXPORT'],
    settings: ['SETTINGS_VIEW', 'SETTINGS_GENERAL', 'SETTINGS_COMPANY'],
  };
  
  Object.keys(legacyPerms).forEach(module => {
    if (legacyPerms[module] === 'full' && mapping[module]) {
      permissions.push(...mapping[module]);
    }
  });
  
  // If no permissions found, use role-based
  if (permissions.length === 0) {
    return getRolePermissions(role);
  }
  
  return permissions;
};

// Get permissions based on role
export const getRolePermissions = (role) => {
  const preset = ROLE_PRESETS[role];
  return preset ? preset.permissions : [];
};

// Save user permissions to database
export const saveUserPermissions = async (userId, permissions, actorId = null) => {
  try {
    const profile = await dbOperations.getById('profiles', userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Update profile with new permissions
    await dbOperations.update('profiles', userId, {
      permissions: permissions,
      updated_at: new Date().toISOString(),
    });
    
    // Log the permission change
    if (actorId) {
      await logPermissionChange(userId, actorId, permissions);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user permissions:', error);
    return false;
  }
};

// Apply role preset to user
export const applyRolePreset = async (userId, role, actorId = null) => {
  const permissions = getRolePermissions(role);
  return await saveUserPermissions(userId, permissions, actorId);
};

// Copy permissions from one user to another
export const copyUserPermissions = async (fromUserId, toUserId, actorId = null) => {
  try {
    const fromPermissions = await getUserPermissions(fromUserId);
    return await saveUserPermissions(toUserId, fromPermissions, actorId);
  } catch (error) {
    console.error('Error copying user permissions:', error);
    return false;
  }
};

// Log permission changes to audit log
const logPermissionChange = async (userId, actorId, newPermissions) => {
  try {
    const user = await dbOperations.getById('profiles', userId);
    const actor = await dbOperations.getById('profiles', actorId);
    
    await dbOperations.insert('audit_logs', {
      userId: actorId,
      actionType: 'PERMISSION_CHANGE',
      entityType: 'user_permissions',
      entityId: userId,
      description: `${actor?.name || 'Admin'} updated permissions for ${user?.name || 'User'}`,
      metadata: {
        targetUserId: userId,
        targetUserName: user?.name,
        permissionCount: newPermissions.length,
        permissions: newPermissions,
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging permission change:', error);
  }
};

// Get user's accessible routes based on permissions
export const getAccessibleRoutes = (userPermissions) => {
  const routes = [];
  
  // Check dashboard
  if (hasPermission(userPermissions, 'DASHBOARD_VIEW')) {
    routes.push('/dashboard');
  }
  
  // Check jobs module
  if (hasPermission(userPermissions, 'JOBS_VIEW')) {
    routes.push('/jobs');
  }
  
  // Check customer module
  if (hasPermission(userPermissions, 'CUSTOMER_VIEW')) {
    routes.push('/customer');
  }
  
  // Check vendors module
  if (hasPermission(userPermissions, 'VENDOR_VIEW')) {
    routes.push('/vendors');
  }
  
  // Check labour module
  if (hasPermission(userPermissions, 'LABOUR_VIEW')) {
    routes.push('/labour');
  }
  
  // Check supplier module
  if (hasPermission(userPermissions, 'SUPPLIER_VIEW')) {
    routes.push('/supplier');
  }
  
  // Check inventory module
  if (hasPermission(userPermissions, 'INVENTORY_VIEW')) {
    routes.push('/inventory');
  }
  
  // Check accounts module
  if (hasPermission(userPermissions, 'ACCOUNTS_VIEW')) {
    routes.push('/accounts');
  }
  
  // Check summary module
  if (hasPermission(userPermissions, 'SUMMARY_VIEW')) {
    routes.push('/summary');
  }
  
  // Check daily tasks module
  if (hasPermission(userPermissions, 'DAILY_TASKS_VIEW')) {
    routes.push('/daily-tasks');
  }
  
  // Check settings module
  if (hasPermission(userPermissions, 'SETTINGS_VIEW')) {
    routes.push('/settings');
  }
  
  return routes;
};

// Check if user can access a specific route
export const canAccessRoute = (userPermissions, route) => {
  const accessibleRoutes = getAccessibleRoutes(userPermissions);
  return accessibleRoutes.some(r => route.startsWith(r));
};

// Get permission label from code
export const getPermissionLabel = (permissionCode) => {
  const permission = PERMISSION_CATALOG[permissionCode];
  return permission ? permission.label : permissionCode;
};

// Get permission module from code
export const getPermissionModule = (permissionCode) => {
  const permission = PERMISSION_CATALOG[permissionCode];
  return permission ? permission.module : 'Unknown';
};

// Seed default permissions to database
export const seedPermissions = async () => {
  try {
    // Check if permissions already exist
    const existingCount = await dbOperations.count('permissions');
    if (existingCount > 0) {
      console.log('Permissions already seeded');
      return;
    }
    
    // Insert all permission definitions
    const permissionEntries = Object.values(PERMISSION_CATALOG).map(perm => ({
      id: perm.code,
      code: perm.code,
      label: perm.label,
      module: perm.module,
      createdAt: new Date().toISOString(),
    }));
    
    for (const perm of permissionEntries) {
      await dbOperations.insert('permissions', perm);
    }
    
    console.log(`Seeded ${permissionEntries.length} permissions`);
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
};

// Seed default roles to database
export const seedRoles = async () => {
  try {
    // Check if roles already exist
    const existingCount = await dbOperations.count('roles');
    if (existingCount > 0) {
      console.log('Roles already seeded');
      return;
    }
    
    // Insert all role presets
    const roleEntries = Object.entries(ROLE_PRESETS).map(([key, preset]) => ({
      id: key.toLowerCase().replace(/\s+/g, '_'),
      name: preset.label,
      description: preset.description,
      permissions: preset.permissions,
      isDefault: true,
      createdAt: new Date().toISOString(),
    }));
    
    for (const role of roleEntries) {
      await dbOperations.insert('roles', role);
    }
    
    console.log(`Seeded ${roleEntries.length} roles`);
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

// Initialize permission system
export const initializePermissionSystem = async () => {
  console.log('Initializing permission system...');
  await seedPermissions();
  await seedRoles();
  console.log('Permission system initialized');
};
