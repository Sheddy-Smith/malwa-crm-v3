import React, { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import {  Trash2 } from "lucide-react";
import SearchBar from "../components/common/SearchBar";
import { toast } from 'sonner';

const CashRecipt = () => {
  const [open, setOpen] = useState(false);
  const [receipts, setReceipts] = useState(() => {
    const saved = localStorage.getItem("cashReceipts");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentType, setPaymentType] = useState("Offline");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Not Deposited");
  const [date, setDate] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  useEffect(() => {
    setFilteredReceipts(receipts);
  }, [receipts]);

  useEffect(() => {
    const savedBills = JSON.parse(localStorage.getItem("customerBills") || "[]");
    const uniqueNames = [...new Set(savedBills.map(bill => bill.customerName).filter(Boolean))];
    setCustomerNames(uniqueNames);
  }, [open]);

  // Total calculation
  const total = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  useEffect(() => {
    localStorage.setItem("cashReceipts", JSON.stringify(receipts));
  }, [receipts]);

  const resetForm = () => {
    setName("");
    setPurpose("");
    setPaymentType("Offline");
    setAmount("");
    setStatus("Not Deposited");
    setDate("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const savedBills = JSON.parse(localStorage.getItem("customerBills") || "[]");
    const customerExists = savedBills.some(bill => bill.customerName === name);

    if (!customerExists) {
      toast.error("Customer name not found in Customer Ledger. Please add customer first.");
      return;
    }

    const newReceipt = {
      id: Date.now(),
      name,
      purpose,
      paymentType,
      amount: Number(amount),
      status,
      date,
    };

    setReceipts([...receipts, newReceipt]);

    const updatedBills = savedBills.map(bill => {
      if (bill.customerName === name) {
        const currentAmount = Number(bill.amountReceived || bill.totalAmount || 0);
        return {
          ...bill,
          amountReceived: currentAmount + Number(amount)
        };
      }
      return bill;
    });
    localStorage.setItem("customerBills", JSON.stringify(updatedBills));

    toast.success("Receipt added and customer ledger updated!");
    resetForm();
    setOpen(false);
  };

  const handleDelete = (id) => {
    const filtered = receipts.filter((r) => r.id !== id);
    setReceipts(filtered);
  };

  const handleSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = receipts.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.purpose.toLowerCase().includes(term) ||
        r.paymentType.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
    setFilteredReceipts(filtered);
  };

  const handleReset = () => {
    setFilteredReceipts(receipts);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cash Receipt</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Add Receipt
        </button>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        searchFields={['name', 'purpose', 'payment type', 'status']}
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Purpose</th>
              <th className="border p-2">Payment Type</th>
              <th className="border p-2">Amount (₹)</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((r) => (
              <tr key={r.id} className="text-center hover:bg-gray-50">
                <td className="border p-2">{r.name}</td>
                <td className="border p-2">{r.purpose}</td>
                <td className="border p-2">{r.paymentType}</td>
                <td className="border p-2">₹{r.amount}</td>
                <td
                  className={`border p-2 font-medium ${
                    r.status === "Deposited" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.status}
                </td>
                <td className="border p-2">{r.date}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    <Trash2/>
                  </button>
                </td>
              </tr>
            ))}

            {filteredReceipts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-gray-500 p-4">
                  No receipts available.
                </td>
              </tr>
            )}

            {filteredReceipts.length > 0 && (
              <tr className="bg-gray-200 font-semibold text-center">
                <td colSpan="3" className="border p-2 text-right">
                  Total:
                </td>
                <td className="border p-2">₹{total}</td>
                <td colSpan="3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-bold">Add Cash Receipt</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-red-500 font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Customer Name (from Ledger)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowNameDropdown(true);
                  }}
                  onFocus={() => setShowNameDropdown(true)}
                  className="w-full border p-2 rounded"
                  required
                />
                {showNameDropdown && customerNames.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                    {customerNames
                      .filter(n => n.toLowerCase().includes(name.toLowerCase()))
                      .map((customerName, idx) => (
                        <div
                          key={idx}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setName(customerName);
                            setShowNameDropdown(false);
                          }}
                        >
                          {customerName}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />

              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
              </select>

              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="Not Deposited">Not Deposited</option>
                <option value="Deposited">Deposited</option>
              </select>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Save Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CashRecipt;
