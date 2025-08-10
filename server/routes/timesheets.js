const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const getWeekDates = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStartDate: monday, weekEndDate: sunday };
};

router.get('/current', authenticate, async (req, res) => {
  try {
    const { weekStartDate, weekEndDate } = getWeekDates(new Date());

    let timesheet = await prisma.timesheet.findUnique({
      where: {
        userId_weekStartDate: {
          userId: req.user.id,
          weekStartDate
        }
      },
      include: {
        timeEntries: {
          include: {
            project: true
          }
        }
      }
    });

    if (!timesheet) {
      timesheet = await prisma.timesheet.create({
        data: {
          userId: req.user.id,
          weekStartDate,
          weekEndDate
        },
        include: {
          timeEntries: {
            include: {
              project: true
            }
          }
        }
      });
    }

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch current timesheet' });
  }
});

router.get('/week/:date', authenticate, async (req, res) => {
  try {
    const { date } = req.params;
    const { weekStartDate, weekEndDate } = getWeekDates(new Date(date));

    let timesheet = await prisma.timesheet.findUnique({
      where: {
        userId_weekStartDate: {
          userId: req.user.id,
          weekStartDate
        }
      },
      include: {
        timeEntries: {
          include: {
            project: true
          },
          orderBy: [
            { projectId: 'asc' },
            { date: 'asc' }
          ]
        }
      }
    });

    if (!timesheet) {
      timesheet = await prisma.timesheet.create({
        data: {
          userId: req.user.id,
          weekStartDate,
          weekEndDate
        },
        include: {
          timeEntries: {
            include: {
              project: true
            },
            orderBy: [
              { projectId: 'asc' },
              { date: 'asc' }
            ]
          }
        }
      });
    }

    res.json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch timesheet' });
  }
});

router.get('/pending', authenticate, authorize('MANAGER'), async (req, res) => {
  try {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        status: 'SUBMITTED',
        user: {
          managerId: req.user.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        timeEntries: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      }
    });

    res.json(timesheets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending timesheets' });
  }
});

router.put('/:id/submit', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    if (timesheet.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        timeEntries: {
          include: {
            project: true
          }
        }
      }
    });

    res.json(updatedTimesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit timesheet' });
  }
});

router.put('/:id/approve', authenticate, authorize('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    if (timesheet.user.managerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: req.user.id,
        comments
      },
      include: {
        timeEntries: {
          include: {
            project: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(updatedTimesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve timesheet' });
  }
});

router.put('/:id/reject', authenticate, authorize('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found' });
    }

    if (timesheet.user.managerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments
      },
      include: {
        timeEntries: {
          include: {
            project: true
          }
        }
      }
    });

    res.json(updatedTimesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject timesheet' });
  }
});

router.get('/status-matrix', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { weeks = 8 } = req.query;
    
    // Get manager's direct reports
    const directReports = await prisma.user.findMany({
      where: {
        managerId: req.user.id,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    // Calculate date range for the requested number of weeks
    const today = new Date();
    const currentWeek = getWeekDates(today);
    const weekRanges = [];
    
    for (let i = 0; i < weeks; i++) {
      const weekDate = new Date(currentWeek.weekStartDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const { weekStartDate, weekEndDate } = getWeekDates(weekDate);
      weekRanges.push({ weekStartDate, weekEndDate });
    }

    // Get all timesheets for direct reports in the date range
    const oldestWeek = weekRanges[weekRanges.length - 1].weekStartDate;
    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId: {
          in: directReports.map(u => u.id)
        },
        weekStartDate: {
          gte: oldestWeek
        }
      },
      select: {
        userId: true,
        weekStartDate: true,
        status: true,
        submittedAt: true,
        approvedAt: true
      }
    });

    // Build the matrix data structure
    const matrix = directReports.map(employee => {
      const employeeData = {
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email
        },
        weeks: {}
      };

      weekRanges.forEach(({ weekStartDate }) => {
        const weekKey = weekStartDate.toISOString().split('T')[0];
        const timesheet = timesheets.find(
          t => t.userId === employee.id && 
          t.weekStartDate.getTime() === weekStartDate.getTime()
        );
        
        if (timesheet) {
          employeeData.weeks[weekKey] = {
            status: timesheet.status,
            submittedAt: timesheet.submittedAt,
            approvedAt: timesheet.approvedAt
          };
        } else {
          employeeData.weeks[weekKey] = {
            status: 'NOT_CREATED',
            submittedAt: null,
            approvedAt: null
          };
        }
      });

      return employeeData;
    });

    res.json({
      weeks: weekRanges.map(({ weekStartDate, weekEndDate }) => ({
        startDate: weekStartDate.toISOString().split('T')[0],
        endDate: weekEndDate.toISOString().split('T')[0]
      })),
      matrix
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch timesheet status matrix' });
  }
});

module.exports = router;