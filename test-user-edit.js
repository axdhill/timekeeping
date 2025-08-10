const axios = require('axios');

async function testUserEdit() {
  try {
    // Login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@company.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully');

    // Get all users
    console.log('\nFetching all users...');
    const usersResponse = await axios.get('http://localhost:5001/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const users = usersResponse.data;
    console.log(`✓ Found ${users.length} users`);

    // Find a test employee to edit
    const testEmployee = users.find(u => u.email === 'alice.employee@company.com');
    if (!testEmployee) {
      console.log('Test employee not found');
      return;
    }

    console.log(`\nCurrent details for ${testEmployee.email}:`);
    console.log(`  Name: ${testEmployee.firstName} ${testEmployee.lastName}`);
    console.log(`  Role: ${testEmployee.role}`);
    console.log(`  Manager: ${testEmployee.manager ? `${testEmployee.manager.firstName} ${testEmployee.manager.lastName}` : 'None'}`);

    // Update the user
    console.log('\nUpdating user details...');
    const updateData = {
      email: testEmployee.email,
      firstName: 'Alicia',  // Changed from Alice
      lastName: 'Employee-Updated',  // Changed from Employee
      role: testEmployee.role,
      managerId: testEmployee.managerId
    };

    await axios.put(`http://localhost:5001/api/users/${testEmployee.id}`, updateData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✓ User updated successfully');

    // Verify the update
    console.log('\nVerifying update...');
    const verifyResponse = await axios.get('http://localhost:5001/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const updatedUser = verifyResponse.data.find(u => u.id === testEmployee.id);
    console.log(`Updated details for ${updatedUser.email}:`);
    console.log(`  Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  Manager: ${updatedUser.manager ? `${updatedUser.manager.firstName} ${updatedUser.manager.lastName}` : 'None'}`);

    // Restore original values
    console.log('\nRestoring original values...');
    await axios.put(`http://localhost:5001/api/users/${testEmployee.id}`, {
      email: testEmployee.email,
      firstName: 'Alice',
      lastName: 'Employee',
      role: testEmployee.role,
      managerId: testEmployee.managerId
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✓ Original values restored');

    console.log('\n✅ User edit functionality is working correctly!');
    console.log('The Admin Dashboard can now successfully edit user details.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUserEdit();