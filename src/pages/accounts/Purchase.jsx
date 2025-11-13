import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Download, Printer, Search, FileText } from 'lucide-react';

const PurchaseInvoiceForm = ({ invoice, suppliers, inventoryItems, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    invoice || {
      invoice_no: '',
      invoice_date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      item_id: '',
      quantity: 0,
      unit_price: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      vehicle_no: '',
      source: '',
      payment_status: 'pending',
      notes: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast.error('Supplier is required.');
      return;
    }
    if (!formData.item_id) {
      toast.error('Item is required.');
      return;
    }
    if (parseFloat(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0.');
      return;
    }
    if (parseFloat(formData.unit_price) <= 0) {
      toast.error('Unit price must be greater than 0.');
      return;
    }
    onSave(formData);
  };

  const selectedItem = inventoryItems.find((item) => item.id === formData.item_id);
  const subtotal = parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0);
  const cgstAmount = (subtotal * parseFloat(formData.cgst_rate || 0)) / 100;
  const sgstAmount = (subtotal * parseFloat(formData.sgst_rate || 0)) / 100;
  const igstAmount = (subtotal * parseFloat(formData.igst_rate || 0)) / 100;
  const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Invoice No
          </label>
          <input
            type="text"
            name="invoice_no"
            value={formData.invoice_no}
            onChange={handleChange}
            placeholder="Auto-generated if empty"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Invoice Date *
          </label>
          <input
            type="date"
            name="invoice_date"
            value={formData.invoice_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Supplier *
        </label>
        <select
          name="supplier_id"
          value={formData.supplier_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="">Select Supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Item *
        </label>
        <select
          name="item_id"
          value={formData.item_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="">Select Item</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.item_name} ({item.unit})
            </option>
          ))}
        </select>
        {selectedItem && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current Stock: {selectedItem.current_stock} {selectedItem.unit}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Quantity * {selectedItem && `(${selectedItem.unit})`}
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Unit Price * (₹)
          </label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-dark-text">GST Details</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              CGST (%)
            </label>
            <input
              type="number"
              name="cgst_rate"
              value={formData.cgst_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              SGST (%)
            </label>
            <input
              type="number"
              name="sgst_rate"
              value={formData.sgst_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              IGST (%)
            </label>
            <input
              type="number"
              name="igst_rate"
              value={formData.igst_rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Vehicle No
          </label>
          <input
            type="text"
            name="vehicle_no"
            value={formData.vehicle_no}
            onChange={handleChange}
            placeholder="e.g., MP09-AB-1234"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Source
          </label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="e.g., Local Market"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Payment Status
        </label>
        <select
          name="payment_status"
          value={formData.payment_status}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        >
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
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
          placeholder="Additional notes..."
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-dark-text-secondary">Subtotal:</span>
          <span className="font-medium text-gray-900 dark:text-dark-text">₹{subtotal.toFixed(2)}</span>
        </div>
        {cgstAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-dark-text-secondary">CGST ({formData.cgst_rate}%):</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">₹{cgstAmount.toFixed(2)}</span>
          </div>
        )}
        {sgstAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-dark-text-secondary">SGST ({formData.sgst_rate}%):</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">₹{sgstAmount.toFixed(2)}</span>
          </div>
        )}
        {igstAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-dark-text-secondary">IGST ({formData.igst_rate}%):</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">₹{igstAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold border-t border-gray-300 dark:border-gray-600 pt-2">
          <span className="text-gray-900 dark:text-dark-text">Total Amount:</span>
          <span className="text-green-600 dark:text-green-400">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{invoice ? 'Update Invoice' : 'Save Invoice'}</Button>
      </div>
    </form>
  );
};

const Purchase = () => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchInventoryItems();
    fetchInvoices();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, item_name, unit, current_stock')
        .order('item_name');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast.error('Failed to load inventory items');
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, name),
          item:inventory_items(id, item_name, unit)
        `)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load purchase invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      const subtotal = parseFloat(invoiceData.quantity) * parseFloat(invoiceData.unit_price);
      const cgst = (subtotal * parseFloat(invoiceData.cgst_rate || 0)) / 100;
      const sgst = (subtotal * parseFloat(invoiceData.sgst_rate || 0)) / 100;
      const igst = (subtotal * parseFloat(invoiceData.igst_rate || 0)) / 100;
      const total = subtotal + cgst + sgst + igst;

      const purchaseRecord = {
        ...invoiceData,
        subtotal,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: total,
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from('purchases')
          .update(purchaseRecord)
          .eq('id', editingInvoice.id);

        if (error) throw error;
        toast.success('Purchase invoice updated successfully!');
      } else {
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('purchases')
          .insert([purchaseRecord])
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([{
            item_id: newInvoice.item_id,
            movement_type: 'in',
            quantity: newInvoice.quantity,
            movement_date: newInvoice.invoice_date,
            reference_type: 'purchase',
            reference_id: newInvoice.id,
            reference_no: newInvoice.invoice_no || `PUR-${newInvoice.id}`,
            notes: `Purchase from ${suppliers.find(s => s.id === newInvoice.supplier_id)?.name || 'supplier'}`,
          }]);

        if (movementError) throw movementError;

        const { error: ledgerError } = await supabase
          .from('supplier_ledger_entries')
          .insert([{
            supplier_id: newInvoice.supplier_id,
            entry_type: 'debit',
            amount: newInvoice.total_amount,
            entry_date: newInvoice.invoice_date,
            reference_type: 'purchase',
            reference_id: newInvoice.id,
            reference_no: newInvoice.invoice_no || `PUR-${newInvoice.id}`,
            notes: `Purchase invoice - ${inventoryItems.find(i => i.id === newInvoice.item_id)?.item_name || 'item'}`,
          }]);

        if (ledgerError) throw ledgerError;

        const totalGst = cgst + sgst + igst;
        if (totalGst > 0) {
          const { error: gstError } = await supabase
            .from('gst_ledger')
            .insert([{
              transaction_date: newInvoice.invoice_date,
              transaction_type: 'purchase',
              document_no: newInvoice.invoice_no || `PUR-${newInvoice.id}`,
              party_name: suppliers.find(s => s.id === newInvoice.supplier_id)?.name || '',
              taxable_amount: subtotal,
              cgst_amount: cgst,
              sgst_amount: sgst,
              igst_amount: igst,
              total_gst: totalGst,
              entry_type: 'input_credit',
              reference_type: 'purchase',
              reference_id: newInvoice.id,
            }]);

          if (gstError) throw gstError;
        }

        toast.success('Purchase invoice created successfully with stock & ledger entries!');
      }

      setIsModalOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save purchase invoice');
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (error) throw error;

      toast.success('Purchase invoice deleted successfully.');
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice. It may be referenced in other records.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Invoice No', 'Date', 'Supplier', 'Item', 'Quantity', 'Unit Price', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map((inv) =>
        [
          inv.invoice_no || `PUR-${inv.id}`,
          inv.invoice_date,
          inv.supplier?.name || '',
          inv.item?.item_name || '',
          inv.quantity,
          inv.unit_price,
          inv.subtotal,
          inv.cgst_amount,
          inv.sgst_amount,
          inv.igst_amount,
          inv.total_amount,
          inv.payment_status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Purchase invoices exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.item?.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading purchase invoices...</span>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        title={editingInvoice ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}
      >
        <PurchaseInvoiceForm
          invoice={editingInvoice}
          suppliers={suppliers}
          inventoryItems={inventoryItems}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingInvoice(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteInvoice}
        title="Delete Purchase Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoice_no || `PUR-${invoiceToDelete?.id}`}"? This will also remove related stock movements and ledger entries.`}
      />

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">Purchase Invoices</h3>
          <Button
            onClick={() => {
              if (suppliers.length === 0) {
                toast.error('Please add suppliers first in the Supplier module');
                return;
              }
              if (inventoryItems.length === 0) {
                toast.error('Please add inventory items first');
                return;
              }
              setIsModalOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Purchase Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice no, supplier, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-2 mb-4">
          <Button variant="secondary" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Invoice No</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Item</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Qty</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Total</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">
                      {invoice.invoice_no || `PUR-${invoice.id}`}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {invoice.supplier?.name || '-'}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {invoice.item?.item_name || '-'}
                    </td>
                    <td className="p-3 text-right text-gray-700 dark:text-dark-text-secondary">
                      {parseFloat(invoice.quantity).toFixed(2)} {invoice.item?.unit}
                    </td>
                    <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">
                      ₹{parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : invoice.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {invoice.payment_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setInvoiceToDelete(invoice);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-12">
                    <div className="flex flex-col items-center text-gray-500 dark:text-dark-text-secondary">
                      <FileText className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No purchase invoices found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter
                          ? 'Try adjusting your filters'
                          : 'Add your first purchase invoice to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredInvoices.length} of {invoices.length} invoice(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default Purchase;
