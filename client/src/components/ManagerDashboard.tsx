import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import TimesheetStatusMatrix from './TimesheetStatusMatrix';

interface PendingTimesheet {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  submittedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  timeEntries: Array<{
    id: string;
    date: string;
    hours: number;
    project: {
      code: string;
      name: string;
    };
  }>;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'status'>('approvals');
  const [pendingTimesheets, setPendingTimesheets] = useState<PendingTimesheet[]>([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState<PendingTimesheet | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTimesheets();
  }, []);

  const fetchPendingTimesheets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/timesheets/pending');
      setPendingTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch pending timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheetId: string) => {
    try {
      await axios.put(`/timesheets/${timesheetId}/approve`, { comments });
      await fetchPendingTimesheets();
      setSelectedTimesheet(null);
      setComments('');
      alert('Timesheet approved successfully');
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      alert('Failed to approve timesheet');
    }
  };

  const handleReject = async (timesheetId: string) => {
    if (!comments.trim()) {
      alert('Please provide comments when rejecting a timesheet');
      return;
    }
    
    try {
      await axios.put(`/timesheets/${timesheetId}/reject`, { comments });
      await fetchPendingTimesheets();
      setSelectedTimesheet(null);
      setComments('');
      alert('Timesheet rejected');
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
      alert('Failed to reject timesheet');
    }
  };

  const calculateTotalHours = (timesheet: PendingTimesheet) => {
    return timesheet.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const groupEntriesByProject = (entries: PendingTimesheet['timeEntries']) => {
    const grouped: { [key: string]: number } = {};
    entries.forEach(entry => {
      const key = `${entry.project.code} - ${entry.project.name}`;
      grouped[key] = (grouped[key] || 0) + entry.hours;
    });
    return grouped;
  };

  if (loading && activeTab === 'approvals') {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Status Matrix
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
          {pendingTimesheets.length === 0 ? (
            <p className="text-gray-500">No pending timesheets</p>
          ) : (
            <div className="space-y-3">
              {pendingTimesheets.map(timesheet => (
                <div
                  key={timesheet.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    selectedTimesheet?.id === timesheet.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedTimesheet(timesheet)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {timesheet.user.firstName} {timesheet.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Week of {format(new Date(timesheet.weekStartDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {format(new Date(timesheet.submittedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{calculateTotalHours(timesheet)} hours</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selectedTimesheet && (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Timesheet Details</h2>
              <div className="mb-4">
                <p className="font-medium">
                  {selectedTimesheet.user.firstName} {selectedTimesheet.user.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedTimesheet.user.email}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Week: {format(new Date(selectedTimesheet.weekStartDate), 'MMM d')} - 
                  {format(new Date(selectedTimesheet.weekEndDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Hours by Project</h3>
                <div className="space-y-1">
                  {Object.entries(groupEntriesByProject(selectedTimesheet.timeEntries)).map(([project, hours]) => (
                    <div key={project} className="flex justify-between text-sm">
                      <span>{project}</span>
                      <span className="font-medium">{hours} hours</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{calculateTotalHours(selectedTimesheet)} hours</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Comments (optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(selectedTimesheet.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedTimesheet.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'status' && <TimesheetStatusMatrix />}
    </div>
  );
};

export default ManagerDashboard;