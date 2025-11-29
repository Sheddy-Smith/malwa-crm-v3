import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Save, Trash2, Receipt, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { dbOperations } from "@/lib/db";
import { createStockMovement } from "@/utils/dataFlow";
import { toast } from "sonner";
import { openPrintPreview, PRINT_PRESETS } from '@/utils/printHelpers';
import useMultiplierStore from "@/store/multiplierStore";
import { broadcastDataChange } from "@/utils/dataSync";
import { saveRateListMemory } from "@/utils/rateListMemory";

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
    if (!formData.amount || parseFloat(formData.amount) === 0) {
      toast.error("Please enter a valid amount (cannot be 0)");
      return;
    }
    // Only check max amount for positive values
    if (parseFloat(formData.amount) > 0 && parseFloat(formData.amount) > maxAmount) {
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
  const [challanNo, setChallanNo] = useState(""); // Challan number state

  useEffect(() => {
    loadRecords();
    generateChallanNo(); // Auto-generate challan number on load
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

  // Generate challan number
  const generateChallanNo = async () => {
    try {
      const year = new Date().getFullYear();
      const prefix = `CHN/${year}/`;
      
      const allChallans = await dbOperations.getAll('sell_challans');
      const currentYearChallans = allChallans.filter(
        ch => ch.challan_no && ch.challan_no.startsWith(prefix)
      );
      
      let nextSeq = 1;
      if (currentYearChallans.length > 0) {
        const sequences = currentYearChallans.map(ch => {
          const parts = ch.challan_no.split('/');
          return parseInt(parts[2]) || 0;
        });
        nextSeq = Math.max(...sequences) + 1;
      }
      
      const newChallanNo = `${prefix}${nextSeq.toString().padStart(3, '0')}`;
      setChallanNo(newChallanNo);
    } catch (error) {
      console.error('Failed to generate challan number:', error);
      setChallanNo(`CHN/${new Date().getFullYear()}/001`);
    }
  };

  // 🔧 Backend Save Function - Saves challans to JSON file
  const saveChallansToBackend = async () => {
    if (!window.electron?.fs?.writeFile) {
      console.log('⚠️ Electron not available - skipping backend save');
      return;
    }
    
    try {
      const allChallans = await dbOperations.getAll('sell_challans');
      const filePath = 'C:/malwa-crm/Data_base/jobs/ChalanStep.json';
      await window.electron.fs.writeFile(
        filePath,
        JSON.stringify(allChallans, null, 2)
      );
      console.log('✅ Challans saved to backend:', filePath);
    } catch (error) {
      console.error('❌ Failed to save challans to backend:', error);
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
    try {
      // Load challan items back into jobSheetEstimate and extraWork
      if (record.items && record.items.length > 0) {
        const loadedItems = record.items.map(item => ({
          item: item.productName,
          cost: item.rate,
          multiplier: item.qty,
          category: item.category || ''
        }));
        localStorage.setItem('jobSheetEstimate', JSON.stringify(loadedItems));
      }
      
      if (record.discount !== undefined) {
        setDiscount(record.discount);
      }
      if (record.advance_payment !== undefined) {
        setAdvancePayment(record.advance_payment);
      }
      if (record.payment_status) {
        setPaymentStatus(record.payment_status);
      }
      if (record.payment_received !== undefined) {
        setManualPayment(record.payment_received);
      }
      if (record.status) {
        setCompletionStatus(record.status);
      }
      if (record.remark) {
        setCompletionRemark(record.remark);
      }
      if (record.create_invoice !== undefined) {
        setCreateInvoice(record.create_invoice);
      }
      
      // Set job context
      const ctx = {
        vehicleNo: record.vehicle_no,
        partyName: record.party_name
      };
      localStorage.setItem('jobsContext', JSON.stringify(ctx));
      setJobCtx(ctx);
      
      toast.success('Challan loaded successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reload the page to reflect the changes
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Failed to load record:', error);
      toast.error('Failed to load record');
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      // Get challan details before deleting
      const challan = await dbOperations.getById('sell_challans', id);
      
      // Delete the challan
      await dbOperations.delete('sell_challans', id);
      await saveChallansToBackend();
      
      // Delete related ledger entries
      if (challan && challan.customer_id) {
        try {
          const allLedgerEntries = await dbOperations.getAll('customer_ledger_entries');
          
          // Find and delete ledger entries for this challan
          const ledgerEntriesToDelete = allLedgerEntries.filter(entry => 
            entry.customer_id === challan.customer_id &&
            entry.reference_type === 'challan' &&
            (
              (challan.challan_no && entry.challan_no === challan.challan_no && entry.vehicle_no === challan.vehicle_no) ||
              entry.reference_id === id
            )
          );
          
          console.log('Deleting ledger entries for challan:', ledgerEntriesToDelete.length);
          
          for (const entry of ledgerEntriesToDelete) {
            await dbOperations.delete('customer_ledger_entries', entry.id);
            broadcastDataChange('customer_ledger_entries', 'delete', { id: entry.id, customer_id: entry.customer_id });
          }
          
          // Save ledger to backend
          if (window.electron?.fs?.writeFile) {
            const updatedLedger = await dbOperations.getAll('customer_ledger_entries');
            await window.electron.fs.writeFile(
              'C:/malwa-crm/Data_base/customer/Ledger.json',
              JSON.stringify(updatedLedger, null, 2)
            );
            console.log('✅ Ledger entries deleted and saved to backend');
          }
        } catch (ledgerError) {
          console.error('Failed to delete ledger entries:', ledgerError);
        }
      }
      
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
      const vehicleNo = jobCtx.vehicleNo || '';
      const entryDate = receiptData.date;
      
      // Check for existing payment entry using challan_no + vehicle_no + date combo
      const allLedgerEntries = await dbOperations.getAll('customer_ledger_entries');
      const existingPaymentEntry = allLedgerEntries.find(entry =>
        entry.customer_id === customer.id &&
        entry.type === 'payment' &&
        entry.challan_no === challanNo &&
        entry.vehicle_no === vehicleNo &&
        entry.entry_date === entryDate
      );
      
      if (existingPaymentEntry) {
        // Update existing payment entry - add new amount to existing
        const newTotalCredit = parseFloat(existingPaymentEntry.credit || 0) + amount;
        await dbOperations.update('customer_ledger_entries', existingPaymentEntry.id, {
          entry_date: entryDate,
          description: `Payment - ${challanNo} | ${vehicleNo}`,
          credit: newTotalCredit,
        });
        
        console.log('✅ Updated existing payment entry with additional amount:', amount);
        broadcastDataChange('customer_ledger_entries', 'update', { 
          id: existingPaymentEntry.id, 
          customer_id: customer.id 
        });
      } else {
        // Create new customer ledger entry for payment
        const ledgerEntry = await dbOperations.insert('customer_ledger_entries', {
          customer_id: customer.id,
          entry_date: entryDate,
          type: 'payment',
          description: `Payment - ${challanNo} | ${vehicleNo}`,
          debit: 0,
          credit: amount,
          reference_type: 'cash_receipt',
          reference_id: Date.now(),
          challan_no: challanNo,
          vehicle_no: vehicleNo,
        });
        
        // Broadcast ledger entry for real-time updates
        broadcastDataChange('customer_ledger_entries', 'add', { ...ledgerEntry, customer_id: customer.id });
      }
      
      // Save ledger entries to backend
      if (window.electron?.fs?.writeFile) {
        try {
          const allLedgerEntries = await dbOperations.getAll('customer_ledger_entries');
          await window.electron.fs.writeFile(
            'C:/malwa-crm/Data_base/customer/Ledger.json',
            JSON.stringify(allLedgerEntries, null, 2)
          );
          console.log('✅ Customer ledger saved to backend (cash receipt)');
        } catch (err) {
          console.error('❌ Failed to save ledger to backend:', err);
        }
      }

      // Save to cash receipts IndexedDB (for Accounts/Cash Receipt page)
      const receiptNo = `CR${Date.now()}`;
      const cashReceiptEntry = {
        id: `cr_${Date.now()}`,
        receipt_no: receiptNo,
        receipt_date: receiptData.date,
        customer_id: customer.id,
        received_from: receiptData.name,
        amount: amount,
        payment_mode: receiptData.paymentType?.toLowerCase() || 'cash',
        particulars: `Payment for Challan - ${challanNo}`,
        notes: `Vehicle: ${jobCtx.vehicleNo || 'N/A'}`,
        source: 'challan',
        challan_no: challanNo,
        vehicle_no: jobCtx.vehicleNo || '',
        created_at: new Date().toISOString(),
      };
      await dbOperations.insert('cash_receipts', cashReceiptEntry);
      
      // Also save to localStorage for backward compatibility
      const cashReceipts = JSON.parse(localStorage.getItem('cashReceipts') || '[]');
      const newReceipt = {
        id: cashReceiptEntry.id,
        name: receiptData.name,
        customer_id: customer.id,
        vehicleNo: jobCtx.vehicleNo || 'N/A',
        purpose: receiptData.purpose,
        paymentType: receiptData.paymentType,
        amount: amount,
        status: 'Received',
        date: receiptData.date,
        source: 'challan',
        challan_no: challanNo,
      };
      cashReceipts.push(newReceipt);
      localStorage.setItem('cashReceipts', JSON.stringify(cashReceipts));
      
      // Save cash receipts to backend
      if (window.electron?.fs?.writeFile) {
        try {
          const allReceipts = await dbOperations.getAll('cash_receipts');
          await window.electron.fs.writeFile(
            'C:/malwa-crm/Data_base/Accounts_Module/cash-receipts.json',
            JSON.stringify(allReceipts, null, 2)
          );
          console.log('✅ Cash receipts saved to backend');
        } catch (err) {
          console.error('❌ Failed to save cash receipts to backend:', err);
        }
      }

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
  const [completionStatus, setCompletionStatus] = useState('issued');
  const [completionRemark, setCompletionRemark] = useState('');

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

    // Use saved multiplier if available, otherwise calculate from category/workBy
    if (item.multiplier !== undefined && item.multiplier !== null) {
      multiplier = parseFloat(item.multiplier) || 1;
    } else if (item.category) {
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

  // ✅ Print Challan
  const handlePrint = () => {
    if (!jobCtx.vehicleNo) {
      toast.error('Please select a job before printing');
      return;
    }

    const success = openPrintPreview({
      elementId: 'challan-body',
      title: `Challan - ${jobCtx.vehicleNo}`,
      ...PRINT_PRESETS.invoice
    });

    if (!success) {
      toast.error('Failed to open print preview');
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
      const items = [...jobSheetEstimate, ...extraWork].map((item) => {
        const cost = parseFloat(item.cost) || 0;
        let multiplier = 1;
        
        // Use saved multiplier if available, otherwise calculate from category/workBy
        if (item.multiplier !== undefined && item.multiplier !== null) {
          multiplier = parseFloat(item.multiplier) || 1;
        } else if (item.category) {
          multiplier = getCategoryMultiplier(item.category.trim());
        } else if (item.workBy) {
          multiplier = getMultiplierByWorkType(item.workBy);
        }
        
        return {
          productName: item.item,
          qty: multiplier,
          rate: cost,
          total: cost * multiplier
        };
      });

      const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
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
      challan_no: challanNo,
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
      status: completionStatus,
      remark: completionRemark || undefined,
    };      let challanId = null;

      if (existingRecord) {
        // Show confirmation for update
        const confirmed = window.confirm(
          `A challan already exists for Vehicle: ${vehicleNo} on Date: ${date}.\n\nDo you want to UPDATE the existing record?`
        );
        
        if (!confirmed) {
          return;
        }

        await dbOperations.update('sell_challans', existingRecord.id, challanData);
        await saveChallansToBackend();
        challanId = existingRecord.id;
        toast.success('Challan updated successfully');
      } else {
        // Create new record
        const challan = await dbOperations.insert('sell_challans', challanData);
        await saveChallansToBackend();
        challanId = challan.id;

        // Create stock movements only for new challans
        for (const it of items) {
          await createStockMovement(undefined, it.productName, 'out', it.qty || 0, 'sell-challan', { challanId: challan.id });
          
          // Update inventory stock - reduce quantity
          try {
            const allInventoryItems = await dbOperations.getAll('inventory_items');
            const inventoryItem = allInventoryItems.find(item => 
              item.material_name?.toLowerCase() === it.productName?.toLowerCase()
            );
            
            if (inventoryItem) {
              const currentQty = parseFloat(inventoryItem.stock_quantity) || 0;
              const qtyToReduce = parseFloat(it.qty) || 0;
              const newQty = Math.max(0, currentQty - qtyToReduce); // Don't allow negative stock
              
              await dbOperations.update('inventory_items', inventoryItem.id, {
                stock_quantity: newQty,
                updated_at: new Date().toISOString(),
              });
              
              console.log(`✅ Updated stock for ${it.productName}: ${currentQty} -> ${newQty} (reduced by ${qtyToReduce})`);
            } else {
              console.warn(`⚠️ Item "${it.productName}" not found in inventory`);
            }
          } catch (invError) {
            console.error('Error updating inventory:', invError);
          }
          
          // Save sell rate history
          try {
            await dbOperations.insert('rate_history', {
              id: `rate_challan_${challan.id}_${item.id || Date.now()}_${Math.random()}`,
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

        // Save to Rate List Memory
        await saveRateListMemory(items.map(it => ({
          material_name: it.productName,
          category_id: it.category || '',
          rate: parseFloat(it.rate) || 0
        })));

        toast.success('Challan saved and stock updated');
      }

      // Update customer ledger for challan
      if (jobCtx.partyName) {
        try {
          // Find customer by name
          let customers = await dbOperations.getAll('customers');
          let customer = customers.find(c => 
            c.name.toLowerCase() === jobCtx.partyName.toLowerCase()
          );

          // Create customer if not exists
          if (!customer) {
            const newCustomerData = {
              name: jobCtx.partyName,
              phone: jobCtx.contactNo || '',
              address: '',
              gstin: '',
              type: 'customer',
              credit_limit: 0,
              credit_days: 30,
              opening_balance: 0
            };
            
            customer = await dbOperations.insert('customers', newCustomerData);
            toast.success('New customer created: ' + jobCtx.partyName);
            
            // Save customers to backend
            if (window.electron?.fs?.writeFile) {
              try {
                const allCustomers = await dbOperations.getAll('customers');
                await window.electron.fs.writeFile(
                  'C:/malwa-crm/Data_base/customer/Details.json',
                  JSON.stringify(allCustomers, null, 2)
                );
                console.log('✅ Customers saved to backend');
              } catch (err) {
                console.error('❌ Failed to save customers to backend:', err);
              }
            }
          }

          if (customer) {
            const allLedgerEntries = await dbOperations.getAll('customer_ledger_entries');
            // Unique identifier: challan_no + vehicle_no + date
            const uniqueKey = `${challanNo}|${vehicleNo}|${date}`;
            
            // Check for existing ledger entry with same challan + vehicle + date combo
            const existingSaleLedger = allLedgerEntries.find(entry =>
              entry.customer_id === customer.id &&
              (entry.type === 'sale' || entry.type === 'invoice') &&
              entry.challan_no === challanNo &&
              entry.vehicle_no === vehicleNo &&
              entry.entry_date === date
            );
            
            const existingPaymentLedger = allLedgerEntries.find(entry =>
              entry.customer_id === customer.id &&
              entry.type === 'payment' &&
              entry.challan_no === challanNo &&
              entry.vehicle_no === vehicleNo &&
              entry.entry_date === date
            );
            
            if (existingSaleLedger) {
              // Update existing sale/invoice ledger entry (preserve type if it's already an invoice)
              // Use grandTotal (before discount/round off) as the sale amount
              await dbOperations.update('customer_ledger_entries', existingSaleLedger.id, {
                entry_date: date,
                description: existingSaleLedger.type === 'invoice' ? `Invoice - ${challanNo} | ${vehicleNo}` : `Challan Sale - ${challanNo} | ${vehicleNo}`,
                debit: grandTotal,
                credit: 0,
                reference_id: challanId,
                challan_no: challanNo,
                vehicle_no: vehicleNo,
              });
              
              broadcastDataChange('customer_ledger_entries', 'update', { 
                id: existingSaleLedger.id, 
                customer_id: customer.id 
              });
            } else {
              // Create new sale ledger entry - Use grandTotal (before discount/round off)
              const saleLedgerEntry = await dbOperations.insert('customer_ledger_entries', {
                customer_id: customer.id,
                entry_date: date,
                type: 'sale',
                description: `Challan Sale - ${challanNo} | ${vehicleNo}`,
                debit: grandTotal,
                credit: 0,
                reference_type: 'challan',
                reference_id: challanId,
                challan_no: challanNo,
                vehicle_no: vehicleNo,
              });
              
              broadcastDataChange('customer_ledger_entries', 'add', { ...saleLedgerEntry, customer_id: customer.id });
            }
            
            if (manualPayment > 0) {
              if (existingPaymentLedger) {
                // Update existing payment ledger entry
                await dbOperations.update('customer_ledger_entries', existingPaymentLedger.id, {
                  entry_date: date,
                  description: `Payment - ${challanNo} | ${vehicleNo}`,
                  debit: 0,
                  credit: manualPayment,
                  reference_id: challanId,
                  challan_no: challanNo,
                  vehicle_no: vehicleNo,
                });
                
                broadcastDataChange('customer_ledger_entries', 'update', { 
                  id: existingPaymentLedger.id, 
                  customer_id: customer.id 
                });
              } else {
                // Create new payment ledger entry
                const paymentLedgerEntry = await dbOperations.insert('customer_ledger_entries', {
                  customer_id: customer.id,
                  entry_date: date,
                  type: 'payment',
                  description: `Payment - ${challanNo} | ${vehicleNo}`,
                  debit: 0,
                  credit: manualPayment,
                  reference_type: 'challan',
                  reference_id: challanId,
                  challan_no: challanNo,
                  vehicle_no: vehicleNo,
                });
                
                broadcastDataChange('customer_ledger_entries', 'add', { ...paymentLedgerEntry, customer_id: customer.id });
              }
            }
            
            // Create discount ledger entry if discount > 0
            if (discount > 0) {
              const existingDiscountLedger = allLedgerEntries.find(entry =>
                entry.customer_id === customer.id &&
                entry.type === 'discount' &&
                entry.challan_no === challanNo &&
                entry.vehicle_no === vehicleNo &&
                entry.entry_date === date
              );
              
              if (existingDiscountLedger) {
                // Update existing discount ledger entry
                await dbOperations.update('customer_ledger_entries', existingDiscountLedger.id, {
                  entry_date: date,
                  description: `Discount - ${challanNo} | ${vehicleNo}`,
                  debit: 0,
                  credit: discount,
                  reference_id: challanId,
                  challan_no: challanNo,
                  vehicle_no: vehicleNo,
                });
                
                broadcastDataChange('customer_ledger_entries', 'update', { 
                  id: existingDiscountLedger.id, 
                  customer_id: customer.id 
                });
              } else {
                // Create new discount ledger entry
                const discountLedgerEntry = await dbOperations.insert('customer_ledger_entries', {
                  customer_id: customer.id,
                  entry_date: date,
                  type: 'discount',
                  description: `Discount - ${challanNo} | ${vehicleNo}`,
                  debit: 0,
                  credit: discount,
                  reference_type: 'challan',
                  reference_id: challanId,
                  challan_no: challanNo,
                  vehicle_no: vehicleNo,
                });
                
                broadcastDataChange('customer_ledger_entries', 'add', { ...discountLedgerEntry, customer_id: customer.id });
              }
            }
            
            // Save ledger entries to backend
            if (window.electron?.fs?.writeFile) {
              try {
                const allLedgerEntries = await dbOperations.getAll('customer_ledger_entries');
                await window.electron.fs.writeFile(
                  'C:/malwa-crm/Data_base/customer/Ledger.json',
                  JSON.stringify(allLedgerEntries, null, 2)
                );
                console.log('✅ Customer ledger entries saved to backend');
              } catch (err) {
                console.error('❌ Failed to save ledger to backend:', err);
              }
            }

            toast.success('Customer ledger updated');
          }
        } catch (ledgerError) {
          console.error('Ledger update error:', ledgerError);
          toast.error('Failed to update customer ledger');
        }
      }

      // Create invoice if requested
      if (createInvoice && jobCtx.partyName) {
        try {
          let customers = await dbOperations.getAll('customers');
          let customer = customers.find(c => 
            c.name.toLowerCase() === jobCtx.partyName.toLowerCase()
          );

          // Create customer if not exists
          if (!customer) {
            const newCustomerData = {
              name: jobCtx.partyName,
              phone: jobCtx.contactNo || '',
              address: '',
              gstin: '',
              type: 'customer',
              credit_limit: 0,
              credit_days: 30,
              opening_balance: 0
            };
            
            customer = await dbOperations.insert('customers', newCustomerData);
            toast.success('New customer created for invoice');
            
            // Save customers to backend
            if (window.electron?.fs?.writeFile) {
              try {
                const allCustomers = await dbOperations.getAll('customers');
                await window.electron.fs.writeFile(
                  'C:/malwa-crm/Data_base/customer/Details.json',
                  JSON.stringify(allCustomers, null, 2)
                );
                console.log('✅ Customers saved to backend');
              } catch (err) {
                console.error('❌ Failed to save customers to backend:', err);
              }
            }
          }

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
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Challan No:</td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Auto-generated"
                    />
                  </td>
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Date:</td>
                  <td className="p-2 border">{new Date().toLocaleDateString('en-GB')}</td>
                </tr>
                <tr>
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Party Name:</td>
                  <td className="p-2 border">{jobCtx.partyName || '--'}</td>
                  <td className="p-2 border bg-gray-50 font-semibold w-1/4">Phone Number:</td>
                  <td className="p-2 border">{jobCtx.contactNo || '--'}</td>
                </tr>
                <tr>
                  <td className="p-2 border bg-gray-50 font-semibold">Vehicle Number:</td>
                  <td className="p-2 border" colSpan="3">{jobCtx.vehicleNo || '--'}</td>
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
                  // Use saved multiplier if available, otherwise calculate from category/workBy
                  let multiplier = 1;
                  if (item.multiplier !== undefined && item.multiplier !== null) {
                    multiplier = parseFloat(item.multiplier) || 1;
                  } else if (item.category) {
                    multiplier = getCategoryMultiplier(item.category.trim());
                  } else if (item.workBy) {
                    multiplier = getMultiplierByWorkType(item.workBy);
                  }
                  
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
                  // Use saved multiplier if available, otherwise calculate from category/workBy
                  let multiplier = 1;
                  if (item.multiplier !== undefined && item.multiplier !== null) {
                    multiplier = parseFloat(item.multiplier) || 1;
                  } else if (item.category) {
                    multiplier = getCategoryMultiplier(item.category.trim());
                  } else if (item.workBy) {
                    multiplier = getMultiplierByWorkType(item.workBy);
                  }
                  
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

            {/* Completion Status Section */}
            <div className="mt-4 pt-3 border-t">
              <h5 className="text-xs font-semibold mb-2">Deal Completion Status</h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1 font-medium">Completion Status *</label>
                  <select
                    value={completionStatus}
                    onChange={(e) => setCompletionStatus(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="issued">Issued</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                    <option value="complete">Complete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 font-medium">Completion Remark</label>
                  <input
                    type="text"
                    value={completionRemark}
                    onChange={(e) => setCompletionRemark(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Optional notes (e.g., 'delivered on time', 'issue with part')"
                  />
                </div>
              </div>
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
                      placeholder=""
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
          <Button onClick={handlePrint} variant="secondary">
            <Printer className="h-4 w-4 mr-2" /> Print Challan
          </Button>
          <Button variant="secondary" onClick={handleSavePDF}>
            <Save className="h-4 w-4 mr-2" /> Save Challan
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
