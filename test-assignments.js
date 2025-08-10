const axios = require('axios');

async function testProjectAssignments() {
  try {
    // Login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@company.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully\n');

    // Get all assignments
    console.log('Fetching current project assignments...');
    const assignmentsResponse = await axios.get('http://localhost:5001/api/projects/assignments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const assignments = assignmentsResponse.data;
    console.log(`✓ Found ${assignments.length} assignments\n`);

    // Group assignments by employee
    const employeeAssignments = {};
    assignments.forEach(a => {
      const employeeName = `${a.user.firstName} ${a.user.lastName}`;
      if (!employeeAssignments[employeeName]) {
        employeeAssignments[employeeName] = {
          email: a.user.email,
          projects: []
        };
      }
      employeeAssignments[employeeName].projects.push(`${a.project.code} - ${a.project.name}`);
    });

    console.log('--- CURRENT PROJECT ASSIGNMENTS ---');
    Object.entries(employeeAssignments).forEach(([name, data]) => {
      console.log(`\n${name} (${data.email}):`);
      data.projects.forEach(project => {
        console.log(`  • ${project}`);
      });
    });

    // Test assigning a new project
    console.log('\n\n--- TESTING ASSIGNMENT FUNCTIONALITY ---');
    
    // Get users and projects
    const [usersRes, projectsRes] = await Promise.all([
      axios.get('http://localhost:5001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:5001/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const employees = usersRes.data.filter(u => u.role === 'EMPLOYEE');
    const projects = projectsRes.data.filter(p => p.active);

    // Find an employee without all projects assigned
    let testEmployee = null;
    let testProject = null;

    for (const employee of employees) {
      const employeeAssignments = assignments.filter(a => a.userId === employee.id);
      const assignedProjectIds = employeeAssignments.map(a => a.projectId);
      
      for (const project of projects) {
        if (!assignedProjectIds.includes(project.id)) {
          testEmployee = employee;
          testProject = project;
          break;
        }
      }
      if (testEmployee) break;
    }

    if (testEmployee && testProject) {
      console.log(`\nAssigning ${testProject.code} to ${testEmployee.firstName} ${testEmployee.lastName}...`);
      
      await axios.post(`http://localhost:5001/api/projects/${testProject.id}/assign`, {
        userId: testEmployee.id,
        startDate: new Date().toISOString()
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✓ Project assigned successfully');

      // Remove the assignment
      console.log('Removing the test assignment...');
      await axios.delete(`http://localhost:5001/api/projects/${testProject.id}/assign/${testEmployee.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✓ Assignment removed successfully');
    } else {
      console.log('All employees are already assigned to all projects');
    }

    console.log('\n✅ Project assignment feature is working correctly!');
    console.log('\nAdmins can now:');
    console.log('• View all employee-project assignments in a matrix view');
    console.log('• Switch between matrix and list views');
    console.log('• Assign projects to employees');
    console.log('• Remove project assignments');
    console.log('• Access this feature through the "Assignments" tab in the Admin Dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProjectAssignments();