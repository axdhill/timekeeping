const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, timesheetId, date, hours, notes } = req.body;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId }
    });

    if (!timesheet || timesheet.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (timesheet.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Cannot modify submitted timesheet' });
    }

    const existingEntry = await prisma.timeEntry.findUnique({
      where: {
        userId_projectId_date: {
          userId: req.user.id,
          projectId,
          date: new Date(date)
        }
      }
    });

    let timeEntry;
    if (existingEntry) {
      timeEntry = await prisma.timeEntry.update({
        where: { id: existingEntry.id },
        data: { hours, notes },
        include: { project: true }
      });
    } else {
      timeEntry = await prisma.timeEntry.create({
        data: {
          userId: req.user.id,
          projectId,
          timesheetId,
          date: new Date(date),
          hours,
          notes
        },
        include: { project: true }
      });
    }

    res.json(timeEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save time entry' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { hours, notes } = req.body;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { timesheet: true }
    });

    if (!timeEntry || timeEntry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (timeEntry.timesheet.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Cannot modify submitted timesheet' });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: { hours, notes },
      include: { project: true }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { timesheet: true }
    });

    if (!timeEntry || timeEntry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (timeEntry.timesheet.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Cannot modify submitted timesheet' });
    }

    await prisma.timeEntry.delete({ where: { id } });

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

router.post('/batch', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;
    
    const results = [];
    for (const entry of entries) {
      const { projectId, timesheetId, date, hours, notes } = entry;

      const timesheet = await prisma.timesheet.findUnique({
        where: { id: timesheetId }
      });

      if (!timesheet || timesheet.userId !== req.user.id) {
        continue;
      }

      if (timesheet.status !== 'DRAFT') {
        continue;
      }

      const existingEntry = await prisma.timeEntry.findUnique({
        where: {
          userId_projectId_date: {
            userId: req.user.id,
            projectId,
            date: new Date(date)
          }
        }
      });

      let timeEntry;
      if (existingEntry) {
        if (hours === 0) {
          await prisma.timeEntry.delete({ where: { id: existingEntry.id } });
          continue;
        }
        timeEntry = await prisma.timeEntry.update({
          where: { id: existingEntry.id },
          data: { hours, notes },
          include: { project: true }
        });
      } else if (hours > 0) {
        timeEntry = await prisma.timeEntry.create({
          data: {
            userId: req.user.id,
            projectId,
            timesheetId,
            date: new Date(date),
            hours,
            notes
          },
          include: { project: true }
        });
      }

      if (timeEntry) {
        results.push(timeEntry);
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save time entries' });
  }
});

module.exports = router;