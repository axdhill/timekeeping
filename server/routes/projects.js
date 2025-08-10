const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        where: { active: true },
        orderBy: { code: 'asc' }
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          active: true,
          assignments: {
            some: {
              userId: req.user.id,
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
              ]
            }
          }
        },
        orderBy: { code: 'asc' }
      });
    }
    
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/assigned', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        assignments: {
          some: {
            userId: req.user.id,
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        },
        active: true
      },
      orderBy: { code: 'asc' }
    });
    
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assigned projects' });
  }
});

router.get('/assignments', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const assignments = await prisma.projectAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            active: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } },
        { project: { code: 'asc' } }
      ]
    });
    
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project assignments' });
  }
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { code, name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        code,
        name,
        description
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, active } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        code,
        name,
        description,
        active
      }
    });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.post('/:projectId/assign', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, startDate, endDate } = req.body;

    const assignment = await prisma.projectAssignment.create({
      data: {
        userId,
        projectId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
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
        project: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

router.delete('/:projectId/assign/:userId', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    await prisma.projectAssignment.delete({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

module.exports = router;