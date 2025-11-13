import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Download, FileText, Printer, Search, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';

const DocumentDetailsModal = ({ documentId, documentType, onClose }) => {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId, documentType]);

  const fetchDocumentDetails = async () => {
    if (!documentId || !documentType) return;

    setLoading(true);
    try {
      let tableName = '';
      if (documentType === 'purchase') tableName = 'purchases';
      else if (documentType === 'purchase_challan') tableName = 'purchase_challans';
      else if (documentType === 'job') tableName = 'jobs';

      if (!tableName) {
        toast.error('Invalid document type');
        return;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', documentId)
        .maybeSingle();

      if (error) throw error;
      setDocumentData(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
        <span className="ml-3">Loading document...</span>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Document not found or has been deleted.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">
          {documentType === 'purchase' && 'Purchase Invoice'}
          {documentType === 'purchase_challan' && 'Purchase Challan'}
          {documentType === 'job' && 'Job Sheet'}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-dark-text-secondary">Document No:</span>
            <span className="ml-2 font-medium">
              {documentData.invoice_no || documentData.challan_no || documentData.job_no}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-dark-text-secondary">Date:</span>
            <span className="ml-2 font-medium">
              {new Date(
                documentData.invoice_date || documentData.challan_date || documentData.created_at
              ).toLocaleDateString('en-IN')}
            </span>
          </div>
          {documentData.total_amount !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-dark-text-secondary">Amount:</span>
              <span className="ml-2 font-medium text-green-600">
                ₹{parseFloat(documentData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {documentData.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Notes
          </label>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {documentData.notes}
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ id: null, type: null });
  const [filters, setFilters] = useState({
    itemSearch: '',
    startDate: '',
    endDate: '',
    movementType: '',
    referenceType: '',
  });

  useEffect(() => {
    fetchMovements();
  }, [filters]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          item:inventory_items(id, name, unit, category:inventory_categories(name))
        `)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('movement_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('movement_date', filters.endDate);
      }
      if (filters.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }
      if (filters.referenceType) {
        query = query.eq('reference_type', filters.referenceType);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      if (filters.itemSearch) {
        filteredData = filteredData.filter(
          (m) =>
            m.item?.name?.toLowerCase().includes(filters.itemSearch.toLowerCase()) ||
            m.item?.category?.name?.toLowerCase().includes(filters.itemSearch.toLowerCase())
        );
      }

      setMovements(filteredData);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const openDocumentModal = (movement) => {
    if (movement.reference_id && movement.reference_type) {
      if (['purchase', 'purchase_challan', 'job'].includes(movement.reference_type)) {
        setSelectedDocument({
          id: movement.reference_id,
          type: movement.reference_type,
        });
        setIsDocumentModalOpen(true);
      } else {
        toast.info('This is a manual entry or system-generated record');
      }
    } else {
      toast.error('No linked document found');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Item Name', 'Category', 'Type', 'Quantity', 'Reference Type', 'Reference No', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...movements.map((m) =>
        [
          m.movement_date,
          m.item?.name || '',
          m.item?.category?.name || '',
          m.movement_type?.toUpperCase(),
          m.quantity,
          m.reference_type || '',
          m.reference_no || '',
          m.notes || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_movements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Stock movements exported to CSV');
  };

  const saveToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Stock Movements History', 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`,
      14,
      22
    );
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    let yPos = 35;
    doc.setFontSize(9);
    doc.text('Date', 14, yPos);
    doc.text('Item', 40, yPos);
    doc.text('Type', 100, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Ref No', 150, yPos);

    yPos += 5;
    movements.forEach((m) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(m.movement_date, 14, yPos);
      doc.text(m.item?.name?.substring(0, 25) || '', 40, yPos);
      doc.text(m.movement_type?.toUpperCase() || '', 100, yPos);
      doc.text(`${m.quantity} ${m.item?.unit || ''}`, 120, yPos);
      doc.text(m.reference_no || '', 150, yPos);
      yPos += 6;
    });

    doc.save(`stock_movements_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Stock movements saved as PDF');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <div>
      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setSelectedDocument({ id: null, type: null });
        }}
        title="Document Details"
      >
        <DocumentDetailsModal
          documentId={selectedDocument.id}
          documentType={selectedDocument.type}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setSelectedDocument({ id: null, type: null });
          }}
        />
      </Modal>

      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">
            Stock Movements History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search item or category..."
                value={filters.itemSearch}
                onChange={(e) => setFilters({ ...filters, itemSearch: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              placeholder="Start Date"
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              placeholder="End Date"
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            />

            <select
              value={filters.movementType}
              onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            >
              <option value="">All Types</option>
              <option value="in">IN (Received)</option>
              <option value="out">OUT (Used)</option>
            </select>

            <select
              value={filters.referenceType}
              onChange={(e) => setFilters({ ...filters, referenceType: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-card dark:border-gray-600 dark:text-dark-text focus:ring-2 focus:ring-brand-red"
            >
              <option value="">All References</option>
              <option value="purchase">Purchase</option>
              <option value="purchase_challan">Purchase Challan</option>
              <option value="job">Job Sheet</option>
              <option value="adjustment">Adjustment</option>
              <option value="opening">Opening Stock</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={saveToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
              <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">
                Loading movements...
              </span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                    <tr>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Item Name</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Quantity</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Ref No</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length > 0 ? (
                      movements.map((movement) => (
                        <tr
                          key={movement.id}
                          className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-gray-700 dark:text-dark-text-secondary">
                            {new Date(movement.movement_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="p-3 font-medium text-gray-900 dark:text-dark-text">
                            {movement.item?.name || '-'}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {movement.item?.category?.name || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                movement.movement_type === 'in'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {movement.movement_type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-900 dark:text-dark-text">
                            {parseFloat(movement.quantity).toFixed(2)} {movement.item?.unit || ''}
                          </td>
                          <td className="p-3 text-gray-700 dark:text-dark-text-secondary capitalize">
                            {movement.reference_type?.replace('_', ' ') || '-'}
                          </td>
                          <td className="p-3">
                            {movement.reference_no && ['purchase', 'purchase_challan', 'job'].includes(movement.reference_type) ? (
                              <button
                                onClick={() => openDocumentModal(movement)}
                                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {movement.reference_no}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </button>
                            ) : (
                              <span className="text-gray-700 dark:text-dark-text-secondary">
                                {movement.reference_no || '-'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-gray-700 dark:text-dark-text-secondary text-sm">
                            {movement.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center p-12">
                          <div className="flex flex-col items-center text-gray-500 dark:text-dark-text-secondary">
                            <p className="text-lg font-medium">No movements found</p>
                            <p className="text-sm mt-1">
                              {filters.itemSearch || filters.startDate || filters.movementType || filters.referenceType
                                ? 'Try adjusting your filters'
                                : 'Stock movements will appear here as items are purchased or used'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {movements.length > 0 && (
                <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
                  Showing {movements.length} movement(s)
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockMovements;
