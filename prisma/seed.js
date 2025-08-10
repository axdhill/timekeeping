const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });
  console.log('Created admin user:', admin.email);

  // Create managers
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager1 = await prisma.user.create({
    data: {
      email: 'john.manager@company.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: 'MANAGER'
    }
  });
  console.log('Created manager:', manager1.email);

  const manager2 = await prisma.user.create({
    data: {
      email: 'jane.manager@company.com',
      password: managerPassword,
      firstName: 'Jane',
      lastName: 'Manager',
      role: 'MANAGER'
    }
  });
  console.log('Created manager:', manager2.email);

  // Create employees
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employees = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice.employee@company.com',
        password: employeePassword,
        firstName: 'Alice',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        managerId: manager1.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob.employee@company.com',
        password: employeePassword,
        firstName: 'Bob',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        managerId: manager1.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'charlie.employee@company.com',
        password: employeePassword,
        firstName: 'Charlie',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        managerId: manager2.id
      }
    }),
    prisma.user.create({
      data: {
        email: 'diana.employee@company.com',
        password: employeePassword,
        firstName: 'Diana',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        managerId: manager2.id
      }
    })
  ]);
  console.log(`Created ${employees.length} employees`);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        code: 'PROJ-001',
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        active: true
      }
    }),
    prisma.project.create({
      data: {
        code: 'PROJ-002',
        name: 'Mobile App Development',
        description: 'Development of new mobile application',
        active: true
      }
    }),
    prisma.project.create({
      data: {
        code: 'PROJ-003',
        name: 'Database Migration',
        description: 'Migrate legacy database to new system',
        active: true
      }
    }),
    prisma.project.create({
      data: {
        code: 'PROJ-004',
        name: 'Security Audit',
        description: 'Annual security audit and improvements',
        active: true
      }
    }),
    prisma.project.create({
      data: {
        code: 'PROJ-005',
        name: 'Internal Training',
        description: 'Internal training and development',
        active: true
      }
    }),
    prisma.project.create({
      data: {
        code: 'ADMIN',
        name: 'Administration',
        description: 'General administration and meetings',
        active: true
      }
    })
  ]);
  console.log(`Created ${projects.length} projects`);

  // Assign projects to employees
  const assignments = await Promise.all([
    // Alice gets 3 projects
    prisma.projectAssignment.create({
      data: {
        userId: employees[0].id,
        projectId: projects[0].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[0].id,
        projectId: projects[1].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[0].id,
        projectId: projects[5].id
      }
    }),
    // Bob gets 3 projects
    prisma.projectAssignment.create({
      data: {
        userId: employees[1].id,
        projectId: projects[0].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[1].id,
        projectId: projects[2].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[1].id,
        projectId: projects[5].id
      }
    }),
    // Charlie gets 3 projects
    prisma.projectAssignment.create({
      data: {
        userId: employees[2].id,
        projectId: projects[1].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[2].id,
        projectId: projects[3].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[2].id,
        projectId: projects[5].id
      }
    }),
    // Diana gets 4 projects
    prisma.projectAssignment.create({
      data: {
        userId: employees[3].id,
        projectId: projects[2].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[3].id,
        projectId: projects[3].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[3].id,
        projectId: projects[4].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: employees[3].id,
        projectId: projects[5].id
      }
    }),
    // Assign projects to managers too
    prisma.projectAssignment.create({
      data: {
        userId: manager1.id,
        projectId: projects[0].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: manager1.id,
        projectId: projects[5].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: manager2.id,
        projectId: projects[1].id
      }
    }),
    prisma.projectAssignment.create({
      data: {
        userId: manager2.id,
        projectId: projects[5].id
      }
    })
  ]);
  console.log(`Created ${assignments.length} project assignments`);

  console.log('Database seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@company.com / admin123');
  console.log('Manager: john.manager@company.com / manager123');
  console.log('Manager: jane.manager@company.com / manager123');
  console.log('Employee: alice.employee@company.com / employee123');
  console.log('Employee: bob.employee@company.com / employee123');
  console.log('Employee: charlie.employee@company.com / employee123');
  console.log('Employee: diana.employee@company.com / employee123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });