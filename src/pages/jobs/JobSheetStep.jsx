





import { Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { dbOperations } from "@/lib/db";
import { toast } from "sonner";

const JobSheetStep = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadRecords();
    loadVendorsAndLabourers();
    loadCategories();
  }, []);

  const loadVendorsAndLabourers = async () => {
    try {
      const vendorData = await dbOperations.getAll('vendors');
      setVendors(vendorData || []);
      
      const labourData = await dbOperations.getAll('labour');
      setLabourers(labourData || []);
    } catch (error) {
      console.error('Failed to load vendors/labourers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoryData = await dbOperations.getAll('inventory_categories');
      setCategories(categoryData || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadRecords = async () => {
    try {
      const data = await dbOperations.getAll('jobsheets');
      const sorted = (data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecords(sorted);
      setFilteredRecords(sorted);
    } catch (error) {
      console.error('Failed to load job sheets:', error);
      toast.error('Failed to load job sheets');
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
      await dbOperations.delete('jobsheets', id);
      toast.success('Job sheet deleted successfully');
      loadRecords();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete job sheet:', error);
      toast.error('Failed to delete job sheet');
    }
  };
  // Load data directly from Vehicle Inspection (Inspection Items)
  const [estimateItems, setEstimateItems] = useState(() => {
    const saved = localStorage.getItem("inspectionItems");
    return saved ? JSON.parse(saved) : [];
  });

  // Status state
  const [jobStatus, setJobStatus] = useState('pending');

  // Auto load saved workBy & notes if present in jobSheetEstimate
  useEffect(() => {
    const savedJobSheet = JSON.parse(localStorage.getItem("jobSheetEstimate") || "[]");
    if (savedJobSheet.length > 0) {
      const merged = estimateItems.map((item) => {
        const existing = savedJobSheet.find(
          (e) => e.item === item.item && e.category === item.category
        );
        return {
          ...item,
          workBy: existing?.workBy || "Labour",
          notes: existing?.notes || "",
          multiplier: item.multiplier || 1,
        };
      });
      setEstimateItems(merged);
    } else {
      const init = estimateItems.map((item) => ({
        ...item,
        workBy: "Labour",
        notes: "",
        multiplier: item.multiplier || 1,
      }));
      setEstimateItems(init);
    }
  }, []);

  // Handle field changes
  const handleEstimateChange = (index, field, value) => {
    const updated = [...estimateItems];
    updated[index][field] = value;
    setEstimateItems(updated);
  };

  // Save Notes & WorkBy to localStorage and database
  const saveJobSheet = async () => {
    try {
      // Save to localStorage
      localStorage.setItem("jobSheetEstimate", JSON.stringify(estimateItems));
      localStorage.setItem("extraWork", JSON.stringify(extraWork));

      const vehicleNo = jobCtx.vehicleNo || '';
      const date = jobCtx.date || new Date().toISOString().split('T')[0];

      // Check for existing record with same vehicle number and date
      const allRecords = await dbOperations.getAll('jobsheets');
      const existingRecord = allRecords.find(
        record => record.vehicle_no === vehicleNo && record.date === date
      );

      const jobSheetData = {
        vehicle_no: vehicleNo,
        party_name: jobCtx.partyName || '',
        date: date,
        inspection_items: estimateItems,
        extra_work: extraWork,
        subtotal_inspection: estimateSubTotal,
        subtotal_extra: extraWorkSubTotal,
        discount: discount,
        grand_total: finalTotal,
        status: jobStatus
      };

      // Add ledger entries for vendors and labour
      const addLedgerEntries = async () => {
        try {
          // Combine inspection items and extra work
          const allItems = [...estimateItems, ...extraWork];
          
          // Group items by vendor/labour
          const vendorGroups = {};
          const labourGroups = {};
          
          for (const item of allItems) {
            if (item.workOrder && item.assignedTo && calculateTotal(item) > 0) {
              const amount = calculateTotal(item);
              const workDescription = item.item || 'Work';
              
              if (item.workOrder === 'Vendor') {
                const vendor = vendors.find(v => v.name === item.assignedTo);
                if (vendor) {
                  if (!vendorGroups[vendor.id]) {
                    vendorGroups[vendor.id] = {
                      vendor: vendor,
                      works: [],
                      totalAmount: 0
                    };
                  }
                  vendorGroups[vendor.id].works.push(workDescription);
                  vendorGroups[vendor.id].totalAmount += amount;
                }
              } else if (item.workOrder === 'Labour') {
                const labour = labourers.find(l => l.name === item.assignedTo);
                if (labour) {
                  if (!labourGroups[labour.id]) {
                    labourGroups[labour.id] = {
                      labour: labour,
                      works: [],
                      totalAmount: 0
                    };
                  }
                  labourGroups[labour.id].works.push(workDescription);
                  labourGroups[labour.id].totalAmount += amount;
                }
              }
            }
          }
          
          // Create single ledger entry per vendor
          for (const vendorId in vendorGroups) {
            const group = vendorGroups[vendorId];
            const combinedWork = group.works.join(', ');
            
            // Calculate 12% of total amount for vendor
            const vendorAmount = group.totalAmount * 0.12;
            
            try {
              await dbOperations.insert('vendor_ledger_entries', {
                id: `${group.vendor.id}_${vehicleNo}_${date}_${Date.now()}`,
                vendor_id: group.vendor.id,
                entry_date: date,
                particulars: combinedWork,
                category: 'Multiple Works',
                debit_amount: vendorAmount,
                credit_amount: 0,
                vehicle_no: vehicleNo,
                owner_name: jobCtx.partyName || '',
                work: combinedWork,
                reference_type: 'job_sheet',
                reference_no: vehicleNo,
                entry_type: 'job_sheet'
              });
              
              // Update vendor balance
              const entries = await dbOperations.getByIndex('vendor_ledger_entries', 'vendor_id', group.vendor.id);
              const balance = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0) - (entry.credit_amount || 0), 0);
              await dbOperations.update('vendors', group.vendor.id, {
                current_balance: (group.vendor.opening_balance || 0) + balance
              });
            } catch (err) {
              console.error('Error adding vendor ledger entry:', err);
            }
          }
          
          // Create single ledger entry per labour
          for (const labourId in labourGroups) {
            const group = labourGroups[labourId];
            const combinedWork = group.works.join(', ');
            
            try {
              await dbOperations.insert('labour_ledger_entries', {
                id: `${group.labour.id}_${vehicleNo}_${date}_${Date.now()}`,
                labour_id: group.labour.id,
                entry_date: date,
                particulars: combinedWork,
                category: 'Multiple Works',
                debit_amount: 0,
                credit_amount: group.totalAmount,
                vehicle_no: vehicleNo,
                owner_name: jobCtx.partyName || '',
                reference_type: 'job_sheet',
                reference_no: vehicleNo,
                entry_type: 'job_sheet'
              });
              
              // Update labour balance
              const entries = await dbOperations.getByIndex('labour_ledger_entries', 'labour_id', group.labour.id);
              const balance = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0) - (entry.credit_amount || 0), 0);
              await dbOperations.update('labour', group.labour.id, {
                current_balance: (group.labour.opening_balance || 0) + balance
              });
            } catch (err) {
              console.error('Error adding labour ledger entry:', err);
            }
          }
        } catch (err) {
          console.error('Error in addLedgerEntries:', err);
          // Don't throw - allow job sheet to save even if ledger entries fail
        }
      };

      // Helper function to delete old ledger entries for this job sheet
      const deleteOldLedgerEntries = async () => {
        try {
          // Delete vendor ledger entries
          const vendorEntries = await dbOperations.getAll('vendor_ledger_entries');
          const oldVendorEntries = vendorEntries.filter(
            entry => entry.reference_type === 'job_sheet' && entry.reference_no === vehicleNo && entry.entry_date === date
          );
          for (const entry of oldVendorEntries) {
            await dbOperations.delete('vendor_ledger_entries', entry.id);
          }
          
          // Delete labour ledger entries
          const labourEntries = await dbOperations.getAll('labour_ledger_entries');
          const oldLabourEntries = labourEntries.filter(
            entry => entry.reference_type === 'job_sheet' && entry.reference_no === vehicleNo && entry.entry_date === date
          );
          for (const entry of oldLabourEntries) {
            await dbOperations.delete('labour_ledger_entries', entry.id);
          }
        } catch (err) {
          console.error('Error deleting old ledger entries:', err);
        }
      };

      if (existingRecord) {
        // Show confirmation for update
        const confirmed = window.confirm(
          `A job sheet already exists for Vehicle: ${vehicleNo} on Date: ${date}.\n\nDo you want to UPDATE the existing record?`
        );
        
        if (confirmed) {
          await deleteOldLedgerEntries(); // Delete old entries first
          await dbOperations.update('jobsheets', existingRecord.id, jobSheetData);
          await addLedgerEntries();
          toast.success('Job Sheet updated successfully!');
          await loadRecords();
        }
      } else {
        // Create new record
        await dbOperations.insert('jobsheets', jobSheetData);
        await addLedgerEntries();
        toast.success('Job Sheet saved successfully!');
        await loadRecords();
      }
    } catch (error) {
      console.error('Error saving job sheet:', error);
      toast.error('Failed to save job sheet: ' + error.message);
    }
  };

  // Extra Work Section
  const [extraWork, setExtraWork] = useState(() => {
    const saved = localStorage.getItem("extraWork");
    return saved ? JSON.parse(saved) : [];
  });

  const addExtraWork = () => {
    setExtraWork([
      ...extraWork,
      {
        category: "",
        item: "",
        condition: "OK",
        cost: 0,
        multiplier: 1,
        workBy: "Labour",
        notes: "",
      },
    ]);
  };

  const handleExtraWorkChange = (index, field, value) => {
    const updated = [...extraWork];
    updated[index][field] = value;
    setExtraWork(updated);
  };

  const deleteExtraWork = (index) => {
    const updated = extraWork.filter((_, i) => i !== index);
    setExtraWork(updated);
    localStorage.setItem("extraWork", JSON.stringify(updated));
  };

  // Total Calculation
  const calculateTotal = (item) => {
    const cost = parseFloat(item.cost) || 0;
    const multiplier = parseFloat(item.multiplier) || 1; // static multiplier
    return cost * multiplier;
  };

  const estimateSubTotal = estimateItems.reduce((acc, item) => acc + calculateTotal(item), 0);
  const extraWorkSubTotal = extraWork.reduce((acc, item) => acc + calculateTotal(item), 0);
  const grandTotal = estimateSubTotal + extraWorkSubTotal;

  // Load discount, advance, and round off from estimate context
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  
  useEffect(() => {
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
  }, []);
  
  const finalTotal = grandTotal - discount + roundOff;
  const balanceDue = finalTotal - advancePayment;

  // Prefill context from Inspection (vehicle/party)
  const [jobCtx, setJobCtx] = useState({ vehicleNo: "", partyName: "", contactNo: "", date: "" });
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jobsContext');
      if (raw) setJobCtx(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-xl font-bold">Job Sheet</h3>

      {/* Context Header */}
      {(jobCtx.vehicleNo || jobCtx.partyName) && (
        <div className="border rounded-lg p-3 shadow bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-sm font-medium">Vehicle: <span className="font-semibold">{jobCtx.vehicleNo}</span></div>
            <div className="text-sm font-medium">Party: <span className="font-semibold">{jobCtx.partyName}</span></div>
            <div className="text-sm font-medium">Contact: <span className="font-semibold">{jobCtx.contactNo}</span></div>
            <div className="text-sm font-medium">
              Status: 
              <select
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value)}
                className="ml-2 p-1 border rounded font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tasks from Inspection */}
      <div className="border rounded-lg p-4 shadow">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Tasks from Inspection</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="p-2 border dark:border-gray-700" style={{width: '30%'}}>Work</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '10%'}}>Category</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '10%'}}>Cost</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '8%'}}>Qty</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '10%'}}>Total</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '10%'}}>Work Order</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '12%'}}>Assigned To</th>
                <th className="p-2 border dark:border-gray-700" style={{width: '10%'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimateItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-gray-500">
                    No items in Inspection.
                  </td>
                </tr>
              ) : (
                estimateItems.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="p-2">{item.item}</td>
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">{item.cost}</td>
                    <td className="p-2">{parseFloat(item.multiplier)}</td>
                    <td className="p-2">{calculateTotal(item).toFixed(2)}</td>
                    <td className="p-2">{item.workOrder || '-'}</td>
                    <td className="p-2">{item.assignedTo || '-'}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) =>
                          handleEstimateChange(index, "notes", e.target.value)
                        }
                        placeholder="Notes..."
                        className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-3 text-right font-semibold">
            Subtotal (Inspection): ₹{estimateSubTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Extra Work Section */}
      <div className="border rounded-lg p-4 shadow">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Extra Work</h4>
          <div className="flex gap-2">
            <button
              onClick={addExtraWork}
              className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              ➕ Add Extra Work
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border" style={{width: '30%'}}>Work</th>
                <th className="p-2 border" style={{width: '10%'}}>Category</th>
                <th className="p-2 border" style={{width: '10%'}}>Cost (₹)</th>
                <th className="p-2 border" style={{width: '8%'}}>Qty</th>
                <th className="p-2 border" style={{width: '10%'}}>Total (₹)</th>
                <th className="p-2 border" style={{width: '10%'}}>Work Order</th>
                <th className="p-2 border" style={{width: '12%'}}>Assigned To</th>
                <th className="p-2 border" style={{width: '10%'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extraWork.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-gray-500">
                    No extra work added.
                  </td>
                </tr>
              ) : (
                extraWork.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "item", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        placeholder="Work description"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.category || ''}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "category", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "cost", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.multiplier}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "multiplier", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">{calculateTotal(item).toFixed(2)}</td>
                    <td className="p-2">
                      <select
                        value={item.workOrder || ''}
                        onChange={(e) => {
                          handleExtraWorkChange(index, "workOrder", e.target.value);
                          handleExtraWorkChange(index, "assignedTo", '');
                        }}
                        className="w-full p-1 border rounded"
                      >
                        <option value="">Select</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Labour">Labour</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={item.assignedTo || ''}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "assignedTo", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        disabled={!item.workOrder}
                      >
                        <option value="">Select</option>
                        {item.workOrder === 'Vendor' && vendors.map(v => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                        {item.workOrder === 'Labour' && labourers.map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => deleteExtraWork(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-right font-semibold">
          Subtotal (Extra Work): ₹{extraWorkSubTotal.toFixed(2)}
        </div>
      </div>

      {/* Totals */}
      <div className="text-right font-bold text-lg space-y-2">
        <div>Grand Total: ₹{grandTotal.toFixed(2)}</div>
        <div>Estimate Discount: ₹{discount.toFixed(2)}</div>
        <div>Round Off: ₹{roundOff.toFixed(2)}</div>
        <div className="text-xl border-t-2 pt-2">Final Total: ₹{finalTotal.toFixed(2)}</div>
        <div className="text-green-600">Advance Payment: ₹{advancePayment.toFixed(2)}</div>
        <div className="text-xl text-red-600 border-t-2 pt-2">Balance Due: ₹{balanceDue.toFixed(2)}</div>
      </div>

      {/* Save Job Sheet Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveJobSheet}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Job Sheet
        </button>
      </div>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Job Sheet"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Job Sheet"
        message="Are you sure you want to delete this job sheet record? This action cannot be undone."
      />
    </div>
  );
};

export default JobSheetStep;
