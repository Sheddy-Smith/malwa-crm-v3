import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import ComboBox from "@/components/ui/ComboBox";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import { useAuthStore } from '@/store/authManagementStore';
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
    wheeler: "",
    status: "in-progress",
  });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [labourers, setLabourers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
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
      } catch {
        setInventoryItems([]);
      }
    };
    loadInventoryItems();

    const loadCustomers = async () => {
      try {
        const data = await dbOperations.getAll('customers');
        setCustomers(data || []);
      } catch {
        setCustomers([]);
      }
    };
    loadCustomers();

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

  // Save inspections to backend JSON file
  const saveInspectionsToBackend = async () => {
    try {
      if (!window.electron?.fs?.writeFile) {
        console.log('⚠️ Electron not available - skipping backend save');
        return;
      }

      const allInspections = await dbOperations.getAll('inspections');
      const filePath = 'C:/malwa-crm/Data_base/jobs/InspectionStep.json';
      
      await window.electron.fs.writeFile(filePath, JSON.stringify(allInspections, null, 2));
      console.log('✅ Inspections saved to backend:', filePath);
    } catch (error) {
      console.error('❌ Failed to save inspections to backend:', error);
      // Don't show error to user as this is a background operation
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
      wheeler: details.wheeler || '',
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

      // Save to backend JSON file
      await saveInspectionsToBackend();

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

      await loadRecords();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save inspection');
    }
  };

  const deleteRow = (index) => {
    const nextItems = items.filter((_, i) => i !== index);
    setItems(nextItems);
  };

  const handleItemChange = (index, field, value) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const handleItemMultipleChange = (index, updates) => {
    const copy = [...items];
    copy[index] = { ...copy[index], ...updates };
    setItems(copy);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        item: '',
        category: '',
        cost: 0,
        multiplier: 1,
        workOrder: '',
        assignedTo: '',
      },
    ]);
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
      
      // Save to backend JSON file after deletion
      await saveInspectionsToBackend();
      
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
        address: "",
        gstNumber: "",
        wheeler: "",
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
      wheeler: "",
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
        wheeler: details.wheeler || '',
        date: details.inspectionDate
      };
      localStorage.setItem('jobsContext', JSON.stringify(ctx));
    } catch {}

    // Clear old estimate context so new estimate starts with default values
    localStorage.removeItem('estimateContext');
    localStorage.removeItem('estimateAdvancePayment');
    localStorage.removeItem('estimateDiscount');
    localStorage.removeItem('estimateRoundOff');

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
          wheeler: details.wheeler || '',
          date: details.inspectionDate
        };
        localStorage.setItem('jobsContext', JSON.stringify(ctx));
      } catch {}
    };
  }, [items, details.vehicleNo, details.ownerName, details.contactNo, details.address, details.gstNumber, details.wheeler, details.inspectionDate]);

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
        <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm items-end">
          <div>
            <label className="font-medium text-sm">Vehicle No:</label>
            <input
              type="text"
              name="vehicleNo"
              value={details.vehicleNo}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-sm">Wheeler:</label>
            <select
              name="wheeler"
              value={details.wheeler || ''}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select Wheeler</option>
              <option value="4 wheel">4 Wheel</option>
              <option value="6 wheel">6 Wheel</option>
              <option value="10 wheel">10 Wheel</option>
              <option value="12 wheel">12 Wheel</option>
              <option value="14 wheel">14 Wheel</option>
              <option value="16 wheel">16 Wheel</option>
              <option value="18 wheel">18 Wheel</option>
              <option value="22 wheel">22 Wheel</option>
            </select>
          </div>
          <div>
            <label className="font-medium text-sm">Owner Name: *</label>
            <ComboBox
              value={details.ownerName}
              onChange={(value) => setDetails({ ...details, ownerName: value })}
              onSelect={(customer) => {
                if (customer) {
                  setDetails({
                    ...details,
                    ownerName: customer.name,
                    contactNo: customer.phone || '',
                    address: customer.address || '',
                    gstNumber: customer.gst_number || ''
                  });
                }
              }}
              suggestions={customers}
              placeholder="Select or type customer name..."
              displayKey="name"
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-sm">Contact Number:</label>
            <input
              type="tel"
              name="contactNo"
              value={details.contactNo}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="10 digit mobile number"
              maxLength="10"
            />
          </div>
          <div className="col-span-2">
            <label className="font-medium text-sm">Address:</label>
            <input
              type="text"
              name="address"
              value={details.address}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-sm">GST Number (Optional):</label>
            <input
              type="text"
              name="gstNumber"
              value={details.gstNumber}
              onChange={handleDetailChange}
              placeholder="15 characters"
              maxLength="15"
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium text-sm">Inspection Date:</label>
            <input
              type="date"
              name="inspectionDate"
              value={details.inspectionDate}
              onChange={handleDetailChange}
              className="w-full mt-1 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        {details.contactNo && details.contactNo.length > 0 && details.contactNo.length !== 10 && (
          <p className="text-xs text-red-500 mt-1">Phone must be 10 digits</p>
        )}
        {details.gstNumber && details.gstNumber.length > 0 && details.gstNumber.length !== 15 && (
          <p className="text-xs text-red-500 mt-1">GST must be 15 characters</p>
        )}
      </Card>

      <Card title="Inspection Items">
        <div className="overflow-visible">
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
                <th className="p-2 text-center" style={{width: '10%'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="relative">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-1 px-2 text-gray-500">
                    No inspection items added.
                  </td>
                </tr>
              ) : (
                items.map((it, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="p-2 relative">
                      <ComboBox
                        value={it.item}
                        onChange={(value) => handleItemChange(index, 'item', value)}
                        onSelect={(suggestion) => {
                          if (suggestion) {
                            const sellingPrice = parseFloat(suggestion.selling_price) || 0;
                            const categoryName = suggestion.category_name || '';
                            const mult = getCategoryMultiplier(categoryName.trim());
                            
                            handleItemMultipleChange(index, {
                              item: suggestion.name,
                              category: categoryName,
                              cost: sellingPrice.toFixed(2),
                              multiplier: mult
                            });
                          }
                        }}
                        suggestions={inventoryItems}
                        placeholder="Select or type work item..."
                        displayKey="name"
                        className="w-full p-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={it.category}
                        onChange={(e) => {
                          const cat = e.target.value;
                          const mult = getCategoryMultiplier(cat.trim());
                          handleItemMultipleChange(index, {
                            category: cat,
                            multiplier: mult
                          });
                        }}
                        list="categories-list"
                        placeholder="Select category"
                        className="w-full p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={it.cost}
                        onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                        className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={it.multiplier ?? getCategoryMultiplier(it.category?.trim() || '') ?? 1}
                        onChange={(e) => handleItemChange(index, 'multiplier', parseFloat(e.target.value) || 1)}
                        className="w-24 p-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Multiplier"
                      />
                    </td>
                    <td className="p-2">{calculateTotal(it)}</td>
                    <td className="p-2">
                      <select
                        value={it.workOrder || ''}
                        onChange={(e) => {
                          handleItemMultipleChange(index, {
                            workOrder: e.target.value,
                            assignedTo: ''
                          });
                        }}
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
                        onChange={(e) => handleItemChange(index, 'assignedTo', e.target.value)}
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
                    <td className="p-2 text-center">
                      <Button variant="ghost" onClick={() => deleteRow(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <Button variant="secondary" onClick={addRow}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Item
          </Button>

          <Button onClick={() => saveDetails()} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="h-4 w-4 mr-2" /> Save Inspection
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
