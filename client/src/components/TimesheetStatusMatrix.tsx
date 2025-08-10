import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface TimesheetStatus {
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NOT_CREATED';
  submittedAt: string | null;
  approvedAt: string | null;
}

interface MatrixRow {
  employee: Employee;
  weeks: { [weekKey: string]: TimesheetStatus };
}

interface MatrixData {
  weeks: Array<{ startDate: string; endDate: string }>;
  matrix: MatrixRow[];
}

const TimesheetStatusMatrix: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekCount, setWeekCount] = useState(8);

  useEffect(() => {
    fetchMatrixData();
  }, [weekCount]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/timesheets/status-matrix', {
        params: { weeks: weekCount }
      });
      setMatrixData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch matrix data:', err);
      setError('Failed to load timesheet status data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TimesheetStatus['status']) => {
    switch (status) {
      case 'NOT_CREATED':
        return { icon: '○', color: 'text-gray-400', title: 'Not Created' };
      case 'DRAFT':
        return { icon: '◐', color: 'text-yellow-500', title: 'Draft - Not Submitted' };
      case 'SUBMITTED':
        return { icon: '◉', color: 'text-blue-500', title: 'Submitted - Pending Approval' };
      case 'APPROVED':
        return { icon: '✓', color: 'text-green-600', title: 'Approved' };
      case 'REJECTED':
        return { icon: '✗', color: 'text-red-600', title: 'Rejected' };
      default:
        return { icon: '?', color: 'text-gray-400', title: 'Unknown' };
    }
  };

  const formatWeekHeader = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    // const end = new Date(endDate); // not currently used
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Format as "Mon DD"
    const startMonth = monthNames[start.getMonth()];
    const startDay = start.getDate();
    
    return (
      <div className="text-center">
        <div className="text-xs font-medium">{startMonth} {startDay}</div>
        <div className="text-xs text-gray-500">Week</div>
      </div>
    );
  };

  const isCurrentWeek = (startDate: string) => {
    const weekStart = new Date(startDate);
    const today = new Date();
    const currentMonday = new Date(today);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);
    
    return weekStart.getTime() === currentMonday.getTime();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading timesheet status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!matrixData || matrixData.matrix.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        No direct reports found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Timesheet Submission Status</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Weeks to display:</label>
            <select
              value={weekCount}
              onChange={(e) => setWeekCount(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
              <option value={16}>16 weeks</option>
            </select>
          </div>
          <button
            onClick={fetchMatrixData}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-lg">○</span>
            <span>Not Created</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">◐</span>
            <span>Draft</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500 text-lg">◉</span>
            <span>Submitted</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-lg">✓</span>
            <span>Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-lg">✗</span>
            <span>Rejected</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                Employee
              </th>
              {matrixData.weeks.map((week, index) => (
                <th
                  key={week.startDate}
                  className={`px-2 py-3 text-xs font-medium text-gray-700 ${
                    isCurrentWeek(week.startDate) ? 'bg-blue-50' : ''
                  }`}
                >
                  {formatWeekHeader(week.startDate, week.endDate)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {matrixData.matrix.map((row, rowIndex) => (
              <tr key={row.employee.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="sticky left-0 bg-inherit px-4 py-3 whitespace-nowrap border-r border-gray-200">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{row.employee.name}</div>
                    <div className="text-xs text-gray-500">{row.employee.email}</div>
                  </div>
                </td>
                {matrixData.weeks.map((week) => {
                  const weekKey = week.startDate;
                  const status = row.weeks[weekKey];
                  const statusInfo = getStatusIcon(status.status);
                  
                  return (
                    <td
                      key={weekKey}
                      className={`px-2 py-3 text-center ${
                        isCurrentWeek(week.startDate) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-center">
                        <span
                          className={`text-2xl ${statusInfo.color} cursor-help`}
                          title={`${statusInfo.title}${
                            status.submittedAt ? `\nSubmitted: ${new Date(status.submittedAt).toLocaleDateString()}` : ''
                          }${
                            status.approvedAt ? `\nApproved: ${new Date(status.approvedAt).toLocaleDateString()}` : ''
                          }`}
                        >
                          {statusInfo.icon}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        <p>Hover over any status icon to see additional details.</p>
        <p>The current week is highlighted in blue.</p>
      </div>
    </div>
  );
};

export default TimesheetStatusMatrix;