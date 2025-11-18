





import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Save, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { dbOperations } from "@/lib/db";
import { createLedgerEntry } from "@/utils/dataFlow";
import { toast } from "sonner";
import useMultiplierStore from "@/store/multiplierStore";

// Cash Receipt Modal Component
const CashReceiptModal = ({ isOpen, onClose, onSubmit, customerName, maxAmount }) => {
  const [formData, setFormData] = useState({
    name: customerName || "",
    purpose: "Payment for Invoice",
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
    if (maxAmount !== undefined && parseFloat(formData.amount) > maxAmount) {
      toast.error(`Amount cannot exceed balance due: ₹${maxAmount.toFixed(2)}`);
      return;
    }
    onSubmit(formData);
    setFormData({
      name: customerName || "",
      purpose: "Payment for Invoice",
      paymentType: "Cash",
      amount: "",
      status: "Received",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const resetForm = () => {
    setFormData({
      name: customerName || "",
      purpose: "Payment for Invoice",
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
            {maxAmount !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max: ₹{maxAmount.toFixed(2)}</p>
            )}
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

const InvoiceStep = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [jobCtx, setJobCtx] = useState({ vehicleNo: "", partyName: "", contactNo: "" });
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isCashReceiptModalOpen, setIsCashReceiptModalOpen] = useState(false);

  useEffect(() => {
    loadRecords();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await dbOperations.getAll('customers');
      setCustomers(data || []);
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  const loadRecords = async () => {
    try {
      const data = await dbOperations.getAll('invoices');
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecords(sorted);
      setFilteredRecords(sorted);
    } catch (e) {
      console.error('Failed to load invoices:', e);
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
      await dbOperations.delete('invoices', id);
      toast.success('Invoice deleted successfully');
      await loadRecords();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleAddCustomer = async (customerData) => {
    try {
      const newCustomer = await dbOperations.insert('customers', customerData);
      await loadCustomers();
      setCustomer(newCustomer.id);
      setSelectedCustomerDetails(newCustomer);
      setShowCustomerModal(false);
      toast.success('Customer added successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add customer');
    }
  };

  const handleCashReceiptSubmit = async (receiptData) => {
    try {
      if (!customer) {
        toast.error('Please select a customer first');
        return;
      }

      const amount = parseFloat(receiptData.amount) || 0;

      // Create ledger entry for cash receipt
      const ledgerEntry = {
        customer_id: customer,
        entry_date: receiptData.date,
        type: 'payment',
        description: `Cash Receipt - ${receiptData.purpose}`,
        debit: 0,
        credit: amount,
        reference_type: 'invoice',
        reference_id: null, // Will be updated when invoice is saved
        payment_type: receiptData.paymentType,
        created_at: new Date().toISOString()
      };

      await dbOperations.insert('customer_ledger_entries', ledgerEntry);
      
      // Save to cash receipts list (for Accounts/Cash Receipt page)
      const cashReceipts = JSON.parse(localStorage.getItem('cashReceipts') || '[]');
      const newReceipt = {
        id: Date.now(),
        name: selectedCustomerDetails?.name || receiptData.name,
        vehicleNo: jobCtx.vehicleNo || 'N/A',
        purpose: receiptData.purpose,
        paymentType: receiptData.paymentType,
        amount: amount,
        status: 'Received',
        date: receiptData.date,
        source: 'invoice'
      };
      cashReceipts.push(newReceipt);
      localStorage.setItem('cashReceipts', JSON.stringify(cashReceipts));
      
      // Update payment amount - add to existing payment
      setPaymentAmount(prev => {
        const newAmount = prev + amount;
        
        // Save to localStorage per vehicle so it persists on reload
        if (jobCtx.vehicleNo) {
          try {
            const savedPayments = JSON.parse(localStorage.getItem('invoicePaymentAmounts') || '{}');
            savedPayments[jobCtx.vehicleNo] = newAmount;
            localStorage.setItem('invoicePaymentAmounts', JSON.stringify(savedPayments));
          } catch (e) {
            console.error('Failed to save payment amount:', e);
          }
        }
        
        return newAmount;
      });
      
      toast.success('Cash receipt recorded successfully');
      setIsCashReceiptModalOpen(false);
    } catch (error) {
      console.error('Error recording cash receipt:', error);
      toast.error('Failed to record cash receipt');
    }
  };

  // Job Sheet data (static)
  const jobSheetEstimate = JSON.parse(localStorage.getItem("jobSheetEstimate") || "[]");
  const extraWork = JSON.parse(localStorage.getItem("extraWork") || "[]");
  useEffect(() => {
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

  const subTotal = subTotalEstimate + subTotalExtra;

  const [customer, setCustomer] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [paymentType, setPaymentType] = useState("Full Payment");
  const [gstType, setGstType] = useState("IGST"); // IGST or CGST+SGST
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [roundOff, setRoundOff] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);

  useEffect(() => {
    // Load from estimate context
    try {
      const estimateContext = localStorage.getItem("estimateContext");
      if (estimateContext) {
        const ctx = JSON.parse(estimateContext);
        setDiscount(ctx.discount || 0);
        const advPayment = ctx.advancePayment || 0;
        setAdvancePayment(advPayment);
        setRoundOff(ctx.roundOff || 0);
      } else {
        // Fallback to old method
        setDiscount(parseFloat(localStorage.getItem("estimateDiscount")) || 0);
        const advPayment = parseFloat(localStorage.getItem("estimateAdvancePayment")) || 0;
        setAdvancePayment(advPayment);
        setRoundOff(parseFloat(localStorage.getItem("estimateRoundOff")) || 0);
      }
    } catch (e) {
      console.error('Failed to load estimate context:', e);
    }
  }, []);

  // Load saved payment amount for this specific vehicle
  useEffect(() => {
    if (jobCtx.vehicleNo) {
      try {
        const savedPayments = JSON.parse(localStorage.getItem('invoicePaymentAmounts') || '{}');
        const savedAmount = savedPayments[jobCtx.vehicleNo];
        if (savedAmount !== undefined) {
          setPaymentAmount(savedAmount);
        } else {
          // Default to advance payment if no saved payment for this vehicle
          setPaymentAmount(advancePayment);
        }
      } catch (e) {
        console.error('Failed to load payment amount:', e);
        setPaymentAmount(advancePayment);
      }
    }
  }, [jobCtx.vehicleNo, advancePayment]);

  // Load jobContext and auto-select customer
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jobsContext');
      if (raw) {
        const ctx = JSON.parse(raw);
        setJobCtx(ctx);
        
        // Auto-select customer based on partyName
        if (ctx.partyName && customers.length > 0) {
          const matchingCustomer = customers.find(c => 
            c.name.toLowerCase() === ctx.partyName.toLowerCase()
          );
          if (matchingCustomer) {
            setCustomer(matchingCustomer.id);
            setSelectedCustomerDetails(matchingCustomer);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load job context:', e);
    }
  }, [customers]);
  
  // Convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
    };
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = num % 1000;
    
    let result = '';
    if (crore) result += convertHundreds(crore) + ' Crore ';
    if (lakh) result += convertHundreds(lakh) + ' Lakh ';
    if (thousand) result += convertHundreds(thousand) + ' Thousand ';
    if (hundred) result += convertHundreds(hundred);
    
    return result.trim() + ' Rupees Only';
  };
  
  // GST Calculation based on type
  const gstRate = 18; // Total GST is always 18%
  const cgstRate = 9;
  const sgstRate = 9;
  const igstRate = 18;
  
  const gstAmount = (subTotal * gstRate) / 100;
  const cgstAmount = gstType === "CGST+SGST" ? (subTotal * cgstRate) / 100 : 0;
  const sgstAmount = gstType === "CGST+SGST" ? (subTotal * sgstRate) / 100 : 0;
  const igstAmount = gstType === "IGST" ? (subTotal * igstRate) / 100 : 0;
  
  const grandTotal = subTotal + gstAmount;
  const totalAfterDiscount = grandTotal - discount;
  const totalWithRoundOff = totalAfterDiscount + parseFloat(roundOff || 0);
  const finalTotal = totalWithRoundOff; // Grand Total (before advance payment)
  const balanceDue = finalTotal - advancePayment; // Balance after advance payment

  // PDF download
  const handleSavePDF = () => {
    const input = document.getElementById("invoice-body");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const filename = jobCtx.vehicleNo ? `${jobCtx.vehicleNo}_invoice.pdf` : "invoice.pdf";
      pdf.save(filename);
    });
  };

  // Print
  const handlePrint = () => {
    const printContent = document.getElementById("invoice-body");
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint.document.write(`<html><head><title>Invoice</title></head><body>${printContent.innerHTML}</body></html>`);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };








const handleSaveInvoice = async () => {
  try {
    if (!customer) {
      toast.error('Please select or enter a customer');
      return;
    }

    const allItems = [...jobSheetEstimate, ...extraWork].map(item => ({
      category: item.category,
      item: item.item,
      condition: item.condition,
      cost: parseFloat(item.cost) || 0,
      total: calculateTotal(item),
    }));

    const date = new Date().toISOString().split('T')[0];
    const subtotal = allItems.reduce((s, i) => s + (i.total || 0), 0);
    
    // Calculate GST based on type
    const gstAmt = (subtotal * 18) / 100;
    const cgst = gstType === "CGST+SGST" ? (subtotal * 9) / 100 : 0;
    const sgst = gstType === "CGST+SGST" ? (subtotal * 9) / 100 : 0;
    const igst = gstType === "IGST" ? (subtotal * 18) / 100 : 0;
    
    const totalAfterDisc = subtotal + gstAmt - (discount || 0);
    const final = totalAfterDisc + parseFloat(roundOff || 0);

    // Get customer details
    let customerId = customer;
    let customerName = customer;
    
    if (!isNewCustomer) {
      const selectedCustomer = customers.find(c => c.id === customer);
      if (selectedCustomer) {
        customerName = selectedCustomer.name;
      }
    }

    const vehicleNo = jobCtx.vehicleNo || '';

    // Check for duplicate with same vehicle and date
    const allRecords = await dbOperations.getAll('invoices');
    const existingRecord = allRecords.find(
      record => record.vehicle_no === vehicleNo && record.date === date
    );

    const invoiceData = {
      date,
      vehicle_no: vehicleNo || undefined,
      party_name: jobCtx.partyName || undefined,
      customer_id: !isNewCustomer ? customerId : undefined,
      customer_name: customerName,
      payment_type: paymentType,
      payment_received: paymentAmount,
      balance_due: final - paymentAmount,
      items: allItems,
      subtotal,
      gst_type: gstType,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      tax: gstAmt,
      discount: discount || 0,
      round_off: parseFloat(roundOff || 0),
      total: final,
      status: paymentAmount >= final ? 'paid' : 'pending',
    };

    let invoiceId = null;

    if (existingRecord) {
      // Show confirmation for update
      const confirmed = window.confirm(
        `An invoice already exists for Vehicle: ${vehicleNo} on Date: ${date}.\n\nDo you want to UPDATE the existing record?`
      );
      
      if (!confirmed) {
        return;
      }

      // Update existing invoice
      await dbOperations.update('invoices', existingRecord.id, invoiceData);
      invoiceId = existingRecord.id;

      // Update sell_challan if exists
      const allChallans = await dbOperations.getAll('sell_challans');
      const existingChallan = allChallans.find(c => c.invoice_id === existingRecord.id);
      
      if (existingChallan) {
        await dbOperations.update('sell_challans', existingChallan.id, {
          date,
          vehicle_no: vehicleNo || undefined,
          party_name: jobCtx.partyName || undefined,
          customer_name: customerName,
          items: allItems,
          subtotal,
          gst_type: gstType,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          tax: gstAmt,
          discount: discount || 0,
          total: final,
          status: 'invoiced',
          invoice_id: existingRecord.id,
        });
      }

      toast.success('Invoice updated successfully');
    } else {
      // Save new invoice to invoices table
      const invoice = await dbOperations.insert('invoices', invoiceData);
      invoiceId = invoice.id;

      // Also save to sell_challans table for consistency
      await dbOperations.insert('sell_challans', {
        date,
        vehicle_no: vehicleNo || undefined,
        party_name: jobCtx.partyName || undefined,
        customer_name: customerName,
        items: allItems,
        subtotal,
        gst_type: gstType,
        cgst: cgst,
        sgst: sgst,
        igst: igst,
        tax: gstAmt,
        discount: discount || 0,
        total: final,
        status: 'invoiced',
        invoice_id: invoice.id,
      });
      
      // Save sell rate history for all items
      for (const item of allItems) {
        try {
          await dbOperations.insert('rate_history', {
            item_name: item.productName || item.item_name || item.name,
            category_id: item.category || '',
            rate: parseFloat(item.rate) || 0,
            vendor_name: customerName || jobCtx.partyName || 'N/A',
            source: 'sell_invoice',
            reference_no: vehicleNo,
            reference_id: invoice.id,
            date: date,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error saving rate history:', err);
        }
      }

      toast.success('Invoice saved successfully');
    }

    // Create ledger entries if customer exists (only for new invoices)
    if (!existingRecord && !isNewCustomer && customerId) {
      try {
        // Create invoice ledger entry (debit)
        await dbOperations.insert('customer_ledger_entries', {
          customer_id: customerId,
          entry_date: date,
          type: 'invoice',
          description: `Invoice for Vehicle: ${jobCtx.vehicleNo || 'N/A'}`,
          debit: final,
          credit: 0,
          reference_type: 'invoice',
          reference_id: invoiceId,
        });

        // Create payment ledger entry if payment received (credit)
        if (paymentAmount > 0) {
          await dbOperations.insert('customer_ledger_entries', {
            customer_id: customerId,
            entry_date: date,
            type: 'payment',
            description: `Payment received for Invoice - Vehicle: ${jobCtx.vehicleNo || 'N/A'}`,
            debit: 0,
            credit: paymentAmount,
            reference_type: 'invoice',
            reference_id: invoiceId,
          });
        }
      } catch (ledgerError) {
        console.error('Failed to create ledger entry:', ledgerError);
      }
    }

    await loadRecords();
  } catch (e) {
    console.error(e);
    toast.error('Failed to save invoice');
  }
};








  return (
    <div className="space-y-4 p-4">
      <h3 className="text-xl font-bold">Invoice</h3>
      {(jobCtx.vehicleNo || jobCtx.partyName) && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm">Vehicle: <span className="font-semibold">{jobCtx.vehicleNo}</span></div>
          <div className="text-sm">Party: <span className="font-semibold">{jobCtx.partyName}</span></div>
        </div>
      )}

      <Card>
        {/* Customer & Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-4">
          <div>
            <label className="text-xs font-medium">Customer</label>
            {!isNewCustomer ? (
              <select
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  const selectedCust = customers.find(c => c.id === e.target.value);
                  setSelectedCustomerDetails(selectedCust || null);
                }}
                className="w-full border p-1.5 rounded mt-1 text-sm"
              >
                <option value="">Select Customer</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter new customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full border p-1.5 rounded mt-1 text-sm"
              />
            )}
            <div className="mt-1">
              <button
                className="text-xs text-blue-500 underline"
                onClick={() => setShowCustomerModal(true)}
              >
                Add New Customer
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border p-1.5 rounded mt-1 text-sm"
            >
              <option>Full Payment</option>
              <option>Advance Payment</option>
              <option>Partial Payment</option>
              <option>Payment Due</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Payment Received (₹)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  readOnly
                  className="w-full border p-1.5 rounded mt-1 text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  placeholder="Amount"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCashReceiptModalOpen(true)}
                disabled={!customer}
                className="mt-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold text-lg disabled:opacity-50 border rounded bg-white dark:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                  minWidth: '45px'
                }}
                title="Record Cash Receipt"
              >
                ₹
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Due: ₹{(finalTotal - paymentAmount).toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Round Off (₹)</label>
            <input
              type="number"
              step="0.01"
              value={roundOff}
              onChange={(e) => setRoundOff(e.target.value)}
              className="w-full border p-1.5 rounded mt-1 text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-medium">GST Type</label>
            <select
              value={gstType}
              onChange={(e) => setGstType(e.target.value)}
              className="w-full border p-1.5 rounded mt-1 text-sm"
            >
              <option value="IGST">IGST 18%</option>
              <option value="CGST+SGST">CGST 9% + SGST 9%</option>
            </select>
          </div>
        </div>

        {/* Invoice Body */}
        <div id="invoice-body" className="bg-white -mx-4 md:-mx-6 lg:-mx-8">
          {/* Header Section */}
          <div className="mb-6 px-4 md:px-6 lg:px-8">
            <div className="bg-red-600 text-white text-center py-3 -mx-4 md:-mx-6 lg:-mx-8 mb-4">
              <h1 className="text-2xl font-bold tracking-wider">INVOICE</h1>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-red-600 mb-2">Malwa Trolley</h2>
                <p className="text-gray-600 italic mb-1">09, Nemawar Road, Udyog nagar, Palda, Indore</p>
                <a href="http://www.malwatrolley.com" className="text-blue-600 underline">www.malwatrolley.com</a>
                <p className="text-gray-700 mt-1">Contact :- +91 822 4000 822</p>
                <p className="text-gray-700">GSTIN : 23CLKPM9473J1ZI</p>
              </div>
              
              <div className="flex-shrink-0 ml-4">
                <img 
                  src="/malwa_logo.png" 
                  alt="Malwa Trolley Logo" 
                  className="h-32 w-32 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.log('Logo image not found');
                  }}
                />
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8">
        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-base">
            <div className="border p-3">
              <h5 className="font-bold mb-2">BILL TO:</h5>
              <div><strong>Name:</strong> {selectedCustomerDetails?.name || customer || 'N/A'}</div>
              <div><strong>Contact:</strong> {selectedCustomerDetails?.phone || jobCtx.contactNo || 'N/A'}</div>
              <div><strong>Address:</strong> {selectedCustomerDetails?.address || 'N/A'}</div>
              <div><strong>GST No:</strong> {selectedCustomerDetails?.gstin || 'N/A'}</div>
            </div>
            <div className="border p-3">
              <div><strong>Invoice Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
              <div><strong>Vehicle No:</strong> {jobCtx.vehicleNo || 'N/A'}</div>
              <div><strong>Payment Type:</strong> {paymentType}</div>
            </div>
          </div>
          
        <h4 className="font-semibold mb-2">ITEMS</h4>
        <table className="w-full text-base border border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border" style={{width: '5%'}}>S.No</th>
                <th className="p-2 border" style={{width: '55%'}}>Work</th>
                <th className="p-2 border" style={{width: '15%'}}>Cost (₹)</th>
                <th className="p-2 border" style={{width: '10%'}}>Qty.</th>
                <th className="p-2 border" style={{width: '15%'}}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {jobSheetEstimate.map((item, idx) => {
                const multiplier = item.category ? getCategoryMultiplier(item.category.trim()) : (item.workBy ? getMultiplierByWorkType(item.workBy) : 1);
                return (
                  <tr key={`est-${idx}`} className="border-b">
                    <td className="p-2 border text-center">{idx + 1}</td>
                    <td className="p-2 border">{item.item}</td>
                    <td className="p-2 border text-right">{item.cost}</td>
                    <td className="p-2 border text-center">{multiplier}</td>
                    <td className="p-2 border text-right">{calculateTotal(item).toFixed(2)}</td>
                  </tr>
                );
              })}
              {extraWork.map((item, idx) => {
                const multiplier = item.category ? getCategoryMultiplier(item.category.trim()) : (item.workBy ? getMultiplierByWorkType(item.workBy) : 1);
                return (
                  <tr key={`extra-${idx}`} className="border-b">
                    <td className="p-2 border text-center">{jobSheetEstimate.length + idx + 1}</td>
                    <td className="p-2 border">{item.item}</td>
                    <td className="p-2 border text-right">{item.cost}</td>
                    <td className="p-2 border text-center">{multiplier}</td>
                    <td className="p-2 border text-right">{calculateTotal(item).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="mt-4 grid grid-cols-2 gap-4">
          {/* Left side - Amount in Words and Account Details */}
          <div className="text-base">
              <div className="font-semibold mb-2">Amount in Words:</div>
              <div className="italic mb-4">{numberToWords(Math.round(finalTotal))}</div>
              
              {/* Account Details */}
              <div className="mt-4 pt-4 border-t">
                <div className="font-semibold mb-2">Account Details:</div>
                <div><strong>MALWA TROLLEY</strong></div>
                <div>ACC. NO.: 917020005504917</div>
                <div>IFSC: UTIB0002512</div>
                <div>AXIS BANK PALDA INDORE</div>
              </div>
            </div>
            
            {/* Right side - Totals and Signature */}
            <div>
              <div className="text-sm">
                <div className="flex justify-between border-b py-1">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                {gstType === "IGST" ? (
                  <div className="flex justify-between border-b py-1">
                    <span>IGST (18%):</span>
                    <span>₹{igstAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between border-b py-1">
                      <span>CGST (9%):</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span>SGST (9%):</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-b py-1">
                  <span>Discount:</span>
                  <span>₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span>Round Off:</span>
                  <span>₹{parseFloat(roundOff || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg py-2 border-t-2">
                  <span>Grand Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Authorized Signature */}
              <div className="mt-8 text-right">
                <div className="inline-block border-t border-black pt-2 px-8">
                  <div className="font-semibold">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mt-4">
          <Button onClick={handleSavePDF}>
            <Save className="h-4 w-4 mr-2" /> Save Invoice
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Invoice
          </Button>
          <Button onClick={handleSaveInvoice}>
            <Save className="h-4 w-4 mr-2" /> Save Invoice (Ledger)
          </Button>

        </div>
      </Card>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Invoice"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice record? This action cannot be undone."
      />

      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Add New Customer"
      >
        <CustomerForm 
          onSave={handleAddCustomer}
          onCancel={() => setShowCustomerModal(false)}
        />
      </Modal>

      <CashReceiptModal
        isOpen={isCashReceiptModalOpen}
        onClose={() => setIsCashReceiptModalOpen(false)}
        onSubmit={handleCashReceiptSubmit}
        customerName={selectedCustomerDetails?.name || ''}
        maxAmount={finalTotal - paymentAmount}
      />
    </div>
  );
};

const CustomerForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    gstin: '',
    credit_limit: 0,
    credit_days: 30,
    opening_balance: 0
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!formData.name || !formData.phone) return toast.error("Name and Phone are required.");
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-1.5 text-sm border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Company</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full p-1.5 text-sm border rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Phone *</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-1.5 text-sm border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Address</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="2"
          className="w-full p-1.5 text-sm border rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">GSTIN</label>
        <input
          type="text"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          className="w-full p-1.5 text-sm border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">Credit Limit (₹)</label>
          <input
            type="number"
            name="credit_limit"
            value={formData.credit_limit}
            onChange={handleChange}
            min="0"
            className="w-full p-1.5 text-sm border rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Credit Days</label>
          <input
            type="number"
            name="credit_days"
            value={formData.credit_days}
            onChange={handleChange}
            min="0"
            className="w-full p-1.5 text-sm border rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Opening Balance (₹)</label>
        <input
          type="number"
          name="opening_balance"
          value={formData.opening_balance}
          onChange={handleChange}
          className="w-full p-1.5 text-sm border rounded"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Customer
        </Button>
      </div>
    </form>
  );
};

export default InvoiceStep;









