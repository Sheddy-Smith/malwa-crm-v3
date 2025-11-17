import { FileText, CheckCircle, Clock, Banknote, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import useJobsStore from '@/store/jobsStore';
import useVendorStore from '@/store/vendorStore';
import useLabourStore from '@/store/labourStore';
import useSupplierStore from '@/store/supplierStore';
import { toast } from 'sonner';
import {
  calculateJobStats,
  calculateRevenue,
  calculateExpenses,
  calculateMonthlyRevenue,
  calculateExpenseBreakdown,
  formatCurrency
} from '@/utils/dashboardCalculations';
import { useMemo, useEffect, useState } from 'react';
import { getMonthlyRevenueExpenses, getExpenseBreakdown } from '@/utils/analytics';

const COLORS = ['#1E3A8A', '#D32F2F', '#FFC107'];

const Dashboard = () => {
  const { jobs, approveEstimate } = useJobsStore();
  const { vendors } = useVendorStore();
  const { labours } = useLabourStore();
  const { suppliers } = useSupplierStore();

  const jobStats = useMemo(() => calculateJobStats(jobs), [jobs]);
  const totalRevenue = useMemo(() => calculateRevenue(jobs), [jobs]);
  const totalExpenses = useMemo(() => calculateExpenses(jobs, labours, vendors, suppliers), [jobs, labours, vendors, suppliers]);
  const [monthlyData, setMonthlyData] = useState(() => calculateMonthlyRevenue(jobs));
  const [expenseBreakdown, setExpenseBreakdown] = useState(() => calculateExpenseBreakdown(jobs, labours, vendors));

  // Fallback: if job-store derived charts are empty, try IDB analytics
  useEffect(() => {
    (async () => {
      const hasData = monthlyData.some(m => (m.revenue || m.expenses));
      if (!hasData) {
        const m = await getMonthlyRevenueExpenses();
        setMonthlyData(m);
      }
      const hasBreakdown = expenseBreakdown.some(b => b.value > 0);
      if (!hasBreakdown) {
        const b = await getExpenseBreakdown();
        setExpenseBreakdown(b);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approvalRequests = Object.values(jobs).filter(job => job.estimate?.approvalNeeded);

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

  const handleApprove = (jobId) => {
    // approveEstimate may not be implemented in the store in some branches — call safely
    if (typeof approveEstimate === 'function') {
      try { approveEstimate(jobId); } catch (e) { console.error('approveEstimate failed', e); }
    }

    // jobs is an array in the store; find the job by id defensively
    const job = Array.isArray(jobs) ? jobs.find(j => j.id === jobId) : (jobs && jobs[jobId]) || null;
    const vehicleNo = job?.vehicleNo || job?.vehicle_no || job?.vehicleNo || job?.vehicle || jobId;
    toast.success(`Estimate for job ${vehicleNo} approved!`);
  };

  const kpiData = [
    {
      name: 'Jobs In-Progress',
      value: jobStats.inProgress,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Jobs Completed',
      value: jobStats.completed,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      name: 'Net Profit',
      value: formatCurrency(profit),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      color: profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      subtitle: `${profitMargin}% margin`
    },
    {
      name: 'Approvals Pending',
      value: jobStats.pendingApprovals,
      icon: FileText,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">{kpi.name}</p>
                <p className="text-3xl font-bold text-brand-dark dark:text-dark-text mt-2">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Approval Requests" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-dark-text-secondary">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Vehicle</th>
                  <th scope="col" className="px-6 py-3">Owner</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.length > 0 ? approvalRequests.map(job => (
                  <tr key={job.id} className="bg-white dark:bg-dark-card border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{job.vehicleNo}</td>
                    <td className="px-6 py-4 dark:text-dark-text">{job.ownerName}</td>
                    <td className="px-6 py-4">Discount Approval</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full dark:bg-amber-900 dark:text-amber-300">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleApprove(job.id)}
                        className="font-medium text-green-600 hover:underline dark:text-green-400"
                      >
                        Approve
                      </button>
                      <button className="font-medium text-red-600 hover:underline dark:text-red-400">
                        Reject
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-gray-500 dark:text-dark-text-secondary">
                      No pending approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Expense Category Split">
          {expenseBreakdown.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(30,30,30,0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <p>No expense data available</p>
            </div>
          )}
        </Card>
      </div>

      <Card title="Revenue vs Expenses">
        {monthlyData.some(item => item.revenue > 0 || item.expenses > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#D32F2F" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="gray" />
              <YAxis stroke="gray" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(30,30,30,0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#1E3A8A"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#D32F2F"
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <p>No revenue/expense data available</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Jobs</p>
            <p className="text-4xl font-bold text-brand-dark dark:text-dark-text">{jobStats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Completion Rate</p>
            <p className="text-4xl font-bold text-brand-dark dark:text-dark-text">
              {jobStats.total > 0 ? ((jobStats.completed / jobStats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Avg Job Value</p>
            <p className="text-4xl font-bold text-brand-dark dark:text-dark-text">
              {formatCurrency(jobStats.completed > 0 ? totalRevenue / jobStats.completed : 0)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
