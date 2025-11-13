import { create } from 'zustand';

const useLedgerStore = create((set, get) => ({
  entries: [],
  customers: [],
  selectedCustomer: null,
  filters: {
    dateFrom: null,
    dateTo: null,
    docType: 'all',
    status: 'all',
    amountMin: null,
    amountMax: null,
  },

  loadCustomerLedger: (customerId) => {
    const bills = JSON.parse(localStorage.getItem('customerBills') || '[]');
    const receipts = JSON.parse(localStorage.getItem('cashReceipts') || '[]');
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');

    const entries = [];

    bills.forEach(bill => {
      if (bill.customerName === customerId) {
        entries.push({
          id: `bill-${bill.date}-${bill.customerName}`,
          date: bill.date,
          docNo: `BILL-${entries.length + 1}`,
          docType: 'Invoice',
          reference: bill.item || '',
          notes: bill.notes || '',
          debit: parseFloat(bill.totalAmount || 0),
          credit: 0,
          partyId: customerId,
          category: bill.category || '',
          item: bill.item || '',
        });
      }
    });

    receipts.forEach(receipt => {
      if (receipt.name === customerId) {
        entries.push({
          id: `receipt-${receipt.id}`,
          date: receipt.date,
          docNo: `RCT-${receipt.id}`,
          docType: 'Receipt',
          reference: receipt.purpose,
          notes: receipt.paymentType,
          debit: 0,
          credit: parseFloat(receipt.amount || 0),
          partyId: customerId,
        });
      }
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    entries.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    set({ entries, selectedCustomer: customerId });
    return entries;
  },

  getCustomerKPIs: (customerId) => {
    const entries = get().entries;

    if (entries.length === 0) {
      return {
        openingBalance: 0,
        currentOutstanding: 0,
        overdueAmount: 0,
        lastPayment: { date: null, amount: 0 },
        avgPaymentDays: 0,
        creditUtilization: 0,
      };
    }

    const currentOutstanding = entries[entries.length - 1]?.balance || 0;
    const receipts = entries.filter(e => e.docType === 'Receipt');
    const lastPayment = receipts.length > 0 ? {
      date: receipts[receipts.length - 1].date,
      amount: receipts[receipts.length - 1].credit,
    } : { date: null, amount: 0 };

    const today = new Date();
    const overdueEntries = entries.filter(e => {
      if (e.docType !== 'Invoice') return false;
      const dueDate = new Date(e.date);
      dueDate.setDate(dueDate.getDate() + 30);
      return dueDate < today && e.balance > 0;
    });
    const overdueAmount = overdueEntries.reduce((sum, e) => sum + e.debit, 0);

    const invoices = entries.filter(e => e.docType === 'Invoice');
    let totalDays = 0;
    let paidCount = 0;
    invoices.forEach(inv => {
      const matchingReceipt = receipts.find(r =>
        new Date(r.date) > new Date(inv.date)
      );
      if (matchingReceipt) {
        const days = Math.floor((new Date(matchingReceipt.date) - new Date(inv.date)) / (1000 * 60 * 60 * 24));
        totalDays += days;
        paidCount++;
      }
    });
    const avgPaymentDays = paidCount > 0 ? Math.round(totalDays / paidCount) : 0;

    return {
      openingBalance: 0,
      currentOutstanding,
      overdueAmount,
      lastPayment,
      avgPaymentDays,
      creditUtilization: 0,
    };
  },

  getAgingBuckets: (customerId) => {
    const entries = get().entries;
    const today = new Date();

    const buckets = {
      '0-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '91-120': { amount: 0, count: 0 },
      '120+': { amount: 0, count: 0 },
    };

    entries
      .filter(e => e.docType === 'Invoice' && e.balance > 0)
      .forEach(entry => {
        const daysDiff = Math.floor((today - new Date(entry.date)) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 30) {
          buckets['0-30'].amount += entry.debit;
          buckets['0-30'].count++;
        } else if (daysDiff <= 60) {
          buckets['31-60'].amount += entry.debit;
          buckets['31-60'].count++;
        } else if (daysDiff <= 90) {
          buckets['61-90'].amount += entry.debit;
          buckets['61-90'].count++;
        } else if (daysDiff <= 120) {
          buckets['91-120'].amount += entry.debit;
          buckets['91-120'].count++;
        } else {
          buckets['120+'].amount += entry.debit;
          buckets['120+'].count++;
        }
      });

    return buckets;
  },

  setFilters: (filters) => set({ filters }),

  getFilteredEntries: () => {
    const { entries, filters } = get();

    return entries.filter(entry => {
      if (filters.dateFrom && new Date(entry.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(entry.date) > new Date(filters.dateTo)) return false;
      if (filters.docType !== 'all' && entry.docType !== filters.docType) return false;
      if (filters.amountMin && (entry.debit + entry.credit) < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && (entry.debit + entry.credit) > parseFloat(filters.amountMax)) return false;

      return true;
    });
  },

  addLedgerEntry: (entry) => {
    const entries = [...get().entries, entry];
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    entries.forEach(e => {
      runningBalance += e.debit - e.credit;
      e.balance = runningBalance;
    });

    set({ entries });
  },

  exportToCSV: (customerId, entries) => {
    const headers = ['Date', 'Doc No', 'Type', 'Reference', 'Notes', 'Debit', 'Credit', 'Balance'];
    const rows = entries.map(e => [
      e.date,
      e.docNo,
      e.docType,
      e.reference,
      e.notes,
      e.debit.toFixed(2),
      e.credit.toFixed(2),
      e.balance.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  },
}));

export default useLedgerStore;
