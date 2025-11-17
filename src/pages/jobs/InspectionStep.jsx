import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import useAuthStore from "@/store/authStore";
import { dbOperations } from "@/lib/db";
import useMultiplierStore from "@/store/multiplierStore";
import { toast } from "sonner";

const InspectionStep = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    vehicleNo: "",
    ownerName: "",
    contactNo: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    address: "",
    gstNumber: "",
    status: "in-progress",
  });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState(null);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { getCategoryMultiplier } = useMultiplierStore();

  useEffect(() => {
    const loadCats = async () => {
      try {
        const data = await dbOperations.getAll('inventory_categories');
        const sorted = (data || []).sort((a,b) => String(a.name).localeCompare(String(b.name)));
        setCategories(sorted);
      } catch {
        setCategories([]);
      }
    };
    loadCats();

    const loadVendors = async () => {
      try {
        const data = await dbOperations.getAll('vendors');
        setVendors(data || []);
      } catch {
        setVendors([]);
      }
    };
    loadVendors();

    const loadLabourers = async () => {
      try {
        const data = await dbOperations.getAll('labour');
        setLabourers(data || []);
      } catch {
        setLabourers([]);
      }
    };
    loadLabourers();
  }, []);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await dbOperations.getAll('inspections');
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecords(sorted);
      setFilteredRecords(sorted);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load inspection records');
    }
  };

  const handleSearch = (filters) => {
    let filtered = [...records];

    if (filters.vehicleNo) {
      filtered = filtered.filter(r =>
        r.vehicle_no && r.vehicle_no.toLowerCase().includes(filters.vehicleNo.toLowerCase())
      );
    }

    if (filters.partyName) {
      filtered = filtered.filter(r =>
        r.party_name && r.party_name.toLowerCase().includes(filters.partyName.toLowerCase())
      );
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

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    
    // Phone validation - only numbers, max 10 digits
    if (name === 'contactNo') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setDetails({ ...details, [name]: numericValue });
      }
      return;
    }
    
    // GSTIN validation - uppercase alphanumeric, max 15 characters
    if (name === 'gstNumber') {
      const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (upperValue.length <= 15) {
        setDetails({ ...details, [name]: upperValue });
      }
      return;
    }
    
    setDetails({ ...details, [name]: value });
  };

  const saveDetails = async (itemsOverride = null) => {
    if (!details.vehicleNo || !details.ownerName) {
      toast.error('Vehicle No and Owner Name are required');
      return;
    }
    const workingItems = Array.isArray(itemsOverride) ? itemsOverride : (Array.isArray(items) ? items : []);
    // Normalize items with computed totals for a single save
    const normalizedItems = workingItems.map((it) => {
      const cat = (it.category || '').trim();
      const mult = parseFloat(it.multiplier ?? getCategoryMultiplier(cat)) || 1;
      const cost = parseFloat(it.cost) || 0;
      const total = parseFloat((cost * mult).toFixed(2));
      return {
        name: it.item ?? it.name ?? '',
        item: it.item ?? it.name ?? '',
        category: cat,
        condition: it.condition,
        cost,
        multiplier: mult,
        total,
        workOrder: it.workOrder || '',
        assignedTo: it.assignedTo || '',
      };
    });

    const payload = {
      vehicle_no: details.vehicleNo,
      party_name: details.ownerName,
      phone: details.contactNo || '',
      date: details.inspectionDate,
      address: details.address,
      gst_number: details.gstNumber || '',
      status: details.status,
      items: normalizedItems,
      user_id: user?.id,
    };

    try {
      if (currentRecordId) {
        await dbOperations.update('inspections', currentRecordId, payload);
        toast.success('Inspection updated successfully');
      } else {
        const rec = await dbOperations.insert('inspections', payload);
        setCurrentRecordId(rec.id);
        toast.success('Inspection saved successfully');
      }

      // Create/Update customer in Customer module
      if (details.contactNo && details.contactNo.length === 10) {
        const existing = await dbOperations.getByIndex('customers', 'phone', details.contactNo);
        const customerData = {
          name: details.ownerName,
          phone: details.contactNo,
          address: details.address || '',
          gstin: details.gstNumber || '',
          type: 'customer',
          credit_limit: 0,
          credit_days: 30
        };
        
        if (existing && existing.length > 0) {
          // Update existing customer with new details
          const c = existing[0];
          await dbOperations.update('customers', c.id, {
            ...customerData,
            credit_limit: c.credit_limit || 0,
            credit_days: c.credit_days || 30
          });
          toast.success('Customer details updated in Customer module');
        } else {
          // Create new customer
          await dbOperations.insert('customers', customerData);
          toast.success('New customer added to Customer module');
        }
      }

      await loadRecords();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save inspection');
    }
  };

  const addRow = () => setNewItem({ item: "", category: "", condition: "OK", cost: "0", multiplier: 1, workOrder: "", assignedTo: "" });

  const saveNewRow = async () => {
    if (!newItem || !newItem.item?.trim()) {
      toast.error("Enter item name");
      return;
    }
    const nextItems = [...items, newItem];
    setItems(nextItems);
    setNewItem(null);
    await saveDetails(nextItems);
  };

  const editRow = (index) => setEditingIndex(index);

  const saveEditRow = async (index) => {
    const it = items[index];
    if (!it || !it.item?.trim()) {
      toast.error("Item cannot be empty");
      return;
    }
    setEditingIndex(null);
    await saveDetails(items);
  };

  const deleteRow = async (index) => {
    const nextItems = items.filter((_, i) => i !== index);
    setItems(nextItems);
    await saveDetails(nextItems);
  };

  const calculateTotal = (item) => {
    const cost = parseFloat(item?.cost) || 0;
    const mult = parseFloat(item?.multiplier ?? getCategoryMultiplier(item?.category?.trim() || '')) || 1;
    return (cost * mult).toFixed(2);
  };

  const handleEditRecord = (record) => {
    setCurrentRecordId(record.id);
    setDetails({
      vehicleNo: record.vehicle_no,
      ownerName: record.party_name,
      contactNo: record.phone || '',
      inspectionDate: record.date,
      address: record.address || '',
      gstNumber: record.gst_number || '',
      status: record.status,
    });
    const uiItems = (record.items || []).map((it) => ({
      item: it.item ?? it.name ?? '',
      category: it.category ?? '',
      condition: it.condition ?? 'OK',
      cost: it.cost ?? 0,
      multiplier: it.multiplier ?? getCategoryMultiplier((it.category ?? '').trim()) ?? 1,
      workOrder: it.workOrder ?? '',
      assignedTo: it.assignedTo ?? '',
    }));
    setItems(uiItems);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Record loaded for editing');
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dbOperations.delete('inspections', id);
      toast.success('Inspection deleted successfully');
      await loadRecords();
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete inspection');
    }

    if (currentRecordId === id) {
      setCurrentRecordId(null);
      setDetails({
        vehicleNo: "",
        ownerName: "",
        contactNo: "",
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
      contactNo: "",
      inspectionDate: new Date().toISOString().split('T')[0],
      address: "",
      gstNumber: "",
      status: "in-progress",
    });
    setItems([]);
    toast.info('Ready for new inspection');
  };

  const handleNext = async () => {
    if (!details.vehicleNo || !details.ownerName) {
      toast.error('Vehicle No and Owner Name are required before proceeding to Estimate');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one inspection item before proceeding to Estimate');
      return;
    }
    
    // Normalize items for localStorage in the shape Estimate expects
    const estimateItems = items.map((it) => ({
      item: it.item || it.name || '',
      category: (it.category || '').trim(),
      condition: it.condition || 'OK',
      cost: parseFloat(it.cost) || 0,
      multiplier: parseFloat(it.multiplier ?? getCategoryMultiplier((it.category || '').trim())) || 1,
      workOrder: it.workOrder || '',
      assignedTo: it.assignedTo || '',
    }));
    
    // Persist meta so downstream job steps can prefill header/details
    try {
      const ctx = {
        vehicleNo: details.vehicleNo,
        partyName: details.ownerName,
        contactNo: details.contactNo || '',
        address: details.address || '',
        gstNumber: details.gstNumber || '',
        date: details.inspectionDate
      };
      localStorage.setItem('jobsContext', JSON.stringify(ctx));
    } catch {}

    localStorage.setItem('inspectionItems', JSON.stringify(estimateItems));
    await saveDetails();
    navigate('/jobs?step=estimate');
  };

  // On unmount (e.g., navigating via Jobs step Next), persist items for Estimate static view
  useEffect(() => {
    return () => {
      if (!items || items.length === 0) return;
      const estimateItems = items.map((it) => ({
        item: it.item || it.name || '',
        category: (it.category || '').trim(),
        condition: it.condition || 'OK',
        cost: parseFloat(it.cost) || 0,
        multiplier: parseFloat(it.multiplier ?? getCategoryMultiplier((it.category || '').trim())) || 1,
        workOrder: it.workOrder || '',
        assignedTo: it.assignedTo || '',
      }));
      try {
        localStorage.setItem('inspectionItems', JSON.stringify(estimateItems));
        const ctx = {
          vehicleNo: details.vehicleNo,
          partyName: details.ownerName,
          contactNo: details.contactNo || '',
          address: details.address || '',
          gstNumber: details.gstNumber || '',
          date: details.inspectionDate
        };
        localStorage.setItem('jobsContext', JSON.stringify(ctx));
      } catch {}
    };
  }, [items, details.vehicleNo, details.ownerName, details.contactNo, details.address, details.gstNumber, details.inspectionDate]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="font-medium text-xs">Vehicle No:</label>
            <input
              type="text"
              name="vehicleNo"
              value={details.vehicleNo}
              onChange={handleDetailChange}
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-xs">Owner Name:</label>
            <input
              type="text"
              name="ownerName"
              value={details.ownerName}
              onChange={handleDetailChange}
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-xs">Contact Number:</label>
            <input
              type="tel"
              name="contactNo"
              value={details.contactNo}
              onChange={handleDetailChange}
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="10 digit mobile number"
              maxLength="10"
            />
            {details.contactNo && details.contactNo.length > 0 && details.contactNo.length !== 10 && (
              <p className="text-xs text-red-500 mt-1">Phone must be 10 digits</p>
            )}
          </div>
          <div>
            <label className="font-medium text-xs">Inspection Date:</label>
            <input
              type="date"
              name="inspectionDate"
              value={details.inspectionDate}
              onChange={handleDetailChange}
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-xs">Address:</label>
            <input
              type="text"
              name="address"
              value={details.address}
              onChange={handleDetailChange}
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-xs">GST Number (Optional):</label>
            <input
              type="text"
              name="gstNumber"
              value={details.gstNumber}
              onChange={handleDetailChange}
              placeholder="15 characters"
              maxLength="15"
              className="w-full mt-1 p-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {details.gstNumber && details.gstNumber.length > 0 && details.gstNumber.length !== 15 && (
              <p className="text-xs text-red-500 mt-1">GST must be 15 characters</p>
            )}
          </div>
          {/* Status field removed as per requirement */}
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button onClick={saveDetails}>
            <Save className="h-4 w-4 mr-2" />
            {currentRecordId ? 'Update Details' : 'Save Details'}
          </Button>
          <Button variant="secondary" onClick={handleNext}>Next</Button>
        </div>
      </Card>

      <Card title="Inspection Items">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="p-2" style={{width: '30%'}}>Work</th>
                <th className="p-2" style={{width: '10%'}}>Category</th>
                <th className="p-2" style={{width: '10%'}}>Cost</th>
                <th className="p-2" style={{width: '8%'}}>Qty</th>
                <th className="p-2" style={{width: '10%'}}>Total</th>
                <th className="p-2" style={{width: '10%'}}>Work Order</th>
                <th className="p-2" style={{width: '12%'}}>Assigned To</th>
                <th className="p-2 text-center" style={{width: '10%'}}><Edit className="h-4 w-4 inline" /></th>
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
                        onChange={(e) => { const copy = [...items]; const cat = e.target.value; const mult = getCategoryMultiplier(cat.trim()); copy[index] = { ...copy[index], category: cat, multiplier: mult }; setItems(copy); }}
                        list="categories-list"
                        placeholder="Select category"
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
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
                        value={it.multiplier ?? getCategoryMultiplier(it.category?.trim() || '') ?? 1}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], multiplier: parseFloat(e.target.value) || 1 }; setItems(copy); }}
                        className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Multiplier"
                      />
                    </td>
                    <td className="p-2">{calculateTotal(it)}</td>
                    <td className="p-2">
                      <select
                        value={it.workOrder || ''}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], workOrder: e.target.value, assignedTo: '' }; setItems(copy); }}
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Labour">Labour</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={it.assignedTo || ''}
                        onChange={(e) => { const copy = [...items]; copy[index] = { ...copy[index], assignedTo: e.target.value }; setItems(copy); }}
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={!it.workOrder}
                      >
                        <option value="">Select</option>
                        {it.workOrder === 'Vendor' && vendors.map(v => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                        {it.workOrder === 'Labour' && labourers.map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-center space-x-1">
                      <Button variant="ghost" onClick={() => saveEditRow(index)}><Save className="h-4 w-4 text-green-600" /></Button>
                      <Button variant="ghost" onClick={() => setEditingIndex(null)}><X className="h-4 w-4 text-gray-600" /></Button>
                    </td>
                  </tr>
                ) : (
                  <tr key={index}>
                    <td className="p-2">{it.item || it.name}</td>
                    <td className="p-2">{it.category}</td>
                    <td className="p-2">{it.cost}</td>
                    <td className="p-2">{it.multiplier ?? getCategoryMultiplier(it.category?.trim() || '') ?? 1}</td>
                    <td className="p-2">{calculateTotal(it)}</td>
                    <td className="p-2">{it.workOrder || '-'}</td>
                    <td className="p-2">{it.assignedTo || '-'}</td>
                    <td className="p-2 text-center space-x-1">
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
                        onChange={(e) => { const cat = e.target.value; const mult = getCategoryMultiplier(cat.trim()); setNewItem({ ...newItem, category: cat, multiplier: mult }); }}
                      list="categories-list"
                      placeholder="Select category"
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
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
                      value={newItem.multiplier ?? getCategoryMultiplier(newItem.category?.trim() || '') ?? 1}
                      onChange={(e) => setNewItem({ ...newItem, multiplier: parseFloat(e.target.value) || 1 })}
                      className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Multiplier"
                    />
                  </td>
                  <td className="p-2">{calculateTotal(newItem)}</td>
                  <td className="p-2">
                    <select
                      value={newItem.workOrder || ''}
                      onChange={(e) => setNewItem({ ...newItem, workOrder: e.target.value, assignedTo: '' })}
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Labour">Labour</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={newItem.assignedTo || ''}
                      onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                      className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={!newItem.workOrder}
                    >
                      <option value="">Select</option>
                      {newItem.workOrder === 'Vendor' && vendors.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                      {newItem.workOrder === 'Labour' && labourers.map(l => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center space-x-1">
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
        showStatus={false}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteRecord(deleteConfirmId)}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection record? This action cannot be undone."
      />

      <datalist id="items-list">
        {/* keep for future item suggestions if needed */}
      </datalist>
      <datalist id="categories-list">
        {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
      </datalist>
    </div>
  );
};

export default InspectionStep;
