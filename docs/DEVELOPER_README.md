# 🏥 Hospital Management System - Developer Documentation

## 📋 Table of Contents
- [System Overview](#-system-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Frontend Architecture](#-frontend-architecture)
- [Authentication & Authorization](#-authentication--authorization)
- [Business Modules](#-business-modules)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 System Overview

This is a comprehensive **Hospital Management System** designed for **King Abdulaziz Hospital**. The system manages employee requests, approvals, role-based access control, and various hospital administrative workflows.

### Key Features
- ✅ **Multi-approval workflow system** - All managers must approve requests
- ✅ **Role-based access control (RBAC)** - Fine-grained permissions
- ✅ **Request management** - Onboarding, clearance, delegation, certificates, etc.
- ✅ **Commissioner delegation system** - Temporary access delegation
- ✅ **Audit logging** - Complete audit trail for compliance
- ✅ **Multi-language support** - English and Arabic
- ✅ **Real-time notifications** - System-wide notification system
- ✅ **Offline-capable frontend** - Works with intermittent connectivity
- ✅ **Modern security** - JWT authentication, CORS, CSP headers

### System Status
- **Version**: 1.0.0
- **Status**: Production-ready with comprehensive testing
- **Last Updated**: November 2024
- **Database Version**: 2.0 COMPLETE

## 🏗️ Architecture

The system follows a **modern 3-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   HTML Pages    │ │  JavaScript      │ │    CSS       │  │
│  │   (Static)      │ │  (Dynamic)       │ │  (Styling)   │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP/REST API
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   Express.js    │ │   TypeScript     │ │ Middleware   │  │
│  │   (Server)      │ │   (Business)     │ │ (Security)   │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ MySQL Connection Pool
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │     MySQL       │ │   Migrations     │ │    Views     │  │
│  │   (Storage)     │ │   (Schema)       │ │  (Reports)   │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns
- **Repository Pattern** - Data access abstraction
- **Service Layer Pattern** - Business logic separation  
- **Controller Pattern** - Request handling
- **Middleware Pattern** - Cross-cutting concerns
- **Module Pattern** - Feature organization

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (>=18.18.0)
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.2
- **Database**: MySQL 8.0+ with mysql2 driver
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod schema validation
- **Logging**: Pino structured logging
- **File Processing**: XLSX for Excel handling
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Vitest with Supertest

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Architecture**: Vanilla JavaScript with module pattern
- **Styling**: Modern CSS with design system
- **State Management**: Local storage with sync manager
- **HTTP Client**: Custom API client with caching
- **Offline Support**: Service worker ready

### Database
- **Engine**: MySQL 8.0+ (utf8mb4 charset)
- **Features**: Foreign keys, indexes, views, stored procedures
- **Migration Strategy**: Single source of truth SQL file
- **Backup**: Automated backup scripts available

### Development Tools
- **Build**: TypeScript compiler (tsc)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Vitest test runner
- **Process Management**: tsx for development
- **Documentation**: JSDoc comments

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >=18.18.0
- **npm**: >=8.0.0
- **MySQL**: 8.0+ (or MariaDB 10.6+)
- **Git**: Latest version

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-root_server_v
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment**
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   # Connect to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE nora_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   # Run migration
   source Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
   ```

5. **Build and start**
   ```bash
   npm run build
   npm start
   ```

6. **Access the system**
   - Frontend: http://localhost:3037/Frontend/HTML/login.html
   - API Health: http://localhost:3037/api/health
   - System Status: http://localhost:3037/Frontend/HTML/system-status.html

### Default Credentials
```
Admin Account:
Email: admin@dev.local
Password: admin123

Employee Account:
Email: employee@dev.local  
Password: employee123
```

**⚠️ IMPORTANT**: Change default credentials in production!

## 📁 Project Structure

```
project-root_server_v/
├── Backend/                     # Backend application
│   ├── src/                     # TypeScript source code
│   │   ├── modules/            # Business modules (auth, admin, requests)
│   │   ├── core/               # Core services (database, logging)
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API route definitions  
│   │   ├── config/             # Configuration management
│   │   ├── shared/             # Shared utilities
│   │   ├── audit/              # Audit logging system
│   │   └── validation/         # Input validation schemas
│   ├── dist/                   # Compiled JavaScript
│   ├── migrations/             # Database migrations
│   ├── tests/                  # Unit and integration tests
│   ├── scripts/                # Utility scripts
│   └── package.json           # Backend dependencies
├── Frontend/                   # Frontend application
│   ├── HTML/                  # Static HTML pages
│   ├── CSS/                   # Stylesheets and design system
│   ├── jS/                    # JavaScript modules
│   └── docs/                  # Frontend documentation
├── sql/                       # Additional SQL scripts
│   ├── setup/                 # Database setup scripts
│   ├── migrations/            # Schema migrations
│   └── maintenance/           # Maintenance scripts
├── scripts/                   # Project scripts
│   ├── ci/                    # CI/CD scripts
│   ├── dev/                   # Development scripts
│   └── ops/                   # Operations scripts
├── tests/                     # System-level tests
├── tools/                     # Development tools
├── logs/                      # Application logs
├── patches/                   # Code patches
└── package.json              # Root package configuration
```

## 🗄️ Database Schema

The system uses a **unified database schema** with the following key components:

### Core Tables
- **`Departments`** - Hospital departments
- **`Job_Titles`** - Employee job positions  
- **`Employees`** - Employee master data
- **`App_Users`** - System user accounts

### Authentication & Authorization
- **`roles`** - System roles (ADMIN, MANAGER, HR, etc.)
- **`user_roles`** - User-role assignments
- **`permissions`** - Granular permissions
- **`role_permissions`** - Role-permission mappings
- **`role_hierarchy`** - Role inheritance structure

### Request Management
- **`Onboarding_Requests`** - New employee onboarding
- **`Clearance_Requests`** - Employee clearance/termination
- **`Delegation_Requests`** - Authority delegation
- **`Certificate_Requests`** - Certificate requests
- **`Experience_Certificate_Requests`** - Experience certificates
- **`Leave_Requests`** - Leave applications
- **`Exit_Requests`** - Exit interviews
- **`Assignment_Requests`** - Job assignments
- **`Internal_Transfer_Requests`** - Internal transfers

### Approval System
- **`Request_Approvals`** - Multi-approval workflow
- **`Approval_Rules`** - Approval configuration
- **`Commissioner_Tickets`** - Temporary delegation

### Audit & Monitoring
- **`Audit_Events`** - System audit trail
- **`role_access_audit`** - Access logging
- **`notifications`** - System notifications

### Key Features
- **UTF8MB4 encoding** for Arabic language support
- **Foreign key constraints** for data integrity
- **Indexes** for performance optimization
- **Views** for complex queries
- **Triggers** for audit logging

## 📡 API Documentation

### Base URL
```
Development: http://localhost:3037/api
Production: https://your-domain.com/api
```

### Authentication
All API endpoints (except public ones) require JWT authentication:
```http
Authorization: Bearer <jwt-token>
```

### Core Endpoints

#### Authentication
```http
POST /api/auth/login          # User login
POST /api/auth/register       # User registration  
POST /api/auth/refresh        # Token refresh
POST /api/auth/logout         # User logout
```

#### User Management
```http
GET    /api/users             # List users
GET    /api/users/:id         # Get user details
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
GET    /api/profile           # Get current user profile
PUT    /api/profile           # Update current user profile
```

#### Request Management
```http
# Onboarding Requests
GET    /api/onboarding                    # List requests
POST   /api/onboarding                    # Create request
GET    /api/onboarding/:id                # Get request details
PUT    /api/onboarding/:id/status         # Update status

# Clearance Requests  
GET    /api/clearance                     # List requests
POST   /api/clearance                     # Create request
GET    /api/clearance/:id                 # Get request details
PUT    /api/clearance/:id/status          # Update status

# Similar patterns for other request types:
# /api/delegation, /api/certificate, /api/experience-certificate
# /api/leave-request, /api/exit-request, /api/assignment
```

#### Admin Endpoints
```http
GET    /api/admin/users                   # Admin user management
GET    /api/admin/requests/:type          # Admin request overview
PUT    /api/admin/requests/:type/:id/approve   # Approve request
PUT    /api/admin/requests/:type/:id/reject    # Reject request
GET    /api/admin/audit                   # Audit logs
```

#### Multi-Approval System
```http
GET    /api/requests/:type/:id/approvals  # Get approval status
POST   /api/requests/:type/:id/approve    # Submit approval
POST   /api/requests/:type/:id/reject     # Submit rejection
GET    /api/requests/pending              # Get pending approvals
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-11-11T10:00:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2024-11-11T10:00:00Z"
}
```

## 🎨 Frontend Architecture

The frontend uses a **modular JavaScript architecture** with dependency management:

### Loading Strategy
```
Phase 1: Foundation Scripts
├── dependency-guard.js     (Prevents race conditions)
├── error-handler.js        (Unified error management)
├── notification-store.js   (Notification storage)
└── notification-utils.js   (Safe notification helpers)

Phase 2: Core Application  
├── app-init.js            (Path resolution, auth helpers)
├── api-client.js          (Backend communication)
├── role-permissions.js    (Role-based access)
└── form-validation-utils.js (Form validation)

Phase 3: Page-Specific
└── [page-name].js         (Individual page logic)
```

### Key Components

#### API Client (`api-client.js`)
- Handles all HTTP requests to backend
- Automatic token management and refresh
- Request/response interceptors
- Error handling and retry logic

#### Sync Manager (`sync-manager.js`)
- Offline data synchronization
- Queue management for failed requests
- Conflict resolution
- Background sync capabilities

#### Role Permissions (`role-permissions.js`)
- Client-side permission checking
- UI element visibility control
- Route protection
- Feature flag management

### Page Structure
Each HTML page follows this pattern:
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Phase 1: Foundation -->
    <script src="../jS/dependency-guard.js"></script>
    <script src="../jS/error-handler.js"></script>
    
    <!-- Phase 2: Core -->
    <script src="../jS/app-init.js"></script>
    <script src="../jS/api-client.js"></script>
    
    <!-- Phase 3: Page-specific -->
    <script src="../jS/page-specific.js"></script>
</head>
<body>
    <!-- Page content -->
    <script>
        window.waitForDependencies().then(() => {
            // Initialize page
        });
    </script>
</body>
</html>
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Login**: User submits credentials
2. **Verification**: Server validates against database
3. **Token Generation**: JWT tokens (access + refresh) created
4. **Storage**: Tokens stored in localStorage
5. **API Requests**: Access token sent in Authorization header
6. **Token Refresh**: Automatic renewal before expiration

### Authorization Levels
- **ADMIN** - Full system access
- **MANAGER** - Department management + approvals
- **HR** - Human resources operations
- **FINANCE** - Financial approvals
- **IT** - Technical administration
- **EMPLOYEE** - Basic user access

### Permission System
The system uses **granular permissions**:
```typescript
// Example permissions
'user:read', 'user:write', 'user:delete'
'request:create', 'request:approve', 'request:view'
'admin:users', 'admin:reports', 'admin:audit'
'commissioner:issue', 'commissioner:revoke'
```

### Role-Based Access Control (RBAC)
- **Hierarchical roles** with inheritance
- **Permission aggregation** from multiple roles
- **Temporary role assignment** with expiration
- **Role templates** for quick assignment
- **Access audit trail** for compliance

## 🏢 Business Modules

### 1. Onboarding Management
**Purpose**: Handle new employee onboarding requests
- Create onboarding requests with required documents
- Multi-level approval workflow
- Department coordination
- Status tracking and notifications

### 2. Clearance Management  
**Purpose**: Process employee clearance and termination
- Clearance request initiation
- Department sign-off collection
- Asset return tracking
- Final clearance approval

### 3. Delegation Management
**Purpose**: Temporary authority delegation
- Delegation request creation
- Authority scope definition
- Time-bound access control
- Delegation revocation

### 4. Certificate Requests
**Purpose**: Handle various certificate requests
- **Regular certificates** (employment, salary, etc.)
- **Experience certificates** with detailed history
- **Custom certificate types** as needed
- **Digital signature** support

### 5. Leave Management
**Purpose**: Employee leave request processing
- Leave request submission
- Manager approval workflow
- Leave balance tracking
- Calendar integration

### 6. Exit Management
**Purpose**: Employee exit process
- Exit interview scheduling
- Feedback collection
- Knowledge transfer
- Final settlement

### 7. Assignment Management
**Purpose**: Job assignment and transfers
- **Internal transfers** between departments
- **Assignment requests** for projects
- **Assignment termination** processes
- **Approval workflows** for all changes

### 8. Multi-Approval System
**Purpose**: Unified approval workflow engine
- **Configurable approval rules** per request type
- **Parallel and sequential** approval flows  
- **Escalation mechanisms** for delays
- **Approval delegation** capabilities
- **Audit trail** for all decisions

### 9. Commissioner System
**Purpose**: Temporary access delegation
- **Ticket-based delegation** system
- **Time-bound access** control
- **Scope limitation** per delegation
- **Revocation capabilities**
- **Usage monitoring**

### 10. Audit & Compliance
**Purpose**: Complete system audit trail
- **Access logging** for all operations
- **Change tracking** for sensitive data
- **Compliance reporting** capabilities
- **Real-time monitoring** dashboards
- **Alert systems** for violations

## 💻 Development Workflow

### Local Development

1. **Setup Development Environment**
   ```bash
   # Install dependencies
   npm run install-all
   
   # Setup database
   mysql -u root -p < Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
   
   # Start development server
   npm run dev
   ```

2. **Making Changes**
   ```bash
   # Frontend changes - edit files in Frontend/
   # Backend changes - edit TypeScript files in Backend/src/
   
   # Build and test
   npm run build
   npm run test
   
   # Check code quality
   npm run lint
   npm run format
   ```

3. **Database Changes**
   ```bash
   # Edit the main schema file
   vim Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
   
   # Test with fresh database
   mysql -u root -p < Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
   ```

### Code Standards

#### TypeScript/JavaScript
- Use **TypeScript** for all backend code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Write **JSDoc** comments for public APIs
- Prefer **async/await** over promises

#### Database
- Use **snake_case** for table/column names
- Include **created_at/updated_at** timestamps
- Define **foreign key constraints**
- Create **indexes** for performance
- Use **utf8mb4** charset for Arabic support

#### API Design
- Follow **RESTful** conventions
- Use **HTTP status codes** correctly
- Implement **proper error handling**
- Include **request/response validation**
- Document with **OpenAPI/Swagger**

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request

# Bug fixes
git checkout -b fix/bug-description
# Fix the bug
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

## 🧪 Testing

### Test Structure
```
Backend/tests/
├── auth/                 # Authentication tests
├── commissioner/         # Commissioner system tests
├── contract/            # API contract tests
├── health/              # Health check tests
├── rbac/                # Role-based access tests
├── rateLimit/           # Rate limiting tests
├── status/              # Status management tests
└── upload/              # File upload tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:cover

# Run specific test file
npm test -- auth

# Watch mode for development
npm test -- --watch
```

### Test Types

#### Unit Tests
- **Service layer** business logic
- **Utility functions** and helpers
- **Validation schemas** and rules
- **Authentication** mechanisms

#### Integration Tests
- **API endpoint** functionality
- **Database operations** and transactions
- **Multi-module** interactions
- **Approval workflows** end-to-end

#### Contract Tests
- **API response** format validation
- **Error handling** consistency
- **Authentication** requirements
- **Authorization** enforcement

### Testing Best Practices
- Write tests **before** implementing features
- Use **descriptive test names**
- **Mock external dependencies**
- Test **both success and failure** scenarios
- Maintain **high test coverage** (>80%)

## 🚀 Deployment

### Production Checklist

#### Security
- [ ] Change default admin credentials
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS enforcement
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Review database user permissions

#### Environment Configuration
```bash
# Production .env example
NODE_ENV=production
HOST=0.0.0.0
PORT=3037
DEV_EASY=false

DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=hospital_management
DB_USER=app_user
DB_PASSWORD=secure_password

JWT_SECRET=your-super-secure-32-character-secret
CORS_ALLOWED_ORIGINS=https://yourdomain.com
TRUST_PROXY=true
LOG_LEVEL=info
```

#### Database Setup
```sql
-- Create production database
CREATE DATABASE hospital_management 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER 'app_user'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_management.* TO 'app_user'@'%';

-- Run migration
source Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
```

#### Build and Deploy
```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start Backend/dist/server.js --name hospital-app
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY Backend/dist ./Backend/dist
COPY Frontend ./Frontend
EXPOSE 3037
CMD ["node", "Backend/dist/server.js"]
```

### Monitoring
- **Health checks**: `/api/health` and `/api/ready`
- **Logging**: Structured JSON logs via Pino
- **Metrics**: Optional Prometheus metrics
- **Alerts**: Configure for critical failures

## 🔧 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check environment configuration
cat .env

# Verify database connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME

# Check if TypeScript is compiled
npm run build

# Check for port conflicts
lsof -i :3037
```

#### Database Connection Issues
```bash
# Test database connectivity
mysql -h 127.0.0.1 -u nora -p nora_database

# Check database exists
SHOW DATABASES;

# Verify user permissions
SHOW GRANTS FOR 'nora'@'%';

# Run migration if tables missing
source Backend/migrations/COMPLETE_DATABASE_SCHEMA.sql
```

#### Frontend Issues
```javascript
// Check browser console for errors
// Look for dependency loading messages
// Verify API connectivity

// Clear browser storage if needed
localStorage.clear();
sessionStorage.clear();
```

#### Authentication Problems
```bash
# Check JWT secret configuration
echo $JWT_SECRET

# Verify token expiration settings
# Check user roles in database
SELECT u.email, r.role_name 
FROM App_Users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.role_id 
WHERE u.email = 'admin@dev.local';
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Enable request logging
ENABLE_REQUEST_LOGGING=true npm start

# Enable development features
DEV_EASY=true npm start
```

### System Health Checks
- **System Status Page**: http://localhost:3037/Frontend/HTML/system-status.html
- **API Health**: http://localhost:3037/api/health
- **Database Ready**: http://localhost:3037/api/ready
- **Dependency Test**: http://localhost:3037/Frontend/HTML/test-dependencies.html

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm run install-all`
4. Create a feature branch
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Review Process
- All changes require code review
- Tests must pass before merging
- Follow existing code style
- Update documentation as needed
- Include migration scripts for database changes

### Reporting Issues
When reporting bugs, please include:
- System information (OS, Node.js version)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs
- Screenshots if applicable

---

## 📞 Support & Contact

For questions, issues, or contributions:
- **Project Team**: Hospital IT Team
- **License**: MIT
- **Version**: 1.0.0
- **Last Updated**: November 2024

**This system is production-ready and battle-tested. Happy coding! 🚀**
