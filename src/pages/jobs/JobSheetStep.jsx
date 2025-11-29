





import { Save, FileText, Printer } from "lucide-react";
import React, { useState, useEffect } from "react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import ComboBox from "@/components/ui/ComboBox";
import { dbOperations } from "@/lib/db";
import { toast } from "sonner";
import { openPrintPreview, PRINT_PRESETS } from '@/utils/printHelpers';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveRateListMemory } from "@/utils/rateListMemory";

const JobSheetStep = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    loadRecords();
    loadVendorsAndLabourers();
    loadCategories();
    loadInventoryItems();
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

  const loadInventoryItems = async () => {
    try {
      const items = await dbOperations.getAll('inventory_items');
      const cats = await dbOperations.getAll('inventory_categories');
      const rateMemory = await dbOperations.getAll('rate_list_memory') || [];
      
      // Enrich items with category names
      const enrichedItems = (items || []).map(item => {
        const category = cats.find(c => c.id === item.category_id);
        return {
          ...item,
          category_name: category ? category.name : 'Uncategorized'
        };
      });
      
      // Also add rate list memory items that don't exist in inventory
      const inventoryNames = enrichedItems.map(i => i.name?.toLowerCase());
      const rateMemoryItems = rateMemory
        .filter(r => r.material_name && !inventoryNames.includes(r.material_name?.toLowerCase()))
        .map(r => {
          const category = cats.find(c => c.id === r.category_id);
          return {
            id: `rate_${r.id}`,
            name: r.material_name,
            category_id: r.category_id,
            category_name: category ? category.name : 'Uncategorized',
            selling_price: r.selling_price || r.rate || 0,
            cost_price: r.actual_price || 0
          };
        });
      
      setInventoryItems([...enrichedItems, ...rateMemoryItems]);
    } catch (error) {
      console.error('Failed to load inventory items:', error);
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

  // 🔧 Backend Save Function - Saves job sheets to JSON file
  const saveJobSheetsToBackend = async () => {
    if (!window.electron?.fs?.writeFile) {
      console.log('⚠️ Electron not available - skipping backend save');
      return;
    }
    
    try {
      const allJobSheets = await dbOperations.getAll('jobsheets');
      const filePath = 'C:/malwa-crm/Data_base/jobs/JobSheetStep.json';
      await window.electron.fs.writeFile(
        filePath,
        JSON.stringify(allJobSheets, null, 2)
      );
      console.log('✅ Job sheets saved to backend:', filePath);
    } catch (error) {
      console.error('❌ Failed to save job sheets to backend:', error);
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
      // Load job sheet data into form
      if (record.inspection_items) {
        setEstimateItems(record.inspection_items);
        localStorage.setItem('inspectionItems', JSON.stringify(record.inspection_items));
      }
      if (record.extra_work) {
        setExtraWork(record.extra_work);
        localStorage.setItem('extraWork', JSON.stringify(record.extra_work));
      }
      if (record.discount !== undefined) {
        setDiscount(record.discount);
      }
      if (record.status) {
        setJobStatus(record.status);
      }
      
      // Set job context
      const ctx = {
        vehicleNo: record.vehicle_no,
        partyName: record.party_name,
        wheeler: record.wheeler,
        date: record.date
      };
      localStorage.setItem('jobsContext', JSON.stringify(ctx));
      setJobCtx(ctx);
      
      toast.success('Job sheet loaded successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to load record:', error);
      toast.error('Failed to load record');
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dbOperations.delete('jobsheets', id);
      await saveJobSheetsToBackend();
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

      // Save to Rate List Memory (Estimate prices as actual_price)
      const allItems = [...estimateItems, ...extraWork];
      const rateItems = allItems
        .filter(item => item.item && parseFloat(item.cost) > 0)
        .map(item => ({
          material_name: item.item,
          category_id: item.category || '',
          actual_price: parseFloat(item.cost) || 0,
          selling_price: parseFloat(item.cost) || 0  // Same as actual for estimate
        }));
      
      if (rateItems.length > 0) {
        await saveRateListMemory(rateItems, 'estimate');
      }

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
        wheeler: jobCtx.wheeler || '',
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
                debit_amount: 0,
                credit_amount: vendorAmount,
                vehicle_no: vehicleNo,
                wheeler: jobCtx.wheeler || '',
                owner_name: jobCtx.partyName || '',
                work: combinedWork,
                reference_type: 'job_sheet',
                reference_no: vehicleNo,
                entry_type: 'job_sheet'
              });
              
              // Update vendor balance
              const entries = await dbOperations.getByIndex('vendor_ledger_entries', 'vendor_id', group.vendor.id);
              const balance = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0) - (entry.debit_amount || 0), 0);
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
              const balance = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0) - (entry.debit_amount || 0), 0);
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
          await saveJobSheetsToBackend();
          toast.success('Job Sheet updated successfully!');
          await loadRecords();
        }
      } else {
        // Create new record
        await dbOperations.insert('jobsheets', jobSheetData);
        await addLedgerEntries();
        await saveJobSheetsToBackend();
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
  const [jobCtx, setJobCtx] = useState({ vehicleNo: "", partyName: "", contactNo: "", wheeler: "", date: "" });
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
                  <td colSpan={8} className="text-center py-1 px-2 text-gray-500">
                    No items in Inspection.
                  </td>
                </tr>
              ) : (
                estimateItems.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="p-2">{item.item}</td>
                    <td className="p-2">{item.category || '-'}</td>
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

        <div className="overflow-visible">
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
            <tbody className="relative">
              {extraWork.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-1 px-2 text-gray-500">
                    No extra work added.
                  </td>
                </tr>
              ) : (
                extraWork.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 relative">
                      <ComboBox
                        value={item.item}
                        onChange={(value) =>
                          handleExtraWorkChange(index, "item", value)
                        }
                        onSelect={(suggestion) => {
                          if (suggestion) {
                            const sellingPrice = parseFloat(suggestion.selling_price) || 0;
                            const categoryName = suggestion.category_name || '';
                            
                            handleExtraWorkChange(index, "item", suggestion.name);
                            handleExtraWorkChange(index, "category", categoryName);
                            handleExtraWorkChange(index, "cost", sellingPrice.toFixed(2));
                          }
                        }}
                        suggestions={inventoryItems}
                        placeholder="Select or type work item..."
                        displayKey="name"
                        className="w-full p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) => handleExtraWorkChange(index, "category", e.target.value)}
                        list="categories-list-extra"
                        placeholder="Category"
                        className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
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
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setIsWorkOrderModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
        >
          <FileText className="w-5 h-5" />
          Work Order Generate
        </button>
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

      {/* Work Order Modal */}
      <Modal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        title="Work Order"
        size="xxl"
      >
        <div className="space-y-6">
          {(() => {
            // Combine inspection items and extra work
            const allItems = [...estimateItems, ...extraWork];
            
            // Group items by assignedTo person
            const groupedByPerson = {};
            
            allItems.forEach(item => {
              if (item.assignedTo && item.workOrder) {
                if (!groupedByPerson[item.assignedTo]) {
                  groupedByPerson[item.assignedTo] = {
                    workOrder: item.workOrder,
                    items: []
                  };
                }
                groupedByPerson[item.assignedTo].items.push(item);
              }
            });

            // If no items assigned
            if (Object.keys(groupedByPerson).length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No work orders assigned yet. Please assign work to Labour or Vendor in the job sheet.
                </div>
              );
            }



            const handlePrintWorkOrders = () => {
              const success = openPrintPreview({
                elementId: 'all-work-orders',
                title: 'Work Orders',
                ...PRINT_PRESETS.jobSheet
              });

              if (!success) {
                toast.error('Failed to open print preview');
              }
            };

            const handleSaveAllPDF = async () => {
              try {
                const input = document.getElementById('all-work-orders');
                if (!input) {
                  toast.error('Work order content not found');
                  return;
                }
                
                toast.info('Generating PDF... Please wait');
                
                // Add padding wrapper for PDF
                const wrapper = document.createElement('div');
                wrapper.style.padding = '40px';
                wrapper.style.backgroundColor = '#ffffff';
                wrapper.style.position = 'fixed';
                wrapper.style.left = '-9999px';
                wrapper.style.top = '0';
                const clonedContent = input.cloneNode(true);
                wrapper.appendChild(clonedContent);
                document.body.appendChild(wrapper);
                
                const canvas = await html2canvas(wrapper, {
                  scale: 3,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#ffffff',
                  logging: false,
                  width: wrapper.scrollWidth,
                  height: wrapper.scrollHeight
                });
                
                // Remove temporary wrapper
                document.body.removeChild(wrapper);
                
                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'mm',
                  format: 'a4',
                  compress: true
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
                
                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                  heightLeft -= pdfHeight;
                }
                
                const fileName = `WorkOrders_${jobCtx.vehicleNo || 'NA'}_${new Date().toISOString().split('T')[0]}.pdf`;
                pdf.save(fileName);
                toast.success('Work Orders PDF saved successfully!');
              } catch (error) {
                console.error('Error generating PDF:', error);
                toast.error('Failed to save PDF: ' + error.message);
              }
            };

            // Display work orders grouped by person
            return (
              <>
                <div id="all-work-orders" className="bg-white" style={{fontSize: '20px'}}>
                  {Object.entries(groupedByPerson).map(([personName, data], personIdx) => (
                    <div key={personName} className="work-order-section mb-8">
                      <div className="header mb-4 pb-3 border-b-2 border-black">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-gray-800 uppercase" style={{fontSize: '32px'}}>
                              {personName}
                            </h3>
                            <p className="subtitle text-gray-600" style={{fontSize: '22px', marginTop: '8px'}}>
                              {data.workOrder} Work Order
                            </p>
                          </div>
                          <div className="info text-right">
                            <p className="text-gray-600" style={{fontSize: '22px'}}><strong>Vehicle:</strong> {jobCtx.vehicleNo || 'N/A'}</p>
                            <p className="text-gray-600" style={{fontSize: '22px'}}><strong>Party:</strong> {jobCtx.partyName || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <table className="w-full border border-black border-collapse" style={{fontSize: '20px'}}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black text-left" style={{width: '8%', padding: '12px'}}>S.No</th>
                            <th className="border border-black text-left" style={{width: '52%', padding: '12px'}}>Work Description</th>
                            <th className="border border-black text-left" style={{width: '15%', padding: '12px'}}>Category</th>
                            <th className="border border-black text-center" style={{width: '10%', padding: '12px'}}>Qty</th>
                            <th className="border border-black text-left" style={{width: '15%', padding: '12px'}}>Extra Work</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-black" style={{padding: '12px', fontSize: '20px'}}>{idx + 1}</td>
                              <td className="border border-black" style={{padding: '12px', fontSize: '20px'}}>{item.item || 'N/A'}</td>
                              <td className="border border-black" style={{padding: '12px', fontSize: '20px'}}>{item.category || 'N/A'}</td>
                              <td className="border border-black text-center" style={{padding: '12px', fontSize: '20px'}}>{item.multiplier || 1}</td>
                              <td className="border border-black" style={{padding: '12px', fontSize: '20px'}}>&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* Print and Save PDF buttons */}
                <div className="mt-6 flex gap-3 justify-between border-t pt-4">
                  <button
                    onClick={() => setShowPrintPreview(!showPrintPreview)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    {showPrintPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handlePrintWorkOrders}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
                    >
                      <Printer className="w-5 h-5" />
                      Print Work Orders
                    </button>
                    <button
                      onClick={handleSaveAllPDF}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save PDF
                    </button>
                  </div>
                </div>

                {/* Print Preview Section */}
                {showPrintPreview && (
                  <div className="mt-6 border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-lg font-semibold mb-3 text-gray-700">Print Preview:</h4>
                    <div className="bg-white shadow-lg p-6 rounded" style={{maxHeight: '600px', overflow: 'auto'}}>
                      <div dangerouslySetInnerHTML={{ __html: document.getElementById('all-work-orders')?.innerHTML || '<p>No preview available</p>' }} />
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </Modal>

      <datalist id="categories-list-extra">
        {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
      </datalist>
    </div>
  );
};

export default JobSheetStep;
