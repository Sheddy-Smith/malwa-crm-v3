





import { Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const JobSheetStep = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('jobs_jobsheet')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
      setFilteredRecords(data);
    }
  };

  const handleSearch = (filters) => {
    let filtered = [...records];
    if (filters.vehicleNo) {
      filtered = filtered.filter(r => r.vehicle_no.toLowerCase().includes(filters.vehicleNo.toLowerCase()));
    }
    if (filters.partyName) {
      filtered = filtered.filter(r => r.party_name.toLowerCase().includes(filters.partyName.toLowerCase()));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(r => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => r.date <= filters.dateTo);
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
    const { error } = await supabase
      .from('jobs_jobsheet')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete job sheet');
      return;
    }

    toast.success('Job sheet deleted successfully');
    loadRecords();
    setDeleteConfirmId(null);
  };
  // Load data directly from Vehicle Inspection (Inspection Items)
  const [estimateItems, setEstimateItems] = useState(() => {
    const saved = localStorage.getItem("inspectionItems");
    return saved ? JSON.parse(saved) : [];
  });

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

  // Save Notes & WorkBy to localStorage
  const saveEstimate = () => {
    localStorage.setItem("jobSheetEstimate", JSON.stringify(estimateItems));
    alert("✅ Notes & Work By saved successfully!");
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

  const saveExtraWork = () => {
    localStorage.setItem("extraWork", JSON.stringify(extraWork));
    alert("✅ Extra Work saved successfully!");
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

  const discount = parseFloat(localStorage.getItem("estimateDiscount")) || 0;
  const finalTotal = grandTotal - discount;

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-xl font-bold">Job Sheet</h3>

      {/* Tasks from Inspection */}
      <div className="border rounded-lg p-4 shadow">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Tasks from Inspection</h4>
          <button onClick={saveEstimate}>
            <Save className="bg-white text-green-500 rounded text-xl" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Condition</th>
                <th className="p-2 border">Cost (₹)</th>
                <th className="p-2 border">Multiplier</th>
                <th className="p-2 border">Total (₹)</th>
                <th className="p-2 border">Work By</th>
                <th className="p-2 border">Notes</th>
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
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">{item.item}</td>
                    <td className="p-2">{item.condition}</td>
                    <td className="p-2">{item.cost}</td>
                    <td className="p-2">{parseFloat(item.multiplier)}</td>
                    <td className="p-2">{calculateTotal(item).toFixed(2)}</td>
                    <td className="p-2">
                      <select
                        value={item.workBy}
                        onChange={(e) =>
                          handleEstimateChange(index, "workBy", e.target.value)
                        }
                        className="p-1 border rounded w-full"
                      >
                        <option value="Labour">Labour</option>
                        <option value="Vendor">Vendor</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) =>
                          handleEstimateChange(index, "notes", e.target.value)
                        }
                        placeholder="Notes..."
                        className="w-full p-1 border rounded"
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
            <button onClick={saveExtraWork}>
              <Save className="bg-white text-green-500 rounded text-xl" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Condition</th>
                <th className="p-2 border">Cost (₹)</th>
                <th className="p-2 border">Multiplier</th>
                <th className="p-2 border">Total (₹)</th>
                <th className="p-2 border">Work By</th>
                <th className="p-2 border">Notes</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {extraWork.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-gray-500">
                    No extra work added.
                  </td>
                </tr>
              ) : (
                extraWork.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "category", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "item", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.condition}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "condition", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "cost", e.target.value)
                        }
                        className="w-24 p-1 border rounded"
                      />
                    </td>
                    <td className="p-2">{parseFloat(item.multiplier)}</td>
                    <td className="p-2">{calculateTotal(item).toFixed(2)}</td>
                    <td className="p-2">
                      <select
                        value={item.workBy}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "workBy", e.target.value)
                        }
                        className="p-1 border rounded w-full"
                      >
                        <option value="Labour">Labour</option>
                        <option value="Vendor">Vendor</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) =>
                          handleExtraWorkChange(index, "notes", e.target.value)
                        }
                        placeholder="Notes..."
                        className="w-full p-1 border rounded"
                      />
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
      <div className="text-right font-bold text-lg">
        <div>Grand Total: ₹{grandTotal.toFixed(2)}</div>
        <div>Estimate Discount: ₹{discount.toFixed(2)}</div>
        <div>Final Total: ₹{finalTotal.toFixed(2)}</div>
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
