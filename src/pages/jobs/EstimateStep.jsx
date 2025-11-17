import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PlusCircle, Save, Printer } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { dbOperations } from "@/lib/db";
import { toast } from "sonner";
import useMultiplierStore from "@/store/multiplierStore";

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

  const [details, setDetails] = useState({
    vehicleNo: "",
    partyName: "",
    date: new Date().toISOString().split('T')[0],
    branch: "",
    status: "in-progress",
  });

  const { getCategoryMultiplier, getMultiplierByWorkType } = useMultiplierStore();

  useEffect(() => {
    const saved = localStorage.getItem("inspectionItems");
    const localItems = saved ? JSON.parse(saved) : [];
    setItems(localItems);

    const savedDiscount = localStorage.getItem("estimateDiscount");
    setDiscount(savedDiscount ? parseFloat(savedDiscount) : 0);

    const savedAdvance = localStorage.getItem("estimateAdvancePayment");
    setAdvancePayment(savedAdvance ? parseFloat(savedAdvance) : 0);

    const savedRoundOff = localStorage.getItem("estimateRoundOff");
    setRoundOff(savedRoundOff ? parseFloat(savedRoundOff) : 0);

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
  }, [discount]);

  useEffect(() => {
    localStorage.setItem("estimateAdvancePayment", advancePayment.toString());
  }, [advancePayment]);

  useEffect(() => {
    localStorage.setItem("estimateRoundOff", roundOff.toString());
  }, [roundOff]);

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

    if (item.category) {
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
      advance_payment: advancePayment || 0,
      balance_due: balanceDue,
      user_id: user?.id,
    };

    try {
      if (currentRecordId) {
        // Editing existing record
        await dbOperations.update('estimates', currentRecordId, payload);
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
            setCurrentRecordId(existingRecord.id);
            toast.success('Estimate updated successfully');
          }
        } else {
          // Create new record
          const rec = await dbOperations.insert('estimates', payload);
          setCurrentRecordId(rec.id);
          toast.success('Estimate saved successfully');
        }
      }
      await loadRecords();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Record loaded for editing');
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dbOperations.delete('estimates', id);
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
    toast.info('Ready for new estimate');
  };

  const handleSavePDF = () => {
    const input = document.getElementById("estimate-body");
    import('html2canvas').then(html2canvas => {
      html2canvas.default(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        const filename = details.vehicleNo ? `${details.vehicleNo}_estimate.pdf` : "estimate.pdf";
        pdf.save(filename);
      });
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("estimate-body");
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint.document.write(`<html><head><title>Estimate</title></head><body>${printContent.innerHTML}</body></html>`);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
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
          <div className="bg-red-600 text-white text-center py-3 -mx-4 md:-mx-6 lg:-mx-8 mb-4">
            <h1 className="text-2xl font-bold tracking-wider">ESTIMATE</h1>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-red-600 mb-2">Malwa Trolley Indore</h2>
              <p className="text-gray-600 italic mb-1">09, Nemawar Road, Udyog nagar, Palda, Indore</p>
              <a href="http://www.malwatrolley.com" className="text-blue-600 underline">www.malwatrolley.com</a>
              <p className="text-gray-700 mt-1">Contact :- +91 822 4000 822</p>
              <p className="text-gray-700">GST : 23CLKPM9473J1ZI</p>
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
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No inspection items.
                </td>
              </tr>
            )}
            {items.map((item, index) => {
              const multiplier = item.category ? getCategoryMultiplier(item.category.trim()) : (item.workBy ? getMultiplierByWorkType(item.workBy) : 1);
              return (
                <tr key={index}>
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{item.item || item.name}</td>
                  <td className="p-2 border text-right">{item.cost}</td>
                  <td className="p-2 border text-center">{multiplier}</td>
                  <td className="p-2 border text-right font-semibold">{calculateTotal(item).toFixed(2)}</td>
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
              <div><strong>MALWA TROLLEY</strong></div>
              <div>ACC. NO.: 917020005504917</div>
              <div>IFSC: UTIB0002512</div>
              <div>AXIS BANK PALDA INDORE</div>
            </div>
          </div>
          
          {/* Right side - Totals and Signature */}
          <div>
            <div className="text-base">
              <div className="flex justify-between border-b py-1">
                <span>Subtotal:</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Discount:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 border px-2 py-1 text-right text-sm"
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
                  className="w-20 border px-2 py-1 text-right text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between font-bold text-lg py-2 border-t-2">
                <span>Total:</span>
                <span>₹{(totalAfterDiscount + parseFloat(roundOff || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Advance Payment:</span>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  className="w-20 border px-2 py-1 text-right text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between font-bold text-lg py-2 border-t-2">
                <span>Balance Due:</span>
                <span>₹{balanceDue.toFixed(2)}</span>
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

      <div className="flex space-x-2 justify-end">
        <Button onClick={saveEstimate}>
          <Save className="h-4 w-4 mr-2" />
          {currentRecordId ? 'Update' : 'Save'} Estimate
        </Button>
        <Button onClick={handleSavePDF} variant="secondary">
          Save PDF
        </Button>
        <Button onClick={handlePrint} variant="secondary">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Estimate"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Estimate"
        message="Are you sure you want to delete this estimate record? This action cannot be undone."
      />
    </div>
  );
};

export default EstimateStep;
