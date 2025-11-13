import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import JobSearchBar from "@/components/jobs/JobSearchBar";
import JobReportList from "@/components/jobs/JobReportList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PlusCircle, Save, Printer } from "lucide-react";
import useAuthStore from "@/store/authStore";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import useMultiplierStore from "@/store/multiplierStore";

const EstimateStep = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
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

    loadRecords();
  }, []);

  useEffect(() => {
    localStorage.setItem("estimateDiscount", discount.toString());
  }, [discount]);

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('jobs_estimate')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load estimate records');
      return;
    }

    setRecords(data || []);
    setFilteredRecords(data || []);
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

  const subTotal = items.reduce((acc, item) => acc + calculateTotal(item), 0);
  const totalAfterDiscount = subTotal - (parseFloat(discount) || 0);

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
      discount: discount,
  total: totalAfterDiscount,
  user_id: user?.id,
    };

    if (currentRecordId) {
      const { error } = await supabase
        .from('jobs_estimate')
        .update(payload)
        .eq('id', currentRecordId);

      if (error) {
        toast.error('Failed to update estimate');
        return;
      }
      toast.success('Estimate updated successfully');
    } else {
      const { data, error } = await supabase
        .from('jobs_estimate')
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast.error('Failed to save estimate');
        return;
      }
      setCurrentRecordId(data.id);
      toast.success('Estimate saved successfully');
    }

    loadRecords();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Record loaded for editing');
  };

  const handleDeleteRecord = async (id) => {
    const { error } = await supabase
      .from('jobs_estimate')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete estimate');
      return;
    }

    toast.success('Estimate deleted successfully');
    loadRecords();
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
        pdf.save("estimate.pdf");
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
              <option value="complete">Complete</option>
              <option value="hold">Hold for Material</option>
            </select>
          </div>
        </div>
      </Card>

      <div id="estimate-body" className="overflow-x-auto border p-4 rounded dark:border-gray-700">
        <table className="w-full text-sm border dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left">
            <tr>
              <th className="p-2 border dark:border-gray-700">Category</th>
              <th className="p-2 border dark:border-gray-700">Item</th>
              <th className="p-2 border dark:border-gray-700">Condition</th>
              <th className="p-2 border dark:border-gray-700">Cost</th>
              <th className="p-2 border dark:border-gray-700">Total</th>
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
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="p-2 border dark:border-gray-700">
                    {item.category}
                    <span className="text-xs text-gray-500 ml-2">({multiplier}x)</span>
                  </td>
                  <td className="p-2 border dark:border-gray-700">{item.item}</td>
                  <td className="p-2 border dark:border-gray-700">{item.condition}</td>
                  <td className="p-2 border dark:border-gray-700">₹{item.cost}</td>
                  <td className="p-2 border dark:border-gray-700 font-semibold">₹{calculateTotal(item).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 text-right">
          <div className="mb-2">Subtotal: ₹{subTotal.toFixed(2)}</div>
          <div className="mb-2">
            Discount:
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="ml-2 w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="font-bold">Total: ₹{totalAfterDiscount.toFixed(2)}</div>
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
