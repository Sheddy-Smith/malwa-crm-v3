import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye, Edit, Download, Printer } from 'lucide-react';
import { dbOperations } from '@/lib/db';
import { broadcastDataChange } from '@/utils/dataSync';

const PurchaseChallan = () => {
  const [challans, setChallans] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);
  
  // View modal
  const [viewingChallan, setViewingChallan] = useState(null);
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    challan_no: '',
    supplier_id: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challanData, supplierData, categoryData] = await Promise.all([
        dbOperations.getAll('purchase_challans'),
        dbOperations.getAll('suppliers'),
        dbOperations.getAll('inventory_categories'),
      ]);
      setChallans(challanData || []);
      setSuppliers(supplierData || []);
      setCategories(categoryData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredChallans = challans.filter(c => {
    const matchChallan = !filters.challan_no || c.challan_no?.toLowerCase().includes(filters.challan_no.toLowerCase());
    const matchSupplier = !filters.supplier_id || c.supplier_id === filters.supplier_id;
    const matchDateFrom = !filters.date_from || c.challan_date >= filters.date_from;
    const matchDateTo = !filters.date_to || c.challan_date <= filters.date_to;
    return matchChallan && matchSupplier && matchDateFrom && matchDateTo;
  });

  const generateChallanNo = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let yearStart, yearEnd;
    if (currentMonth >= 3) {
      yearStart = currentYear.toString().slice(-2);
      yearEnd = (currentYear + 1).toString().slice(-2);
    } else {
      yearStart = (currentYear - 1).toString().slice(-2);
      yearEnd = currentYear.toString().slice(-2);
    }
    
    const prefix = `CR/${yearStart}-${yearEnd}/`;
    const allChallans = await dbOperations.getAll('purchase_challans');
    const fyChallans = allChallans.filter(c => c.challan_no?.startsWith(prefix));
    const sequence = (fyChallans.length + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  };

  const handleSaveChallan = async (challanData) => {
    try {
      const isEditing = !!editingChallan;
      const challanId = isEditing ? editingChallan.id : `PC-${Date.now()}`;
      
      // Save main challan record
      const challanRecord = {
        id: challanId,
        challan_no: challanData.challan_no,
        challan_date: challanData.challan_date,
        supplier_id: challanData.supplier_id,
        supplier_name: challanData.supplier_name,
        payment_mode: challanData.payment_mode,
        payment_amount: parseFloat(challanData.payment_amount || 0),
        payment_status: challanData.payment_status,
        total_amount: parseFloat(challanData.total_amount),
        created_at: isEditing ? editingChallan.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        await dbOperations.update('purchase_challans', challanId, challanRecord);
        
        // Delete old challan items
        const oldItems = await dbOperations.getAll('purchase_challan_items');
        const itemsToDelete = oldItems.filter(item => item.challan_id === challanId);
        for (const item of itemsToDelete) {
          await dbOperations.delete('purchase_challan_items', item.id);
        }
        
        // Delete old stock movements
        const oldMovements = await dbOperations.getAll('stock_movements');
        const movementsToDelete = oldMovements.filter(m => m.reference_id === challanId);
        for (const movement of movementsToDelete) {
          await dbOperations.delete('stock_movements', movement.id);
        }
        
        // Delete old supplier ledger entries
        const oldLedger = await dbOperations.getAll('supplier_ledger_entries');
        const ledgerToDelete = oldLedger.filter(e => e.reference_id === challanId);
        for (const entry of ledgerToDelete) {
          await dbOperations.delete('supplier_ledger_entries', entry.id);
        }
      } else {
        await dbOperations.insert('purchase_challans', challanRecord);
      }

      // Save challan items and update stock
      for (const material of challanData.materials) {
        const itemId = `${challanId}_${Date.now()}_${Math.random()}`;
        
        // Save challan item
        await dbOperations.insert('purchase_challan_items', {
          id: itemId,
          challan_id: challanId,
          material_name: material.material_name,
          category_id: material.category_id,
          quantity: parseFloat(material.quantity),
          unit: material.unit,
          rate: parseFloat(material.rate),
          amount: parseFloat(material.quantity) * parseFloat(material.rate),
          created_at: new Date().toISOString(),
        });

        // Add stock movement
        await dbOperations.insert('stock_movements', {
          id: `SM-${itemId}`,
          material_name: material.material_name,
          category_id: material.category_id,
          movement_type: 'in',
          quantity: parseFloat(material.quantity),
          unit: material.unit,
          reference_type: 'challan',
          reference_id: challanId,
          reference_no: challanData.challan_no,
          movement_date: challanData.challan_date,
          created_at: new Date().toISOString(),
        });

        // Update inventory stock
        const inventoryItems = await dbOperations.getAll('inventory_items');
        const existingItem = inventoryItems.find(i => 
          i.name?.toLowerCase() === material.material_name?.toLowerCase() && 
          i.category_id === material.category_id
        );

        if (existingItem) {
          await dbOperations.update('inventory_items', existingItem.id, {
            ...existingItem,
            quantity: parseFloat(existingItem.quantity || 0) + parseFloat(material.quantity),
            unit: material.unit,
            last_purchase_rate: parseFloat(material.rate),
            updated_at: new Date().toISOString(),
          });
        } else {
          await dbOperations.insert('inventory_items', {
            id: `INV-${Date.now()}-${Math.random()}`,
            name: material.material_name,
            category_id: material.category_id,
            quantity: parseFloat(material.quantity),
            unit: material.unit,
            last_purchase_rate: parseFloat(material.rate),
            created_at: new Date().toISOString(),
          });
        }
      }

      // Create supplier ledger entry (CREDIT - liability for total amount)
      await dbOperations.insert('supplier_ledger_entries', {
        id: `SL-${challanId}-CR`,
        supplier_id: challanData.supplier_id,
        entry_date: challanData.challan_date,
        vehicle_no: '',
        owner_name: '',
        work: `Purchase Challan - ${challanData.challan_no}`,
        particulars: `Purchase Challan - ${challanData.challan_no}`,
        debit_amount: 0,
        credit_amount: parseFloat(challanData.total_amount),
        reference_type: 'challan',
        reference_id: challanId,
        reference_no: challanData.challan_no,
        created_at: new Date().toISOString(),
      });

      // If payment is made, create DEBIT entry
      if (challanData.payment_mode !== 'pending' && parseFloat(challanData.payment_amount) > 0) {
        await dbOperations.insert('supplier_ledger_entries', {
          id: `SL-${challanId}-DR`,
          supplier_id: challanData.supplier_id,
          entry_date: challanData.challan_date,
          vehicle_no: '',
          owner_name: '',
          work: `Payment for Challan - ${challanData.challan_no} (${challanData.payment_mode})`,
          particulars: `Payment for Challan - ${challanData.challan_no} (${challanData.payment_mode})`,
          debit_amount: parseFloat(challanData.payment_amount),
          credit_amount: 0,
          reference_type: 'challan_payment',
          reference_id: challanId,
          reference_no: challanData.challan_no,
          created_at: new Date().toISOString(),
        });
      }

      // Broadcast change
      broadcastDataChange('purchase', isEditing ? 'updated' : 'created', {
        purchase_id: challanId,
        supplier_id: challanData.supplier_id,
      });

      toast.success(isEditing ? 'Purchase challan updated successfully!' : 'Purchase challan saved successfully!');
      setShowForm(false);
      setEditingChallan(null);
      loadData();
    } catch (error) {
      console.error('Error saving challan:', error);
      toast.error('Failed to save purchase challan');
    }
  };

  const handleDelete = async () => {
    if (!challanToDelete) return;
    
    try {
      const challanId = challanToDelete.id;
      
      // Delete challan items
      const items = await dbOperations.getAll('purchase_challan_items');
      const itemsToDelete = items.filter(item => item.challan_id === challanId);
      for (const item of itemsToDelete) {
        await dbOperations.delete('purchase_challan_items', item.id);
      }
      
      // Delete stock movements
      const movements = await dbOperations.getAll('stock_movements');
      const movementsToDelete = movements.filter(m => m.reference_id === challanId);
      for (const movement of movementsToDelete) {
        await dbOperations.delete('stock_movements', movement.id);
      }
      
      // Delete supplier ledger entries
      const ledger = await dbOperations.getAll('supplier_ledger_entries');
      const ledgerToDelete = ledger.filter(e => e.reference_id === challanId);
      for (const entry of ledgerToDelete) {
        await dbOperations.delete('supplier_ledger_entries', entry.id);
      }
      
      // Delete main challan
      await dbOperations.delete('purchase_challans', challanId);
      
      toast.success('Purchase challan deleted successfully');
      setDeleteConfirmOpen(false);
      setChallanToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting challan:', error);
      toast.error('Failed to delete purchase challan');
    }
  };

  const handleEdit = async (challan) => {
    try {
      const items = await dbOperations.getAll('purchase_challan_items');
      const materials = items.filter(item => item.challan_id === challan.id);
      
      setEditingChallan({
        ...challan,
        materials: materials.map(m => ({
          id: m.id,
          material_name: m.material_name,
          category_id: m.category_id,
          quantity: m.quantity,
          unit: m.unit,
          rate: m.rate,
        })),
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error loading challan for edit:', error);
      toast.error('Failed to load challan for editing');
    }
  };

  const handleView = async (challan) => {
    try {
      const items = await dbOperations.getAll('purchase_challan_items');
      const materials = items.filter(item => item.challan_id === challan.id);
      
      setViewingChallan({
        ...challan,
        materials: materials,
      });
    } catch (error) {
      console.error('Error loading challan details:', error);
      toast.error('Failed to load challan details');
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Purchase Challans</h2>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Purchase Challan
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Search Challan No..."
            value={filters.challan_no}
            onChange={(e) => setFilters({ ...filters, challan_no: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
          />
          <select
            value={filters.supplier_id}
            onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
          </div>
        ) : filteredChallans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No purchase challans found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Challan No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Payment</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredChallans.map(challan => (
                  <tr key={challan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-gray-900 dark:text-dark-text">{challan.challan_no}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-dark-text-secondary">
                      {new Date(challan.challan_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-dark-text">{challan.supplier_name}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-dark-text">
                      ₹{challan.total_amount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-dark-text-secondary">
                      ₹{challan.payment_amount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        challan.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {challan.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(challan)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(challan)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setChallanToDelete(challan);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingChallan(null);
        }}
        title={editingChallan ? 'Edit Purchase Challan' : 'Add Purchase Challan'}
        size="xl"
      >
        <ChallanForm
          suppliers={suppliers}
          categories={categories}
          editData={editingChallan}
          onSave={handleSaveChallan}
          onClose={() => {
            setShowForm(false);
            setEditingChallan(null);
          }}
          generateChallanNo={generateChallanNo}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingChallan}
        onClose={() => setViewingChallan(null)}
        title="Purchase Challan Details"
        size="xl"
      >
        {viewingChallan && <ChallanView challan={viewingChallan} />}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setChallanToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Purchase Challan"
        message="Are you sure you want to delete this purchase challan? This will remove all related stock movements and ledger entries."
      />
    </div>
  );
};

// Challan Form Component
const ChallanForm = ({ suppliers, categories, editData, onSave, onClose, generateChallanNo }) => {
  const [formData, setFormData] = useState({
    challan_no: editData?.challan_no || '',
    challan_date: editData?.challan_date || new Date().toISOString().split('T')[0],
    supplier_id: editData?.supplier_id || '',
    payment_mode: editData?.payment_mode || 'pending',
    payment_amount: editData?.payment_amount || 0,
    payment_status: editData?.payment_status || 'pending',
  });

  const [materials, setMaterials] = useState(
    editData?.materials?.length > 0
      ? editData.materials
      : [{ id: Date.now(), material_name: '', category_id: '', quantity: '', unit: 'pcs', rate: '' }]
  );

  useEffect(() => {
    if (!editData && !formData.challan_no) {
      generateChallanNo().then(no => setFormData(prev => ({ ...prev, challan_no: no })));
    }
  }, []);

  const addMaterial = () => {
    setMaterials([...materials, { id: Date.now(), material_name: '', category_id: '', quantity: '', unit: 'pcs', rate: '' }]);
  };

  const removeMaterial = (id) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (id, field, value) => {
    setMaterials(materials.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.rate || 0)), 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.challan_no || !formData.supplier_id) {
      toast.error('Challan number and supplier are required');
      return;
    }

    const validMaterials = materials.filter(m => m.material_name && m.category_id && m.quantity && m.rate);
    if (validMaterials.length === 0) {
      toast.error('Please add at least one material');
      return;
    }

    const total = calculateTotal();
    const supplier = suppliers.find(s => s.id === formData.supplier_id);

    onSave({
      ...formData,
      supplier_name: supplier?.name || '',
      materials: validMaterials,
      total_amount: total,
    });
  };

  const total = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Challan No *
          </label>
          <input
            type="text"
            value={formData.challan_no}
            onChange={(e) => setFormData({ ...formData, challan_no: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            required
            readOnly={!editData}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Challan Date *
          </label>
          <input
            type="date"
            value={formData.challan_date}
            onChange={(e) => setFormData({ ...formData, challan_date: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Supplier *
        </label>
        <select
          value={formData.supplier_id}
          onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
          required
        >
          <option value="">Select Supplier</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name} {s.company && `- ${s.company}`}</option>
          ))}
        </select>
      </div>

      {/* Materials Table */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Material Name *</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Category *</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty *</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Unit</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Rate *</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {materials.map(material => (
              <tr key={material.id} className="bg-white dark:bg-dark-card">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={material.material_name}
                    onChange={(e) => updateMaterial(material.id, 'material_name', e.target.value)}
                    placeholder="Material name"
                    className="w-full p-1 text-sm border border-gray-300 rounded bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={material.category_id}
                    onChange={(e) => updateMaterial(material.id, 'category_id', e.target.value)}
                    className="w-full p-1 text-sm border border-gray-300 rounded bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                  >
                    <option value="">Select</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => updateMaterial(material.id, 'quantity', e.target.value)}
                    placeholder="0"
                    step="0.01"
                    className="w-full p-1 text-sm border border-gray-300 rounded bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={material.unit}
                    onChange={(e) => updateMaterial(material.id, 'unit', e.target.value)}
                    className="w-full p-1 text-sm border border-gray-300 rounded bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="ltr">Ltr</option>
                    <option value="mtr">Mtr</option>
                    <option value="box">Box</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={material.rate}
                    onChange={(e) => updateMaterial(material.id, 'rate', e.target.value)}
                    placeholder="0"
                    step="0.01"
                    className="w-full p-1 text-sm border border-gray-300 rounded bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                  />
                </td>
                <td className="px-2 py-2 text-right font-medium">
                  ₹{((parseFloat(material.quantity) || 0) * (parseFloat(material.rate) || 0)).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeMaterial(material.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={materials.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
          <Button type="button" onClick={addMaterial} variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-1" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Payment Section */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-3">Payment Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Payment Mode
            </label>
            <select
              value={formData.payment_mode}
              onChange={(e) => {
                const mode = e.target.value;
                setFormData({ 
                  ...formData, 
                  payment_mode: mode,
                  payment_status: mode === 'pending' ? 'pending' : 'paid',
                  payment_amount: mode === 'pending' ? 0 : total
                });
              }}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            >
              <option value="pending">Pending</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Payment Amount
            </label>
            <input
              type="number"
              value={formData.payment_amount}
              onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
              step="0.01"
              disabled={formData.payment_mode === 'pending'}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Status
            </label>
            <input
              type="text"
              value={formData.payment_status}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text"
            />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-900 dark:text-dark-text">Total Amount:</span>
          <span className="text-brand-red">₹{total}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {editData ? 'Update Challan' : 'Save Challan'}
        </Button>
      </div>
    </form>
  );
};

// Challan View Component
const ChallanView = ({ challan }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Challan No</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{challan.challan_no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">
            {new Date(challan.challan_date).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{challan.supplier_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Payment Mode</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{challan.payment_mode || 'pending'}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-2">Materials</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Material</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Rate</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {challan.materials?.map(material => (
              <tr key={material.id}>
                <td className="px-3 py-2 text-gray-900 dark:text-dark-text">{material.material_name}</td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-dark-text-secondary">
                  {material.quantity} {material.unit}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-dark-text-secondary">
                  ₹{material.rate?.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-dark-text">
                  ₹{material.amount?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-lg font-bold">
          <span>Total Amount:</span>
          <span className="text-brand-red">₹{challan.total_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Payment Amount:</span>
          <span className="font-medium">₹{challan.payment_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
          <span className={`font-medium ${
            challan.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {challan.payment_status || 'pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseChallan;
