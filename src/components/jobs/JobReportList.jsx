import { Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

const STATUS_COLORS = {
  'in-progress': 'bg-yellow-400',
  'complete': 'bg-blue-500',
  'hold': 'bg-red-500',
};

const STATUS_LABELS = {
  'in-progress': 'Work in Progress',
  'complete': 'Complete',
  'hold': 'Hold for Material',
};

const JobReportList = ({ records, onEdit, onDelete, stepName }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No {stepName} records found
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-6 dark:border-gray-700">
      <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
        {stepName} Reports
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 text-left">
            <tr>
              <th className="p-3 border-b dark:border-gray-700">Status</th>
              <th className="p-3 border-b dark:border-gray-700">Vehicle No</th>
              <th className="p-3 border-b dark:border-gray-700">Party Name</th>
              <th className="p-3 border-b dark:border-gray-700">Date</th>
              <th className="p-3 border-b dark:border-gray-700">Branch</th>
              <th className="p-3 border-b dark:border-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${STATUS_COLORS[record.status]}`}
                      title={STATUS_LABELS[record.status]}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {STATUS_LABELS[record.status]}
                    </span>
                  </div>
                </td>
                <td className="p-3 font-medium text-gray-900 dark:text-white">
                  {record.vehicleNo}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{record.partyName}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{record.branch}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(record)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(record.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobReportList;
