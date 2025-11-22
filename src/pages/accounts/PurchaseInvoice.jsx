import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Eye, Edit, Download, Printer, Search } from 'lucide-react';
import { dbOperations } from '@/lib/db';
import { broadcastDataChange } from '@/utils/dataSync';

const PurchaseInvoice = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  
  // View modal
  const [viewingPurchase, setViewingPurchase] = useState(null);
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    invoice_no: '',
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
      const [purchaseData, supplierData, categoryData] = await Promise.all([
        dbOperations.getAll('purchases'),
        dbOperations.getAll('suppliers'),
        dbOperations.getAll('inventory_categories'),
      ]);
      setPurchases(purchaseData || []);
      setSuppliers(supplierData || []);
      setCategories(categoryData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const matchInvoice = !filters.invoice_no || p.invoice_no?.toLowerCase().includes(filters.invoice_no.toLowerCase());
    const matchSupplier = !filters.supplier_id || p.supplier_id === filters.supplier_id;
    const matchDateFrom = !filters.date_from || p.invoice_date >= filters.date_from;
    const matchDateTo = !filters.date_to || p.invoice_date <= filters.date_to;
    return matchInvoice && matchSupplier && matchDateFrom && matchDateTo;
  });

  const handleSavePurchase = async (purchaseData) => {
    try {
      const isEditing = !!editingPurchase;
      const purchaseId = isEditing ? editingPurchase.id : `PI-${Date.now()}`;
      
      // Save main purchase record
      const purchaseRecord = {
        id: purchaseId,
        invoice_no: purchaseData.invoice_no,
        invoice_date: purchaseData.invoice_date,
        supplier_id: purchaseData.supplier_id,
        supplier_name: purchaseData.supplier_name,
        gst_type: purchaseData.gst_type,
        igst: parseFloat(purchaseData.igst || 0),
        cgst: parseFloat(purchaseData.cgst || 0),
        sgst: parseFloat(purchaseData.sgst || 0),
        subtotal: parseFloat(purchaseData.subtotal),
        gst_amount: parseFloat(purchaseData.gst_amount),
        total_amount: parseFloat(purchaseData.total_amount),
        created_at: isEditing ? editingPurchase.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        await dbOperations.update('purchases', purchaseId, purchaseRecord);
        
        // Delete old purchase items
        const oldItems = await dbOperations.getAll('purchase_items');
        const itemsToDelete = oldItems.filter(item => item.purchase_id === purchaseId);
        for (const item of itemsToDelete) {
          await dbOperations.delete('purchase_items', item.id);
        }
        
        // Delete old stock movements
        const oldMovements = await dbOperations.getAll('stock_movements');
        const movementsToDelete = oldMovements.filter(m => m.reference_id === purchaseId);
        for (const movement of movementsToDelete) {
          await dbOperations.delete('stock_movements', movement.id);
        }
        
        // Delete old supplier ledger entries
        const oldLedger = await dbOperations.getAll('supplier_ledger_entries');
        const ledgerToDelete = oldLedger.filter(e => e.reference_id === purchaseId);
        for (const entry of ledgerToDelete) {
          await dbOperations.delete('supplier_ledger_entries', entry.id);
        }
      } else {
        await dbOperations.insert('purchases', purchaseRecord);
      }

      // Save purchase items and update stock
      for (const material of purchaseData.materials) {
        const itemId = `${purchaseId}_${Date.now()}_${Math.random()}`;
        
        // Save purchase item
        await dbOperations.insert('purchase_items', {
          id: itemId,
          purchase_id: purchaseId,
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
          reference_type: 'purchase',
          reference_id: purchaseId,
          reference_no: purchaseData.invoice_no,
          movement_date: purchaseData.invoice_date,
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

      // Create supplier ledger entry (CREDIT - liability)
      await dbOperations.insert('supplier_ledger_entries', {
        id: `SL-${purchaseId}`,
        supplier_id: purchaseData.supplier_id,
        entry_date: purchaseData.invoice_date,
        vehicle_no: '',
        owner_name: '',
        work: `Purchase Invoice - ${purchaseData.invoice_no}`,
        particulars: `Purchase Invoice - ${purchaseData.invoice_no}`,
        debit_amount: 0,
        credit_amount: parseFloat(purchaseData.total_amount),
        reference_type: 'purchase',
        reference_id: purchaseId,
        reference_no: purchaseData.invoice_no,
        created_at: new Date().toISOString(),
      });

      // Broadcast change
      broadcastDataChange('purchase', isEditing ? 'updated' : 'created', {
        purchase_id: purchaseId,
        supplier_id: purchaseData.supplier_id,
      });

      toast.success(isEditing ? 'Purchase invoice updated successfully!' : 'Purchase invoice saved successfully!');
      setShowForm(false);
      setEditingPurchase(null);
      loadData();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error('Failed to save purchase invoice');
    }
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    
    try {
      const purchaseId = purchaseToDelete.id;
      
      // Delete purchase items
      const items = await dbOperations.getAll('purchase_items');
      const itemsToDelete = items.filter(item => item.purchase_id === purchaseId);
      for (const item of itemsToDelete) {
        await dbOperations.delete('purchase_items', item.id);
      }
      
      // Delete stock movements
      const movements = await dbOperations.getAll('stock_movements');
      const movementsToDelete = movements.filter(m => m.reference_id === purchaseId);
      for (const movement of movementsToDelete) {
        await dbOperations.delete('stock_movements', movement.id);
      }
      
      // Delete supplier ledger entries
      const ledger = await dbOperations.getAll('supplier_ledger_entries');
      const ledgerToDelete = ledger.filter(e => e.reference_id === purchaseId);
      for (const entry of ledgerToDelete) {
        await dbOperations.delete('supplier_ledger_entries', entry.id);
      }
      
      // Delete main purchase
      await dbOperations.delete('purchases', purchaseId);
      
      toast.success('Purchase invoice deleted successfully');
      setDeleteConfirmOpen(false);
      setPurchaseToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase invoice');
    }
  };

  const handleEdit = async (purchase) => {
    try {
      const items = await dbOperations.getAll('purchase_items');
      const materials = items.filter(item => item.purchase_id === purchase.id);
      
      setEditingPurchase({
        ...purchase,
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
      console.error('Error loading purchase for edit:', error);
      toast.error('Failed to load purchase for editing');
    }
  };

  const handleView = async (purchase) => {
    try {
      const items = await dbOperations.getAll('purchase_items');
      const materials = items.filter(item => item.purchase_id === purchase.id);
      
      setViewingPurchase({
        ...purchase,
        materials: materials,
      });
    } catch (error) {
      console.error('Error loading purchase details:', error);
      toast.error('Failed to load purchase details');
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Purchase Invoices</h2>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Purchase Invoice
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Search Invoice No..."
            value={filters.invoice_no}
            onChange={(e) => setFilters({ ...filters, invoice_no: e.target.value })}
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
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No purchase invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Invoice No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Supplier</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Subtotal</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">GST</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-gray-900 dark:text-dark-text">{purchase.invoice_no}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-dark-text-secondary">
                      {new Date(purchase.invoice_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-dark-text">{purchase.supplier_name}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-dark-text">
                      ₹{purchase.subtotal?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-dark-text-secondary">
                      ₹{purchase.gst_amount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-dark-text">
                      ₹{purchase.total_amount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(purchase)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPurchaseToDelete(purchase);
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
          setEditingPurchase(null);
        }}
        title={editingPurchase ? 'Edit Purchase Invoice' : 'Add Purchase Invoice'}
        size="xl"
      >
        <PurchaseForm
          suppliers={suppliers}
          categories={categories}
          editData={editingPurchase}
          onSave={handleSavePurchase}
          onClose={() => {
            setShowForm(false);
            setEditingPurchase(null);
          }}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingPurchase}
        onClose={() => setViewingPurchase(null)}
        title="Purchase Invoice Details"
        size="xl"
      >
        {viewingPurchase && <PurchaseView purchase={viewingPurchase} />}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPurchaseToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Purchase Invoice"
        message="Are you sure you want to delete this purchase invoice? This will remove all related stock movements and ledger entries."
      />
    </div>
  );
};

// Purchase Form Component
const PurchaseForm = ({ suppliers, categories, editData, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    invoice_no: editData?.invoice_no || '',
    invoice_date: editData?.invoice_date || new Date().toISOString().split('T')[0],
    supplier_id: editData?.supplier_id || '',
    gst_type: editData?.gst_type || 'cgst_sgst',
    igst: editData?.igst || 18,
    cgst: editData?.cgst || 9,
    sgst: editData?.sgst || 9,
  });

  const [materials, setMaterials] = useState(
    editData?.materials?.length > 0
      ? editData.materials
      : [{ id: Date.now(), material_name: '', category_id: '', quantity: '', unit: 'pcs', rate: '' }]
  );

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

  const calculateTotals = () => {
    const subtotal = materials.reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.rate || 0)), 0);
    let gstAmount = 0;
    if (formData.gst_type === 'igst') {
      gstAmount = (subtotal * parseFloat(formData.igst)) / 100;
    } else {
      gstAmount = (subtotal * (parseFloat(formData.cgst) + parseFloat(formData.sgst))) / 100;
    }
    return {
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: (subtotal + gstAmount).toFixed(2),
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.invoice_no || !formData.supplier_id) {
      toast.error('Invoice number and supplier are required');
      return;
    }

    const validMaterials = materials.filter(m => m.material_name && m.category_id && m.quantity && m.rate);
    if (validMaterials.length === 0) {
      toast.error('Please add at least one material');
      return;
    }

    const totals = calculateTotals();
    const supplier = suppliers.find(s => s.id === formData.supplier_id);

    onSave({
      ...formData,
      supplier_name: supplier?.name || '',
      materials: validMaterials,
      subtotal: totals.subtotal,
      gst_amount: totals.gstAmount,
      total_amount: totals.total,
    });
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Invoice No *
          </label>
          <input
            type="text"
            value={formData.invoice_no}
            onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Invoice Date *
          </label>
          <input
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
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

      {/* GST Section */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              GST Type
            </label>
            <select
              value={formData.gst_type}
              onChange={(e) => setFormData({ ...formData, gst_type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
            >
              <option value="igst">IGST</option>
              <option value="cgst_sgst">CGST + SGST</option>
            </select>
          </div>
          {formData.gst_type === 'igst' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                IGST (%)
              </label>
              <input
                type="number"
                value={formData.igst}
                onChange={(e) => setFormData({ ...formData, igst: e.target.value })}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  CGST (%)
                </label>
                <input
                  type="number"
                  value={formData.cgst}
                  onChange={(e) => setFormData({ ...formData, cgst: e.target.value })}
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  SGST (%)
                </label>
                <input
                  type="number"
                  value={formData.sgst}
                  onChange={(e) => setFormData({ ...formData, sgst: e.target.value })}
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-medium text-gray-900 dark:text-dark-text">₹{totals.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">GST:</span>
          <span className="font-medium text-gray-900 dark:text-dark-text">₹{totals.gstAmount}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
          <span className="text-gray-900 dark:text-dark-text">Total:</span>
          <span className="text-brand-red">₹{totals.total}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {editData ? 'Update Purchase' : 'Save Purchase'}
        </Button>
      </div>
    </form>
  );
};

// Purchase View Component
const PurchaseView = ({ purchase }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Invoice No</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{purchase.invoice_no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">
            {new Date(purchase.invoice_date).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{purchase.supplier_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">GST Type</p>
          <p className="font-medium text-gray-900 dark:text-dark-text">{purchase.gst_type?.toUpperCase()}</p>
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
            {purchase.materials?.map(material => (
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
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-medium">₹{purchase.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">GST:</span>
          <span className="font-medium">₹{purchase.gst_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
          <span>Total:</span>
          <span className="text-brand-red">₹{purchase.total_amount?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoice;
