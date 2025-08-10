# Employee Timekeeping System

A comprehensive web-based timekeeping application for medium-sized companies with employee, manager, and administrator interfaces.

## Features

### Employee Features
- Spreadsheet-like timesheet view with weekly entries
- Project assignment and time tracking
- Auto-save functionality
- Navigate between weeks
- Submit timesheets for manager approval

### Manager Features
- View and approve employee timesheets
- Add comments to timesheet reviews
- Manage team assignments
- **Team Status Matrix** (NEW):
  - Visual matrix view showing timesheet status for all direct reports
  - Rows represent employees, columns represent weeks
  - Status indicators: ○ Not Created, ◐ Draft, ◉ Submitted, ✓ Approved, ✗ Rejected
  - Configurable time range (4, 8, 12, or 16 weeks)
  - Current week highlighting for easy reference

### Administrator Features
- User management (create, edit, delete users)
- Project management
- Role assignment
- System configuration
- **Reports Dashboard** (NEW):
  - Generate project-by-employee hour reports for compliance and billing
  - View employee-by-project breakdowns for payroll
  - Export reports to CSV for external processing
  - Filter by date range, specific projects, or employees
  - Summary reports with top projects and employees by hours

## Technology Stack

- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **Authentication**: JWT tokens

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
cd client && npm install
cd ..
```

3. Set up your PostgreSQL database and update the `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/timekeeping?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

4. Run database migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed the database with test data:
```bash
npm run seed
```

## Running the Application

### Development Mode

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them separately:

Backend:
```bash
npm run server:dev
```

Frontend:
```bash
npm run client:dev
```

### Production Mode

Build the frontend:
```bash
npm run build
```

Start the server:
```bash
npm start
```

## Test Credentials

After running the seed script, you can use these test accounts:

- **Admin**: admin@company.com / admin123
- **Manager**: john.manager@company.com / manager123
- **Manager**: jane.manager@company.com / manager123
- **Employee**: alice.employee@company.com / employee123
- **Employee**: bob.employee@company.com / employee123
- **Employee**: charlie.employee@company.com / employee123
- **Employee**: diana.employee@company.com / employee123

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user

### Users
- GET `/api/users` - Get all users (Admin/Manager)
- GET `/api/users/employees` - Get manager's employees
- PUT `/api/users/:id` - Update user (Admin)
- DELETE `/api/users/:id` - Delete user (Admin)

### Projects
- GET `/api/projects` - Get projects
- GET `/api/projects/assigned` - Get assigned projects
- POST `/api/projects` - Create project (Admin)
- PUT `/api/projects/:id` - Update project (Admin)
- POST `/api/projects/:projectId/assign` - Assign project

### Timesheets
- GET `/api/timesheets/current` - Get current week timesheet
- GET `/api/timesheets/week/:date` - Get specific week timesheet
- GET `/api/timesheets/pending` - Get pending timesheets (Manager)
- GET `/api/timesheets/status-matrix` - Get status matrix for direct reports (Manager)
- PUT `/api/timesheets/:id/submit` - Submit timesheet
- PUT `/api/timesheets/:id/approve` - Approve timesheet (Manager)
- PUT `/api/timesheets/:id/reject` - Reject timesheet (Manager)

### Time Entries
- POST `/api/time-entries` - Create/update time entry
- PUT `/api/time-entries/:id` - Update time entry
- DELETE `/api/time-entries/:id` - Delete time entry
- POST `/api/time-entries/batch` - Batch save time entries

### Reports (Admin/Manager)
- GET `/api/reports/summary` - Get summary statistics
- GET `/api/reports/project-employee-breakdown` - Hours by project with employee details
- GET `/api/reports/employee-project-breakdown` - Hours by employee with project details
- GET `/api/reports/project-hours` - Raw time entry data with filters

## Database Schema

The application uses the following main entities:
- **User**: Stores employee, manager, and admin accounts
- **Project**: Company projects with codes and descriptions
- **ProjectAssignment**: Links users to projects
- **Timesheet**: Weekly timesheet containers
- **TimeEntry**: Individual time entries for projects

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- HTTP-only cookies for token storage
- Input validation and sanitization

## Development

### Database Management
```bash
# View database in Prisma Studio
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

## License

ISC