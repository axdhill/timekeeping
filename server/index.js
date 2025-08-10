const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const timesheetRoutes = require('./routes/timesheets');
const timeEntryRoutes = require('./routes/timeEntries');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration for development and production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        return callback(null, true);
      }
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Handle React routing, return all non-API requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});