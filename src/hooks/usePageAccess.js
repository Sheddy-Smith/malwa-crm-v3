import { useState, useEffect } from 'react';
import { dbOperations } from '@/lib/db';
import useAuthStore from '@/store/authStore';

/**
 * Hook to check if user has access to specific pages based on user_page_visibility store
 */
export const usePageAccess = () => {
  const { user } = useAuthStore();
  const [pageAccess, setPageAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPageAccess = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get user's page visibility settings from IndexedDB
        const allVisibilityRecords = await dbOperations.getAll('user_page_visibility');
        const userVisibility = allVisibilityRecords?.find(record => record.userId === user.id);

        if (userVisibility && userVisibility.pageAccess) {
          setPageAccess(userVisibility.pageAccess);
        } else {
          // Default: Super Admin gets full access
          setPageAccess({
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
          });
        }
      } catch (error) {
        console.error('Error loading page access:', error);
        // On error, provide default full access
        setPageAccess({
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
        });
      } finally {
        setLoading(false);
      }
    };

    loadPageAccess();
  }, [user?.id]);

  /**
   * Check if user has access to a specific page
   * @param {string} pageKey - The page key (e.g., 'dashboard', 'jobs', 'customer')
   * @param {string} subPageKey - Optional subpage key (e.g., 'vehicleInspection', 'leads')
   * @returns {boolean} - Whether user has access
   */
  const hasAccess = (pageKey, subPageKey = null) => {
    if (!pageAccess) return false;

    const page = pageAccess[pageKey];
    
    // Simple boolean page (like dashboard, summary, dailyTasks)
    if (typeof page === 'boolean') {
      return page;
    }
    
    // Page with subpages
    if (page && typeof page === 'object') {
      // If checking subpage access
      if (subPageKey) {
        return page.subPages?.[subPageKey] || false;
      }
      // If checking main page access
      return page.enabled || false;
    }
    
    return false;
  };

  /**
   * Get all accessible subpages for a module
   * @param {string} pageKey - The page key (e.g., 'jobs', 'customer')
   * @returns {object} - Object with subpage keys and their access status
   */
  const getSubPages = (pageKey) => {
    if (!pageAccess) return {};
    
    const page = pageAccess[pageKey];
    if (page && typeof page === 'object' && page.subPages) {
      return page.subPages;
    }
    
    return {};
  };

  return {
    pageAccess,
    hasAccess,
    getSubPages,
    loading
  };
};
