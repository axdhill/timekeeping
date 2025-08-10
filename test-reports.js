const axios = require('axios');

async function testReports() {
  try {
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@company.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;

    // Get summary report
    const reportResponse = await axios.get('http://localhost:5001/api/reports/summary', {
      params: {
        startDate: '2025-07-01',
        endDate: '2025-08-31'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Summary Report:');
    console.log('Total Hours:', reportResponse.data.totalHours);
    console.log('\nTop Projects:');
    reportResponse.data.projects.slice(0, 3).forEach(p => {
      console.log(`  ${p.project.code} - ${p.project.name}: ${p.totalHours} hours`);
    });
    console.log('\nTop Employees:');
    reportResponse.data.employees.slice(0, 3).forEach(e => {
      console.log(`  ${e.employee.firstName} ${e.employee.lastName}: ${e.totalHours} hours`);
    });

    console.log('\n✅ Reports API is working correctly!');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testReports();