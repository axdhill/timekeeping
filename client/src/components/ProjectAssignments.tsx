import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface Assignment {
  id: string;
  userId: string;
  projectId: string;
  user: User;
  project: Project;
  startDate: string;
  endDate: string | null;
}

const ProjectAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('matrix');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, usersRes, projectsRes] = await Promise.all([
        axios.get('/projects/assignments'),
        axios.get('/users'),
        axios.get('/projects')
      ]);
      
      setAssignments(assignmentsRes.data);
      setUsers(usersRes.data.filter((u: User) => u.role === 'EMPLOYEE'));
      setProjects(projectsRes.data.filter((p: Project) => p.active));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedProjectId) {
      alert('Please select both an employee and a project');
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.userId === selectedUserId && a.projectId === selectedProjectId
    );
    
    if (existingAssignment) {
      alert('This employee is already assigned to this project');
      return;
    }

    try {
      await axios.post(`/projects/${selectedProjectId}/assign`, {
        userId: selectedUserId,
        startDate: new Date().toISOString()
      });
      
      await fetchData();
      setSelectedUserId('');
      setSelectedProjectId('');
      alert('Project assigned successfully');
    } catch (error) {
      console.error('Failed to assign project:', error);
      alert('Failed to assign project');
    }
  };

  const handleUnassign = async (projectId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      await axios.delete(`/projects/${projectId}/assign/${userId}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const isAssigned = (userId: string, projectId: string) => {
    return assignments.some(a => a.userId === userId && a.projectId === projectId);
  };

  const getUserProjects = (userId: string) => {
    return assignments
      .filter(a => a.userId === userId)
      .map(a => a.project);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Assign Project to Employee</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Employee
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose an employee...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAssign}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Assign Project
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Current Assignments</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded ${
                viewMode === 'matrix' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Matrix View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {viewMode === 'matrix' ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    Employee / Project
                  </th>
                  {projects.map(project => (
                    <th key={project.id} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="font-semibold">{project.code}</div>
                      <div className="text-xs font-normal text-gray-500 normal-case">
                        {project.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="sticky left-0 bg-inherit px-4 py-3 whitespace-nowrap border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    {projects.map(project => {
                      const assigned = isAssigned(user.id, project.id);
                      return (
                        <td key={project.id} className="px-4 py-3 text-center">
                          {assigned ? (
                            <button
                              onClick={() => handleUnassign(project.id, user.id)}
                              className="text-green-600 hover:text-red-600 text-2xl"
                              title="Click to unassign"
                            >
                              ✓
                            </button>
                          ) : (
                            <span className="text-gray-300 text-2xl">○</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(user => {
              const userProjects = getUserProjects(user.id);
              return (
                <div key={user.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {userProjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userProjects.map(project => (
                          <div
                            key={project.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {project.code} - {project.name}
                            <button
                              onClick={() => handleUnassign(project.id, user.id)}
                              className="ml-2 text-blue-600 hover:text-red-600"
                              title="Remove assignment"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No projects assigned</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p>• Click the ✓ in matrix view to remove an assignment</p>
        <p>• Use the form above to add new assignments</p>
        <p>• Only active projects and employees are shown</p>
      </div>
    </div>
  );
};

export default ProjectAssignments;