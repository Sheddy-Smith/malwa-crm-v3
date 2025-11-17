import { useState, useEffect } from 'react';
import useSupplierStore from '@/store/supplierStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Download, FileText, Printer, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
import { dbOperations } from '@/lib/db';
import jsPDF from 'jspdf';

const ManualEntryForm = ({ supplierId, entry, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    entry || {
      entry_date: new Date().toISOString().split('T')[0],
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
    if (!formData.particulars) {
      toast.error('Particulars is required.');
      return;
    }
    if (parseFloat(formData.debit_amount) === 0 && parseFloat(formData.credit_amount) === 0) {
      toast.error('Either Debit or Credit amount must be greater than 0.');
      return;
    }
    onSave({ ...formData, supplier_id: supplierId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Date *
        </label>
        <input
          type="date"
          name="entry_date"
          value={formData.entry_date}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Particulars/Description *
        </label>
        <input
          type="text"
          name="particulars"
          value={formData.particulars}
          onChange={handleChange}
          placeholder="e.g., Opening Balance, Payment Adjustment"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Category
        </label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Hardware, Steel, Paints"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Debit (Paid) ₹
          </label>
          <input
            type="number"
            name="debit_amount"
            value={formData.debit_amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Credit (Owe) ₹
          </label>
          <input
            type="number"
            name="credit_amount"
            value={formData.credit_amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{entry ? 'Update Entry' : 'Add Entry'}</Button>
      </div>
    </form>
  );
};

const DocumentDetailsModal = ({ documentId, documentType, onClose }) => {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId, documentType]);

  const fetchDocumentDetails = async () => {
    if (!documentId || !documentType) return;

    setLoading(true);
    try {
      let storeName = '';
      if (documentType === 'purchase') storeName = 'purchases';
      else if (documentType === 'purchase_challan') storeName = 'purchase_challans';
      else if (documentType === 'voucher') storeName = 'vouchers';

      if (!storeName) {
        toast.error('Invalid document type');
        return;
      }

      const rec = await dbOperations.getById(storeName, documentId);
      setDocumentData(rec);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
        <span className="ml-3">Loading document...</span>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Document not found or has been deleted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">
          {documentType === 'purchase' && 'Purchase Invoice'}
          {documentType === 'purchase_challan' && 'Purchase Challan'}
          {documentType === 'voucher' && 'Payment Voucher'}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-dark-text-secondary">Document No:</span>
            <span className="ml-2 font-medium">{documentData.invoice_no || documentData.challan_no || documentData.voucher_no}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-dark-text-secondary">Date:</span>
            <span className="ml-2 font-medium">
              {new Date(documentData.invoice_date || documentData.challan_date || documentData.voucher_date).toLocaleDateString('en-GB')}
            </span>
          </div>
          {documentData.total_amount !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-dark-text-secondary">Amount:</span>
              <span className="ml-2 font-medium text-green-600">
                ₹{parseFloat(documentData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {documentData.payment_amount !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-dark-text-secondary">Payment:</span>
              <span className="ml-2 font-medium text-red-600">
                ₹{parseFloat(documentData.payment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {documentData.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Notes
          </label>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {documentData.notes}
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

const SupplierLedgerTab = () => {
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ id: null, type: null });

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categorySearch: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchLedgerEntries();
    } else {
      setLedgerEntries([]);
    }
  }, [selectedSupplierId, filters]);

  const fetchLedgerEntries = async () => {
    setLoading(true);
    try {
      let data = await dbOperations.getByIndex('supplier_ledger_entries', 'supplier_id', selectedSupplierId);
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
      toast.error('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (entryData) => {
    try {
      await dbOperations.insert('supplier_ledger_entries', {
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
      if (editingEntry.entry_type && editingEntry.entry_type !== 'manual') {
        throw new Error('Only manual entries can be edited.');
      }
      await dbOperations.update('supplier_ledger_entries', editingEntry.id, entryData);

      toast.success('Entry updated successfully!');
      setIsModalOpen(false);
      setEditingEntry(null);
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry. Only manual entries can be edited.');
    }
  };

  const handleDeleteEntry = async () => {
    try {
      if (entryToDelete.entry_type && entryToDelete.entry_type !== 'manual') {
        throw new Error('Only manual entries can be deleted.');
      }
      await dbOperations.delete('supplier_ledger_entries', entryToDelete.id);

      toast.success('Entry deleted successfully!');
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry. Only manual entries can be deleted.');
    }
  };

  const openEditModal = (entry) => {
    if (entry.entry_type !== 'manual') {
      toast.error('Only manual entries can be edited');
      return;
    }
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const openDeleteModal = (entry) => {
    if (entry.entry_type !== 'manual') {
      toast.error('Only manual entries can be deleted');
      return;
    }
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const openDocumentModal = (entry) => {
    if (entry.reference_id && entry.reference_type) {
      setSelectedDocument({
        id: entry.reference_id,
        type: entry.reference_type,
      });
      setIsDocumentModalOpen(true);
    } else {
      toast.error('No linked document found');
    }
  };

  const calculateRunningBalance = () => {
    let balance = 0;
    return ledgerEntries.map((entry) => {
      balance += parseFloat(entry.credit_amount || 0) - parseFloat(entry.debit_amount || 0);
      return { ...entry, running_balance: balance };
    });
  };

  const entriesWithBalance = calculateRunningBalance();
  const currentBalance = entriesWithBalance.length > 0
    ? entriesWithBalance[entriesWithBalance.length - 1].running_balance
    : 0;

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const exportToCSV = () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }

    const headers = ['Date', 'Particulars', 'Category', 'Ref No', 'Debit', 'Credit', 'Balance'];
    const csvContent = [
      `Supplier Ledger - ${selectedSupplier.name}`,
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
    a.download = `supplier_ledger_${selectedSupplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Ledger exported to CSV');
  };

  const saveToPDF = () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Supplier Ledger - ${selectedSupplier.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Category: ${selectedSupplier.category || 'N/A'}`, 14, 22);
    doc.text(`Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`, 14, 27);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 32);

    let yPos = 40;
    doc.setFontSize(9);
    doc.text('Date', 14, yPos);
    doc.text('Particulars', 40, yPos);
    doc.text('Debit', 120, yPos);
    doc.text('Credit', 145, yPos);
    doc.text('Balance', 170, yPos);

    yPos += 5;
    entriesWithBalance.forEach((e) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(e.entry_date, 14, yPos);
      doc.text(e.particulars.substring(0, 30), 40, yPos);
      doc.text(parseFloat(e.debit_amount || 0).toFixed(2), 120, yPos);
      doc.text(parseFloat(e.credit_amount || 0).toFixed(2), 145, yPos);
      doc.text(e.running_balance.toFixed(2), 170, yPos);
      yPos += 6;
    });

    yPos += 5;
    doc.setFontSize(11);
    doc.text(`Final Balance: ₹${currentBalance.toFixed(2)}`, 14, yPos);

    doc.save(`supplier_ledger_${selectedSupplier.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Ledger saved as PDF');
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
          supplierId={selectedSupplierId}
          entry={editingEntry}
          onSave={editingEntry ? handleEditEntry : handleAddEntry}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setSelectedDocument({ id: null, type: null });
        }}
        title="Document Details"
      >
        <DocumentDetailsModal
          documentId={selectedDocument.id}
          documentType={selectedDocument.type}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setSelectedDocument({ id: null, type: null });
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

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Select Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.category ? `(${s.category})` : ''}
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
                  placeholder="e.g., Hardware"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                if (!selectedSupplierId) {
                  toast.error('Please select a supplier first');
                  return;
                }
                setIsModalOpen(true);
              }}
              disabled={!selectedSupplierId}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Manual Entry
            </Button>

            <Button variant="secondary" onClick={exportToCSV} disabled={!selectedSupplierId}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button variant="secondary" onClick={saveToPDF} disabled={!selectedSupplierId}>
              <FileText className="h-4 w-4 mr-2" />
              Save PDF
            </Button>

            <Button variant="secondary" onClick={handlePrint} disabled={!selectedSupplierId}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          {selectedSupplier && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Supplier</p>
                  <p className="font-semibold text-gray-900 dark:text-dark-text">{selectedSupplier.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-dark-text">{selectedSupplier.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Category</p>
                  <p className="font-semibold text-gray-900 dark:text-dark-text">
                    {selectedSupplier.category || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Company</p>
                  <p className="font-semibold text-gray-900 dark:text-dark-text">
                    {selectedSupplier.company || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Current Balance</p>
                  <p
                    className={`font-bold text-lg ${
                      currentBalance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    ₹{Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {currentBalance > 0 ? ' (Owe)' : ' (Paid)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading entries...</span>
            </div>
          ) : !selectedSupplierId ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-dark-text-secondary">
                Please select a supplier to view their ledger entries
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Particulars</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Ref No</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Debit</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Credit</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Balance</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
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
                          <td className="p-3 text-gray-900 dark:text-dark-text">{entry.particulars}</td>
                          <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                            {entry.category || '-'}
                          </td>
                          <td className="p-3">
                            {entry.reference_no ? (
                              <button
                                onClick={() => openDocumentModal(entry)}
                                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {entry.reference_no}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </button>
                            ) : (
                              '-'
                            )}
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
                          <td className="p-3 text-right font-semibold text-gray-900 dark:text-dark-text">
                            ₹{Math.abs(entry.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            {entry.entry_type === 'manual' && (
                              <div className="flex justify-end items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  className="p-2 h-auto"
                                  onClick={() => openEditModal(entry)}
                                >
                                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="p-2 h-auto"
                                  onClick={() => openDeleteModal(entry)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center p-12">
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
                      {currentBalance > 0 ? 'Amount You Owe' : 'Amount Overpaid'}
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

export default SupplierLedgerTab;
