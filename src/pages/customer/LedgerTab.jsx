// import Card from "@/components/ui/Card";
// import { Trash2Icon } from "lucide-react";

// const LedgerTab = () => (
//     <>
//     <Card>
//        <table className="border-2 w-full h-[70px]" >
//    <tr className="border-2">
//     <th className="border-2">Category</th>
//     <th className="border-2">Item</th>
//     <th className="border-2">Condition</th>
//     <th className="border-2">Cost (₹)</th>
//     <th className="border-2">Multiplier	</th>
//     <th className="border-2">Total (₹)</th>
//     <th className="border-2">Work By</th>
//     <th className="border-2">Notes</th>
//     <th className="border-2">Action</th>
// </tr>
//    <tbody>
// <tr className="border-2 text-center">
//     <td className="border-2">Parts</td>
//     <th className="border-2">tank</th>
//     <th className="border-2">ok</th>
//     <th className="border-2">100</th>
//     <th className="border-2">1</th>
//     <th className="border-2">100</th>
//     <th className="border-2">Labour</th>
//     <th className="border-2"> salman bhai   </th>
//     <th className="border-2">
//      <button className=" pointer-curson text-red-500">   <Trash2Icon /> </button> 
//           </th>
// </tr>
//    </tbody>


//        </table>



//     </Card>
//     </>
// );
// export default LedgerTab;


//  <p className="dark:text-dark-text-secondary text-sm">This table will automatically update after an Estimate, JobSheet, Challan, or Invoice is created, showing Date, Document Type, Number, Amount, Discount, and Payment Status.</p>





// Final and completed code 
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

