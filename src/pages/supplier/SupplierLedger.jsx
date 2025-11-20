import { useState, useEffect } from 'react';
import { Edit, Trash } from 'lucide-react';
import SearchBar from '@/components/common/SearchBar';
import { dbOperations } from '@/lib/db';
import { toast } from 'sonner';

const SupplierLedger = () => {
  const [supplierData, setSupplierData] = useState([]);
  const [challanData, setChallanData] = useState([]);
  const [filteredSupplierData, setFilteredSupplierData] = useState([]);
  const [filteredChallanData, setFilteredChallanData] = useState([]);

  const handleSearch = (term) => {
    if (!term.trim()) {
      setFilteredSupplierData(supplierData);
      setFilteredChallanData(challanData);
      return;
    }
    const lowerTerm = term.toLowerCase();

    const filteredSuppliers = supplierData.filter(v =>
      v.payee_name?.toLowerCase().includes(lowerTerm) ||
      v.payee_type?.toLowerCase().includes(lowerTerm) ||
      v.payment_mode?.toLowerCase().includes(lowerTerm) ||
      v.voucher_date?.includes(term)
    );

    const filteredChallans = challanData.filter(c =>
      c.supplier_name?.toLowerCase().includes(lowerTerm) ||
      c.purchase_date?.includes(term)
    );

    setFilteredSupplierData(filteredSuppliers);
    setFilteredChallanData(filteredChallans);
  };

  const handleReset = () => {
    setFilteredSupplierData(supplierData);
    setFilteredChallanData(challanData);
  };

  // load supplier vouchers from IndexedDB
  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const vouchers = await dbOperations.getAll('vouchers');
        const supplierVouchers = vouchers.filter((v) => v.payee_type === 'supplier');
        setSupplierData(supplierVouchers);
        setFilteredSupplierData(supplierVouchers);
      } catch (error) {
        console.error('Error loading supplier vouchers:', error);
        toast.error('Failed to load supplier vouchers');
      }
    };
    loadVouchers();
  }, []);

  // load purchase challans from IndexedDB
  useEffect(() => {
    const loadChallans = async () => {
      try {
        const purchases = await dbOperations.getAll('purchases');
        setChallanData(purchases);
        setFilteredChallanData(purchases);
      } catch (error) {
        console.error('Error loading purchase challans:', error);
        toast.error('Failed to load purchase challans');
      }
    };
    loadChallans();
  }, []);

  // delete voucher by id and update IndexedDB + state
  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Kya aap voucher delete karna chahte hain?")) return;
    try {
      await dbOperations.delete('vouchers', id);
      const vouchers = await dbOperations.getAll('vouchers');
      const supplierVouchers = vouchers.filter((v) => v.payee_type === 'supplier');
      setSupplierData(supplierVouchers);
      setFilteredSupplierData(supplierVouchers);
      toast.success('Voucher deleted successfully');
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Failed to delete voucher');
    }
  };

  // delete challan by id and update IndexedDB + state
  const handleDeleteChallan = async (id) => {
    if (!window.confirm("Kya aap challan delete karna chahte hain?")) return;
    try {
      await dbOperations.delete('purchases', id);
      const purchases = await dbOperations.getAll('purchases');
      setChallanData(purchases);
      setFilteredChallanData(purchases);
      toast.success('Challan deleted successfully');
    } catch (error) {
      console.error('Error deleting challan:', error);
      toast.error('Failed to delete challan');
    }
  };

  // totals
  const supplierTotal = supplierData.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const challanTotal = challanData.reduce((sum, c) => sum + (Number(c.grand_total) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Supplier Ledger</h2>
        <SearchBar onSearch={handleSearch} onReset={handleReset} searchFields={['party', 'date', 'type', 'method']} />

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Type</th>
                <th className="border p-2">Party</th>
                <th className="border p-2">Amount</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Method</th>
                <th className="border p-2">Details</th>
                <th className="border p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupplierData.map((v) => (
                <tr key={v.id} className="text-center">
                  <td className="border p-2">{v.payee_type}</td>
                  <td className="border p-2">{v.payee_name}</td>
                  <td className="border p-2">₹{Number(v.amount || 0).toFixed(2)}</td>
                  <td className="border p-2">{new Date(v.voucher_date).toLocaleDateString('en-GB')}</td>
                  <td className="border p-2">{v.payment_mode}</td>
                  <td className="border p-2">
                    {v.payment_mode === "upi" ? v.upi_id : v.payment_mode === "bank_transfer" ? v.bank_name : v.cheque_no || "-"}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleDeleteVoucher(v.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Voucher"
                    >
                      <Trash />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSupplierData.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-gray-500 p-4">
                    No Supplier vouchers found.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="border p-2 font-semibold" colSpan={2}>Total (Supplier)</td>
                <td className="border p-2 font-semibold">₹{supplierTotal.toFixed(2)}</td>
                <td className="border p-2" colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Purchase-Challan Data section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Purchase-Challan Data</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th className="border p-2">ID</th>
                <th className="border p-2">Invoice No</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Supplier</th>
                <th className="border p-2">Items</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Payment</th>
                <th className="border p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallanData.map((c) => (
                <tr key={c.id} className="text-center hover:bg-gray-50">
                  <td className="border p-2">{c.id}</td>
                  <td className="border p-2">{c.purchase_invoice_no || '-'}</td>
                  <td className="border p-2">{new Date(c.purchase_date).toLocaleDateString('en-GB')}</td>
                  <td className="border p-2">{c.supplier_name || '-'}</td>
                  <td className="border p-2">{c.items?.length || 0} items</td>
                  <td className="border p-2">{c.total_quantity || 0}</td>
                  <td className="border p-2">₹{Number(c.subtotal || 0).toFixed(2)}</td>
                  <td className="border p-2">₹{Number(c.grand_total || 0).toFixed(2)}</td>
                  <td className="border p-2">{c.payment_mode || '-'}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteChallan(c.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Challan"
                    >
                      <Trash />
                    </button>
                  </td>
                </tr>))}

              {filteredChallanData.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-gray-500 p-4">
                    No Purchase-Challan data found.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td className="border p-2 font-semibold text-center" colSpan={7}>Grand Total (Challans)</td>
                <td className="border p-2 font-semibold text-center">₹{challanTotal.toFixed(2)}</td>
                <td className="border p-2" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedger;
