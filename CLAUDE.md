# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive employee timekeeping web application for medium-sized companies. It features role-based access control with three user types (Employee, Manager, Admin), spreadsheet-like timesheet entry, approval workflows, and reporting capabilities for compliance, billing, and payroll.

## Essential Development Commands

### Running the Application
```bash
npm run dev              # Runs both frontend (port 3000) and backend (port 5001) concurrently
npm run server:dev       # Backend only with hot reload
npm run client:dev       # Frontend only with hot reload
```

### Database Operations
```bash
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Apply database migrations
npm run prisma:studio    # Open Prisma Studio GUI for database inspection
npm run seed            # Populate database with test data
```

### Building for Production
```bash
npm run build           # Build frontend for production
npm start              # Start production server
```

### Linting and Type Checking
Currently no linting or type checking commands are configured. If needed, ask the user for the appropriate commands and update this file.

## Architecture Overview

### Tech Stack
- **Backend**: Node.js/Express REST API on port 5001
- **Frontend**: React with TypeScript on port 3000
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Styling**: Tailwind CSS v3

### Project Structure
```
/
├── client/               # React frontend application
│   ├── src/components/  # UI components (Login, Timesheet, Dashboards, Reports)
│   └── src/contexts/    # AuthContext for global authentication state
├── server/              # Express backend
│   ├── routes/         # API route handlers
│   └── middleware/     # Authentication and authorization middleware
└── prisma/             # Database schema and migrations
```

### Database Schema
The application uses five main entities:
- **User**: Employees, managers, and admins with hierarchical relationships
- **Project**: Company projects with unique codes
- **ProjectAssignment**: Many-to-many user-project relationships
- **Timesheet**: Weekly containers with approval workflow (DRAFT → SUBMITTED → APPROVED/REJECTED)
- **TimeEntry**: Individual time records linking users, projects, and dates

### Authentication Flow
1. JWT-based authentication with 7-day expiration
2. Tokens stored in HTTP-only cookies (secure in production)
3. Middleware checks both cookies and Authorization headers
4. Role-based authorization: EMPLOYEE < MANAGER < ADMIN

### API Structure
All API routes are prefixed with `/api`:
- `/auth/*` - Authentication endpoints
- `/users/*` - User management (Admin/Manager access)
- `/projects/*` - Project CRUD operations
- `/timesheets/*` - Timesheet submission and approval
- `/time-entries/*` - Individual time entry management
- `/reports/*` - Reporting and analytics (Admin/Manager access)

### Frontend Routing
React Router handles role-based component rendering:
- `/` - Login page
- `/timesheet` - Employee timesheet entry
- `/manager` - Manager approval dashboard
- `/admin` - Admin management dashboard with Users, Projects, and Reports tabs

## Key Implementation Details

### Auto-Save Functionality
The Timesheet component automatically saves entries on input change using debounced API calls to `/api/time-entries`.

### Week Navigation
Timesheets are organized by week (Monday-Sunday). The frontend uses date-fns for date calculations and maintains week state in the Timesheet component.

### Report Export
The Reports component includes CSV export functionality that converts JSON data to CSV format and triggers browser download.

### Environment Configuration
Required `.env` variables:
```
DATABASE_URL="postgresql://[connection_string]"
JWT_SECRET="[secret_key]"
PORT=5001
NODE_ENV=development|production
```

### Test Credentials
After seeding the database:
- Admin: admin@company.com / admin123
- Managers: john.manager@company.com / manager123
- Employees: alice.employee@company.com / employee123

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `server/routes/`
2. Add authentication middleware: `authenticate`
3. Add authorization middleware: `authorize('ROLE1', 'ROLE2')`
4. Update frontend axios calls to use the new endpoint

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update client
4. Update seed scripts if needed

### Adding Frontend Components
1. Create component in `client/src/components/`
2. Use TypeScript interfaces for props and state
3. Follow existing patterns for API integration
4. Use Tailwind CSS classes for styling

## Important Notes

- The server runs on port 5001 (changed from 5000 due to conflict)
- Frontend proxy is configured to forward `/api` requests to backend
- Prisma can start its own PostgreSQL instance with `npx prisma dev`
- All time entries are unique by user + project + date combination
- Managers can only see/approve their direct reports' timesheets