const CustomerLedger = () => {
  const [ledgerRows, setLedgerRows] = useState([]);
  const [discount, setDiscount] = useState(0);

  // Load Challan data
  useEffect(() => {
    const estimateData = JSON.parse(localStorage.getItem("jobSheetEstimate") || "[]");
    const extraData = JSON.parse(localStorage.getItem("extraWork") || "[]");
    const disc = parseFloat(localStorage.getItem("estimateDiscount")) || 0;

    // Transform to ledger format
    const transformedRows = [
      ...estimateData.map((item) => ({
        ...item,
        total: (parseFloat(item.cost || 0) * parseFloat(item.multiplier || 1)).toFixed(2),
      })),
      ...extraData.map((item) => ({
        ...item,
        total: (parseFloat(item.cost || 0) * parseFloat(item.multiplier || 1)).toFixed(2),
      })),
    ];

    setLedgerRows(transformedRows);
    setDiscount(disc);
    localStorage.setItem("customerLedger", JSON.stringify(transformedRows));
  }, []);

  // Delete row
  const handleDelete = (index) => {
    const updated = ledgerRows.filter((_, i) => i !== index);
    setLedgerRows(updated);
    localStorage.setItem("customerLedger", JSON.stringify(updated));
  };

  // Totals
  const subtotalEstimate = ledgerRows
    .filter((r) => r.jobSheetNo !== undefined || r.jobSheetNo !== null)
    .reduce((acc, item) => acc + parseFloat(item.total || 0), 0);

  const subtotalExtra = ledgerRows
    .filter((r) => r.jobSheetNo === undefined || r.jobSheetNo === null)
    .reduce((acc, item) => acc + parseFloat(item.total || 0), 0);

  const grandTotal = subtotalEstimate + subtotalExtra - discount;

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-xl font-bold mb-2">Customer Ledger</h3>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Category</th>
                <th className="border p-2">Item</th>
                <th className="border p-2">Condition</th>
                <th className="border p-2 text-right">Cost (₹)</th>
                <th className="border p-2 text-right">Multiplier</th>
                <th className="border p-2 text-right">Total (₹)</th>
                <th className="border p-2">Work By</th>
                <th className="border p-2">Notes</th>
                <th className="border p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-3 text-gray-500">
                    No Ledger Data Found
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{row.category}</td>
                    <td className="border p-2">{row.item}</td>
                    <td className="border p-2">{row.condition || "OK"}</td>
                    <td className="border p-2 text-right">{parseFloat(row.cost).toFixed(2)}</td>
                    <td className="border p-2 text-right">{parseFloat(row.multiplier).toFixed(2)}</td>
                    <td className="border p-2 text-right">{parseFloat(row.total).toFixed(2)}</td>
                    <td className="border p-2">{row.workBy || "Labour"}</td>
                    <td className="border p-2">{row.notes || ""}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Row"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 text-right font-semibold space-y-1">
          <div>Subtotal (Estimate): ₹{subtotalEstimate.toFixed(2)}</div>
          <div>Subtotal (Extra Work): ₹{subtotalExtra.toFixed(2)}</div>
          <div>Estimate Discount: ₹{discount.toFixed(2)}</div>
          <div className="font-extrabold  text-lg">Grand Total: ₹{grandTotal.toFixed(2)}</div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerLedger;
 




// // src/pages/customer/LedgerTab.jsx
//  import Card from "@/components/ui/Card";
//  import { Trash2Icon } from "lucide-react";
// import { useState, useEffect, useMemo } from 'react';
// import useCustomerStore from '@/store/customerStore';
// import Card from '@/components/ui/Card';
// import Button from '@/components/ui/Button';
// import { Trash2, PlusCircle } from 'lucide-react';

// const LedgerTab = () => {
//     // --- CORRECT ZUSTAND USAGE ---
//     // Ensure you pass a FUNCTION (selector) to the hook like this:
//     const customers = useCustomerStore(state => state.customers);
//     const addLedgerEntry = useCustomerStore(state => state.addLedgerEntry);
//     const deleteLedgerEntry = useCustomerStore(state => state.deleteLedgerEntry);
//     // --- DO NOT pass a non-function variable here ---

//     const [selectedCustomerId, setSelectedCustomerId] = useState('');
//     const [showPaymentForm, setShowPaymentForm] = useState(false);
//     const [paymentAmount, setPaymentAmount] = useState('');
//     const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
//     const [paymentNotes, setPaymentNotes] = useState('');

//     // Effect to select the first customer by default
//     useEffect(() => {
//         if (!selectedCustomerId && customers && customers.length > 0) {
//             setSelectedCustomerId(customers[0].id);
//         }
//         if (selectedCustomerId && customers && !customers.some(c => c.id === selectedCustomerId)) {
//              setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
//         }
//     }, [customers, selectedCustomerId]);

//     // Find the selected customer's data
//     const selectedCustomer = useMemo(() => {
//         if (!Array.isArray(customers)) {
//             console.error("Customers state is not an array:", customers); // Debugging log
//             return null;
//         }
//         return customers.find(c => c.id === selectedCustomerId);
//     }, [customers, selectedCustomerId]);

//     // Get ledger entries for the selected customer
//     const ledgerEntries = useMemo(() => {
//         if (!selectedCustomer || !Array.isArray(selectedCustomer.ledger)) {
//              // console.warn("Selected customer or ledger not available or not an array"); // Debugging log
//              return [];
//         }
//         return selectedCustomer.ledger;
//     }, [selectedCustomer]);

//     // Handle adding a payment
//     const handleAddPayment = (e) => {
//         e.preventDefault();
//         if (!selectedCustomerId || !paymentAmount || parseFloat(paymentAmount) <= 0) {
//             alert('Please select a customer and enter a valid payment amount.');
//             return;
//         }
//         const paymentEntry = {
//             date: paymentDate,
//             type: 'Payment',
//             details: `Payment Received ${paymentNotes ? '- ' + paymentNotes : ''}`,
//             debit: 0,
//             credit: parseFloat(paymentAmount),
//         };
//         addLedgerEntry(selectedCustomerId, paymentEntry);
//         setPaymentAmount('');
//         setPaymentDate(new Date().toISOString().split('T')[0]);
//         setPaymentNotes('');
//         setShowPaymentForm(false);
//         alert('Payment recorded successfully!');
//     };

//      // Handle deleting a ledger entry
//     const handleDeleteEntry = (entryId) => {
//         if (window.confirm('Are you sure you want to delete this ledger entry? This cannot be undone.')) {
//             deleteLedgerEntry(selectedCustomerId, entryId);
//             alert('Ledger entry deleted.');
//         }
//     };

//     // Get the final balance safely
//     const finalBalance = ledgerEntries.length > 0 ? (ledgerEntries[0]?.balance ?? 0) : 0;

//     return (
//         <Card>
//             {/* Header and Controls */}
//             <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
//                 <h3 className="text-lg font-bold dark:text-dark-text">Customer Account Ledger</h3>
//                 <div className="flex items-center gap-2 w-full sm:w-auto">
//                     <select
//                         value={selectedCustomerId}
//                         onChange={(e) => setSelectedCustomerId(e.target.value)}
//                         className="p-2 border rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-red min-w-[200px] flex-grow sm:flex-grow-0"
//                     >
//                         <option value="">-- Select Customer --</option>
//                         {Array.isArray(customers) && customers.map(c => (
//                             <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No Phone'})</option>
//                         ))}
//                     </select>
//                     <Button
//                         variant="secondary"
//                         onClick={() => setShowPaymentForm(true)}
//                         disabled={!selectedCustomerId}
//                     >
//                         <PlusCircle className="h-4 w-4 mr-2" /> Record Payment
//                     </Button>
//                 </div>
//             </div>

//             {/* Ledger Display Area */}
//             {selectedCustomerId && selectedCustomer ? (
//                 <>
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-sm dark:text-dark-text-secondary border">
//                             {/* Table Head */}
//                             <thead className="bg-gray-50 dark:bg-gray-700 text-left">
//                                 <tr>
//                                     <th className="p-2 border">Date</th>
//                                     <th className="p-2 border">Type</th>
//                                     <th className="p-2 border">Details</th>
//                                     <th className="p-2 border text-right">Debit (₹)</th>
//                                     <th className="p-2 border text-right">Credit (₹)</th>
//                                     <th className="p-2 border text-right">Balance (₹)</th>
//                                     <th className="p-2 border text-center">Action</th>
//                                 </tr>
//                             </thead>
//                             {/* Table Body */}
//                             <tbody>
//                                 {ledgerEntries.length > 0 ? ledgerEntries.map(entry => (
//                                     <tr key={entry.entryId} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/50">
//                                         <td className="p-2 border">{new Date(entry.date).toLocaleDateString()}</td>
//                                         <td className="p-2 border">{entry.type}</td>
//                                         <td className="p-2 border">{entry.details}</td>
//                                         <td className="p-2 border text-right">{(entry.debit ?? 0) > 0 ? (entry.debit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
//                                         <td className="p-2 border text-right">{(entry.credit ?? 0) > 0 ? (entry.credit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
//                                         <td className={`p-2 border text-right font-medium ${(entry.balance ?? 0) < 0 ? 'text-red-600' : 'dark:text-dark-text'}`}>
//                                             {Math.abs(entry.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {(entry.balance ?? 0) < 0 ? ' Cr' : ' Dr'}
//                                         </td>
//                                         <td className="p-2 border text-center">
//                                             {entry.type === 'Payment' && ( // Only allow deleting payments for now
//                                                 <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.entryId)} className="p-1 h-auto">
//                                                     <Trash2 className="h-4 w-4 text-red-500"/>
//                                                 </Button>
//                                             )}
//                                         </td>
//                                     </tr>
//                                 )) : (
//                                     <tr>
//                                         <td colSpan="7" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
//                                             No ledger entries found for this customer.
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                             {/* Table Footer */}
//                             {ledgerEntries.length > 0 && (
//                                 <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
//                                     <tr>
//                                         <td colSpan="5" className="p-2 border text-right dark:text-dark-text">Final Balance:</td>
//                                         <td className={`p-2 border text-right ${finalBalance < 0 ? 'text-red-600' : 'dark:text-dark-text'}`}>
//                                             {Math.abs(finalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {finalBalance < 0 ? ' Cr' : ' Dr'}
//                                         </td>
//                                         <td className="p-2 border"></td>
//                                     </tr>
//                                 </tfoot>
//                             )}
//                         </table>
//                     </div>
//                 </>
//             ) : (
//                 // Message when no customer is selected or available
//                 <p className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
//                     {Array.isArray(customers) && customers.length > 0 ? 'Please select a customer to view their ledger.' : 'No customers found. Please add a customer first.'}
//                 </p>
//             )}

//              {/* Payment Form Modal */}
//             {showPaymentForm && selectedCustomer && (
//                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPaymentForm(false)}>
//                     <form onSubmit={handleAddPayment} className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
//                         <h4 className="text-lg font-bold mb-2 dark:text-dark-text">Record Payment for {selectedCustomer?.name}</h4>
//                         <div>
//                             <label className="text-sm dark:text-dark-text-secondary block mb-1">Amount (₹)</label>
//                             <input
//                                 type="number" step="0.01" value={paymentAmount}
//                                 onChange={(e) => setPaymentAmount(e.target.value)}
//                                 className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red" required
//                             />
//                         </div>
//                          <div>
//                             <label className="text-sm dark:text-dark-text-secondary block mb-1">Date</label>
//                             <input
//                                 type="date" value={paymentDate}
//                                 onChange={(e) => setPaymentDate(e.target.value)}
//                                 className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red" required
//                             />
//                         </div>
//                          <div>
//                             <label className="text-sm dark:text-dark-text-secondary block mb-1">Notes (Optional)</label>
//                             <input
//                                 type="text" value={paymentNotes}
//                                 onChange={(e) => setPaymentNotes(e.target.value)}
//                                 className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
//                                 placeholder="e.g., Cheque No, UPI Ref"
//                             />
//                         </div>
//                         <div className="flex justify-end gap-2 pt-2">
//                             <Button type="button" variant="secondary" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
//                             <Button type="submit">Save Payment</Button>
//                         </div>
//                     </form>
//                 </div>
//             )}
//         </Card>
//     );
// };

// export default LedgerTab;