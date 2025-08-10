const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get project hours summary
router.get('/project-hours', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate, projectId, userId } = req.query;
    
    const whereClause = {
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(projectId && { projectId }),
      ...(userId && { userId })
    };

    // Get all time entries with project and user details
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        timesheet: {
          select: {
            status: true,
            weekStartDate: true,
            weekEndDate: true
          }
        }
      },
      orderBy: [
        { project: { code: 'asc' } },
        { user: { lastName: 'asc' } },
        { date: 'asc' }
      ]
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Failed to generate project hours report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get summary statistics
router.get('/summary', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } })
    };

    // Get aggregated data by project
    const projectSummary = await prisma.timeEntry.groupBy({
      by: ['projectId'],
      where: dateFilter,
      _sum: {
        hours: true
      }
    });

    // Get project details for the summary
    const projectIds = projectSummary.map(p => p.projectId);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } }
    });

    // Combine the data
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const projectData = projectSummary.map(summary => ({
      project: projectMap.get(summary.projectId),
      totalHours: summary._sum.hours || 0
    }));

    // Get aggregated data by employee
    const employeeSummary = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: dateFilter,
      _sum: {
        hours: true
      }
    });

    // Get employee details
    const userIds = employeeSummary.map(e => e.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const employeeData = employeeSummary.map(summary => ({
      employee: userMap.get(summary.userId),
      totalHours: summary._sum.hours || 0
    }));

    // Get total hours
    const totalHours = await prisma.timeEntry.aggregate({
      where: dateFilter,
      _sum: {
        hours: true
      }
    });

    res.json({
      projects: projectData.sort((a, b) => b.totalHours - a.totalHours),
      employees: employeeData.sort((a, b) => b.totalHours - a.totalHours),
      totalHours: totalHours._sum.hours || 0,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    console.error('Failed to generate summary report:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Get detailed project-employee breakdown
router.get('/project-employee-breakdown', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    const whereClause = {
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(projectId && { projectId })
    };

    // Get all projects with their time entries grouped by employee
    const projects = await prisma.project.findMany({
      where: projectId ? { id: projectId } : { active: true },
      include: {
        timeEntries: {
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                manager: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    // Process data to group by project and employee
    const breakdown = projects.map(project => {
      const employeeHours = {};
      
      project.timeEntries.forEach(entry => {
        const employeeKey = entry.userId;
        if (!employeeHours[employeeKey]) {
          employeeHours[employeeKey] = {
            employee: entry.user,
            totalHours: 0,
            entries: []
          };
        }
        employeeHours[employeeKey].totalHours += entry.hours;
        employeeHours[employeeKey].entries.push({
          date: entry.date,
          hours: entry.hours,
          notes: entry.notes
        });
      });

      return {
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          description: project.description
        },
        employees: Object.values(employeeHours).sort((a, b) => 
          a.employee.lastName.localeCompare(b.employee.lastName)
        ),
        totalHours: Object.values(employeeHours).reduce((sum, emp) => sum + emp.totalHours, 0)
      };
    }).filter(p => p.totalHours > 0); // Only include projects with hours

    res.json({
      breakdown,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    console.error('Failed to generate breakdown report:', error);
    res.status(500).json({ error: 'Failed to generate breakdown' });
  }
});

// Get employee-project breakdown (inverse view)
router.get('/employee-project-breakdown', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const whereClause = {
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(userId && { userId })
    };

    // Get all users with their time entries grouped by project
    const users = await prisma.user.findMany({
      where: userId ? { id: userId } : {},
      include: {
        timeEntries: {
          where: whereClause,
          include: {
            project: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            timesheet: {
              select: {
                status: true,
                weekStartDate: true
              }
            }
          }
        },
        manager: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Process data to group by employee and project
    const breakdown = users.map(user => {
      const projectHours = {};
      
      user.timeEntries.forEach(entry => {
        const projectKey = entry.projectId;
        if (!projectHours[projectKey]) {
          projectHours[projectKey] = {
            project: entry.project,
            totalHours: 0,
            weeks: {}
          };
        }
        projectHours[projectKey].totalHours += entry.hours;
        
        // Group by week
        const weekKey = new Date(entry.timesheet.weekStartDate).toISOString().split('T')[0];
        if (!projectHours[projectKey].weeks[weekKey]) {
          projectHours[projectKey].weeks[weekKey] = {
            weekStart: entry.timesheet.weekStartDate,
            hours: 0,
            status: entry.timesheet.status
          };
        }
        projectHours[projectKey].weeks[weekKey].hours += entry.hours;
      });

      return {
        employee: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          manager: user.manager
        },
        projects: Object.values(projectHours).sort((a, b) => 
          a.project.code.localeCompare(b.project.code)
        ),
        totalHours: Object.values(projectHours).reduce((sum, proj) => sum + proj.totalHours, 0)
      };
    }).filter(u => u.totalHours > 0); // Only include employees with hours

    res.json({
      breakdown,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    });
  } catch (error) {
    console.error('Failed to generate employee breakdown report:', error);
    res.status(500).json({ error: 'Failed to generate breakdown' });
  }
});

module.exports = router;