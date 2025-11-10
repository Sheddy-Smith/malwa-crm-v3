import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import useAuthStore from "@/store/authStore";
import supabase from "@/lib/supabase";
import { toast } from "sonner";

const InspectionStep = () => {
  const { user } = useAuthStore();
  const [details, setDetails] = useState({
    vehicleNo: "",
    ownerName: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    branch: "",
    status: "in-progress",
  });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState(null);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const multipliers = {
    Hardware: 2,
    Steel: 1.5,
    Labour: 2,
    Parts: 1.5,
  };

  useEffect(() => {
    const loadCats = () => {
      try {
        const saved = localStorage.getItem("categories");
        setCategories(saved ? JSON.parse(saved) : []);
      } catch {
        setCategories([]);
      }
    };
    loadCats();

    const onCats = () => loadCats();
    const onStorage = (e) => { if (e.key === "categories") loadCats(); };

    window.addEventListener("categoriesUpdated", onCats);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("categoriesUpdated", onCats);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('jobs_inspection')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load inspection records');
      return;
    }

    setRecords(data || []);
    setFilteredRecords(data || []);
  };

  const handleSearch = (filters) => {
    let filtered = [...records];

    if (filters.vehicleNo) {
      filtered = filtered.filter(r =>
        r.vehicle_no.toLowerCase().includes(filters.vehicleNo.toLowerCase())
      );
    }

    if (filters.partyName) {
      filtered = filtered.filter(r =>
        r.party_name.toLowerCase().includes(filters.partyName.toLowerCase())
      );
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

  const handleDetailChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const saveDetails = async () => {
    if (!details.vehicleNo || !details.ownerName) {
      toast.error('Vehicle No and Owner Name are required');
      return;
    }

    const payload = {
      vehicle_no: details.vehicleNo,
      party_name: details.ownerName,
      date: details.inspectionDate,
      branch: details.branch,
      status: details.status,
  items: items,
  user_id: user?.id,
    };

    if (currentRecordId) {
      const { error } = await supabase
        .from('jobs_inspection')
        .update(payload)
        .eq('id', currentRecordId);

      if (error) {
        toast.error('Failed to update inspection');
        return;
      }

      toast.success('Inspection updated successfully');
    } else {
      const { data, error } = await supabase
        .from('jobs_inspection')
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast.error('Failed to save inspection');
        return;
      }

      setCurrentRecordId(data.id);
      toast.success('Inspection saved successfully');
    }

    loadRecords();
  };

  const addRow = () => setNewItem({ item: "", category: "", condition: "OK", cost: "0", multiplier: 1 });

  const saveNewRow = () => {
    if (!newItem || !newItem.item?.trim()) {
      toast.error("Enter item name");
      return;
    }
    setItems([...items, newItem]);
    setNewItem(null);
  };

  const editRow = (index) => setEditingIndex(index);

  const saveEditRow = (index) => {
    const it = items[index];
    if (!it || !it.item?.trim()) {
      toast.error("Item cannot be empty");
      return;
    }
    setEditingIndex(null);
  };

  const deleteRow = (index) => setItems(items.filter((_, i) => i !== index));

  const calculateTotal = (item) => {
    const cost = parseFloat(item?.cost) || 0;
    const multiplier = parseFloat(item?.multiplier) || multipliers[item?.category?.trim()] || 1;
    return (cost * multiplier).toFixed(2);
  };

  const handleEditRecord = (record) => {
    setCurrentRecordId(record.id);
    setDetails({
      vehicleNo: record.vehicle_no,
      ownerName: record.party_name,
      inspectionDate: record.date,
      branch: record.branch,
      status: record.status,
    });
    setItems(record.items || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Record loaded for editing');
  };

  const handleDeleteRecord = async (id) => {
    const { error } = await supabase
      .from('jobs_inspection')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete inspection');
      return;
    }

    toast.success('Inspection deleted successfully');
    loadRecords();
    setDeleteConfirmId(null);

    if (currentRecordId === id) {
      setCurrentRecordId(null);
      setDetails({
        vehicleNo: "",
        ownerName: "",
        inspectionDate: new Date().toISOString().split('T')[0],
        branch: "",
        status: "in-progress",
      });
      setItems([]);
    }
  };

  const handleNewRecord = () => {
    setCurrentRecordId(null);
    setDetails({
      vehicleNo: "",
      ownerName: "",
      inspectionDate: new Date().toISOString().split('T')[0],
      branch: "",
      status: "in-progress",
    });
    setItems([]);
    toast.info('Ready for new inspection');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Vehicle Inspection</h3>
        <Button onClick={handleNewRecord} variant="secondary" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-medium">Vehicle No:</label>
            <input
              type="text"
              name="vehicleNo"
              value={details.vehicleNo}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Owner Name:</label>
            <input
              type="text"
              name="ownerName"
              value={details.ownerName}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Inspection Date:</label>
            <input
              type="date"
              name="inspectionDate"
              value={details.inspectionDate}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Branch:</label>
            <input
              type="text"
              name="branch"
              value={details.branch}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium">Status:</label>
            <select
              name="status"
              value={details.status}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="in-progress">Work in Progress</option>
              <option value="complete">Complete</option>
              <option value="hold">Hold for Material</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={saveDetails}>
            <Save className="h-4 w-4 mr-2" />
            {currentRecordId ? 'Update Details' : 'Save Details'}
          </Button>
        </div>
      </Card>

      <Card title="Inspection Items">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2">Category</th>
                <th className="p-2">Condition</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Multiplier</th>
                <th className="p-2">Total</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, index) =>
                editingIndex === index ? (
                  <tr key={index} className="bg-blue-50 dark:bg-blue-900">
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.item}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], item: e.target.value }; setItems(copy); }}
                        list="items-list"
                        placeholder="Type or select item"
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.category}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], category: e.target.value }; setItems(copy); }}
                        list="items-list"
                        placeholder="Type or select category"
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={it.condition}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], condition: e.target.value }; setItems(copy); }}
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option>OK</option>
                        <option>Repair Needed</option>
                        <option>Replace</option>
                        <option>Damage</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={it.cost}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], cost: e.target.value }; setItems(copy); }}
                        className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={it.multiplier ?? multipliers[it.category] ?? 1}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], multiplier: parseFloat(e.target.value) || 1 }; setItems(copy); }}
                        className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Multiplier"
                      />
                    </td>
                    <td className="p-2">{calculateTotal(it)}</td>
                    <td className="p-2 text-right space-x-1">
                      <Button variant="ghost" onClick={() => saveEditRow(index)}><Save className="h-4 w-4 text-green-600" /></Button>
                      <Button variant="ghost" onClick={() => setEditingIndex(null)}><X className="h-4 w-4 text-gray-600" /></Button>
                    </td>
                  </tr>
                ) : (
                  <tr key={index}>
                    <td className="p-2">{it.item}</td>
                    <td className="p-2">{it.category}</td>
                    <td className="p-2">{it.condition}</td>
                    <td className="p-2">{it.cost}</td>
                    <td className="p-2">{it.multiplier ?? multipliers[it.category] ?? 1}</td>
                    <td className="p-2">{calculateTotal(it)}</td>
                    <td className="p-2 text-right space-x-1">
                      <Button variant="ghost" onClick={() => editRow(index)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                      <Button variant="ghost" onClick={() => deleteRow(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </td>
                  </tr>
                )
              )}

              {newItem && (
                <tr className="bg-blue-50 dark:bg-blue-900">
                  <td className="p-2">
                    <input
                      type="text"
                      value={newItem.item}
                      onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                      list="items-list"
                      placeholder="Type or select item"
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      list="items-list"
                      placeholder="Type or select category"
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={newItem.condition}
                      onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option>OK</option>
                      <option>Repair Needed</option>
                      <option>Replace</option>
                      <option>Damage</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={newItem.cost}
                      onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                      className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={newItem.multiplier ?? multipliers[newItem.category] ?? 1}
                      onChange={(e) => setNewItem({ ...newItem, multiplier: parseFloat(e.target.value) || 1 })}
                      className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Multiplier"
                    />
                  </td>
                  <td className="p-2">{calculateTotal(newItem)}</td>
                  <td className="p-2 text-right space-x-1">
                    <Button variant="ghost" onClick={saveNewRow}><Save className="h-4 w-4 text-green-600" /></Button>
                    <Button variant="ghost" onClick={() => setNewItem(null)}><X className="h-4 w-4 text-gray-600" /></Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {items.length === 0 && !newItem && <div className="text-center p-4 text-gray-500">No inspection items.</div>}
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={addRow} disabled={!!newItem}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </Card>

      <JobSearchBar onSearch={handleSearch} onReset={handleReset} />

      <JobReportList
        records={filteredRecords}
        onEdit={handleEditRecord}
        onDelete={(id) => setDeleteConfirmId(id)}
        stepName="Inspection"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection record? This action cannot be undone."
      />

      <datalist id="items-list">
        {categories.map((cat, i) => <option key={i} value={cat.name} />)}
      </datalist>
    </div>
  );
};

export default InspectionStep;
