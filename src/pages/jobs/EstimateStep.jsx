import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PlusCircle, Save, Printer } from "lucide-react";
import { useAuthStore } from '@/store/authManagementStore';
import { dbOperations } from "@/lib/db";
import { toast } from "sonner";
import { openPrintPreview, PRINT_PRESETS } from '@/utils/printHelpers';
import useMultiplierStore from "@/store/multiplierStore";
import useCompanyStore from "@/store/companyStore";

// Cash Receipt Modal Component
const CashReceiptModal = ({ isOpen, onClose, onSubmit, customerName }) => {
  const [formData, setFormData] = useState({
    name: customerName || "",
    purpose: "Advance Payment for Estimate",
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
    onSubmit(formData);
    setFormData({
      name: customerName || "",
      purpose: "Advance Payment for Estimate",
      paymentType: "Cash",
      amount: "",
      status: "Received",
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cash Receipt - Advance Payment">
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

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
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

// Number to words conversion
const numberToWords = (num) => {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTenth = (digit, prev) => {
    return 0 == digit ? '' : ' ' + (1 == digit ? double[prev] : tens[digit]);
  };
  const formatOther = (digit, next, denom) => {
    return (0 != digit && 1 != next ? ' ' + single[digit] : '') + (0 != next || digit > 0 ? ' ' + denom : '');
  };
  let res = '';
  let index = 0;
  let digit = 0;
  let next = 0;
  let words = [];
  if (num += '', isNaN(parseInt(num))) {
    res = '';
  } else if (parseInt(num) > 0 && num.length <= 10) {
    for (index = num.length - 1; index >= 0; index--) switch (digit = num[index] - 0, next = index > 0 ? num[index - 1] - 0 : 0, num.length - index - 1) {
      case 0:
        words.push(formatOther(digit, next, ''));
        break;
      case 1:
        words.push(formatTenth(digit, num[index + 1]));
        break;
      case 2:
        words.push(0 != digit ? ' ' + single[digit] + ' Hundred' + (0 != num[index + 1] && 0 != num[index + 2] ? ' and' : '') : '');
        break;
      case 3:
        words.push(formatOther(digit, next, 'Thousand'));
        break;
      case 4:
        words.push(formatTenth(digit, num[index + 1]));
        break;
      case 5:
        words.push(formatOther(digit, next, 'Lakh'));
        break;
      case 6:
        words.push(formatTenth(digit, num[index + 1]));
        break;
      case 7:
        words.push(formatOther(digit, next, 'Crore'));
        break;
      case 8:
        words.push(formatTenth(digit, num[index + 1]));
        break;
      case 9:
        words.push(0 != digit ? ' ' + single[digit] + ' Hundred' + (0 != num[index + 1] || 0 != num[index + 2] ? ' and' : ' Crore') : '');
    }
    res = words.reverse().join('');
  } else res = '';
  return res + ' Rupees Only';
};

const EstimateStep = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isCashReceiptModalOpen, setIsCashReceiptModalOpen] = useState(false);

  const [details, setDetails] = useState({
    vehicleNo: "",
    partyName: "",
    date: new Date().toISOString().split('T')[0],
    branch: "",
    status: "in-progress",
  });

  const { getCategoryMultiplier, getMultiplierByWorkType } = useMultiplierStore();
  const { companyDetails } = useCompanyStore();

  useEffect(() => {
    const saved = localStorage.getItem("inspectionItems");
    const localItems = saved ? JSON.parse(saved) : [];
    setItems(localItems);

    // Try to load from saved estimate context first
    const savedEstimateContext = localStorage.getItem("estimateContext");
    if (savedEstimateContext) {
      try {
        const ctx = JSON.parse(savedEstimateContext);
        if (ctx.currentRecordId) {
          setCurrentRecordId(ctx.currentRecordId);
          setDiscount(ctx.discount || 0);
          setAdvancePayment(ctx.advancePayment !== undefined ? ctx.advancePayment : 0);
          setRoundOff(ctx.roundOff || 0);
          setDetails(prev => ({
            ...prev,
            vehicleNo: ctx.vehicleNo || prev.vehicleNo,
            partyName: ctx.partyName || prev.partyName,
            date: ctx.date || prev.date,
            branch: ctx.branch || prev.branch,
            status: ctx.status || prev.status,
          }));
        }
      } catch (e) {
        console.error('Failed to load estimate context:', e);
      }
    } else {
      // Fallback to old localStorage method - default to 0 for new inspection
      const savedDiscount = localStorage.getItem("estimateDiscount");
      setDiscount(savedDiscount ? parseFloat(savedDiscount) : 0);

      const savedAdvance = localStorage.getItem("estimateAdvancePayment");
      const advanceValue = savedAdvance ? parseFloat(savedAdvance) : 0;
      setAdvancePayment(isNaN(advanceValue) ? 0 : advanceValue);

      const savedRoundOff = localStorage.getItem("estimateRoundOff");
      setRoundOff(savedRoundOff ? parseFloat(savedRoundOff) : 0);
    }

    // Prefill vehicle/party from Inspection context if available
    try {
      const ctxRaw = localStorage.getItem('jobsContext');
      if (ctxRaw) {
        const ctx = JSON.parse(ctxRaw);
        setDetails((d) => ({
          ...d,
          vehicleNo: ctx?.vehicleNo || d.vehicleNo || "",
          partyName: ctx?.partyName || d.partyName || "",
          date: ctx?.date || d.date,
        }));
      }
    } catch {}

    loadRecords();
  }, []);

  useEffect(() => {
    localStorage.setItem("estimateDiscount", discount.toString());
    saveEstimateContext();
  }, [discount]);

  useEffect(() => {
    localStorage.setItem("estimateAdvancePayment", advancePayment.toString());
    saveEstimateContext();
  }, [advancePayment]);

  useEffect(() => {
    localStorage.setItem("estimateRoundOff", roundOff.toString());
    saveEstimateContext();
  }, [roundOff]);

  // Save complete estimate context for persistence across steps
  const saveEstimateContext = () => {
    const estimateContext = {
      currentRecordId,
      vehicleNo: details.vehicleNo,
      partyName: details.partyName,
      date: details.date,
      branch: details.branch,
      status: details.status,
      discount,
      advancePayment,
      roundOff,
      items,
    };
    localStorage.setItem("estimateContext", JSON.stringify(estimateContext));
  };

  const loadRecords = async () => {
    try {
      const data = await dbOperations.getAll('estimates');
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecords(sorted);
      setFilteredRecords(sorted);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load estimate records');
    }
  };

  // 🔧 Backend Save Function - Saves estimates to JSON file
  const saveEstimatesToBackend = async () => {
    if (!window.electron?.fs?.writeFile) {
      console.log('⚠️ Electron not available - skipping backend save');
      return;
    }
    
    try {
      const allEstimates = await dbOperations.getAll('estimates');
      const filePath = 'C:/malwa-crm/Data_base/jobs/EstimateStep.json';
      await window.electron.fs.writeFile(
        filePath,
        JSON.stringify(allEstimates, null, 2)
      );
      console.log('✅ Estimates saved to backend:', filePath);
    } catch (error) {
      console.error('❌ Failed to save estimates to backend:', error);
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

  const subTotal = items.reduce((sum, item) => sum + calculateTotal(item), 0);
  const totalAfterDiscount = subTotal - discount;
  const totalWithRoundOff = totalAfterDiscount + parseFloat(roundOff || 0);
  const balanceDue = totalWithRoundOff - advancePayment;

  const saveEstimate = async () => {
    if (!details.vehicleNo || !details.partyName) {
      toast.error('Vehicle No and Party Name are required');
      return;
    }

    const payload = {
      vehicle_no: details.vehicleNo,
      party_name: details.partyName,
      date: details.date,
      branch: details.branch,
      status: details.status,
      items: items,
      subtotal: subTotal,
      discount: discount || 0,
      round_off: parseFloat(roundOff || 0),
      total: totalWithRoundOff,
      advance_payment: parseFloat(advancePayment) || 0,
      balance_due: balanceDue,
      user_id: user?.id,
    };

    try {
      if (currentRecordId) {
        // Editing existing record
        await dbOperations.update('estimates', currentRecordId, payload);
        await saveEstimatesToBackend();
        toast.success('Estimate updated successfully');
      } else {
        // Check for duplicate with same vehicle and date
        const allRecords = await dbOperations.getAll('estimates');
        const existingRecord = allRecords.find(
          record => record.vehicle_no === details.vehicleNo && record.date === details.date
        );

        if (existingRecord) {
          // Show confirmation for update
          const confirmed = window.confirm(
            `An estimate already exists for Vehicle: ${details.vehicleNo} on Date: ${details.date}.\n\nDo you want to UPDATE the existing record?`
          );
          
          if (confirmed) {
            await dbOperations.update('estimates', existingRecord.id, payload);
            await saveEstimatesToBackend();
            setCurrentRecordId(existingRecord.id);
            toast.success('Estimate updated successfully');
          }
        } else {
          // Create new record
          const rec = await dbOperations.insert('estimates', payload);
          await saveEstimatesToBackend();
          setCurrentRecordId(rec.id);
          toast.success('Estimate saved successfully');
        }
      }
      await loadRecords();
      
      // Save estimate context for next steps
      saveEstimateContext();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save estimate');
    }
  };

  const handleEditRecord = (record) => {
    setCurrentRecordId(record.id);
    setDetails({
      vehicleNo: record.vehicle_no,
      partyName: record.party_name,
      date: record.date,
      branch: record.branch,
      status: record.status,
    });
    setItems(record.items || []);
    setDiscount(record.discount || 0);
    setRoundOff(record.round_off || 0);
    setAdvancePayment(record.advance_payment || 0);
    
    // Save to context for persistence
    const estimateContext = {
      currentRecordId: record.id,
      vehicleNo: record.vehicle_no,
      partyName: record.party_name,
      date: record.date,
      branch: record.branch,
      status: record.status,
      discount: record.discount || 0,
      advancePayment: record.advance_payment || 0,
      roundOff: record.round_off || 0,
      items: record.items || [],
    };
    localStorage.setItem("estimateContext", JSON.stringify(estimateContext));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Record loaded for editing');
  };

  const handleCashReceiptSubmit = async (receiptData) => {
    try {
      if (!details.partyName) {
        toast.error('Please enter party name first');
        return;
      }

      const amount = parseFloat(receiptData.amount) || 0;

      // Find customer by name
      const customers = await dbOperations.getAll('customers');
      const customer = customers.find(c => 
        c.name.trim().toLowerCase() === details.partyName.trim().toLowerCase()
      );

      // Create customer ledger entry for advance payment (credit - they paid in advance)
      if (customer) {
        const ledgerEntryId = `cle_adv_${Date.now()}`;
        await dbOperations.insert('customer_ledger_entries', {
          id: ledgerEntryId,
          customer_id: customer.id,
          entry_date: receiptData.date,
          type: 'payment',
          description: `Advance Payment - ${details.vehicleNo || 'Estimate'}`,
          debit: 0,
          credit: amount,
          reference_type: 'estimate',
          reference_id: currentRecordId || Date.now(),
          vehicle_no: details.vehicleNo || '',
          created_at: new Date().toISOString()
        });
        console.log('✅ Created advance payment ledger entry for customer:', customer.id);
      } else {
        console.warn('⚠️ Customer not found for advance payment ledger:', details.partyName);
      }

      // Save to cash receipts IndexedDB (for Accounts/Cash Receipt page)
      const receiptNo = `CR${Date.now()}`;
      const cashReceiptEntry = {
        id: `cr_${Date.now()}`,
        receipt_no: receiptNo,
        receipt_date: receiptData.date,
        customer_id: customer?.id || '',
        received_from: details.partyName,
        amount: amount,
        payment_mode: receiptData.paymentType?.toLowerCase() || 'cash',
        particulars: `Advance Payment for Estimate`,
        notes: `Vehicle: ${details.vehicleNo || 'N/A'}`,
        source: 'estimate',
        vehicle_no: details.vehicleNo || '',
        created_at: new Date().toISOString(),
      };
      await dbOperations.insert('cash_receipts', cashReceiptEntry);
      
      // Also save to localStorage for backward compatibility
      const cashReceipts = JSON.parse(localStorage.getItem('cashReceipts') || '[]');
      const newReceipt = {
        id: cashReceiptEntry.id,
        name: details.partyName,
        customer_id: customer?.id || '',
        vehicleNo: details.vehicleNo || 'N/A',
        purpose: receiptData.purpose,
        paymentType: receiptData.paymentType,
        amount: amount,
        status: 'Received',
        date: receiptData.date,
        source: 'estimate'
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
      
      // Update advance payment
      setAdvancePayment(prev => prev + amount);
      
      // Save context to persist the advance payment
      setTimeout(() => saveEstimateContext(), 100);
      
      toast.success('Advance payment recorded successfully');
      setIsCashReceiptModalOpen(false);
    } catch (error) {
      console.error('Error recording advance payment:', error);
      toast.error('Failed to record advance payment');
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dbOperations.delete('estimates', id);
      await saveEstimatesToBackend();
      toast.success('Estimate deleted successfully');
      await loadRecords();
      setDeleteConfirmId(null);

      if (currentRecordId === id) {
        setCurrentRecordId(null);
        setDetails({
          vehicleNo: "",
          partyName: "",
          date: new Date().toISOString().split('T')[0],
          branch: "",
          status: "in-progress",
        });
        setItems([]);
        setDiscount(0);
        setRoundOff(0);
        setAdvancePayment(0);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete estimate');
    }
  };

  const handleNewRecord = () => {
    setCurrentRecordId(null);
    setDetails({
      vehicleNo: "",
      partyName: "",
      date: new Date().toISOString().split('T')[0],
      branch: "",
      status: "in-progress",
    });
    const saved = localStorage.getItem("inspectionItems");
    setItems(saved ? JSON.parse(saved) : []);
    setDiscount(0);
    setRoundOff(0);
    setAdvancePayment(0);
    
    // Clear estimate context and localStorage
    localStorage.removeItem("estimateContext");
    localStorage.removeItem("estimateAdvancePayment");
    localStorage.removeItem("estimateDiscount");
    localStorage.removeItem("estimateRoundOff");
    
    toast.info('Ready for new estimate');
  };

  const handlePrint = () => {
    if (!details.vehicleNo) {
      toast.error('Please enter vehicle number before printing');
      return;
    }

    const success = openPrintPreview({
      elementId: 'estimate-body',
      title: `Estimate - ${details.vehicleNo}`,
      ...PRINT_PRESETS.estimate
    });

    if (!success) {
      toast.error('Failed to open print preview');
    }
  };

  const handleSavePDF = () => {
    const input = document.getElementById("estimate-body");
    import('html2canvas').then(html2canvas => {
      html2canvas.default(input, { 
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: input.scrollWidth,
        height: input.scrollHeight
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'SLOW');
        heightLeft -= pdfHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'SLOW');
          heightLeft -= pdfHeight;
        }
        
        const filename = details.vehicleNo ? `${details.vehicleNo}_estimate.pdf` : "estimate.pdf";
        pdf.save(filename);
      });
    });
  };



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Estimate</h3>
        <Button onClick={handleNewRecord} variant="secondary" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="font-medium">Vehicle No:</label>
            <input
              type="text"
              value={details.vehicleNo}
              onChange={(e) => setDetails({ ...details, vehicleNo: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Party Name:</label>
            <input
              type="text"
              value={details.partyName}
              onChange={(e) => setDetails({ ...details, partyName: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Status:</label>
            <select
              value={details.status}
              onChange={(e) => setDetails({ ...details, status: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="in-progress">Work in Progress</option>
              <option value="pending-confirmation">Pending for Customer Confirmation</option>
              <option value="approve-next-step">Approve for Next Step</option>
              <option value="deal-not-done">Deal Not Done</option>
              <option value="hold">Hold for Material</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
      </Card>

      <div id="estimate-body" className="bg-white -mx-4 md:-mx-6 lg:-mx-8">
        {/* Header Section */}
        <div className="mb-6 px-4 md:px-6 lg:px-8">
          <div className="bg-red-600 text-white text-center py-1 -mx-4 md:-mx-6 lg:-mx-8 mb-4">
            <h1 className="text-2xl font-bold tracking-wider">ESTIMATE</h1>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-red-600 mb-2">{companyDetails.name || "Malwa Trolley Indore"}</h2>
              <p className="text-gray-600 italic mb-1">{`${companyDetails.address || ''}, ${companyDetails.city || ''}`.replace(/^, /, '').replace(/, $/, '') || "09, Nemawar Road, Udyog nagar, Palda, Indore"}</p>
              <a href={`http://${companyDetails.website || "www.malwatrolley.com"}`} className="text-blue-600 underline">{companyDetails.website || "www.malwatrolley.com"}</a>
              <p className="text-gray-700 mt-1">Contact :- {companyDetails.phone || "+91 822 4000 822"}</p>
              <p className="text-gray-700">GST : {companyDetails.gstin || "23CLKPM9473J1ZI"}</p>
            </div>
            
            {companyDetails.logo && (
              <div className="flex-shrink-0 ml-4">
                <img 
                  src={companyDetails.logo} 
                  alt="Company Logo" 
                  className="h-32 w-32 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6 lg:px-8">
        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-base">
          <div className="border p-3">
            <h5 className="font-bold mb-2">ESTIMATE FOR:</h5>
            <div><strong>Vehicle No:</strong> {details.vehicleNo || 'N/A'}</div>
            <div><strong>Party Name:</strong> {details.partyName || 'N/A'}</div>
            <div><strong>Status:</strong> {(() => {
              const map = {
                'in-progress': 'Work in Progress',
                'pending-confirmation': 'Pending for Customer Confirmation',
                'approve-next-step': 'Approve for Next Step',
                'deal-not-done': 'Deal Not Done',
                'hold': 'Hold for Material',
                'complete': 'Complete'
              };
              return map[details.status] || details.status;
            })()}</div>
          </div>
          <div className="border p-3">
            <div><strong>Estimate Date:</strong> {new Date(details.date).toLocaleDateString('en-GB')}</div>
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
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-1 px-2 text-center text-gray-500">
                  No inspection items.
                </td>
              </tr>
            )}
            {items.map((item, index) => {
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
                <tr key={index}>
                  <td className="p-2 border text-center">{index + 1}</td>
                  <td className="p-2 border">{item.item || item.name}</td>
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
            <div className="italic mb-4">{numberToWords(Math.round(balanceDue))}</div>
            
            {/* Account Details */}
            <div className="mt-4 pt-4 border-t">
              <div className="font-semibold mb-2">Account Details:</div>
              <div><strong>{companyDetails.bankDetails?.accountHolderName || companyDetails.name || "MALWA TROLLEY"}</strong></div>
              {companyDetails.bankDetails?.accountNumber && (
                <div>ACC. NO.: {companyDetails.bankDetails.accountNumber}</div>
              )}
              {companyDetails.bankDetails?.ifscCode && (
                <div>IFSC: {companyDetails.bankDetails.ifscCode}</div>
              )}
              {companyDetails.bankDetails?.bankName && companyDetails.bankDetails?.branch && (
                <div>{companyDetails.bankDetails.bankName} {companyDetails.bankDetails.branch}</div>
              )}
              {/* Fallback to default if no bank details are set */}
              {!companyDetails.bankDetails?.accountNumber && (
                <>
                  <div>ACC. NO.: 917020005504917</div>
                  <div>IFSC: UTIB0002512</div>
                  <div>AXIS BANK PALDA INDORE</div>
                </>
              )}
              <div className="mt-2 text-sm italic text-gray-600">*GST Extra on above amount</div>
            </div>
          </div>
          
          {/* Right side - Totals and Signature */}
          <div>
            <div className="text-base">
              <div className="flex justify-between border-b py-1">
                <span>Subtotal:</span>
                <span className="font-bold">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Discount:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 border px-2 py-1 text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Round Off:</span>
                <input
                  type="number"
                  step="0.01"
                  value={roundOff}
                  onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                  className="w-24 border px-2 py-1 text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between font-bold text-xl py-2 border-t-2">
                <span>Total:</span>
                <span>₹{(totalAfterDiscount + parseFloat(roundOff || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setIsCashReceiptModalOpen(true)}
                    disabled={!details.partyName}
                    className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                      minWidth: '30px'
                    }}
                    title="Record Advance Payment"
                  >
                    ₹
                  </button>
                  <span>Advance Payment:</span>
                </div>
                <span className="text-right font-bold">₹{(advancePayment || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl py-2 border-t-2">
                <span>Balance Due:</span>
                <span className="text-red-600">₹{balanceDue.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Authorized Signature */}
            <div className="mt-8 text-right">
              <div className="inline-block border-t-2 border-black pt-2 px-8">
                <div className="font-semibold">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions - Slim Footer */}
        {companyDetails.termsEstimate && companyDetails.termsEstimate.length > 0 && (
          <div className="mt-6 pt-3 border-t border-gray-300">
            <div className="text-xs font-semibold mb-1">Terms & Conditions:</div>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-gray-700">
              {companyDetails.termsEstimate.map((term, index) => (
                <li key={index} className="leading-tight">{term}</li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </div>

      <div className="flex space-x-2 justify-end">
        <Button onClick={saveEstimate}>
          <Save className="h-4 w-4 mr-2" />
          {currentRecordId ? 'Update' : 'Save'} Estimate
        </Button>
        <Button onClick={handlePrint} variant="secondary">
          <Printer className="h-4 w-4 mr-2" />
          Print Estimate
        </Button>
        <Button onClick={handleSavePDF} variant="secondary">
          Save PDF
        </Button>

      </div>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Estimate"
        showStatus={true}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Estimate"
        message="Are you sure you want to delete this estimate record? This action cannot be undone."
      />

      <CashReceiptModal
        isOpen={isCashReceiptModalOpen}
        onClose={() => setIsCashReceiptModalOpen(false)}
        onSubmit={handleCashReceiptSubmit}
        customerName={details.partyName}
      />
    </div>
  );
};

export default EstimateStep;
