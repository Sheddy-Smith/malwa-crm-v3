import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useVendorStore from '@/store/vendorStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Download, FileText, Printer, Edit, Trash2, Search, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dbOperations } from '@/lib/db';
import { subscribeToEntity, broadcastDataChange } from '@/utils/dataSync';
import { VoucherForm } from '@/pages/accounts/Voucher';



const ManualEntryForm = ({ vendorId, entry, onSave, onCancel }) => {
  const isEditMode = !!entry; // Check if editing existing entry
  
  const [formData, setFormData] = useState(
    entry || {
      entry_date: new Date().toISOString().split('T')[0],
      vehicle_no: '',
      owner_name: '',
      work: '',
      particulars: '',
      category: '',
      debit_amount: 0,
      credit_amount: 0,
      notes: '',
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vehicle_no) {
      toast.error('Vehicle No is required.');
      return;
    }
    if (!formData.owner_name) {
      toast.error('Owner Name is required.');
      return;
    }
    if (!formData.work) {
      toast.error('Work is required.');
      return;
    }
    if (parseFloat(formData.debit_amount) === 0 && parseFloat(formData.credit_amount) === 0) {
      toast.error('Either Debit or Credit amount must be greater than 0.');
      return;
    }
    // Set particulars from work field
    const dataToSave = { 
      ...formData, 
      vendor_id: vendorId,
      particulars: formData.work // Auto-set particulars from work
    };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date and Vehicle No Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
            📅 Entry Date *
          </label>
          <input
            type="date"
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            className="w-full p-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-blue-500 text-base font-medium"
            required
            disabled={isEditMode}
          />
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <label className="block text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            🚗 Vehicle No *
          </label>
          <input
            type="text"
            name="vehicle_no"
            value={formData.vehicle_no}
            onChange={handleChange}
            placeholder="e.g., PB01AB1234"
            className="w-full p-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-indigo-500 text-base uppercase"
            required
            disabled={isEditMode}
          />
        </div>
      </div>

      {/* Owner Name and Work Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
          <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">
            👤 Owner Name *
          </label>
          <input
            type="text"
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
            placeholder="e.g., Rajesh Kumar"
            className="w-full p-3 border-2 border-teal-300 dark:border-teal-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-teal-500 text-base"
            required
            disabled={isEditMode}
          />
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
            🔧 Work *
          </label>
          <input
            type="text"
            name="work"
            value={formData.work}
            onChange={handleChange}
            placeholder="e.g., Painting, Denting, Body Work"
            className="w-full p-3 border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-purple-500 text-base"
            required
            disabled={isEditMode}
          />
        </div>
      </div>

      {/* Debit and Credit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
          <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            💸 Debit Amount (Payable)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400 font-bold text-lg">₹</span>
            <input
              type="number"
              name="debit_amount"
              value={formData.debit_amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border-2 border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-red-500 text-base font-semibold"
            />
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Amount you owe to vendor</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
          <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
            💰 Credit Amount (Paid)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 font-bold text-lg">₹</span>
            <input
              type="number"
              name="credit_amount"
              value={formData.credit_amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border-2 border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-green-500 text-base font-semibold"
            />
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Amount you paid to vendor</p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
          📌 Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Add any additional details, reference numbers, or comments..."
          className="w-full p-3 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg bg-white dark:bg-dark-card dark:text-dark-text focus:ring-2 focus:ring-yellow-500 text-base resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} className="px-6">
          ✖ Cancel
        </Button>
        <Button type="submit" className="px-6">
          {entry ? '✓ Update Entry' : '+ Add Entry'}
        </Button>
      </div>
    </form>
  );
};

const VendorLedgerTab = () => {
  const { vendors, fetchVendors } = useVendorStore();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [vendorVouchers, setVendorVouchers] = useState([]);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categorySearch: '',
  });

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (selectedVendorId) {
      fetchLedgerEntries();
      fetchVendorVouchers();
    } else {
      setLedgerEntries([]);
      setVendorVouchers([]);
    }
  }, [selectedVendorId, filters]);

  // Auto-refresh when page becomes visible or focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedVendorId) {
        fetchLedgerEntries();
      }
    };

    const handleFocus = () => {
      if (selectedVendorId) {
        fetchLedgerEntries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedVendorId, filters]);

  // Listen for voucher changes from Accounts module
  useEffect(() => {
    const unsubscribe = subscribeToEntity('voucher', ({ action, data }) => {
      console.log('[VendorLedger] Voucher event received:', action, data);
      if (data?.payee_type === 'vendor' && data?.payee_id === selectedVendorId) {
        console.log('[VendorLedger] Voucher change detected for current vendor, refreshing...');
        // Immediate refresh
        setTimeout(() => {
          fetchLedgerEntries();
          fetchVendorVouchers();
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [selectedVendorId]);

  // Add polling for real-time updates every 5 seconds
  useEffect(() => {
    if (!selectedVendorId) return;

    const pollInterval = setInterval(() => {
      fetchLedgerEntries(true); // Pass silent flag to prevent loading indicator
      fetchVendorVouchers();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [selectedVendorId, filters]);

  const fetchLedgerEntries = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let data;
      try {
        data = await dbOperations.getByIndex('vendor_ledger_entries', 'vendor_id', selectedVendorId);
      } catch (indexError) {
        console.warn('Index not available, using fallback:', indexError);
        // Fallback: get all entries and filter manually
        const allEntries = await dbOperations.getAll('vendor_ledger_entries');
        data = allEntries.filter(entry => entry.vendor_id === selectedVendorId);
      }
      
      data = Array.isArray(data) ? data : [];

      let filteredData = data.sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date)));
      if (filters.startDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) >= filters.startDate);
      }
      if (filters.endDate) {
        filteredData = filteredData.filter(e => String(e.entry_date) <= filters.endDate);
      }

      if (filters.categorySearch) {
        filteredData = filteredData.filter((entry) =>
          entry.category?.toLowerCase().includes(filters.categorySearch.toLowerCase())
        );
      }

      setLedgerEntries(filteredData);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      if (!silent) toast.error('Failed to load ledger entries: ' + error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchVendorVouchers = async () => {
    if (!selectedVendorId) return;
    try {
      const allVouchers = await dbOperations.getAll('vouchers');
      const filtered = allVouchers.filter(
        v => v.payee_type === 'vendor' && v.payee_id === selectedVendorId
      );
      setVendorVouchers(filtered);
    } catch (error) {
      console.error('Error fetching vendor vouchers:', error);
    }
  };

  const handleAddEntry = async (entryData) => {
    try {
      await dbOperations.insert('vendor_ledger_entries', {
        ...entryData,
        entry_type: 'manual',
      });

      toast.success('Manual entry added successfully!');
      setIsModalOpen(false);
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add entry');
    }
  };

  const handleEditEntry = async (entryData) => {
    try {
      await dbOperations.update('vendor_ledger_entries', editingEntry.id, entryData);

      toast.success('Entry updated successfully!');
      setIsModalOpen(false);
      setEditingEntry(null);
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry.');
    }
  };

  const handleDeleteEntry = async () => {
    try {
      await dbOperations.delete('vendor_ledger_entries', entryToDelete.id);

      toast.success('Entry deleted successfully!');
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry.');
    }
  };

  const handleSaveVoucher = async (voucherData) => {
    try {
      // Generate voucher number
      const allVouchers = await dbOperations.getAll('vouchers');
      const voucherNo = `VCH-${String(allVouchers.length + 1).padStart(5, '0')}`;
      
      const voucherRecord = {
        ...voucherData,
        voucher_no: voucherNo,
        amount: parseFloat(voucherData.amount),
        created_at: new Date().toISOString(),
        id: `v_${Date.now()}`,
      };

      // Save voucher
      await dbOperations.insert('vouchers', voucherRecord);

      // Create ledger entry for vendor
      if (voucherData.payee_type === 'vendor' && voucherData.payee_id) {
        const ledgerEntry = {
          id: `vle_${Date.now()}`,
          vendor_id: voucherData.payee_id,
          entry_date: voucherData.voucher_date,
          vehicle_no: '',
          owner_name: '',
          work: voucherData.particulars || 'Payment Voucher',
          particulars: voucherData.particulars || 'Payment Voucher',
          category: 'Payment',
          debit_amount: 0,
          credit_amount: parseFloat(voucherData.amount),
          reference_type: 'voucher',
          reference_id: voucherRecord.id,
          notes: voucherData.notes || '',
          created_at: new Date().toISOString(),
        };
        
        await dbOperations.insert('vendor_ledger_entries', ledgerEntry);
      }

      toast.success('Voucher created and added to vendor ledger!');
      
      // Broadcast data change
      broadcastDataChange('voucher', 'created', {
        voucher: voucherRecord,
        payee_type: voucherData.payee_type,
        payee_id: voucherData.payee_id
      });

      setIsVoucherModalOpen(false);
      fetchLedgerEntries();
      fetchVendorVouchers();
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error('Failed to save voucher');
    }
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const openDeleteModal = (entry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const calculateRunningBalance = () => {
    const openingBalance = parseFloat(selectedVendor?.opening_balance || 0);
    let balance = openingBalance;
    return ledgerEntries.map((entry) => {
      balance += parseFloat(entry.debit_amount || 0) - parseFloat(entry.credit_amount || 0);
      return { ...entry, running_balance: balance };
    });
  };

  const entriesWithBalance = calculateRunningBalance();
  const currentBalance = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance
    : parseFloat(selectedVendor?.opening_balance || 0);

  // Calculate period-specific balances
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const startOfMonth = `${currentMonth}-01`;
  
  // Opening balance from vendor record
  const openingBalance = parseFloat(selectedVendor?.opening_balance || 0);
  
  const previousMonthEntries = ledgerEntries.filter(e => e.entry_date < startOfMonth);
  const previousBalance = openingBalance + previousMonthEntries.reduce(
    (bal, e) => bal + (parseFloat(e.debit_amount) || 0) - (parseFloat(e.credit_amount) || 0), 
    0
  );
  
  const currentMonthEntries = ledgerEntries.filter(
    e => e.entry_date >= startOfMonth && e.entry_date <= new Date().toISOString().split('T')[0]
  );
  const currentMonthDebit = currentMonthEntries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
  const currentMonthCredit = currentMonthEntries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
  const currentMonthBalance = currentMonthDebit - currentMonthCredit;
  
  const totalVoucherPayments = vendorVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const netBalance = previousBalance + currentMonthBalance;

  const exportToCSV = () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor first');
      return;
    }

    const headers = ['Date', 'Particulars', 'Category', 'Ref No', 'Debit', 'Credit', 'Balance'];
    const csvContent = [
      `Vendor Ledger - ${selectedVendor.name}`,
      `Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`,
      '',
      headers.join(','),
      ...entriesWithBalance.map((e) =>
        [
          e.entry_date,
          e.particulars,
          e.category || '',
          e.reference_no || '',
          e.debit_amount || 0,
          e.credit_amount || 0,
          e.running_balance.toFixed(2),
        ].join(',')
      ),
      '',
      `Final Balance,,,,,${currentBalance.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_ledger_${selectedVendor.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Ledger exported to CSV');
  };

  const saveToPDF = () => {
    try {
      if (!selectedVendor) {
        toast.error('Please select a vendor first');
        return;
      }

      console.log('[PDF] Starting PDF generation...');
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode for better table fit
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text('Vendor Ledger', 14, 15);
      
      // Vendor Info Box
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.rect(14, 22, 130, 25, 'F');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Vendor: ${selectedVendor.name}`, 18, 28);
      doc.text(`Phone: ${selectedVendor.phone || '-'}`, 18, 34);
      doc.text(`Type: ${selectedVendor.serviceType || '-'}`, 18, 40);
      doc.text(`Company: ${selectedVendor.company || '-'}`, 80, 28);
      
      // Balance Cards
      const startY = 22;
      const cardWidth = 35;
      const cardHeight = 20;
      let cardX = 150;
      
      // Previous Balance (Yellow)
      doc.setFillColor(254, 252, 232);
      doc.rect(cardX, startY, cardWidth, cardHeight, 'F');
      doc.setDrawColor(253, 224, 71);
      doc.rect(cardX, startY, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(161, 98, 7);
      doc.text('Previous Balance', cardX + 2, startY + 5);
      doc.setFontSize(12);
      doc.setTextColor(120, 53, 15);
      doc.text(`Rs ${Math.abs(previousBalance).toLocaleString('en-IN')}`, cardX + 2, startY + 12);
      
      // Current Month (Blue)
      cardX += cardWidth + 2;
      doc.setFillColor(239, 246, 255);
      doc.rect(cardX, startY, cardWidth, cardHeight, 'F');
      doc.setDrawColor(147, 197, 253);
      doc.rect(cardX, startY, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(29, 78, 216);
      doc.text('Current Month', cardX + 2, startY + 5);
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text(`Rs ${Math.abs(currentMonthBalance).toLocaleString('en-IN')}`, cardX + 2, startY + 12);
      
      // Total Payments (Purple)
      cardX = 150;
      const cardY = startY + cardHeight + 2;
      doc.setFillColor(250, 245, 255);
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
      doc.setDrawColor(216, 180, 254);
      doc.rect(cardX, cardY, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(126, 34, 206);
      doc.text('Total Payments', cardX + 2, cardY + 5);
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text(`Rs ${totalVoucherPayments.toLocaleString('en-IN')}`, cardX + 2, cardY + 12);
      
      // Net Balance (Indigo/Red/Green)
      cardX += cardWidth + 2;
      const balanceColor = netBalance > 0 ? [254, 242, 242] : [240, 253, 244]; // Red or Green bg
      doc.setFillColor(...balanceColor);
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
      doc.setDrawColor(netBalance > 0 ? 252 : 134, netBalance > 0 ? 165 : 239, netBalance > 0 ? 165 : 172);
      doc.rect(cardX, cardY, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(netBalance > 0 ? 185 : 21, netBalance > 0 ? 28 : 128, netBalance > 0 ? 28 : 61);
      doc.text('Net Balance', cardX + 2, cardY + 5);
      doc.setFontSize(12);
      doc.setTextColor(netBalance > 0 ? 153 : 22, netBalance > 0 ? 27 : 163, netBalance > 0 ? 27 : 74);
      doc.text(`Rs ${Math.abs(netBalance).toLocaleString('en-IN')}`, cardX + 2, cardY + 12);
      doc.setFontSize(7);
      doc.text(netBalance > 0 ? '(Payable)' : '(Paid)', cardX + 2, cardY + 17);
      
      // Table
      console.log('[PDF] Preparing table data...');
      const tableData = entriesWithBalance.map(entry => [
        new Date(entry.entry_date).toLocaleDateString('en-GB'),
        entry.vehicle_no || '-',
        entry.owner_name || '-',
        (entry.work || entry.particulars || '-').substring(0, 50),
        parseFloat(entry.debit_amount || 0) > 0 ? `Rs ${parseFloat(entry.debit_amount).toFixed(2)}` : '-',
        parseFloat(entry.credit_amount || 0) > 0 ? `Rs ${parseFloat(entry.credit_amount).toFixed(2)}` : '-',
      ]);
      
      console.log('[PDF] Rendering table...');
      autoTable(doc, {
        startY: 70,
        head: [['Date', 'Vehicle No', 'Owner Name', 'Work', 'Debit', 'Credit']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [249, 250, 251],
          textColor: [55, 65, 81],
          fontStyle: 'bold',
          lineWidth: 0.5,
          lineColor: [209, 213, 219]
        },
        bodyStyles: {
          textColor: [31, 41, 55],
          lineWidth: 0.5,
          lineColor: [229, 231, 235]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 80 },
          4: { cellWidth: 35, halign: 'right', textColor: [220, 38, 38] },
          5: { cellWidth: 35, halign: 'right', textColor: [22, 163, 74] }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 14, right: 14 }
      });
      
      // Final Balance
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(220, 38, 38);
      doc.rect(14, finalY, 80, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('Final Balance', 18, finalY + 8);
      doc.setFontSize(16);
      doc.setTextColor(netBalance > 0 ? 220 : 22, netBalance > 0 ? 38 : 163, netBalance > 0 ? 38 : 74);
      doc.text(`Rs ${Math.abs(currentBalance).toFixed(2)}`, 100, finalY + 8);
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 14, finalY + 20);

      console.log('[PDF] Saving PDF...');
      doc.save(`Vendor_Ledger_${selectedVendor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Colorful PDF saved successfully!');
    } catch (error) {
      console.error('[PDF] Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        title={editingEntry ? 'Edit Manual Entry' : 'Add Manual Entry'}
      >
        <ManualEntryForm
          vendorId={selectedVendorId}
          entry={editingEntry}
          onSave={editingEntry ? handleEditEntry : handleAddEntry}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry"
        message="Are you sure you want to delete this manual entry? This action cannot be undone."
      />

      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Create Payment Voucher"
        size="xl"
      >
        <VoucherForm
          voucher={null}
          onSave={handleSaveVoucher}
          onCancel={() => setIsVoucherModalOpen(false)}
          preselectedPayee={{ payee_type: 'vendor', payee_id: selectedVendorId }}
        />
      </Modal>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Select Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.vendor_type ? `(${v.vendor_type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Search Category
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.categorySearch}
                  onChange={(e) => setFilters({ ...filters, categorySearch: e.target.value })}
                  placeholder="e.g., Painter"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                if (!selectedVendorId) {
                  toast.error('Please select a vendor first');
                  return;
                }
                setIsModalOpen(true);
              }}
              disabled={!selectedVendorId}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Manual Entry
            </Button>

            <Button
              onClick={() => {
                if (!selectedVendorId) {
                  toast.error('Please select a vendor first');
                  return;
                }
                setIsVoucherModalOpen(true);
              }}
              disabled={!selectedVendorId}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Voucher ({vendorVouchers.length})
            </Button>

            <Button variant="secondary" onClick={exportToCSV} disabled={!selectedVendorId}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button variant="secondary" onClick={saveToPDF} disabled={!selectedVendorId}>
              <FileText className="h-4 w-4 mr-2" />
              Save PDF
            </Button>

            <Button variant="secondary" onClick={handlePrint} disabled={!selectedVendorId}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          {selectedVendor && (
            <>
              {/* Vendor Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Vendor</p>
                    <p className="font-semibold text-gray-900 dark:text-dark-text">{selectedVendor.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-dark-text">{selectedVendor.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Type</p>
                    <p className="font-semibold text-gray-900 dark:text-dark-text">
                      {selectedVendor.vendor_type || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Company</p>
                    <p className="font-semibold text-gray-900 dark:text-dark-text">
                      {selectedVendor.company_name || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Balance Blocks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Previous Balance</p>
                  <p className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                    ₹{Math.abs(previousBalance).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Current Month</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                    ₹{Math.abs(currentMonthBalance).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Total Payments</p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                    ₹{totalVoucherPayments.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Net Balance</p>
                  <p className={`text-xl font-bold ${
                    netBalance > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    ₹{Math.abs(netBalance).toLocaleString('en-IN')}
                    {netBalance > 0 ? ' (Payable)' : ' (Paid)'}
                  </p>
                </div>
              </div>
            </>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading entries...</span>
            </div>
          ) : !selectedVendorId ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-dark-text-secondary">
                Please select a vendor to view their ledger entries
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 w-24">Date</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 w-32">Vehicle No</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 w-32">Owner Name</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Work</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right w-20">Debit</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right w-20">Credit</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entriesWithBalance.length > 0 ? (
                      entriesWithBalance.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                            {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-3 text-gray-900 dark:text-dark-text font-medium">
                            {entry.vehicle_no || '-'}
                          </td>
                          <td className="p-3 text-gray-900 dark:text-dark-text">
                            {entry.owner_name || '-'}
                          </td>
                          <td className="p-3 text-gray-900 dark:text-dark-text">
                            {entry.work || entry.particulars || '-'}
                          </td>
                          <td className="p-3 text-right text-red-600 dark:text-red-400 font-medium">
                            {parseFloat(entry.debit_amount || 0) > 0
                              ? `₹${parseFloat(entry.debit_amount).toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '-'}
                          </td>
                          <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">
                            {parseFloat(entry.credit_amount || 0) > 0
                              ? `₹${parseFloat(entry.credit_amount).toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Button
                                variant="ghost"
                                className="p-2 h-auto"
                                onClick={() => openEditModal(entry)}
                                title="View/Edit Entry"
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="p-2 h-auto"
                                onClick={() => openDeleteModal(entry)}
                                title="Delete Entry"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center p-12">
                          <p className="text-gray-500 dark:text-dark-text-secondary">
                            No entries found for the selected filters
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {entriesWithBalance.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    Showing {entriesWithBalance.length} entries
                  </p>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">Final Balance</p>
                    <p
                      className={`text-2xl font-bold ${
                        currentBalance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      ₹{Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                      {currentBalance > 0 ? 'Amount Payable' : 'Amount in Credit'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VendorLedgerTab;
