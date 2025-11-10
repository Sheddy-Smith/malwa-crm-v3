import useMultiplierStore from '@/store/multiplierStore';
import useInventoryStore from '@/store/inventoryStore';
import useCustomerStore from '@/store/customerStore';
import useVendorStore from '@/store/vendorStore';
import useSupplierStore from '@/store/supplierStore';
import useLedgerStore from '@/store/ledgerStore';

export const calculateItemTotal = (item) => {
  const { getCategoryMultiplier, getMultiplierByWorkType } = useMultiplierStore.getState();

  const baseAmount = (item.rate || 0) * (item.quantity || 1);

  let multiplier = 1;
  if (item.category) {
    multiplier = getCategoryMultiplier(item.category);
  } else if (item.workBy) {
    multiplier = getMultiplierByWorkType(item.workBy);
  }

  return baseAmount * multiplier;
};

export const calculateEstimateTotal = (items) => {
  if (!items || items.length === 0) return { subtotal: 0, tax: 0, total: 0 };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return { subtotal, tax, total };
};

export const updateInventoryFromEstimate = (estimateItems) => {
  const { stockItems, updateStockItem } = useInventoryStore.getState();

  estimateItems.forEach(item => {
    const stockItem = stockItems.find(s => s.name === item.name || s.itemCode === item.itemCode);
    if (stockItem && item.quantity) {
      const updatedItem = {
        ...stockItem,
        quantity: (stockItem.quantity || 0) - (item.quantity || 0),
      };
      updateStockItem(updatedItem);
    }
  });
};

export const createLedgerEntry = (type, entityId, entityName, amount, description, date = new Date()) => {
  const { addEntry } = useLedgerStore.getState();

  const entry = {
    id: Date.now().toString(),
    date: date.toISOString().split('T')[0],
    entityType: type,
    entityId: entityId,
    entityName: entityName,
    description: description,
    debit: amount > 0 ? amount : 0,
    credit: amount < 0 ? Math.abs(amount) : 0,
    balance: amount,
  };

  addEntry(entry);
  return entry;
};

export const syncJobToInvoice = (job) => {
  if (!job || !job.estimate) return null;

  const { subtotal, tax, total } = calculateEstimateTotal([
    ...(job.estimate.parts || []),
    ...(job.estimate.labour || []),
    ...(job.estimate.newBody || []),
  ]);

  return {
    jobId: job.id,
    jobNumber: job.jobNumber,
    customerName: job.customerName,
    vehicleNumber: job.vehicleNumber,
    items: [
      ...(job.estimate.parts || []),
      ...(job.estimate.labour || []),
      ...(job.estimate.newBody || []),
    ],
    subtotal,
    tax,
    total,
    date: new Date().toISOString().split('T')[0],
  };
};

export const createInvoiceFromJob = (job) => {
  const invoiceData = syncJobToInvoice(job);
  if (!invoiceData) return null;

  createLedgerEntry(
    'customer',
    job.customerId,
    job.customerName,
    invoiceData.total,
    `Invoice for Job ${job.jobNumber} - ${job.vehicleNumber}`
  );

  return invoiceData;
};

export const createChallanFromEstimate = (job, challanType = 'sell') => {
  if (!job || !job.estimate) return null;

  const items = [
    ...(job.estimate.parts || []),
    ...(job.estimate.newBody || []),
  ];

  const { subtotal, tax, total } = calculateEstimateTotal(items);

  return {
    jobId: job.id,
    jobNumber: job.jobNumber,
    type: challanType,
    customerName: job.customerName,
    vehicleNumber: job.vehicleNumber,
    items,
    subtotal,
    tax,
    total,
    date: new Date().toISOString().split('T')[0],
  };
};

