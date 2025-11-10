// completed but Edi is not response
import React, { useState, useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";

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
      v.party?.toLowerCase().includes(lowerTerm) ||
      v.type?.toLowerCase().includes(lowerTerm) ||
      v.method?.toLowerCase().includes(lowerTerm) ||
      v.date?.includes(term)
    );

    const filteredChallans = challanData.filter(c =>
      c.party?.toLowerCase().includes(lowerTerm) ||
      c.date?.includes(term)
    );

    setFilteredSupplierData(filteredSuppliers);
    setFilteredChallanData(filteredChallans);
  };

  const handleReset = () => {
    setFilteredSupplierData(supplierData);
    setFilteredChallanData(challanData);
  };

  // load supplier vouchers from localStorage
  useEffect(() => {
    const vouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
    const supplierVouchers = vouchers.filter((v) => v.type === "Supplier");
    setSupplierData(supplierVouchers);
    setFilteredSupplierData(supplierVouchers);
  }, []);

  // load challans (purchase-challan) from localStorage
  useEffect(() => {
    const challans = JSON.parse(localStorage.getItem("challans")) || [];
    setChallanData(challans);
    setFilteredChallanData(challans);
  }, []);

  // delete voucher by id and update localStorage + state
  const handleDeleteVoucher = (id) => {
    if (!window.confirm("Kya aap voucher delete karna chahte hain?")) return;
    const all = JSON.parse(localStorage.getItem("vouchers")) || [];
    const updated = all.filter((v) => v.id !== id);
    localStorage.setItem("vouchers", JSON.stringify(updated));
    // update state to only supplier vouchers
    setSupplierData(updated.filter((v) => v.type === "Supplier"));
  };

  // delete challan by id and update localStorage + state
  const handleDeleteChallan = (id) => {
    if (!window.confirm("Kya aap challan delete karna chahte hain?")) return;
    const all = JSON.parse(localStorage.getItem("challans")) || [];
    const updated = all.filter((c) => c.id !== id);
    localStorage.setItem("challans", JSON.stringify(updated));
    setChallanData(updated);
  };

  // totals
  const supplierTotal = supplierData.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const challanTotal = challanData.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

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
                  <td className="border p-2">{v.type}</td>
                  <td className="border p-2">{v.party}</td>
                  <td className="border p-2">₹{Number(v.amount || 0).toFixed(2)}</td>
                  <td className="border p-2">{v.date}</td>
                  <td className="border p-2">{v.method}</td>
                  <td className="border p-2">
                    {v.method === "UPI" ? v.upi : v.method === "Bank" ? v.bankAcc : "-"}
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
                <th className="border p-2">Challan No</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Source</th>
                <th className="border p-2">Item (Category)</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Payment</th>
                {/* <th className="border p-2">Edit</th> */}
                <th className="border p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallanData.map((c) => (
                <tr key={c.id} className="text-center hover:bg-gray-50">
                  <td className="border p-2">{c.id}</td>
                  <td className="border p-2">{c.challanNo}</td>
                  <td className="border p-2">{c.date}</td>
                  <td className="border p-2">{c.source}</td>
                  <td className="border p-2">{c.item} {c.category ? `(${c.category})` : ""}</td>
                  <td className="border p-2">{c.qty}</td>
                  <td className="border p-2">{Number(c.price || 0).toFixed(2)}₹</td>
                  <td className="border p-2">{Number(c.total || 0).toFixed(2)}₹</td>
                  <td className="border p-2">{c.payment}</td>
                  {/* <td className="border p-2">
                    Edit is left empty because editing probably lives in Purchase-Challan page
                    <span className="text-gray-500"> <Edit/></span>
                  </td> */}
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
                  <td colSpan="11" className="text-gray-500 p-4">
                    No Purchase-Challan data found.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td className="border p-2 font-semibold text-center" colSpan={7}>Grand Total (Challans)</td>
                <td className="border p-2 font-semibold text-center">₹{challanTotal.toFixed(2)}</td>
                <td className="border p-2" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedger;
