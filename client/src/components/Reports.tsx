import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  manager?: {
    firstName: string;
    lastName: string;
  };
}

interface ProjectEmployeeBreakdown {
  project: Project;
  employees: {
    employee: Employee;
    totalHours: number;
    entries: Array<{
      date: string;
      hours: number;
      notes?: string;
    }>;
  }[];
  totalHours: number;
}

interface EmployeeProjectBreakdown {
  employee: Employee;
  projects: {
    project: {
      id: string;
      code: string;
      name: string;
    };
    totalHours: number;
    weeks: Record<string, {
      weekStart: string;
      hours: number;
      status: string;
    }>;
  }[];
  totalHours: number;
}

// Commented out - not currently used but may be needed for future enhancements
// interface SummaryData {
//   projects: Array<{
//     project: Project;
//     totalHours: number;
//   }>;
//   employees: Array<{
//     employee: Employee;
//     totalHours: number;
//   }>;
//   totalHours: number;
//   dateRange: {
//     startDate: string;
//     endDate: string;
//   };
// }

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'project-employee' | 'employee-project' | 'summary'>('project-employee');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [reportType, startDate, endDate, selectedProject, selectedEmployee]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params: any = {
        startDate,
        endDate
      };

      switch (reportType) {
        case 'project-employee':
          endpoint = '/reports/project-employee-breakdown';
          if (selectedProject) params.projectId = selectedProject;
          break;
        case 'employee-project':
          endpoint = '/reports/employee-project-breakdown';
          if (selectedEmployee) params.userId = selectedEmployee;
          break;
        case 'summary':
          endpoint = '/reports/summary';
          break;
      }

      const response = await axios.get(endpoint, { params });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    const date = new Date().toISOString().split('T')[0];

    if (reportType === 'project-employee' && reportData.breakdown) {
      csv = 'Project Code,Project Name,Employee,Email,Department/Manager,Total Hours,Period\n';
      reportData.breakdown.forEach((project: ProjectEmployeeBreakdown) => {
        project.employees.forEach(emp => {
          const manager = emp.employee.manager 
            ? `${emp.employee.manager.firstName} ${emp.employee.manager.lastName}`
            : 'No Manager';
          csv += `"${project.project.code}","${project.project.name}","${emp.employee.firstName} ${emp.employee.lastName}","${emp.employee.email}","${manager}",${emp.totalHours},"${startDate} to ${endDate}"\n`;
        });
      });
    } else if (reportType === 'employee-project' && reportData.breakdown) {
      csv = 'Employee,Email,Role,Manager,Project Code,Project Name,Total Hours,Period\n';
      reportData.breakdown.forEach((emp: EmployeeProjectBreakdown) => {
        const manager = emp.employee.manager 
          ? `${emp.employee.manager.firstName} ${emp.employee.manager.lastName}`
          : 'No Manager';
        emp.projects.forEach(proj => {
          csv += `"${emp.employee.firstName} ${emp.employee.lastName}","${emp.employee.email}","${emp.employee.role}","${manager}","${proj.project.code}","${proj.project.name}",${proj.totalHours},"${startDate} to ${endDate}"\n`;
        });
      });
    } else if (reportType === 'summary' && reportData) {
      csv = 'Type,Name,Total Hours,Period\n';
      csv += '\nProjects Summary\n';
      reportData.projects.forEach((proj: any) => {
        csv += `Project,"${proj.project.code} - ${proj.project.name}",${proj.totalHours},"${startDate} to ${endDate}"\n`;
      });
      csv += '\nEmployees Summary\n';
      reportData.employees.forEach((emp: any) => {
        csv += `Employee,"${emp.employee.firstName} ${emp.employee.lastName}",${emp.totalHours},"${startDate} to ${endDate}"\n`;
      });
      csv += `\nTotal Hours,${reportData.totalHours}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet-report-${reportType}-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setQuickDateRange = (range: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear') => {
    const now = new Date();
    switch (range) {
      case 'thisMonth':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'thisYear':
        setStartDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'));
        break;
      case 'lastYear':
        setStartDate(format(new Date(now.getFullYear() - 1, 0, 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(now.getFullYear() - 1, 11, 31), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="project-employee">Hours by Project (with Employee Breakdown)</option>
              <option value="employee-project">Hours by Employee (with Project Breakdown)</option>
              <option value="summary">Summary Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {reportType === 'project-employee' && (
            <div>
              <label className="block text-sm font-medium mb-1">Project (Optional)</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'employee-project' && (
            <div>
              <label className="block text-sm font-medium mb-1">Employee (Optional)</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setQuickDateRange('thisMonth')}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            This Month
          </button>
          <button
            onClick={() => setQuickDateRange('lastMonth')}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Last Month
          </button>
          <button
            onClick={() => setQuickDateRange('thisYear')}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            This Year
          </button>
          <button
            onClick={() => setQuickDateRange('lastYear')}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Last Year
          </button>
          <div className="flex-1"></div>
          <button
            onClick={exportToCSV}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!reportData}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Report Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : reportData ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reportType === 'project-employee' && reportData.breakdown && (
            <div>
              <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
                Project Hours Report - {startDate} to {endDate}
              </h3>
              {reportData.breakdown.map((project: ProjectEmployeeBreakdown) => (
                <div key={project.project.id} className="border-b">
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-lg">{project.project.code}</span>
                        <span className="ml-2">{project.project.name}</span>
                      </div>
                      <span className="font-bold text-lg">{project.totalHours.toFixed(1)} hours</span>
                    </div>
                    {project.project.description && (
                      <p className="text-sm text-gray-600 mt-1">{project.project.description}</p>
                    )}
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Employee</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Department/Manager</th>
                        <th className="px-4 py-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.employees.map((emp, idx) => (
                        <tr key={emp.employee.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2">
                            {emp.employee.firstName} {emp.employee.lastName}
                            <span className="ml-2 text-xs text-gray-500">({emp.employee.role})</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{emp.employee.email}</td>
                          <td className="px-4 py-2 text-sm">
                            {emp.employee.manager 
                              ? `${emp.employee.manager.firstName} ${emp.employee.manager.lastName}`
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">{emp.totalHours.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="p-4 bg-blue-50 font-bold text-lg text-right">
                Total Hours: {reportData.breakdown.reduce((sum: number, p: ProjectEmployeeBreakdown) => sum + p.totalHours, 0).toFixed(1)}
              </div>
            </div>
          )}

          {reportType === 'employee-project' && reportData.breakdown && (
            <div>
              <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
                Employee Hours Report - {startDate} to {endDate}
              </h3>
              {reportData.breakdown.map((emp: EmployeeProjectBreakdown) => (
                <div key={emp.employee.id} className="border-b">
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-lg">
                          {emp.employee.firstName} {emp.employee.lastName}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">({emp.employee.role})</span>
                      </div>
                      <span className="font-bold text-lg">{emp.totalHours.toFixed(1)} hours</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {emp.employee.email}
                      {emp.employee.manager && (
                        <span className="ml-4">
                          Manager: {emp.employee.manager.firstName} {emp.employee.manager.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Project Code</th>
                        <th className="px-4 py-2 text-left">Project Name</th>
                        <th className="px-4 py-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.projects.map((proj, idx) => (
                        <tr key={proj.project.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 font-medium">{proj.project.code}</td>
                          <td className="px-4 py-2">{proj.project.name}</td>
                          <td className="px-4 py-2 text-right font-medium">{proj.totalHours.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="p-4 bg-blue-50 font-bold text-lg text-right">
                Total Hours: {reportData.breakdown.reduce((sum: number, e: EmployeeProjectBreakdown) => sum + e.totalHours, 0).toFixed(1)}
              </div>
            </div>
          )}

          {reportType === 'summary' && reportData && (
            <div>
              <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
                Summary Report - {startDate} to {endDate}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div>
                  <h4 className="font-semibold mb-3">Top Projects by Hours</h4>
                  <div className="space-y-2">
                    {reportData.projects.slice(0, 10).map((proj: any) => (
                      <div key={proj.project.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{proj.project.code}</span>
                          <span className="ml-2 text-sm text-gray-600">{proj.project.name}</span>
                        </div>
                        <span className="font-bold">{proj.totalHours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Top Employees by Hours</h4>
                  <div className="space-y-2">
                    {reportData.employees.slice(0, 10).map((emp: any) => (
                      <div key={emp.employee.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">
                            {emp.employee.firstName} {emp.employee.lastName}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">({emp.employee.role})</span>
                        </div>
                        <span className="font-bold">{emp.totalHours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 text-center">
                <div className="text-3xl font-bold">{reportData.totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Total Hours Logged</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Select report parameters to generate a report
        </div>
      )}
    </div>
  );
};

export default Reports;