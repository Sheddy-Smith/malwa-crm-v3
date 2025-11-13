import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ExternalLink, FileText } from 'lucide-react';

const JobHistoryTab = ({ customer }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_jobs')
        .select('*')
        .eq('customer_id', customer.id)
        .order('job_date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [customer.id]);

  const getStatusBadge = (status) => {
    const statusColors = {
      inspection: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      estimate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      jobsheet: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      chalan: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      invoice: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.inspection
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleJobClick = (job) => {
    navigate(`/jobs?jobId=${job.id}&step=${job.status}`);
  };

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-xl font-bold dark:text-dark-text">Job History</h3>
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
          All jobs for {customer.name}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
          Loading jobs...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left border dark:border-gray-600">Job No.</th>
                <th className="p-3 text-left border dark:border-gray-600">Vehicle No.</th>
                <th className="p-3 text-left border dark:border-gray-600">Job Date</th>
                <th className="p-3 text-left border dark:border-gray-600">Status</th>
                <th className="p-3 text-right border dark:border-gray-600">Amount</th>
                <th className="p-3 text-center border dark:border-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center p-8 text-gray-500 dark:text-dark-text-secondary"
                  >
                    No jobs found for this customer.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-3 border dark:border-gray-600 dark:text-dark-text font-medium">
                      {job.job_no}
                    </td>
                    <td className="p-3 border dark:border-gray-600 dark:text-dark-text">
                      {job.vehicle_no}
                    </td>
                    <td className="p-3 border dark:border-gray-600 dark:text-dark-text">
                      {new Date(job.job_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 border dark:border-gray-600">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="p-3 text-right border dark:border-gray-600 dark:text-dark-text">
                      {job.total_amount > 0
                        ? `₹ ${parseFloat(job.total_amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}`
                        : '-'}
                    </td>
                    <td className="p-3 text-center border dark:border-gray-600">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleJobClick(job)}
                        className="inline-flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default JobHistoryTab;
