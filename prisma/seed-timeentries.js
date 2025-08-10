const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding sample time entries for testing reports...');

  // Get users and projects
  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' }
  });

  const projects = await prisma.project.findMany({
    where: { active: true }
  });

  // Get current week's Monday
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  // Create time entries for the current week and previous weeks
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() - (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`Creating entries for week starting ${weekStart.toDateString()}`);

    for (const user of users) {
      // Get user's assigned projects
      const assignments = await prisma.projectAssignment.findMany({
        where: { userId: user.id },
        include: { project: true }
      });

      if (assignments.length === 0) continue;

      // Create or get timesheet for this week
      let timesheet = await prisma.timesheet.findUnique({
        where: {
          userId_weekStartDate: {
            userId: user.id,
            weekStartDate: weekStart
          }
        }
      });

      if (!timesheet) {
        timesheet = await prisma.timesheet.create({
          data: {
            userId: user.id,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            status: weekOffset === 0 ? 'DRAFT' : 'APPROVED',
            submittedAt: weekOffset === 0 ? null : new Date(weekEnd.getTime() - 86400000),
            approvedAt: weekOffset === 0 ? null : new Date(weekEnd)
          }
        });
      }

      // Create time entries for each assigned project
      for (const assignment of assignments) {
        // Create entries for Monday through Friday
        for (let day = 0; day < 5; day++) {
          const entryDate = new Date(weekStart);
          entryDate.setDate(weekStart.getDate() + day);

          // Random hours between 0 and 8
          const hours = Math.floor(Math.random() * 5) + (Math.random() > 0.3 ? 3 : 0);
          
          if (hours > 0) {
            try {
              await prisma.timeEntry.create({
                data: {
                  userId: user.id,
                  projectId: assignment.projectId,
                  timesheetId: timesheet.id,
                  date: entryDate,
                  hours: hours,
                  notes: `Work on ${assignment.project.name}`
                }
              });
            } catch (error) {
              // Entry might already exist, skip
            }
          }
        }
      }
    }
  }

  console.log('Sample time entries created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating time entries:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });