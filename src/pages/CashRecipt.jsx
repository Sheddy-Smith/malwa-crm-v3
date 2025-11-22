import React, { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Trash2, PlusCircle } from "lucide-react";
import SearchBar from "../components/common/SearchBar";
import { toast } from 'sonner';
import { dbOperations } from '@/lib/db';
import { broadcastDataChange } from '@/utils/dataSync';

const CashRecipt = () => {
  const [open, setOpen] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [purpose, setPurpose] = useState("Payment for Invoice");
  const [paymentType, setPaymentType] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Received");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  useEffect(() => {
    loadReceipts();
    loadCustomers();
  }, []);

  useEffect(() => {
    setFilteredReceipts(receipts);
  }, [receipts]);

  const loadReceipts = async () => {
    try {
      const data = await dbOperations.getAll('cash_receipts');
      // Sort by date descending (recent first)
      const sorted = (data || []).sort((a, b) => new Date(b.receipt_date || b.created_at) - new Date(a.receipt_date || a.created_at));
      setReceipts(sorted);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setReceipts([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await dbOperations.getAll('customers');
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  // Total calculation
  const total = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const resetForm = () => {
    setName("");
    setCustomerId("");
    setPurpose("Payment for Invoice");
    setPaymentType("Cash");
    setAmount("");
    setStatus("Received");
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Please select a customer from the dropdown");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const receiptId = `receipt_${Date.now()}`;
      const receiptData = {
        id: receiptId,
        customer_id: customerId,
        customer_name: name,
        purpose,
        payment_type: paymentType,
        amount: parseFloat(amount),
        status,
        receipt_date: date,
        created_at: new Date().toISOString(),
      };

      // Save cash receipt
      await dbOperations.insert('cash_receipts', receiptData);

      // Create customer ledger entry (CREDIT - payment received reduces receivable)
      const ledgerEntry = await dbOperations.insert('customer_ledger_entries', {
        id: `cle_receipt_${Date.now()}`,
        customer_id: customerId,
        entry_date: date,
        particulars: `Cash Receipt - ${purpose}`,
        reference_no: receiptId,
        reference_type: 'cash_receipt',
        reference_id: receiptId,
        debit_amount: 0,
        credit_amount: parseFloat(amount),
        entry_type: 'payment',
        created_at: new Date().toISOString(),
      });

      toast.success("Receipt added and customer ledger updated!");
      
      // Broadcast data changes for real-time updates
      broadcastDataChange('cash_receipt', 'created', {
        receipt_id: receiptId,
        customer_id: customerId,
        amount: parseFloat(amount)
      });
      
      broadcastDataChange('customer_ledger_entries', 'add', {
        ...ledgerEntry,
        customer_id: customerId
      });

      resetForm();
      setOpen(false);
      loadReceipts();
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast.error('Failed to save receipt');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;

    try {
      const receipt = receipts.find(r => r.id === id);
      
      // Delete the receipt
      await dbOperations.delete('cash_receipts', id);

      // Delete associated ledger entry
      if (receipt) {
        const ledgerEntries = await dbOperations.getAll('customer_ledger_entries');
        const entry = ledgerEntries.find(e => e.reference_id === id && e.reference_type === 'cash_receipt');
        if (entry) {
          await dbOperations.delete('customer_ledger_entries', entry.id);
          // Broadcast ledger entry deletion
          broadcastDataChange('customer_ledger_entries', 'delete', {
            id: entry.id,
            customer_id: receipt?.customer_id
          });
        }
      }

      toast.success('Receipt deleted successfully');
      
      // Broadcast receipt deletion
      broadcastDataChange('cash_receipt', 'deleted', {
        receipt_id: id,
        customer_id: receipt?.customer_id
      });

      loadReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    }
  };

  const handleSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = receipts.filter(
      (r) =>
        r.customer_name?.toLowerCase().includes(term) ||
        r.purpose?.toLowerCase().includes(term) ||
        r.payment_type?.toLowerCase().includes(term) ||
        r.status?.toLowerCase().includes(term)
    );
    setFilteredReceipts(filtered);
  };

  const handleReset = () => {
    setFilteredReceipts(receipts);
  };

  const handleCustomerSelect = (customer) => {
    setName(customer.name);
    setCustomerId(customer.id);
    setShowNameDropdown(false);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Cash Receipt</h2>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Receipt
        </Button>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        searchFields={['customer name', 'purpose', 'payment type', 'status']}
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Customer Name</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Purpose</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Payment Type</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Amount (₹)</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Status</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Date</th>
              <th className="border p-2 dark:border-gray-600 dark:text-gray-300">Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((r) => (
              <tr key={r.id} className="text-center hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">{r.customer_name}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">{r.purpose}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">{r.payment_type}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">₹{parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td
                  className={`border p-2 font-medium dark:border-gray-600 ${
                    r.status === "Received" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.status}
                </td>
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">
                  {new Date(r.receipt_date).toLocaleDateString('en-GB')}
                </td>
                <td className="border p-2 dark:border-gray-600">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredReceipts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-gray-500 dark:text-gray-400 p-4">
                  No receipts available.
                </td>
              </tr>
            )}

            {filteredReceipts.length > 0 && (
              <tr className="bg-gray-200 dark:bg-gray-700 font-semibold text-center">
                <td colSpan="3" className="border p-2 text-right dark:border-gray-600 dark:text-dark-text">
                  Total:
                </td>
                <td className="border p-2 dark:border-gray-600 dark:text-dark-text">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan="3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Add Cash Receipt"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Customer Name *
            </label>
            <input
              type="text"
              placeholder="Select customer from dropdown"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowNameDropdown(true);
              }}
              onFocus={() => setShowNameDropdown(true)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
            {showNameDropdown && customers.length > 0 && (
              <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                {customers
                  .filter(c => c.name?.toLowerCase().includes(name.toLowerCase()))
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Purpose *</label>
            <input
              type="text"
              placeholder="Payment for Invoice"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Payment Type *</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount (₹) *</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Received">Received</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save Receipt</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default CashRecipt;
