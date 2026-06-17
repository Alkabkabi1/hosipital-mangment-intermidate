# 🔧 Request Forms - Technical Implementation Guide

## 📚 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Database Schema](#database-schema)
4. [API Implementation](#api-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Approval Workflow Engine](#approval-workflow-engine)
7. [Notification System](#notification-system)
8. [Security & Permissions](#security--permissions)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Mobile     │  │    Tablet    │          │
│  │  (Desktop)   │  │   (iOS/And)  │  │    (iPad)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/REST API
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────────┐
│                      APPLICATION LAYER                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    Express.js Server                    │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│  │  │  Routes  │  │  Controllers│  │ Services │             │     │
│  │  └──────────┘  └──────────┘  └──────────┘             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│  │  │Middleware│  │Validators│  │  Utils   │             │     │
│  │  └──────────┘  └──────────┘  └──────────┘             │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ SQL/Database Queries
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              PostgreSQL Database Server                 │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │  Tables:                                                │     │
│  │  • Onboarding_Requests      • Certificate_Requests     │     │
│  │  • Clearance_Requests       • Request_Approvals        │     │
│  │  • Assignment_Requests      • Request_Comments         │     │
│  │  • Internal_Transfer_Requests • Request_Documents      │     │
│  │  • Delegation_Requests      • Audit_Events             │     │
│  │  • Leave_Requests           • Notification_Queue       │     │
│  │  • Exit_Requests                                        │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Frontend Structure

```
Frontend/
├── HTML/
│   ├── assignment-request.html                    # Assignment form
│   ├── assignment-termination-request.html        # Assignment end form
│   ├── clearance-request.html                     # Clearance form
│   ├── direct-request.html                        # Onboarding form
│   ├── delegation-request.html                    # Delegation form
│   ├── internal-transfer-request.html             # Transfer form
│   ├── employee-leave-request.html                # Leave form
│   ├── employee-exit-request.html                 # Exit form
│   ├── certificate-request.html                   # Salary certificate
│   ├── employee-certificate-request.html          # Experience certificate
│   ├── employee-dashboard.html                    # Employee portal
│   ├── admin-dashboard.html                       # Admin portal
│   └── REQUEST_FORMS_GUIDE.md                     # This guide
│
├── jS/
│   ├── Core Scripts:
│   │   ├── dependency-guard.js                    # Dependency management
│   │   ├── error-handler.js                       # Error handling
│   │   ├── notification-utils.js                  # Notifications
│   │   ├── app-init.js                            # App initialization
│   │   ├── api-client.js                          # API client
│   │   └── role-permissions.js                    # Permissions
│   │
│   └── Form-Specific Scripts:
│       ├── assignment-request-inline.js           # Assignment logic
│       ├── assignment-termination-request-inline.js # Termination logic
│       ├── clearance-request-inline.js            # Clearance logic
│       ├── direct-request-inline.js               # Onboarding logic
│       └── internal-transfer-request-inline.js    # Transfer logic
│
└── CSS/
    ├── design-system.css                          # Design tokens
    ├── base-updated.css                           # Base styles
    └── unified-form-styles.css                    # Form styles
```

### Backend Structure

```
Backend/
├── src/
│   ├── routes/
│   │   ├── requests.routes.ts                     # All request routes
│   │   ├── onboarding.routes.ts                   # Onboarding specific
│   │   ├── clearance.routes.ts                    # Clearance specific
│   │   └── approvals.routes.ts                    # Approval routes
│   │
│   ├── modules/
│   │   ├── requests/
│   │   │   ├── onboarding.service.ts              # Business logic
│   │   │   ├── clearance.service.ts               # Business logic
│   │   │   ├── assignment.service.ts              # Business logic
│   │   │   └── approval.service.ts                # Approval logic
│   │   │
│   │   └── notifications/
│   │       ├── email.service.ts                   # Email notifications
│   │       └── notification.service.ts            # Notification manager
│   │
│   ├── core/
│   │   ├── database.ts                            # DB connection
│   │   ├── auth.middleware.ts                     # Authentication
│   │   └── permissions.middleware.ts              # Authorization
│   │
│   └── config/
│       └── env.ts                                 # Configuration
│
└── migrations/
    └── 000_complete_hospital_schema.sql           # Database schema
```

---

## Database Schema

### Main Request Tables

```sql
-- 1. ONBOARDING REQUESTS
CREATE TABLE Onboarding_Requests (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    second_name VARCHAR(100),
    third_name VARCHAR(100),
    fourth_name VARCHAR(100),
    job_title VARCHAR(150),
    work_id VARCHAR(50),
    reason_for_job VARCHAR(50),
    document_number VARCHAR(100),
    application_date DATE,
    start_date DATE,
    transaction_number VARCHAR(100),
    transaction_date DATE,
    employee_status VARCHAR(50),
    employee_number VARCHAR(50),
    department VARCHAR(150),
    nationality VARCHAR(100),
    gender VARCHAR(20),
    onboarding_reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'قيد الاعتماد',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (created_by) REFERENCES App_Users(email)
);

-- 2. CLEARANCE REQUESTS
CREATE TABLE Clearance_Requests (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    second_name VARCHAR(100),
    third_name VARCHAR(100),
    employee_number VARCHAR(50),
    department VARCHAR(150),
    job_title VARCHAR(150),
    phone VARCHAR(20),
    clearance_type VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    specific_reason VARCHAR(100),
    last_working_day DATE NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    request_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'قيد الاعتماد',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (created_by) REFERENCES App_Users(email)
);

-- 3. ASSIGNMENT REQUESTS
CREATE TABLE Assignment_Requests (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    first_name VARCHAR(100),
    second_name VARCHAR(100),
    third_name VARCHAR(100),
    department VARCHAR(150),
    job_title VARCHAR(150),
    phone VARCHAR(20),
    assignment_type VARCHAR(50) NOT NULL,
    new_role VARCHAR(255) NOT NULL,
    new_department VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE,
    expected_duration VARCHAR(100),
    financial_impact VARCHAR(255),
    assignment_reason TEXT NOT NULL,
    additional_benefits TEXT,
    request_notes TEXT,
    status VARCHAR(50) DEFAULT 'قيد الاعتماد',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (created_by) REFERENCES App_Users(email)
);

-- 4. ASSIGNMENT TERMINATION REQUESTS
CREATE TABLE Assignment_Termination_Requests (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    assignment_role VARCHAR(255) NOT NULL,
    assignment_department VARCHAR(150),
    assignment_start_date DATE,
    termination_date DATE NOT NULL,
    return_date DATE,
    return_to_department VARCHAR(150),
    return_to_position VARCHAR(150),
    termination_reason TEXT NOT NULL,
    assignment_performance TEXT,
    lessons_learned TEXT,
    request_notes TEXT,
    status VARCHAR(50) DEFAULT 'قيد الاعتماد',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (created_by) REFERENCES App_Users(email)
);

-- 5. INTERNAL TRANSFER REQUESTS
CREATE TABLE Internal_Transfer_Requests (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    current_department VARCHAR(150) NOT NULL,
    current_position VARCHAR(150) NOT NULL,
    current_location VARCHAR(255),
    target_department VARCHAR(150) NOT NULL,
    target_position VARCHAR(150) NOT NULL,
    target_location VARCHAR(255),
    transfer_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    return_date DATE,
    transfer_reason TEXT NOT NULL,
    skills_match TEXT,
    training_needed TEXT,
    budget_impact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'قيد الاعتماد',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    FOREIGN KEY (created_by) REFERENCES App_Users(email)
);

-- APPROVAL TRACKING TABLE
CREATE TABLE Request_Approvals (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    request_id INTEGER NOT NULL,
    approver_email VARCHAR(255) NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approval_level INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'pending'
    comments TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approver_email) REFERENCES App_Users(email)
);

-- COMMENTS TABLE
CREATE TABLE Request_Comments (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    request_id INTEGER NOT NULL,
    commenter_email VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commenter_email) REFERENCES App_Users(email)
);

-- DOCUMENTS TABLE
CREATE TABLE Request_Documents (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    request_id INTEGER NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES App_Users(email)
);
```

### Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_onboarding_email ON Onboarding_Requests(employee_email);
CREATE INDEX idx_onboarding_status ON Onboarding_Requests(status);
CREATE INDEX idx_onboarding_created ON Onboarding_Requests(created_at);

CREATE INDEX idx_clearance_email ON Clearance_Requests(employee_email);
CREATE INDEX idx_clearance_status ON Clearance_Requests(status);

CREATE INDEX idx_assignment_email ON Assignment_Requests(employee_email);
CREATE INDEX idx_assignment_status ON Assignment_Requests(status);

CREATE INDEX idx_approvals_request ON Request_Approvals(request_type, request_id);
CREATE INDEX idx_approvals_approver ON Request_Approvals(approver_email);
```

---

## API Implementation

### REST API Endpoints

```typescript
// ===== COMMON ENDPOINTS FOR ALL REQUEST TYPES =====

// GET /api/requests - Get all requests (filtered by role)
// GET /api/requests/:type - Get requests of specific type
// GET /api/requests/:type/:id - Get specific request
// POST /api/requests/:type - Create new request
// PUT /api/requests/:type/:id - Update request
// DELETE /api/requests/:type/:id - Cancel request
// POST /api/requests/:type/:id/approve - Approve request
// POST /api/requests/:type/:id/reject - Reject request
// GET /api/requests/:type/:id/history - Get approval history
// POST /api/requests/:type/:id/comment - Add comment
// GET /api/requests/:type/:id/documents - Get documents
// POST /api/requests/:type/:id/documents - Upload document

// ===== REQUEST TYPE SPECIFIC ENDPOINTS =====

// Onboarding
POST   /api/employee/requests/onboarding
GET    /api/employee/requests/onboarding/:id
PUT    /api/employee/requests/onboarding/:id

// Clearance
POST   /api/employee/requests/clearance
GET    /api/employee/requests/clearance/:id
PUT    /api/employee/requests/clearance/:id

// Assignment
POST   /api/assignment
GET    /api/assignment/:id
PUT    /api/assignment/:id

// Assignment Termination
POST   /api/assignment-termination
GET    /api/assignment-termination/:id

// Internal Transfer
POST   /api/internal-transfer
GET    /api/internal-transfer/:id

// Delegation
POST   /api/employee/requests/delegation
GET    /api/employee/requests/delegation/:id

// Leave
POST   /api/employee/requests/leave
GET    /api/employee/requests/leave/:id

// ===== ADMIN ENDPOINTS =====

// GET /api/admin/requests/all - Get all requests (admin only)
// GET /api/admin/requests/stats - Get statistics
// GET /api/admin/requests/pending - Get all pending requests
// POST /api/admin/requests/:id/reassign - Reassign request
```

### Example API Implementation (TypeScript)

```typescript
// routes/requests.routes.ts
import express from 'express';
import { authenticate, authorize } from '../core/auth.middleware';
import { RequestController } from '../modules/requests/request.controller';

const router = express.Router();
const requestController = new RequestController();

// Create new request
router.post(
  '/requests/:type',
  authenticate,
  requestController.createRequest
);

// Get user's requests
router.get(
  '/requests/:type',
  authenticate,
  requestController.getUserRequests
);

// Get specific request
router.get(
  '/requests/:type/:id',
  authenticate,
  requestController.getRequest
);

// Approve request
router.post(
  '/requests/:type/:id/approve',
  authenticate,
  authorize(['manager', 'hr', 'admin']),
  requestController.approveRequest
);

// Reject request
router.post(
  '/requests/:type/:id/reject',
  authenticate,
  authorize(['manager', 'hr', 'admin']),
  requestController.rejectRequest
);

export default router;
```

```typescript
// modules/requests/request.controller.ts
import { Request, Response } from 'express';
import { RequestService } from './request.service';
import { ApprovalService } from './approval.service';
import { NotificationService } from '../notifications/notification.service';

export class RequestController {
  private requestService = new RequestService();
  private approvalService = new ApprovalService();
  private notificationService = new NotificationService();

  async createRequest(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const data = req.body;
      const user = req.user; // From auth middleware

      // Validate request type
      const validTypes = ['onboarding', 'clearance', 'assignment', 'transfer', 'delegation', 'leave', 'exit'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid request type' });
      }

      // Create request
      const request = await this.requestService.createRequest(type, {
        ...data,
        created_by: user.email,
        status: 'قيد الاعتماد'
      });

      // Initialize approval workflow
      await this.approvalService.initializeWorkflow(type, request.id);

      // Send notifications
      await this.notificationService.notifyNewRequest(type, request);

      res.status(201).json({
        success: true,
        data: request,
        message: 'Request created successfully'
      });
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({ error: 'Failed to create request' });
    }
  }

  async approveRequest(req: Request, res: Response) {
    try {
      const { type, id } = req.params;
      const { comments } = req.body;
      const approver = req.user;

      // Get request
      const request = await this.requestService.getRequest(type, id);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Check if user can approve
      const canApprove = await this.approvalService.canUserApprove(
        type,
        id,
        approver.email,
        approver.role
      );
      if (!canApprove) {
        return res.status(403).json({ error: 'Not authorized to approve this request' });
      }

      // Record approval
      await this.approvalService.recordApproval(type, id, {
        approver_email: approver.email,
        approver_role: approver.role,
        action: 'approved',
        comments
      });

      // Check if workflow is complete
      const isComplete = await this.approvalService.isWorkflowComplete(type, id);
      
      if (isComplete) {
        // Update request status to completed
        await this.requestService.updateRequestStatus(type, id, 'مكتمل');
        
        // Execute post-approval actions
        await this.requestService.executePostApproval(type, request);
        
        // Notify completion
        await this.notificationService.notifyRequestCompleted(type, request);
      } else {
        // Move to next approval level
        await this.approvalService.advanceToNextLevel(type, id);
        
        // Notify next approver
        await this.notificationService.notifyNextApprover(type, request);
      }

      res.json({
        success: true,
        message: 'Request approved successfully',
        isComplete
      });
    } catch (error) {
      console.error('Error approving request:', error);
      res.status(500).json({ error: 'Failed to approve request' });
    }
  }
}
```

---

## Frontend Implementation

### Form Structure (HTML)

```html
<!-- Standard form structure used across all request forms -->
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <link rel="stylesheet" href="../CSS/design-system.css">
    <link rel="stylesheet" href="../CSS/base-updated.css">
    <link rel="stylesheet" href="../CSS/unified-form-styles.css">
    <title>Request Form</title>
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="in">
      <div class="brand">
        <img src="public/image.png" alt="Logo">
        <div>
          <h1>مستشفى الملك عبدالعزيز</h1>
          <small>Form Title</small>
        </div>
      </div>
      <button class="back" data-action="go-back">رجوع</button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container">
    <!-- Employee Data Section -->
    <section class="form-section">
      <h2 class="section-title">بيانات الموظف</h2>
      <div class="form-grid">
        <div class="form-group">
          <label>الاسم الأول <span class="required">*</span></label>
          <input class="input" id="empFirstName" required>
        </div>
        <!-- More fields... -->
      </div>
    </section>

    <!-- Request Details Section -->
    <section class="form-section">
      <h2 class="section-title">تفاصيل الطلب</h2>
      <div class="form-grid single">
        <!-- Request-specific fields -->
      </div>
    </section>

    <!-- Actions -->
    <section class="form-section">
      <div class="actions">
        <button class="btn btn-outline" data-action="cancel-form">إلغاء</button>
        <button class="btn btn-primary" id="btnSubmit" data-action="submit-request">إرسال</button>
      </div>
    </section>
  </main>

  <!-- Phase 1: Foundation scripts -->
  <script src="../jS/dependency-guard.js"></script>
  <script src="../jS/error-handler.js"></script>
  <script src="../jS/notification-store.js"></script>
  <script src="../jS/notification-utils.js"></script>

  <!-- Phase 2: Core application scripts -->
  <script src="../jS/app-init.js"></script>
  <script src="../jS/api-client.js"></script>
  <script src="../jS/role-permissions.js"></script>
  <script src="../jS/form-validation-utils.js"></script>

  <!-- Phase 3: Page-specific scripts -->
  <script src="../jS/request-specific-inline.js"></script>
</body>
</html>
```

### JavaScript Implementation Pattern

```javascript
// Standard pattern used in all *-inline.js files
document.addEventListener('DOMContentLoaded', function() {
  // 1. Auth guard
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  if (!authUser) {
    window.location.href = window.resolveFrontendPath('login.html');
    return;
  }

  // 2. Load and auto-fill profile data
  loadAndFillProfileData(authUser);

  // 3. Setup event handlers
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    switch (btn.dataset.action) {
      case 'submit-request': handleSubmit(); break;
      case 'cancel-form': history.back(); break;
    }
  });

  async function loadAndFillProfileData(authUser) {
    try {
      const profile = await window.apiClient.getProfile();
      
      // Auto-fill fields
      document.getElementById('empEmail').value = profile.email;
      document.getElementById('empFirstName').value = profile.first_name_ar;
      // ... more fields
      
      // Make some fields read-only
      document.getElementById('empEmail').readOnly = true;
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to localStorage data
    }
  }

  async function handleSubmit() {
    // 1. Collect form data
    const formData = {
      empFirstName: document.getElementById('empFirstName')?.value,
      empEmail: document.getElementById('empEmail')?.value,
      // ... more fields
    };

    // 2. Validate
    if (!formData.empFirstName || !formData.empEmail) {
      window.showError('الرجاء تعبئة الحقول المطلوبة');
      return;
    }

    // 3. Prepare payload
    const payload = {
      email: formData.empEmail.trim(),
      firstName: formData.empFirstName.trim(),
      // ... more fields
      requestDate: new Date().toISOString().split('T')[0]
    };

    // 4. Submit to API
    try {
      const response = await window.apiClient.makeRequest('/request-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.success) {
        window.showSuccess(`تم إرسال الطلب بنجاح! الرقم المرجعي: ${response.data.reference_number}`);
        setTimeout(() => {
          window.location.href = window.resolveFrontendPath('employee-dashboard.html');
        }, 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      window.showError('حدث خطأ أثناء الإرسال');
    }
  }
});
```

---

## Approval Workflow Engine

### Workflow Configuration

```typescript
// config/approval-workflows.ts
export const approvalWorkflows = {
  onboarding: [
    { level: 1, role: 'hr', required: true },
    { level: 2, role: 'manager', required: true },
    { level: 3, role: 'admin', required: true }
  ],
  clearance: [
    { level: 1, role: 'manager', required: true },
    { level: 2, role: 'hr', required: true },
    { level: 3, role: 'finance', required: true },
    { level: 4, role: 'it', required: true },
    { level: 5, role: 'admin', required: true }
  ],
  assignment: [
    { level: 1, role: 'current_manager', required: true },
    { level: 2, role: 'target_manager', required: true },
    { level: 3, role: 'hr', required: true },
    { level: 4, role: 'admin', required: true }
  ],
  transfer: [
    { level: 1, role: 'current_manager', required: true },
    { level: 2, role: 'target_manager', required: true },
    { level: 3, role: 'hr', required: true },
    { level: 4, role: 'admin', required: true }
  ],
  delegation: [
    { level: 1, role: 'manager', required: true },
    { level: 2, role: 'delegate', required: true },
    { level: 3, role: 'hr', required: true }
  ],
  leave: [
    { level: 1, role: 'manager', required: true },
    { level: 2, role: 'hr', required: true },
    { level: 3, role: 'department_head', required: true }
  ]
};
```

### Workflow Service Implementation

```typescript
// modules/requests/approval.service.ts
export class ApprovalService {
  async initializeWorkflow(requestType: string, requestId: number) {
    const workflow = approvalWorkflows[requestType];
    if (!workflow) {
      throw new Error('Invalid request type');
    }

    // Create approval records for each level
    for (const step of workflow) {
      await db.query(`
        INSERT INTO Request_Approvals 
        (request_type, request_id, approver_role, approval_level, action)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [requestType, requestId, step.role, step.level]);
    }

    // Notify first level approver
    await this.notifyApprover(requestType, requestId, 1);
  }

  async canUserApprove(
    requestType: string,
    requestId: number,
    userEmail: string,
    userRole: string
  ): Promise<boolean> {
    // Get current approval level
    const currentLevel = await this.getCurrentApprovalLevel(requestType, requestId);
    
    // Get workflow configuration for this level
    const workflow = approvalWorkflows[requestType];
    const currentStep = workflow.find(s => s.level === currentLevel);
    
    if (!currentStep) return false;
    
    // Check if user's role matches required role for this level
    if (currentStep.role === userRole) return true;
    
    // Check if user is admin (admins can approve at any level)
    if (userRole === 'admin') return true;
    
    return false;
  }

  async recordApproval(
    requestType: string,
    requestId: number,
    approvalData: {
      approver_email: string;
      approver_role: string;
      action: string;
      comments?: string;
    }
  ) {
    const currentLevel = await this.getCurrentApprovalLevel(requestType, requestId);
    
    await db.query(`
      UPDATE Request_Approvals
      SET action = $1,
          approver_email = $2,
          comments = $3,
          action_date = CURRENT_TIMESTAMP
      WHERE request_type = $4
        AND request_id = $5
        AND approval_level = $6
    `, [
      approvalData.action,
      approvalData.approver_email,
      approvalData.comments,
      requestType,
      requestId,
      currentLevel
    ]);
  }

  async isWorkflowComplete(requestType: string, requestId: number): Promise<boolean> {
    const result = await db.query(`
      SELECT COUNT(*) as pending_count
      FROM Request_Approvals
      WHERE request_type = $1
        AND request_id = $2
        AND action = 'pending'
    `, [requestType, requestId]);
    
    return result.rows[0].pending_count === 0;
  }

  async advanceToNextLevel(requestType: string, requestId: number) {
    const currentLevel = await this.getCurrentApprovalLevel(requestType, requestId);
    const nextLevel = currentLevel + 1;
    
    // Check if there is a next level
    const workflow = approvalWorkflows[requestType];
    const hasNextLevel = workflow.some(s => s.level === nextLevel);
    
    if (hasNextLevel) {
      await this.notifyApprover(requestType, requestId, nextLevel);
    }
  }

  private async getCurrentApprovalLevel(requestType: string, requestId: number): Promise<number> {
    const result = await db.query(`
      SELECT MIN(approval_level) as current_level
      FROM Request_Approvals
      WHERE request_type = $1
        AND request_id = $2
        AND action = 'pending'
    `, [requestType, requestId]);
    
    return result.rows[0].current_level || 999;
  }
}
```

---

## Notification System

### Email Templates

```typescript
// modules/notifications/email.templates.ts
export const emailTemplates = {
  newRequest: (requestType: string, requestData: any) => ({
    subject: `طلب جديد: ${requestType} - ${requestData.reference_number}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>طلب جديد يحتاج إلى موافقتك</h2>
        <p><strong>نوع الطلب:</strong> ${requestType}</p>
        <p><strong>الرقم المرجعي:</strong> ${requestData.reference_number}</p>
        <p><strong>مقدم الطلب:</strong> ${requestData.employee_name}</p>
        <p><strong>تاريخ التقديم:</strong> ${requestData.created_at}</p>
        <a href="${process.env.BASE_URL}/request/${requestData.id}" 
           style="background: #2B6CB0; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          عرض الطلب
        </a>
      </div>
    `
  }),

  requestApproved: (requestType: string, requestData: any) => ({
    subject: `تمت الموافقة على طلبك - ${requestData.reference_number}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>✅ تمت الموافقة على طلبك</h2>
        <p><strong>نوع الطلب:</strong> ${requestType}</p>
        <p><strong>الرقم المرجعي:</strong> ${requestData.reference_number}</p>
        <p>تم الموافقة على طلبك وسيتم معالجته في أقرب وقت.</p>
        <a href="${process.env.BASE_URL}/my-requests" 
           style="background: #10b981; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          عرض طلباتي
        </a>
      </div>
    `
  }),

  requestRejected: (requestType: string, requestData: any, reason: string) => ({
    subject: `تم رفض طلبك - ${requestData.reference_number}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>❌ تم رفض طلبك</h2>
        <p><strong>نوع الطلب:</strong> ${requestType}</p>
        <p><strong>الرقم المرجعي:</strong> ${requestData.reference_number}</p>
        <p><strong>سبب الرفض:</strong> ${reason}</p>
        <p>يمكنك تقديم طلب جديد أو التواصل مع الموارد البشرية.</p>
      </div>
    `
  })
};
```

### Notification Service

```typescript
// modules/notifications/notification.service.ts
import nodemailer from 'nodemailer';
import { emailTemplates } from './email.templates';

export class NotificationService {
  private transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  async notifyNewRequest(requestType: string, requestData: any) {
    // Get approvers for first level
    const approvers = await this.getApproversForLevel(requestType, requestData.id, 1);
    
    const template = emailTemplates.newRequest(requestType, requestData);
    
    for (const approver of approvers) {
      await this.sendEmail(approver.email, template.subject, template.html);
      await this.createInSystemNotification(approver.email, template.subject);
    }
  }

  async notifyRequestCompleted(requestType: string, requestData: any) {
    const template = emailTemplates.requestApproved(requestType, requestData);
    await this.sendEmail(requestData.employee_email, template.subject, template.html);
    await this.createInSystemNotification(requestData.employee_email, template.subject);
  }

  async notifyRequestRejected(requestType: string, requestData: any, reason: string) {
    const template = emailTemplates.requestRejected(requestType, requestData, reason);
    await this.sendEmail(requestData.employee_email, template.subject, template.html);
    await this.createInSystemNotification(requestData.employee_email, template.subject);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
    }
  }

  private async createInSystemNotification(userEmail: string, message: string) {
    await db.query(`
      INSERT INTO Notification_Queue (user_email, message, is_read)
      VALUES ($1, $2, FALSE)
    `, [userEmail, message]);
  }
}
```

---

## Security & Permissions

### Authentication Middleware

```typescript
// core/auth.middleware.ts
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}
```

### Permission Checks

```typescript
// core/permissions.middleware.ts
export async function canAccessRequest(
  userId: string,
  userRole: string,
  requestType: string,
  requestId: number
): Promise<boolean> {
  // Admins can access everything
  if (userRole === 'admin') return true;
  
  // Get request
  const request = await getRequest(requestType, requestId);
  
  // Employees can access their own requests
  if (request.created_by === userId) return true;
  
  // Managers can access their team's requests
  if (userRole === 'manager') {
    const isTeamMember = await checkIfTeamMember(userId, request.created_by);
    if (isTeamMember) return true;
  }
  
  // HR can access all requests
  if (userRole === 'hr') return true;
  
  return false;
}
```

---

## Testing

### Unit Tests

```typescript
// tests/requests/request.service.test.ts
import { RequestService } from '../../src/modules/requests/request.service';

describe('RequestService', () => {
  let requestService: RequestService;
  
  beforeEach(() => {
    requestService = new RequestService();
  });
  
  describe('createRequest', () => {
    it('should create a new request with reference number', async () => {
      const data = {
        employee_email: 'test@example.com',
        first_name: 'Test',
        status: 'قيد الاعتماد'
      };
      
      const result = await requestService.createRequest('onboarding', data);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('reference_number');
      expect(result.reference_number).toMatch(/^ONB-\d+$/);
    });
  });
  
  describe('getRequest', () => {
    it('should retrieve request by id', async () => {
      // Create test request
      const created = await requestService.createRequest('onboarding', testData);
      
      // Retrieve it
      const retrieved = await requestService.getRequest('onboarding', created.id);
      
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.reference_number).toBe(created.reference_number);
    });
  });
});
```

### Integration Tests

```typescript
// tests/api/requests.api.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Requests API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.token;
  });
  
  describe('POST /api/requests/onboarding', () => {
    it('should create new onboarding request', async () => {
      const response = await request(app)
        .post('/api/requests/onboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employee_email: 'new@example.com',
          first_name: 'New',
          second_name: 'Employee',
          job_title: 'Developer'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reference_number');
    });
    
    it('should reject request without auth token', async () => {
      const response = await request(app)
        .post('/api/requests/onboarding')
        .send({});
      
      expect(response.status).toBe(401);
    });
  });
});
```

---

## Deployment

### Environment Variables

```env
# .env
NODE_ENV=production
PORT=3037

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
SMTP_FROM=noreply@kauh.sa

# Frontend
BASE_URL=https://hospital.example.com
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3037

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3037:3037"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hospital_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Performance Optimization

### Database Optimization

```sql
-- Partitioning for large tables
CREATE TABLE Request_Approvals_2024 PARTITION OF Request_Approvals
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized view for statistics
CREATE MATERIALIZED VIEW request_statistics AS
SELECT 
    request_type,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_processing_days
FROM Onboarding_Requests
GROUP BY request_type, status;

-- Refresh periodically
REFRESH MATERIALIZED VIEW request_statistics;
```

### Caching Strategy

```typescript
// Use Redis for caching
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Cache frequently accessed data
async function getRequestWithCache(type: string, id: number) {
  const cacheKey = `request:${type}:${id}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, fetch from DB
  const request = await db.query(/*...*/);
  
  // Store in cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(request));
  
  return request;
}
```

---

**END OF TECHNICAL GUIDE**

For user documentation, see: `REQUEST_FORMS_GUIDE.md`  
For visual guide, see: `REQUEST_FORMS_VISUAL_GUIDE.md`

