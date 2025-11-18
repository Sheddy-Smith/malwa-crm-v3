import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Save, Printer, Trash2, Receipt } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { dbOperations } from "@/lib/db";
import { createStockMovement } from "@/utils/dataFlow";
import { toast } from "sonner";
import useMultiplierStore from "@/store/multiplierStore";

// Cash Receipt Modal Component
const CashReceiptModal = ({ isOpen, onClose, onSubmit, customerName, maxAmount }) => {
  const [formData, setFormData] = useState({
    name: customerName || "",
    purpose: "Payment for Challan",
    paymentType: "Cash",
    amount: "",
    status: "Received",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (customerName) {
      setFormData(prev => ({ ...prev, name: customerName }));
    }
  }, [customerName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(formData.amount) > maxAmount) {
      toast.error(`Amount cannot exceed balance due: ₹${maxAmount.toFixed(2)}`);
      return;
    }
    onSubmit(formData);
    setFormData({
      name: customerName || "",
      purpose: "Payment for Challan",
      paymentType: "Cash",
      amount: "",
      status: "Received",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const resetForm = () => {
    setFormData({
      name: customerName || "",
      purpose: "Payment for Challan",
      paymentType: "Cash",
      amount: "",
      status: "Received",
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cash Receipt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Customer Name *</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Purpose</label>
          <input
            type="text"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Payment Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount (₹) *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter amount"
              step="0.01"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max: ₹{maxAmount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-600">
          <Button type="button" variant="secondary" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit">
            Submit Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ChalanStep = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [jobCtx, setJobCtx] = useState({ vehicleNo: "", partyName: "", contactNo: "" });
  const [isCashReceiptModalOpen, setIsCashReceiptModalOpen] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await dbOperations.getAll('sell_challans');
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecords(sorted);
      setFilteredRecords(sorted);
    } catch (e) {
      console.error('Failed to load challans:', e);
    }
  };

  const handleSearch = (filters) => {
    let filtered = [...records];
    if (filters.vehicleNo) {
      filtered = filtered.filter(r => r.vehicle_no && r.vehicle_no.toLowerCase().includes(filters.vehicleNo.toLowerCase()));
    }
    if (filters.partyName) {
      filtered = filtered.filter(r => r.party_name && r.party_name.toLowerCase().includes(filters.partyName.toLowerCase()));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(r => r.date && r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => r.date && r.date <= filters.dateTo);
    }
    setFilteredRecords(filtered);
  };

  const handleReset = () => {
    setFilteredRecords(records);
  };

  const handleEditRecord = (record) => {
    toast.info('Load record feature coming soon');
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dbOperations.delete('sell_challans', id);
      toast.success('Challan deleted successfully');
      await loadRecords();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete challan');
    }
  };

  // Handle Cash Receipt submission
  const handleCashReceiptSubmit = async (receiptData) => {
    try {
      // Find customer by name
      const customers = await dbOperations.getAll('customers');
      const customer = customers.find(c => 
        c.name.toLowerCase() === receiptData.name.toLowerCase()
      );

      if (!customer) {
        toast.error('Customer not found in system');
        return;
      }

      const amount = parseFloat(receiptData.amount);
      
      // Create customer ledger entry for payment
      await dbOperations.insert('customer_ledger_entries', {
        customer_id: customer.id,
        entry_date: receiptData.date,
        type: 'payment',
        description: `${receiptData.purpose} (${receiptData.paymentType})`,
        debit: 0,
        credit: amount,
        reference_type: 'cash_receipt',
        reference_id: Date.now(),
      });

      // Save to cash receipts list (for Accounts/Cash Receipt page)
      const cashReceipts = JSON.parse(localStorage.getItem('cashReceipts') || '[]');
      const newReceipt = {
        id: Date.now(),
        name: receiptData.name,
        vehicleNo: jobCtx.vehicleNo || 'N/A',
        purpose: receiptData.purpose,
        paymentType: receiptData.paymentType,
        amount: amount,
        status: 'Received',
        date: receiptData.date,
        source: 'challan'
      };
      cashReceipts.push(newReceipt);
      localStorage.setItem('cashReceipts', JSON.stringify(cashReceipts));

      // Update manual payment amount
      setManualPayment(prev => prev + amount);

      toast.success(`Cash receipt of ₹${amount.toFixed(2)} recorded successfully`);
      setIsCashReceiptModalOpen(false);
    } catch (error) {
      console.error('Cash receipt error:', error);
      toast.error('Failed to record cash receipt');
    }
  };

  const [jobSheetEstimate, setJobSheetEstimate] = useState([]);
  const [extraWork, setExtraWork] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [manualPayment, setManualPayment] = useState(0);
  const [createInvoice, setCreateInvoice] = useState(false);

  useEffect(() => {
    const estimateData = JSON.parse(localStorage.getItem("jobSheetEstimate") || "[]");
    const extraData = JSON.parse(localStorage.getItem("extraWork") || "[]");
    
    setJobSheetEstimate(estimateData);
    setExtraWork(extraData);
    
    // Load from estimate context
    try {
      const estimateContext = localStorage.getItem("estimateContext");
      if (estimateContext) {
        const ctx = JSON.parse(estimateContext);
        setDiscount(ctx.discount || 0);
        setAdvancePayment(ctx.advancePayment || 0);
        setRoundOff(ctx.roundOff || 0);
      } else {
        // Fallback to old method
        setDiscount(parseFloat(localStorage.getItem("estimateDiscount")) || 0);
        setAdvancePayment(parseFloat(localStorage.getItem("estimateAdvancePayment")) || 0);
        setRoundOff(parseFloat(localStorage.getItem("estimateRoundOff")) || 0);
      }
    } catch (e) {
      console.error('Failed to load estimate context:', e);
    }
    
    try {
      const raw = localStorage.getItem('jobsContext');
      if (raw) setJobCtx(JSON.parse(raw));
    } catch {}
  }, []);

  const { getCategoryMultiplier, getMultiplierByWorkType } = useMultiplierStore();

  const calculateTotal = (item) => {
    const cost = parseFloat(item.cost) || 0;
    let multiplier = 1;

    if (item.category) {
      multiplier = getCategoryMultiplier(item.category.trim());
    } else if (item.workBy) {
      multiplier = getMultiplierByWorkType(item.workBy);
    }

    return cost * multiplier;
  };

  const subTotalEstimate = jobSheetEstimate.reduce(
    (acc, item) => acc + calculateTotal(item),
    0
  );

  const subTotalExtra = extraWork.reduce(
    (acc, item) => acc + calculateTotal(item),
    0
  );

  const grandTotal = subTotalEstimate + subTotalExtra;
  const totalAfterDiscount = grandTotal - discount;
  const totalWithRoundOff = totalAfterDiscount + roundOff;
  const finalTotal = totalWithRoundOff - advancePayment;

  // ✅ Delete entry from localStorage + UI
  const handleDelete = (type, index) => {
    if (type === "estimate") {
      const updated = jobSheetEstimate.filter((_, i) => i !== index);
      setJobSheetEstimate(updated);
      localStorage.setItem("jobSheetEstimate", JSON.stringify(updated));
    } else if (type === "extra") {
      const updated = extraWork.filter((_, i) => i !== index);
      setExtraWork(updated);
      localStorage.setItem("extraWork", JSON.stringify(updated));
    }
  };

  // ✅ Save as PDF using html2canvas - Simple and reliable
  const handleSavePDF = async () => {
    try {
      const input = document.getElementById("challan-body");
      const canvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If content fits in one page
      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        // Multiple pages needed
        let yOffset = 0;
        let remainingHeight = imgHeight;
        
        while (remainingHeight > 0) {
          pdf.addImage(imgData, "PNG", 0, -yOffset, imgWidth, imgHeight);
          remainingHeight -= pdfHeight;
          yOffset += pdfHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }
      
      const filename = jobCtx.vehicleNo ? jobCtx.vehicleNo + '_challan.pdf' : "challan.pdf";
      pdf.save(filename);
      toast.success('Challan PDF saved successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try Print Challan instead.');
    }
  };

  // ✅ Persist challan to IndexedDB and create stock movements (OUT)
  const handlePersistChallan = async () => {
    try {
      const items = [...jobSheetEstimate, ...extraWork].map((item) => ({
        productName: item.item,
        qty: 1,
        rate: parseFloat(item.cost) || 0,
      }));

      const subtotal = items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
      const tax = 0;
      const total = subtotal - (discount || 0);
      const vehicleNo = jobCtx.vehicleNo || '';
      const date = new Date().toISOString().split('T')[0];

      // Check for duplicate with same vehicle and date
      const allRecords = await dbOperations.getAll('sell_challans');
      const existingRecord = allRecords.find(
        record => record.vehicle_no === vehicleNo && record.date === date
      );

      const challanData = {
        date: date,
        vehicle_no: vehicleNo || undefined,
        party_name: jobCtx.partyName || undefined,
        items,
        subtotal,
        tax,
        discount: discount,
        advance_payment: advancePayment,
        total,
        payment_status: paymentStatus,
        payment_received: manualPayment,
        balance_due: finalTotal - manualPayment,
        create_invoice: createInvoice,
        status: 'issued',
      };

      let challanId = null;

      if (existingRecord) {
        // Show confirmation for update
        const confirmed = window.confirm(
          `A challan already exists for Vehicle: ${vehicleNo} on Date: ${date}.\n\nDo you want to UPDATE the existing record?`
        );
        
        if (!confirmed) {
          return;
        }

        await dbOperations.update('sell_challans', existingRecord.id, challanData);
        challanId = existingRecord.id;
        toast.success('Challan updated successfully');
      } else {
        // Create new record
        const challan = await dbOperations.insert('sell_challans', challanData);
        challanId = challan.id;

        // Create stock movements only for new challans
        for (const it of items) {
          await createStockMovement(undefined, it.productName, 'out', it.qty || 0, 'sell-challan', { challanId: challan.id });
          
          // Save sell rate history
          try {
            await dbOperations.insert('rate_history', {
              item_name: it.productName,
              category_id: it.category || '',
              rate: parseFloat(it.rate) || 0,
              vendor_name: jobCtx.partyName || 'N/A',
              source: 'sell_challan',
              reference_no: vehicleNo,
              reference_id: challan.id,
              date: date,
              created_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Error saving rate history:', err);
          }
        }

        toast.success('Challan saved and stock updated');
      }

      // Update customer ledger if payment is received
      if (manualPayment > 0 && jobCtx.partyName) {
        try {
          // Find customer by name
          const customers = await dbOperations.getAll('customers');
          const customer = customers.find(c => 
            c.name.toLowerCase() === jobCtx.partyName.toLowerCase()
          );

          if (customer) {
            // Create ledger entry for payment received
            await dbOperations.insert('customer_ledger_entries', {
              customer_id: customer.id,
              entry_date: date,
              type: 'payment',
              description: `Payment for Challan - Vehicle: ${vehicleNo}`,
              debit: 0,
              credit: manualPayment,
              reference_type: 'challan',
              reference_id: challanId,
            });

            // Create ledger entry for challan amount (if not full payment)
            if (finalTotal > manualPayment) {
              await dbOperations.insert('customer_ledger_entries', {
                customer_id: customer.id,
                entry_date: date,
                type: 'sale',
                description: `Challan - Vehicle: ${vehicleNo}`,
                debit: finalTotal,
                credit: 0,
                reference_type: 'challan',
                reference_id: challanId,
              });
            }

            toast.success('Customer ledger updated');
          } else {
            toast.warning('Customer not found. Ledger not updated.');
          }
        } catch (ledgerError) {
          console.error('Ledger update error:', ledgerError);
          toast.error('Failed to update customer ledger');
        }
      }

      // Create invoice if requested
      if (createInvoice && jobCtx.partyName) {
        try {
          const customers = await dbOperations.getAll('customers');
          const customer = customers.find(c => 
            c.name.toLowerCase() === jobCtx.partyName.toLowerCase()
          );

          if (customer) {
            await dbOperations.insert('invoices', {
              customer_id: customer.id,
              invoice_no: `INV-${Date.now()}`,
              date: date,
              vehicle_no: vehicleNo,
              items: items,
              subtotal: subtotal,
              tax: tax,
              discount: discount,
              total: finalTotal,
              payment_received: manualPayment,
              balance_due: finalTotal - manualPayment,
              status: paymentStatus === 'full' ? 'paid' : 'pending',
            });
            toast.success('Invoice created successfully');
          }
        } catch (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          toast.error('Failed to create invoice');
        }
      }

      await loadRecords();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save challan');
    }
  };

  // ✅ Print with proper styling
  const handlePrint = () => {
    const printContent = document.getElementById("challan-body");
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint.document.write(`
      <html>
        <head>
          <title>Challan</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 250);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Challan</h3>

      <Card>
        <div id="challan-body" style={{ paddingBottom: '50px' }}>
          {/* Challan Header with Details */}
          <div className="mb-4 border-b pb-4">
            <h2 className="text-2xl font-bold text-center mb-4">CHALLAN</h2>
            <table className="w-full text-sm border">
              <tbody>
                <tr>
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Party Name:</td>
                  <td className="p-2 border">{jobCtx.partyName || '--'}</td>
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Date:</td>
                  <td className="p-2 border">{new Date().toLocaleDateString('en-GB')}</td>
                </tr>
                <tr>
                  <td className="p-2 border bg-gray-50 font-semibold">Vehicle Number:</td>
                  <td className="p-2 border">{jobCtx.vehicleNo || '--'}</td>
                  <td className="p-2 border bg-gray-50 font-semibold">Phone Number:</td>
                  <td className="p-2 border">{jobCtx.contactNo || '--'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold mb-2">Tasks from Job Sheet</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-base border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border" style={{width: '40%'}}>Work</th>
                  <th className="p-2 border text-center" style={{width: '15%'}}>Extra Work</th>
                  <th className="p-2 border text-center" style={{width: '15%'}}>Category</th>
                  <th className="p-2 border text-center" style={{width: '12%'}}>Cost (₹)</th>
                  <th className="p-2 border text-center" style={{width: '8%'}}>Qty</th>
                  <th className="p-2 border text-center" style={{width: '10%'}}>Total (₹)</th>
                </tr>
              </thead>

              <tbody>
                {/* Estimate Data */}
                {jobSheetEstimate.map((item, idx) => {
                  const multiplier = item.category ? getCategoryMultiplier(item.category.trim()) : (item.workBy ? getMultiplierByWorkType(item.workBy) : 1);
                  return (
                    <tr key={`est-${idx}`} className="border-b">
                      <td className="p-2">{item.item}</td>
                      <td className="p-2 text-center">--</td>
                      <td className="p-2 text-center">{item.category}</td>
                      <td className="p-2 text-center">₹{item.cost}</td>
                      <td className="p-2 text-center">{multiplier}</td>
                      <td className="p-2 text-center font-semibold">₹{calculateTotal(item).toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Extra Work Data */}
                {extraWork.map((item, idx) => {
                  const multiplier = item.category ? getCategoryMultiplier(item.category.trim()) : (item.workBy ? getMultiplierByWorkType(item.workBy) : 1);
                  return (
                    <tr key={`extra-${idx}`} className="border-b">
                      <td className="p-2">{item.item}</td>
                      <td className="p-2 text-center">✓</td>
                      <td className="p-2 text-center">{item.category}</td>
                      <td className="p-2 text-center">₹{item.cost}</td>
                      <td className="p-2 text-center">{multiplier}</td>
                      <td className="p-2 text-center font-semibold">₹{calculateTotal(item).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 text-right font-semibold">
              <div>Subtotal (Estimate): ₹{subTotalEstimate.toFixed(2)}</div>
              <div>Subtotal (Extra Work): ₹{subTotalExtra.toFixed(2)}</div>
              <div>Estimate Discount: ₹{discount.toFixed(2)}</div>
              <div className="font-semibold">Total: ₹{totalAfterDiscount.toFixed(2)}</div>
              <div className="text-green-600">Advance Payment: ₹{advancePayment.toFixed(2)}</div>
              <div className="font-bold text-lg">Grand Total: ₹{finalTotal.toFixed(2)}</div>
            </div>

            {/* Payment Details Section */}
            <div className="mt-4 border-t pt-2">
              <h5 className="text-xs font-semibold mb-1.5">Payment Details</h5>
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
                <div>
                  <label className="block text-xs mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="half">Half Paid</option>
                    <option value="full">Full Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Payment Amount (₹)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={manualPayment}
                      readOnly
                      className="w-full p-1.5 text-sm border rounded bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      placeholder="0"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsCashReceiptModalOpen(true)}
                      disabled={createInvoice || !jobCtx.partyName}
                      className="px-2 shadow-md hover:shadow-lg transition-shadow"
                      title={createInvoice ? "Disabled when Create Invoice is checked" : "Add Cash Receipt"}
                    >
                      ₹
                    </Button>
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createInvoice}
                      onChange={(e) => setCreateInvoice(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Create Invoice</span>
                  </label>
                </div>
              </div>
              <div className="mt-2 text-right">
                <div className="text-2xl">Total: ₹{finalTotal.toFixed(2)}</div>
                <div className="text-2xl">Payment Received: ₹{manualPayment.toFixed(2)}</div>
                <div className="text-2xl font-bold text-red-600">Balance Due: ₹{(finalTotal - manualPayment).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <Button variant="secondary" onClick={handleSavePDF}>
            <Save className="h-4 w-4 mr-2" /> Save Challan
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Challan
          </Button>
          <Button onClick={handlePersistChallan}>
            <Save className="h-4 w-4 mr-2" /> Post Challan (Stock OUT)
          </Button>
        </div>
      </Card>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Chalan"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Chalan"
        message="Are you sure you want to delete this chalan record? This action cannot be undone."
      />

      {/* Cash Receipt Modal */}
      <CashReceiptModal
        isOpen={isCashReceiptModalOpen}
        onClose={() => setIsCashReceiptModalOpen(false)}
        onSubmit={handleCashReceiptSubmit}
        customerName={jobCtx.partyName}
        maxAmount={finalTotal - manualPayment}
      />
    </div>
  );
};

export default ChalanStep;
