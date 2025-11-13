import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Download, Printer, Search, Receipt } from 'lucide-react';

const VoucherForm = ({ voucher, vendors, labour, suppliers, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    voucher || {
      voucher_no: '',
      voucher_date: new Date().toISOString().split('T')[0],
      party_type: 'vendor',
      party_id: '',
      amount: 0,
      payment_method: 'cash',
      upi_id: '',
      bank_details: '',
      reference_no: '',
      notes: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'party_type') {
      setFormData({ ...formData, party_type: value, party_id: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.party_id) {
      toast.error('Party is required.');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }
    if (formData.payment_method === 'upi' && !formData.upi_id) {
      toast.error('UPI ID is required for UPI payments.');
      return;
    }
    if (formData.payment_method === 'bank' && !formData.bank_details) {
      toast.error('Bank details are required for bank transfers.');
      return;
    }
    onSave(formData);
  };

  const getPartyList = () => {
    switch (formData.party_type) {
      case 'vendor':
        return vendors;
      case 'labour':
        return labour;
      case 'supplier':
        return suppliers;
      default:
        return [];
    }
  };

  const partyList = getPartyList();
  const selectedParty = partyList.find((p) => p.id === formData.party_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Voucher No
          </label>
          <input
            type="text"
            name="voucher_no"
            value={formData.voucher_no}
            onChange={handleChange}
            placeholder="Auto-generated if empty"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Voucher Date *
          </label>
          <input
            type="date"
            name="voucher_date"
            value={formData.voucher_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Party Type *
        </label>
        <select
          name="party_type"
          value={formData.party_type}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="vendor">Vendor</option>
          <option value="labour">Labour</option>
          <option value="supplier">Supplier</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Party Name *
        </label>
        <select
          name="party_id"
          value={formData.party_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="">Select {formData.party_type}</option>
          {partyList.map((party) => (
            <option key={party.id} value={party.id}>
              {party.name}
            </option>
          ))}
        </select>
        {selectedParty && selectedParty.balance !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current Balance: ₹{parseFloat(selectedParty.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Amount * (₹)
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Payment Method *
        </label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          required
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank Transfer</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      {formData.payment_method === 'upi' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            UPI ID *
          </label>
          <input
            type="text"
            name="upi_id"
            value={formData.upi_id}
            onChange={handleChange}
            placeholder="e.g., example@upi"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      )}

      {formData.payment_method === 'bank' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Bank Details *
          </label>
          <input
            type="text"
            name="bank_details"
            value={formData.bank_details}
            onChange={handleChange}
            placeholder="Account No / IFSC"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      )}

      {(formData.payment_method === 'cheque' || formData.payment_method === 'bank') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Reference No
          </label>
          <input
            type="text"
            name="reference_no"
            value={formData.reference_no}
            onChange={handleChange}
            placeholder="Cheque No / Transaction ID"
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Payment details or remarks..."
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{voucher ? 'Update Voucher' : 'Save Voucher'}</Button>
      </div>
    </form>
  );
};

const Voucher = () => {
  const [vouchers, setVouchers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [labour, setLabour] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');

  useEffect(() => {
    fetchAllParties();
    fetchVouchers();
  }, []);

  const fetchAllParties = async () => {
    try {
      const [vendorsRes, labourRes, suppliersRes] = await Promise.all([
        supabase.from('vendors').select('id, name, balance').order('name'),
        supabase.from('labour').select('id, name, balance').order('name'),
        supabase.from('suppliers').select('id, name, balance').order('name'),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (labourRes.error) throw labourRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      setVendors(vendorsRes.data || []);
      setLabour(labourRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast.error('Failed to load party lists');
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('voucher_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoucher = async (voucherData) => {
    try {
      if (editingVoucher) {
        const { error } = await supabase
          .from('vouchers')
          .update(voucherData)
          .eq('id', editingVoucher.id);

        if (error) throw error;
        toast.success('Voucher updated successfully!');
      } else {
        const { data: newVoucher, error: voucherError } = await supabase
          .from('vouchers')
          .insert([voucherData])
          .select()
          .single();

        if (voucherError) throw voucherError;

        let ledgerTable = '';
        let partyIdField = '';
        let partyName = '';

        switch (newVoucher.party_type) {
          case 'vendor':
            ledgerTable = 'vendor_ledger_entries';
            partyIdField = 'vendor_id';
            partyName = vendors.find((v) => v.id === newVoucher.party_id)?.name || '';
            break;
          case 'labour':
            ledgerTable = 'labour_ledger_entries';
            partyIdField = 'labour_id';
            partyName = labour.find((l) => l.id === newVoucher.party_id)?.name || '';
            break;
          case 'supplier':
            ledgerTable = 'supplier_ledger_entries';
            partyIdField = 'supplier_id';
            partyName = suppliers.find((s) => s.id === newVoucher.party_id)?.name || '';
            break;
          default:
            throw new Error('Invalid party type');
        }

        const { error: ledgerError } = await supabase.from(ledgerTable).insert([
          {
            [partyIdField]: newVoucher.party_id,
            entry_type: 'credit',
            amount: newVoucher.amount,
            entry_date: newVoucher.voucher_date,
            reference_type: 'voucher',
            reference_id: newVoucher.id,
            reference_no: newVoucher.voucher_no || `VOU-${newVoucher.id}`,
            notes: `Payment made - ${newVoucher.payment_method} ${newVoucher.reference_no ? `(Ref: ${newVoucher.reference_no})` : ''}`,
          },
        ]);

        if (ledgerError) throw ledgerError;

        toast.success(`Voucher created successfully! Ledger entry added for ${partyName}.`);
      }

      setIsModalOpen(false);
      setEditingVoucher(null);
      fetchVouchers();
      fetchAllParties();
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error('Failed to save voucher');
    }
  };

  const handleDeleteVoucher = async () => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', voucherToDelete.id);

      if (error) throw error;

      toast.success('Voucher deleted successfully.');
      setIsDeleteModalOpen(false);
      setVoucherToDelete(null);
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Failed to delete voucher. It may be referenced in ledger entries.');
    }
  };

  const getPartyName = (voucher) => {
    switch (voucher.party_type) {
      case 'vendor':
        return vendors.find((v) => v.id === voucher.party_id)?.name || '-';
      case 'labour':
        return labour.find((l) => l.id === voucher.party_id)?.name || '-';
      case 'supplier':
        return suppliers.find((s) => s.id === voucher.party_id)?.name || '-';
      default:
        return '-';
    }
  };

  const exportToCSV = () => {
    const headers = ['Voucher No', 'Date', 'Party Type', 'Party Name', 'Amount', 'Payment Method', 'Reference', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredVouchers.map((v) =>
        [
          v.voucher_no || `VOU-${v.id}`,
          v.voucher_date,
          v.party_type,
          getPartyName(v),
          v.amount,
          v.payment_method,
          v.reference_no || '-',
          v.notes || '-',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Vouchers exported to CSV');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const filteredVouchers = vouchers.filter((v) => {
    const partyName = getPartyName(v);
    const matchesSearch =
      v.voucher_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !partyTypeFilter || v.party_type === partyTypeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
          <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading vouchers...</span>
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
          setEditingVoucher(null);
        }}
        title={editingVoucher ? 'Edit Voucher' : 'New Payment Voucher'}
      >
        <VoucherForm
          voucher={editingVoucher}
          vendors={vendors}
          labour={labour}
          suppliers={suppliers}
          onSave={handleSaveVoucher}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingVoucher(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteVoucher}
        title="Delete Voucher"
        message={`Are you sure you want to delete voucher "${voucherToDelete?.voucher_no || `VOU-${voucherToDelete?.id}`}"? This will also affect related ledger entries.`}
      />

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">Payment Vouchers</h3>
          <Button
            onClick={() => {
              if (vendors.length === 0 && labour.length === 0 && suppliers.length === 0) {
                toast.error('Please add vendors, labour, or suppliers first');
                return;
              }
              setIsModalOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Voucher
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by voucher no, party name, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <select
            value={partyTypeFilter}
            onChange={(e) => setPartyTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Party Types</option>
            <option value="vendor">Vendor</option>
            <option value="labour">Labour</option>
            <option value="supplier">Supplier</option>
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
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Voucher No</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Party Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Amount</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Method</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((voucher) => (
                  <tr
                    key={voucher.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-dark-text">
                      {voucher.voucher_no || `VOU-${voucher.id}`}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                      {new Date(voucher.voucher_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          voucher.party_type === 'vendor'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : voucher.party_type === 'labour'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {voucher.party_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary">{getPartyName(voucher)}</td>
                    <td className="p-3 text-right font-medium text-red-600 dark:text-red-400">
                      ₹{parseFloat(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary capitalize">
                      {voucher.payment_method}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-dark-text-secondary text-sm">
                      {voucher.reference_no || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setEditingVoucher(voucher);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-2 h-auto"
                          onClick={() => {
                            setVoucherToDelete(voucher);
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
                      <Receipt className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No vouchers found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || partyTypeFilter
                          ? 'Try adjusting your filters'
                          : 'Create your first payment voucher to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredVouchers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Showing {filteredVouchers.length} of {vouchers.length} voucher(s)
          </div>
        )}
      </Card>
    </div>
  );
};

export default Voucher;
