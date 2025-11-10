import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      generalSettings: {
        themeMode: 'system',
        language: 'English',
        financialYear: 'Apr-Mar',
        autoLogoutTime: 30,
        startupPage: 'Dashboard',
        notificationsEnabled: true,
        soundAlerts: true,
        autoSaveInterval: 5,
      },

      ledgerSettings: {
        autoCalculateBalance: true,
        creditLimitAlert: 80,
        overdueHighlightColor: '#ef4444',
        defaultViewRange: 30,
        autoRounding: 'none',
        defaultPrintFormat: 'A4-portrait',
      },

      inventorySettings: {
        stockValuationMethod: 'FIFO',
        allowNegativeStock: false,
        autoGenerateItemCode: true,
        defaultUnit: 'pcs',
        autoUpdateStockOnInvoice: true,
        lowStockAlertLevel: 10,
        defaultWarehouse: 'Main Store',
      },

      invoiceSettings: {
        invoicePrefix: 'INV',
        invoiceSuffix: '',
        challanPrefix: 'CH',
        receiptPrefix: 'RCP',
        autoNumbering: true,
        termsAndConditions: 'Thank you for your business.',
        gstMode: 'Regular',
        defaultTaxRate: 18,
        showCompanyLogo: true,
        defaultPrintTemplate: 'Standard',
        pdfSaveLocation: '',
      },

      backupSettings: {
        backupFolder: '',
        autoBackup: 'Weekly',
        exportFormat: 'JSON',
        dataRetentionYears: 7,
        lastBackupDate: null,
      },

      syncSettings: {
        syncMode: 'Manual',
        apiUrl: '',
        syncFrequency: 'Daily',
        lastSyncTimestamp: null,
        cloudBackupEnabled: false,
      },

      printSettings: {
        defaultPrinter: '',
        paperSize: 'A4',
        showLogoAndInfo: true,
        footerText: 'Thank you for your business',
        currencyFormat: 'INR',
        decimalPrecision: 2,
        autoOpenAfterExport: true,
        exportLocation: '',
      },

      securitySettings: {
        appPinLock: '',
        encryptLocalData: false,
        maskAmounts: false,
        autoLockMinutes: 15,
        auditTrailEnabled: true,
      },

      appInfo: {
        version: '1.0.0',
        buildDate: '2025-01-06',
        developer: 'Malwa CRM',
        licenseKey: '',
      },

      updateGeneralSettings: (updates) =>
        set((state) => ({
          generalSettings: { ...state.generalSettings, ...updates },
        })),

      updateLedgerSettings: (updates) =>
        set((state) => ({
          ledgerSettings: { ...state.ledgerSettings, ...updates },
        })),

      updateInventorySettings: (updates) =>
        set((state) => ({
          inventorySettings: { ...state.inventorySettings, ...updates },
        })),

      updateInvoiceSettings: (updates) =>
        set((state) => ({
          invoiceSettings: { ...state.invoiceSettings, ...updates },
        })),

      updateBackupSettings: (updates) =>
        set((state) => ({
          backupSettings: { ...state.backupSettings, ...updates },
        })),

      updateSyncSettings: (updates) =>
        set((state) => ({
          syncSettings: { ...state.syncSettings, ...updates },
        })),

      updatePrintSettings: (updates) =>
        set((state) => ({
          printSettings: { ...state.printSettings, ...updates },
        })),

      updateSecuritySettings: (updates) =>
        set((state) => ({
          securitySettings: { ...state.securitySettings, ...updates },
        })),

      resetToDefaults: () =>
        set({
          generalSettings: {
            themeMode: 'system',
            language: 'English',
            financialYear: 'Apr-Mar',
            autoLogoutTime: 30,
            startupPage: 'Dashboard',
            notificationsEnabled: true,
            soundAlerts: true,
            autoSaveInterval: 5,
          },
          ledgerSettings: {
            autoCalculateBalance: true,
            creditLimitAlert: 80,
            overdueHighlightColor: '#ef4444',
            defaultViewRange: 30,
            autoRounding: 'none',
            defaultPrintFormat: 'A4-portrait',
          },
          inventorySettings: {
            stockValuationMethod: 'FIFO',
            allowNegativeStock: false,
            autoGenerateItemCode: true,
            defaultUnit: 'pcs',
            autoUpdateStockOnInvoice: true,
            lowStockAlertLevel: 10,
            defaultWarehouse: 'Main Store',
          },
          invoiceSettings: {
            invoicePrefix: 'INV',
            invoiceSuffix: '',
            challanPrefix: 'CH',
            receiptPrefix: 'RCP',
            autoNumbering: true,
            termsAndConditions: 'Thank you for your business.',
            gstMode: 'Regular',
            defaultTaxRate: 18,
            showCompanyLogo: true,
            defaultPrintTemplate: 'Standard',
            pdfSaveLocation: '',
          },
        }),

      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          generalSettings: state.generalSettings,
          ledgerSettings: state.ledgerSettings,
          inventorySettings: state.inventorySettings,
          invoiceSettings: state.invoiceSettings,
          backupSettings: state.backupSettings,
          syncSettings: state.syncSettings,
          printSettings: state.printSettings,
          securitySettings: state.securitySettings,
        }, null, 2);
      },

      importSettings: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);
          set({
            generalSettings: imported.generalSettings || get().generalSettings,
            ledgerSettings: imported.ledgerSettings || get().ledgerSettings,
            inventorySettings: imported.inventorySettings || get().inventorySettings,
            invoiceSettings: imported.invoiceSettings || get().invoiceSettings,
            backupSettings: imported.backupSettings || get().backupSettings,
            syncSettings: imported.syncSettings || get().syncSettings,
            printSettings: imported.printSettings || get().printSettings,
            securitySettings: imported.securitySettings || get().securitySettings,
          });
          return true;
        } catch (error) {
          console.error('Failed to import settings:', error);
          return false;
        }
      },
    }),
    {
      name: 'malwa-crm-settings',
    }
  )
);

export default useSettingsStore;
