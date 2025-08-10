import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface TimeEntry {
  id?: string;
  projectId: string;
  date: string;
  hours: number;
  notes?: string;
  project?: Project;
}

interface TimesheetData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  timeEntries: TimeEntry[];
}

interface TimeRow {
  projectId: string;
  project?: Project;
  entries: { [date: string]: number };
}

const Timesheet: React.FC = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timesheet, setTimesheet] = useState<TimesheetData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeRows, setTimeRows] = useState<TimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchTimesheet();
    fetchProjects();
  }, [currentWeek]);

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/timesheets/week/${format(currentWeek, 'yyyy-MM-dd')}`);
      setTimesheet(response.data);
      processTimeEntries(response.data.timeEntries);
    } catch (error) {
      console.error('Failed to fetch timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects/assigned');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const processTimeEntries = (entries: TimeEntry[]) => {
    const rowsMap = new Map<string, TimeRow>();

    entries.forEach(entry => {
      const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
      
      if (!rowsMap.has(entry.projectId)) {
        rowsMap.set(entry.projectId, {
          projectId: entry.projectId,
          project: entry.project,
          entries: {}
        });
      }
      
      const row = rowsMap.get(entry.projectId)!;
      row.entries[dateStr] = entry.hours;
    });

    if (rowsMap.size === 0) {
      setTimeRows([{ projectId: '', entries: {} }]);
    } else {
      setTimeRows(Array.from(rowsMap.values()));
    }
  };

  const handleProjectSelect = (rowIndex: number, projectId: string) => {
    const newRows = [...timeRows];
    const project = projects.find(p => p.id === projectId);
    newRows[rowIndex] = { ...newRows[rowIndex], projectId, project };
    setTimeRows(newRows);
  };

  const handleHoursChange = async (rowIndex: number, date: Date, hours: string) => {
    const hoursNum = parseFloat(hours) || 0;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const newRows = [...timeRows];
    newRows[rowIndex].entries[dateStr] = hoursNum;
    setTimeRows(newRows);

    if (timesheet && timeRows[rowIndex].projectId) {
      setSaving(true);
      try {
        await axios.post('/time-entries', {
          projectId: timeRows[rowIndex].projectId,
          timesheetId: timesheet.id,
          date: dateStr,
          hours: hoursNum,
          notes: ''
        });
      } catch (error) {
        console.error('Failed to save time entry:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const addNewRow = () => {
    setTimeRows([...timeRows, { projectId: '', entries: {} }]);
  };

  const removeRow = (rowIndex: number) => {
    const newRows = timeRows.filter((_, index) => index !== rowIndex);
    setTimeRows(newRows.length > 0 ? newRows : [{ projectId: '', entries: {} }]);
  };

  const calculateRowTotal = (row: TimeRow) => {
    return Object.values(row.entries).reduce((sum, hours) => sum + hours, 0);
  };

  const calculateDayTotal = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeRows.reduce((sum, row) => sum + (row.entries[dateStr] || 0), 0);
  };

  const calculateWeekTotal = () => {
    return timeRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  };

  const handleSubmit = async () => {
    if (!timesheet) return;
    
    try {
      await axios.put(`/timesheets/${timesheet.id}/submit`);
      await fetchTimesheet();
      alert('Timesheet submitted successfully!');
    } catch (error) {
      console.error('Failed to submit timesheet:', error);
      alert('Failed to submit timesheet');
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ← Previous Week
            </button>
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              Next Week →
            </button>
          </div>
        </div>
        {timesheet && (
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
              ${timesheet.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' : ''}
              ${timesheet.status === 'SUBMITTED' ? 'bg-blue-200 text-blue-800' : ''}
              ${timesheet.status === 'APPROVED' ? 'bg-green-200 text-green-800' : ''}
              ${timesheet.status === 'REJECTED' ? 'bg-red-200 text-red-800' : ''}
            `}>
              {timesheet.status}
            </span>
            {saving && <span className="ml-4 text-sm text-gray-500">Saving...</span>}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border text-left">Project</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="px-4 py-2 border text-center min-w-[100px]">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
                </th>
              ))}
              <th className="px-4 py-2 border text-center">Total</th>
              <th className="px-4 py-2 border"></th>
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-4 py-2 border">
                  <select
                    value={row.projectId}
                    onChange={(e) => handleProjectSelect(rowIndex, e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={timesheet?.status !== 'DRAFT'}
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.code} - {project.name}
                      </option>
                    ))}
                  </select>
                </td>
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  return (
                    <td key={day.toISOString()} className="px-2 py-2 border">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={row.entries[dateStr] || ''}
                        onChange={(e) => handleHoursChange(rowIndex, day, e.target.value)}
                        className="w-full p-1 text-center border rounded"
                        disabled={timesheet?.status !== 'DRAFT' || !row.projectId}
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-2 border text-center font-medium">
                  {calculateRowTotal(row).toFixed(1)}
                </td>
                <td className="px-2 py-2 border">
                  {timesheet?.status === 'DRAFT' && timeRows.length > 1 && (
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-2 border font-medium">Daily Total</td>
              {weekDays.map(day => (
                <td key={day.toISOString()} className="px-4 py-2 border text-center font-medium">
                  {calculateDayTotal(day).toFixed(1)}
                </td>
              ))}
              <td className="px-4 py-2 border text-center font-bold">
                {calculateWeekTotal().toFixed(1)}
              </td>
              <td className="px-4 py-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={addNewRow}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          disabled={timesheet?.status !== 'DRAFT'}
        >
          Add Row
        </button>
        {timesheet?.status === 'DRAFT' && (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit to Manager
          </button>
        )}
      </div>
    </div>
  );
};

export default Timesheet;