export const recordPurchase = (supplierName, items, amount) => {
  const { suppliers } = useSupplierStore.getState();
  const supplier = suppliers.find(s => s.name === supplierName);

  if (supplier) {
    createLedgerEntry(
      'supplier',
      supplier.id,
      supplier.name,
      -amount,
      `Purchase from ${supplier.name}`
    );
  }

  items.forEach(item => {
    const { stockItems, addStockItem, updateStockItem } = useInventoryStore.getState();
    const existingItem = stockItems.find(s => s.name === item.name);

    if (existingItem) {
      updateStockItem({
        ...existingItem,
        quantity: (existingItem.quantity || 0) + (item.quantity || 0),
      });
    } else {
      addStockItem({
        ...item,
        quantity: item.quantity || 0,
      });
    }
  });
};

export const recordPayment = (type, entityId, entityName, amount, paymentMode = 'Cash') => {
  createLedgerEntry(
    type,
    entityId,
    entityName,
    -amount,
    `${paymentMode} Payment to ${entityName}`
  );

  return {
    date: new Date().toISOString().split('T')[0],
    type,
    entityId,
    entityName,
    amount,
    paymentMode,
  };
};

export const recordReceipt = (customerId, customerName, amount, paymentMode = 'Cash') => {
  createLedgerEntry(
    'customer',
    customerId,
    customerName,
    -amount,
    `${paymentMode} Receipt from ${customerName}`
  );

  return {
    date: new Date().toISOString().split('T')[0],
    customerId,
    customerName,
    amount,
    paymentMode,
  };
};

export const getCustomerBalance = (customerId) => {
  const { entries } = useLedgerStore.getState();
  const customerEntries = entries.filter(e => e.entityType === 'customer' && e.entityId === customerId);

  return customerEntries.reduce((balance, entry) => {
    return balance + (entry.debit || 0) - (entry.credit || 0);
  }, 0);
};

export const getVendorBalance = (vendorId) => {
  const { entries } = useLedgerStore.getState();
  const vendorEntries = entries.filter(e => e.entityType === 'vendor' && e.entityId === vendorId);

  return vendorEntries.reduce((balance, entry) => {
    return balance + (entry.debit || 0) - (entry.credit || 0);
  }, 0);
};

export const getSupplierBalance = (supplierId) => {
  const { entries } = useLedgerStore.getState();
  const supplierEntries = entries.filter(e => e.entityType === 'supplier' && e.entityId === supplierId);

  return supplierEntries.reduce((balance, entry) => {
    return balance + (entry.debit || 0) - (entry.credit || 0);
  }, 0);
};

export const generateGSTReport = (startDate, endDate) => {
  const { entries } = useLedgerStore.getState();

  const filteredEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
  });

  const totalSales = filteredEntries
    .filter(e => e.entityType === 'customer' && e.debit > 0)
    .reduce((sum, e) => sum + e.debit, 0);

  const totalPurchases = filteredEntries
    .filter(e => e.entityType === 'supplier' && e.credit > 0)
    .reduce((sum, e) => sum + e.credit, 0);

  const outputGST = totalSales * 0.18;
  const inputGST = totalPurchases * 0.18;
  const netGST = outputGST - inputGST;

  return {
    period: { startDate, endDate },
    totalSales,
    totalPurchases,
    outputGST,
    inputGST,
    netGST,
  };
};

export const createStockMovement = (itemId, itemName, type, quantity, reason, reference) => {
  const movement = {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    itemId,
    itemName,
    type,
    quantity,
    reason,
    reference,
  };

  const movements = JSON.parse(localStorage.getItem('stockMovements') || '[]');
  movements.push(movement);
  localStorage.setItem('stockMovements', JSON.stringify(movements));

  return movement;
};

export const getStockMovements = (itemId = null) => {
  const movements = JSON.parse(localStorage.getItem('stockMovements') || '[]');
  return itemId ? movements.filter(m => m.itemId === itemId) : movements;
};

export const dataFlowHelpers = {
  calculateItemTotal,
  calculateEstimateTotal,
  updateInventoryFromEstimate,
  createLedgerEntry,
  syncJobToInvoice,
  createInvoiceFromJob,
  createChallanFromEstimate,
  recordPurchase,
  recordPayment,
  recordReceipt,
  getCustomerBalance,
  getVendorBalance,
  getSupplierBalance,
  generateGSTReport,
  createStockMovement,
  getStockMovements,
};

export default dataFlowHelpers;
