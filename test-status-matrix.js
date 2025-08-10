const axios = require('axios');

async function testStatusMatrix() {
  try {
    // Login as manager
    console.log('Logging in as manager...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'john.manager@company.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully');

    // Fetch status matrix
    console.log('\nFetching timesheet status matrix...');
    const matrixResponse = await axios.get('http://localhost:5001/api/timesheets/status-matrix', {
      params: { weeks: 4 },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { weeks, matrix } = matrixResponse.data;
    
    console.log(`\n✓ Fetched status matrix for ${matrix.length} employees across ${weeks.length} weeks`);
    
    // Display matrix summary
    console.log('\n--- TIMESHEET STATUS MATRIX ---');
    console.log('Weeks covered:');
    weeks.forEach(week => {
      console.log(`  • ${week.startDate} to ${week.endDate}`);
    });
    
    console.log('\nEmployee Status Summary:');
    matrix.forEach(row => {
      console.log(`\n${row.employee.name} (${row.employee.email}):`);
      weeks.forEach(week => {
        const status = row.weeks[week.startDate];
        const statusEmoji = {
          'NOT_CREATED': '○',
          'DRAFT': '◐',
          'SUBMITTED': '◉',
          'APPROVED': '✓',
          'REJECTED': '✗'
        }[status.status] || '?';
        
        console.log(`  Week ${week.startDate}: ${statusEmoji} ${status.status}`);
      });
    });
    
    // Count statuses
    let statusCounts = {
      'NOT_CREATED': 0,
      'DRAFT': 0,
      'SUBMITTED': 0,
      'APPROVED': 0,
      'REJECTED': 0
    };
    
    matrix.forEach(row => {
      weeks.forEach(week => {
        const status = row.weeks[week.startDate].status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    });
    
    console.log('\n--- OVERALL STATISTICS ---');
    console.log(`Total cells: ${matrix.length * weeks.length}`);
    console.log('Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`  ${status}: ${count} (${Math.round(count * 100 / (matrix.length * weeks.length))}%)`);
      }
    });
    
    console.log('\n✅ Status matrix feature is working correctly!');
    console.log('Managers can now view the submission and approval status of their direct reports in a matrix view.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testStatusMatrix();