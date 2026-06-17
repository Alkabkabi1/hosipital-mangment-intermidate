# 📋 Complete Guide: Adding New Request Types

**Version**: 1.0.0  
**Last Updated**: November 15, 2025  
**Target Audience**: Developers, System Architects  

---

## 🎯 Overview

This guide provides a **complete, step-by-step blueprint** for adding new request types to the Hospital Request Management System. Follow this guide to ensure new request types integrate seamlessly with the multi-approval workflow, notifications, audit logging, and all stakeholder touchpoints.

---

## 📊 Request Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────┘

1. EMPLOYEE SUBMISSION
   ├─> Employee fills form
   ├─> Frontend validation
   ├─> API call to backend
   └─> Request created in database
        │
        ├─> Status: "submitted"
        ├─> Approval Stage: "Pending Review"
        └─> Multi-approval initialized
             │
             └─> Approval records created for all required approvers
        
2. MULTI-APPROVAL WORKFLOW
   ├─> Manager 1 receives notification
   ├─> Manager 1 reviews and approves
   │    └─> Request status updated
   │
   ├─> Manager 2 receives notification
   ├─> Manager 2 reviews and approves
   │    └─> Request status updated
   │
   └─> All approvals collected
        │
        ├─> If ALL approve: Status = "approved", Final Decision = "approved"
        └─> If ANY reject: Status = "rejected", Final Decision = "rejected"

3. FINAL PROCESSING
   ├─> Employee receives notification
   ├─> Admin processes final steps
   ├─> Status updated to "completed"
   └─> Request archived

4. STAKEHOLDER VISIBILITY
   ├─> Employee Dashboard: View own requests
   ├─> Manager Dashboard: View pending approvals
   ├─> Admin Dashboard: View all requests
   └─> Audit Trail: All actions logged
```

---

## 🏗️ Implementation Checklist

Use this checklist to ensure nothing is missed:

### **Phase 1: Database Schema** ☐
- [ ] 1.1 Create main request table
- [ ] 1.2 Create status history table
- [ ] 1.3 Add foreign keys and constraints
- [ ] 1.4 Create indexes for performance
- [ ] 1.5 Add to approval types configuration

### **Phase 2: Backend API** ☐
- [ ] 2.1 Create module folder structure
- [ ] 2.2 Define TypeScript types/interfaces
- [ ] 2.3 Create Zod validation schemas
- [ ] 2.4 Implement service layer (CRUD + business logic)
- [ ] 2.5 Create controllers
- [ ] 2.6 Define routes (employee + admin + approver)
- [ ] 2.7 Register routes in main router
- [ ] 2.8 Integrate with multi-approval system

### **Phase 3: Frontend (Employee)** ☐
- [ ] 3.1 Create request submission form (HTML)
- [ ] 3.2 Add form validation (JavaScript)
- [ ] 3.3 Add API client methods
- [ ] 3.4 Create request list view
- [ ] 3.5 Create request detail view
- [ ] 3.6 Add to employee dashboard
- [ ] 3.7 Add navigation menu item

### **Phase 4: Frontend (Admin/Manager)** ☐
- [ ] 4.1 Create admin list view
- [ ] 4.2 Create admin detail view with approval actions
- [ ] 4.3 Add to admin dashboard
- [ ] 4.4 Add to manager approval inbox
- [ ] 4.5 Create admin statistics widgets

### **Phase 5: Integration** ☐
- [ ] 5.1 Multi-approval workflow integration
- [ ] 5.2 Notification system integration
- [ ] 5.3 Audit logging integration
- [ ] 5.4 Role permissions configuration
- [ ] 5.5 Status tracking integration

### **Phase 6: Testing & Documentation** ☐
- [ ] 6.1 Unit tests for service layer
- [ ] 6.2 Integration tests for API endpoints
- [ ] 6.3 Frontend testing (manual/automated)
- [ ] 6.4 Update API documentation
- [ ] 6.5 Create user guide
- [ ] 6.6 Stakeholder walkthrough

---

## 📝 Detailed Implementation Steps

---

## **PHASE 1: Database Schema**

### **Step 1.1: Create Main Request Table**

**File**: `Backend/migrations/add_new_request_type.sql`

```sql
-- Example: Training Request
CREATE TABLE IF NOT EXISTS Training_Requests (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Employee Information (Required)
  employee_id INT NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50),
  department VARCHAR(255),
  job_title VARCHAR(255),
  
  -- Request-Specific Fields
  training_title VARCHAR(500) NOT NULL,
  training_type ENUM('internal', 'external', 'online') NOT NULL,
  training_provider VARCHAR(255),
  training_location VARCHAR(500),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_cost DECIMAL(10,2),
  justification TEXT NOT NULL,
  expected_outcomes TEXT,
  
  -- Approval Status Fields (Required for Multi-Approval)
  status VARCHAR(50) DEFAULT 'submitted',
  approval_stage VARCHAR(100) DEFAULT 'Pending Review',
  final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_count INT DEFAULT 0,
  total_approvers INT DEFAULT 0,
  
  -- Admin Fields
  admin_notes TEXT,
  rejection_reason TEXT,
  completion_notes TEXT,
  
  -- Audit Fields (Required)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  -- Foreign Keys
  FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  -- Indexes for Performance
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_approval_stage (approval_stage),
  INDEX idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **Step 1.2: Create Status History Table**

```sql
CREATE TABLE IF NOT EXISTS Training_Request_Status_History (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_notes TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES Training_Requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  INDEX idx_request_id (request_id),
  INDEX idx_changed_at (changed_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **Step 1.3: Add to Approval Configuration**

This is automatically handled by the multi-approval system, but ensure your request type is recognized:

```sql
-- The multi-approval system will automatically handle this
-- Just ensure your table follows the naming convention: {Type}_Requests
```

---

## **PHASE 2: Backend Implementation**

### **Step 2.1: Create Module Structure**

```bash
Backend/src/modules/training/
├── training.routes.ts          # API route definitions
├── training.controller.ts       # Request handlers
├── training.service.ts          # Business logic
├── training.schema.ts           # Validation schemas
└── training.types.ts            # TypeScript interfaces
```

### **Step 2.2: Define TypeScript Types**

**File**: `Backend/src/modules/training/training.types.ts`

```typescript
/**
 * Training Request Types
 */

export interface TrainingRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  department?: string;
  job_title?: string;
  
  // Request fields
  training_title: string;
  training_type: 'internal' | 'external' | 'online';
  training_provider?: string;
  training_location?: string;
  start_date: string;
  end_date: string;
  estimated_cost?: number;
  justification: string;
  expected_outcomes?: string;
  
  // Status fields
  status: string;
  approval_stage: string;
  final_decision: 'pending' | 'approved' | 'rejected';
  approved_count: number;
  total_approvers: number;
  
  // Admin fields
  admin_notes?: string;
  rejection_reason?: string;
  completion_notes?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  submitted_at?: Date;
  approved_at?: Date;
  completed_at?: Date;
}

export interface CreateTrainingInput {
  training_title: string;
  training_type: 'internal' | 'external' | 'online';
  training_provider?: string;
  training_location?: string;
  start_date: string;
  end_date: string;
  estimated_cost?: number;
  justification: string;
  expected_outcomes?: string;
}

export interface UpdateTrainingStatusInput {
  status: string;
  admin_notes?: string;
  rejection_reason?: string;
  completion_notes?: string;
}
```

### **Step 2.3: Create Validation Schemas**

**File**: `Backend/src/modules/training/training.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Training Request Validation Schemas
 */

export const createTrainingSchema = z.object({
  training_title: z.string()
    .min(5, 'عنوان التدريب يجب أن يكون 5 أحرف على الأقل')
    .max(500, 'عنوان التدريب طويل جداً'),
  
  training_type: z.enum(['internal', 'external', 'online'], {
    errorMap: () => ({ message: 'نوع التدريب غير صحيح' })
  }),
  
  training_provider: z.string().optional(),
  training_location: z.string().max(500).optional(),
  
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البدء يجب أن يكون بصيغة YYYY-MM-DD'),
  
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الانتهاء يجب أن يكون بصيغة YYYY-MM-DD'),
  
  estimated_cost: z.number().min(0).optional(),
  
  justification: z.string()
    .min(20, 'المبرر يجب أن يكون 20 حرف على الأقل')
    .max(2000, 'المبرر طويل جداً'),
  
  expected_outcomes: z.string().max(1000).optional()
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء',
    path: ['end_date']
  }
);

export const updateTrainingStatusSchema = z.object({
  status: z.string(),
  admin_notes: z.string().max(1000).optional(),
  rejection_reason: z.string().max(1000).optional(),
  completion_notes: z.string().max(1000).optional()
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingStatusInput = z.infer<typeof updateTrainingStatusSchema>;
```

### **Step 2.4: Implement Service Layer**

**File**: `Backend/src/modules/training/training.service.ts`

```typescript
/**
 * Training Request Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateTrainingInput, UpdateTrainingStatusInput } from './training.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

/**
 * Create a new training request
 */
export async function createTraining(
  userId: number,
  input: CreateTrainingInput
) {
  return withConnection(async (conn) => {
    // Get employee details
    const [users] = await conn.execute<any[]>(
      'SELECT name, employee_number, department, job_title FROM App_Users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    // Create the training request
    const [result] = await conn.execute(
      `INSERT INTO Training_Requests 
       (employee_id, employee_name, employee_number, department, job_title,
        training_title, training_type, training_provider, training_location,
        start_date, end_date, estimated_cost, justification, expected_outcomes,
        status, approval_stage, final_decision, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending', NOW())`,
      [
        userId,
        user.name,
        user.employee_number || null,
        user.department || null,
        user.job_title || null,
        input.training_title,
        input.training_type,
        input.training_provider || null,
        input.training_location || null,
        input.start_date,
        input.end_date,
        input.estimated_cost || null,
        input.justification,
        input.expected_outcomes || null
      ]
    );

    const trainingId = (result as any).insertId;

    // Add status history
    await conn.execute(
      `INSERT INTO Training_Request_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Training request created')`,
      [trainingId, userId]
    );

    // Initialize multi-approval workflow
    try {
      await initializeRequestApprovals('training', trainingId, conn);
      console.log(`✅ Initialized approvals for training request ${trainingId}`);
    } catch (error) {
      console.error('❌ Failed to initialize approvals:', error);
      // Don't fail the request creation, but log the error
    }

    return {
      id: trainingId,
      message: 'تم تقديم طلب التدريب بنجاح'
    };
  });
}

/**
 * Get user's training requests
 */
export async function getUserTrainings(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, training_title, training_type, start_date, end_date,
              status, approval_stage, created_at, submitted_at
       FROM Training_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows;
  });
}

/**
 * Get training request by ID
 */
export async function getTrainingById(trainingId: number, userId?: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<any[]>(
      `SELECT * FROM Training_Requests WHERE id = ?`,
      [trainingId]
    );

    if (rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب التدريب غير موجود',
        code: 'NOT_FOUND'
      });
    }

    // Authorization check if userId provided
    if (userId && rows[0].employee_id !== userId) {
      throw new AppError({
        statusCode: 403,
        message: 'ليس لديك صلاحية لعرض هذا الطلب',
        code: 'FORBIDDEN'
      });
    }

    return rows[0];
  });
}

/**
 * Get all training requests (admin only)
 */
export async function getAllTrainings() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT tr.*, u.email as employee_email
       FROM Training_Requests tr
       LEFT JOIN App_Users u ON tr.employee_id = u.id
       ORDER BY tr.created_at DESC`
    );

    return rows;
  });
}

/**
 * Update training request status (admin only)
 */
export async function updateTrainingStatus(
  trainingId: number,
  input: UpdateTrainingStatusInput,
  adminId: number
) {
  return withConnection(async (conn) => {
    // Get current status
    const [current] = await conn.execute<any[]>(
      'SELECT status FROM Training_Requests WHERE id = ?',
      [trainingId]
    );

    if (current.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب التدريب غير موجود',
        code: 'NOT_FOUND'
      });
    }

    const oldStatus = current[0].status;

    // Update request
    await conn.execute(
      `UPDATE Training_Requests 
       SET status = ?, 
           admin_notes = ?,
           rejection_reason = ?,
           completion_notes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        input.status,
        input.admin_notes || null,
        input.rejection_reason || null,
        input.completion_notes || null,
        trainingId
      ]
    );

    // Add status history
    await conn.execute(
      `INSERT INTO Training_Request_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        trainingId,
        oldStatus,
        input.status,
        adminId,
        input.admin_notes || `Status changed to ${input.status}`
      ]
    );

    return {
      message: 'تم تحديث حالة الطلب بنجاح'
    };
  });
}
```

### **Step 2.5: Create Controllers**

**File**: `Backend/src/modules/training/training.controller.ts`

```typescript
/**
 * Training Request Controllers
 */

import type { RequestHandler } from 'express';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';
import * as trainingService from './training.service';
import type { CreateTrainingInput, UpdateTrainingStatusInput } from './training.schema';

/**
 * Create training request
 * POST /api/training
 */
export const createTrainingController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const input = req.body as CreateTrainingInput;
    const result = await trainingService.createTraining(userId, input);
    
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's training requests
 * GET /api/employee/trainings
 */
export const getMyTrainingsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const trainings = await trainingService.getUserTrainings(userId);
    sendSuccess(res, trainings);
  } catch (error) {
    next(error);
  }
};

/**
 * Get training request by ID
 * GET /api/training/:id
 */
export const getTrainingByIdController: RequestHandler = async (req, res, next) => {
  try {
    const trainingId = parseInt(req.params.id);
    const userId = req.auth?.sub;

    const training = await trainingService.getTrainingById(trainingId, userId);
    sendSuccess(res, training);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all training requests (admin only)
 * GET /api/training/all
 */
export const getAllTrainingsController: RequestHandler = async (req, res, next) => {
  try {
    const trainings = await trainingService.getAllTrainings();
    sendSuccess(res, trainings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update training status (admin only)
 * PUT /api/training/:id/status
 */
export const updateTrainingStatusController: RequestHandler = async (req, res, next) => {
  try {
    const trainingId = parseInt(req.params.id);
    const adminId = req.auth?.sub;
    
    if (!adminId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const input = req.body as UpdateTrainingStatusInput;
    const result = await trainingService.updateTrainingStatus(trainingId, input, adminId);
    
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
```

### **Step 2.6: Define Routes**

**File**: `Backend/src/modules/training/training.routes.ts`

```typescript
/**
 * Training Request Routes
 */

import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { validateBody } from '../../validation/validate';
import { createTrainingSchema, updateTrainingStatusSchema } from './training.schema';
import * as controller from './training.controller';

export const trainingRouter = Router();

// Employee routes
trainingRouter.post(
  '/',
  authenticate,
  validateBody(createTrainingSchema),
  controller.createTrainingController
);

trainingRouter.get(
  '/:id',
  authenticate,
  controller.getTrainingByIdController
);

// Admin routes
trainingRouter.get(
  '/all',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  controller.getAllTrainingsController
);

trainingRouter.put(
  '/:id/status',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  validateBody(updateTrainingStatusSchema),
  controller.updateTrainingStatusController
);

// Employee-specific router for /employee/trainings
export const employeeTrainingRouter = Router();
employeeTrainingRouter.get(
  '/',
  authenticate,
  controller.getMyTrainingsController
);
```

### **Step 2.7: Register Routes**

**File**: `Backend/src/routes/index.ts`

```typescript
// Add import
import { trainingRouter } from '../modules/training/training.routes';

// Register route
apiRouter.use('/training', trainingRouter);
```

**File**: `Backend/src/modules/employee-requests/employee-requests.routes.ts`

```typescript
// Add import
import { employeeTrainingRouter } from '../training/training.routes';

// Mount employee route
employeeRequestsRouter.use('/employee/trainings', employeeTrainingRouter);
```

### **Step 2.8: Update Multi-Approval Configuration**

**File**: `Backend/src/modules/multi-approval/multi-approval.controller.ts`

Add to `getApprovalTypes` function:

```typescript
{
  type: 'training',
  name: 'Training Requests',
  name_ar: 'طلبات التدريب',
  description: 'Employee training requests',
  table: 'Training_Requests',
  approval_levels: 2
}
```

---

## **PHASE 3: Frontend (Employee)**

### **Step 3.1: Create Submission Form**

**File**: `Frontend/HTML/employee-training-request.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب تدريب - نظام إدارة الموارد البشرية</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="../CSS/styles.css">
    <link rel="stylesheet" href="../CSS/form-styles.css">
    
    <!-- Phase 1: Foundation -->
    <script src="../jS/dependency-guard.js"></script>
    <script src="../jS/error-handler.js"></script>
    <script src="../jS/notification-store.js"></script>
    <script src="../jS/notification-utils.js"></script>
    
    <!-- Phase 2: Core -->
    <script src="../jS/app-init.js"></script>
    <script src="../jS/api-client.js"></script>
    <script src="../jS/form-validation-utils.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 طلب تدريب</h1>
            <p>تقديم طلب للحصول على تدريب</p>
        </header>

        <form id="trainingForm" class="request-form">
            <!-- Training Title -->
            <div class="form-group">
                <label for="training_title">عنوان التدريب *</label>
                <input 
                    type="text" 
                    id="training_title" 
                    name="training_title" 
                    required
                    minlength="5"
                    maxlength="500"
                    placeholder="مثال: برنامج القيادة الإدارية المتقدمة">
                <small class="form-help">أدخل اسم البرنامج التدريبي</small>
            </div>

            <!-- Training Type -->
            <div class="form-group">
                <label for="training_type">نوع التدريب *</label>
                <select id="training_type" name="training_type" required>
                    <option value="">-- اختر النوع --</option>
                    <option value="internal">تدريب داخلي</option>
                    <option value="external">تدريب خارجي</option>
                    <option value="online">تدريب إلكتروني</option>
                </select>
            </div>

            <!-- Training Provider -->
            <div class="form-group">
                <label for="training_provider">جهة التدريب</label>
                <input 
                    type="text" 
                    id="training_provider" 
                    name="training_provider"
                    placeholder="مثال: المعهد الوطني للتدريب">
            </div>

            <!-- Training Location -->
            <div class="form-group">
                <label for="training_location">مكان التدريب</label>
                <input 
                    type="text" 
                    id="training_location" 
                    name="training_location"
                    placeholder="مثال: الرياض - فندق الريتز كارلتون">
            </div>

            <!-- Date Range -->
            <div class="form-row">
                <div class="form-group">
                    <label for="start_date">تاريخ البدء *</label>
                    <input 
                        type="date" 
                        id="start_date" 
                        name="start_date" 
                        required>
                </div>
                
                <div class="form-group">
                    <label for="end_date">تاريخ الانتهاء *</label>
                    <input 
                        type="date" 
                        id="end_date" 
                        name="end_date" 
                        required>
                </div>
            </div>

            <!-- Estimated Cost -->
            <div class="form-group">
                <label for="estimated_cost">التكلفة التقديرية (ريال سعودي)</label>
                <input 
                    type="number" 
                    id="estimated_cost" 
                    name="estimated_cost"
                    min="0"
                    step="0.01"
                    placeholder="0.00">
            </div>

            <!-- Justification -->
            <div class="form-group">
                <label for="justification">مبرر الطلب *</label>
                <textarea 
                    id="justification" 
                    name="justification" 
                    required
                    minlength="20"
                    maxlength="2000"
                    rows="5"
                    placeholder="اشرح أهمية هذا التدريب وكيف سيساهم في تطوير مهاراتك وأداء عملك..."></textarea>
                <small class="form-help">الحد الأدنى 20 حرف</small>
            </div>

            <!-- Expected Outcomes -->
            <div class="form-group">
                <label for="expected_outcomes">النتائج المتوقعة</label>
                <textarea 
                    id="expected_outcomes" 
                    name="expected_outcomes"
                    maxlength="1000"
                    rows="4"
                    placeholder="ما هي المهارات أو المعارف التي ستكتسبها من هذا التدريب؟"></textarea>
            </div>

            <!-- Submit Buttons -->
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <span class="btn-icon">📤</span>
                    تقديم الطلب
                </button>
                <button type="button" class="btn btn-secondary" onclick="history.back()">
                    <span class="btn-icon">↩️</span>
                    إلغاء
                </button>
            </div>
        </form>
    </div>

    <!-- JavaScript -->
    <script>
        window.waitForDependencies(async () => {
            // Check authentication
            if (!window.DetailUtils || !window.DetailUtils.requireAuth()) {
                return;
            }

            const form = document.getElementById('trainingForm');
            
            // Set minimum dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('start_date').min = today;
            document.getElementById('end_date').min = today;

            // Date validation
            document.getElementById('start_date').addEventListener('change', function() {
                document.getElementById('end_date').min = this.value;
            });

            // Form submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                try {
                    const formData = new FormData(form);
                    const data = {
                        training_title: formData.get('training_title'),
                        training_type: formData.get('training_type'),
                        training_provider: formData.get('training_provider') || undefined,
                        training_location: formData.get('training_location') || undefined,
                        start_date: formData.get('start_date'),
                        end_date: formData.get('end_date'),
                        estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost')) : undefined,
                        justification: formData.get('justification'),
                        expected_outcomes: formData.get('expected_outcomes') || undefined
                    };

                    // Disable submit button
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'جاري الإرسال...';

                    // Submit request
                    const response = await window.apiClient.makeRequest('/training', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });

                    // Success
                    if (window.NotificationUtils) {
                        window.NotificationUtils.showSuccess('تم تقديم طلب التدريب بنجاح');
                    } else {
                        alert('تم تقديم طلب التدريب بنجاح');
                    }

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = window.resolveFrontendPath ? 
                            window.resolveFrontendPath('employee-dashboard.html') : 
                            'employee-dashboard.html';
                    }, 1500);

                } catch (error) {
                    console.error('Error submitting training request:', error);
                    
                    if (window.NotificationUtils) {
                        window.NotificationUtils.showError(error.message || 'حدث خطأ في تقديم الطلب');
                    } else {
                        alert('حدث خطأ: ' + (error.message || 'حدث خطأ في تقديم الطلب'));
                    }

                    // Re-enable submit button
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="btn-icon">📤</span> تقديم الطلب';
                }
            });

            console.log('✅ Training request form initialized');
        }, ['apiClient', 'DetailUtils', 'NotificationUtils']);
    </script>
</body>
</html>
```

### **Step 3.2: Add API Client Methods**

**File**: `Frontend/jS/api-client.js`

Add to the `APIClient` class:

```javascript
// Training requests
async getMyTrainings() {
  try {
    const response = await this.makeRequest('/employee/trainings');
    return response.data || response || [];
  } catch (error) {
    console.error('Failed to fetch training requests:', error);
    return [];
  }
}

async createTraining(data) {
  return await this.makeRequest('/training', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async getTrainingById(id) {
  return await this.makeRequest(`/training/${id}`);
}
```

### **Step 3.3: Add to Employee Dashboard**

**File**: `Frontend/HTML/employee-dashboard.html`

Add training card to the dashboard:

```html
<!-- Training Requests Card -->
<div class="stat-card">
    <div class="stat-icon">📚</div>
    <div class="stat-content">
        <div class="stat-label">طلبات التدريب</div>
        <div class="stat-value" id="trainingCount">-</div>
    </div>
    <a href="employee-training-request.html" class="stat-action">طلب جديد →</a>
</div>
```

Add to data loading:

```javascript
// Load training requests
const trainings = await apiClient.getMyTrainings();
document.getElementById('trainingCount').textContent = trainings.length;
```

---

## **PHASE 4: Frontend (Admin/Manager)**

### **Step 4.1: Create Admin List View**

**File**: `Frontend/HTML/admin-training-list.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة طلبات التدريب</title>
    <!-- Include standard CSS and JS -->
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 إدارة طلبات التدريب</h1>
        </header>

        <!-- Filters -->
        <div class="filters">
            <select id="statusFilter">
                <option value="">جميع الحالات</option>
                <option value="submitted">مقدم</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
                <option value="completed">مكتمل</option>
            </select>
            
            <input type="search" id="searchInput" placeholder="بحث...">
        </div>

        <!-- Training List -->
        <div id="trainingList" class="request-list">
            <!-- Populated by JavaScript -->
        </div>
    </div>

    <script>
        window.waitForDependencies(async () => {
            // Load trainings
            const response = await window.apiClient.makeRequest('/training/all');
            const trainings = response.data || response || [];
            
            // Render list
            const container = document.getElementById('trainingList');
            container.innerHTML = trainings.map(training => `
                <div class="request-card">
                    <div class="request-header">
                        <h3>${training.training_title}</h3>
                        <span class="badge ${training.status}">${training.status}</span>
                    </div>
                    <div class="request-body">
                        <p><strong>الموظف:</strong> ${training.employee_name}</p>
                        <p><strong>النوع:</strong> ${training.training_type}</p>
                        <p><strong>التاريخ:</strong> ${training.start_date} - ${training.end_date}</p>
                    </div>
                    <div class="request-actions">
                        <a href="admin-training-detail.html?id=${training.id}" class="btn btn-sm">عرض التفاصيل</a>
                    </div>
                </div>
            `).join('');
        }, ['apiClient']);
    </script>
</body>
</html>
```

### **Step 4.2: Add to Admin Dashboard**

Add training statistics widget:

```html
<div class="widget">
    <h3>📚 طلبات التدريب</h3>
    <div class="stats">
        <div class="stat">
            <span class="value" id="trainingPending">-</span>
            <span class="label">قيد الانتظار</span>
        </div>
        <div class="stat">
            <span class="value" id="trainingApproved">-</span>
            <span class="label">موافق عليه</span>
        </div>
    </div>
    <a href="admin-training-list.html" class="widget-link">عرض الكل →</a>
</div>
```

---

## **PHASE 5: Integration**

### **Step 5.1: Multi-Approval Integration**

The multi-approval system will automatically:
- ✅ Create approval records for all managers
- ✅ Track approval progress
- ✅ Update request status when all approve
- ✅ Handle rejection workflow

**Required**: Ensure your table follows the naming convention:
- Table: `{Type}_Requests` (e.g., `Training_Requests`)
- Columns: `status`, `approval_stage`, `final_decision`, `approved_count`, `total_approvers`

### **Step 5.2: Notification Integration**

Notifications are automatically sent when:
- Request is created
- Manager approves/rejects
- Request is completed

**Optional**: Add custom notifications in your service:

```typescript
// In training.service.ts
await conn.execute(
  `INSERT INTO Notifications (user_id, title_ar, message_ar, type, reference_id, created_at)
   VALUES (?, ?, ?, ?, ?, NOW())`,
  [
    userId,
    'تم تقديم طلب التدريب',
    `تم تقديم طلبك للتدريب "${input.training_title}" بنجاح`,
    'training_submitted',
    trainingId
  ]
);
```

### **Step 5.3: Audit Logging**

Audit logging is automatic via:
- Status history table (you created this)
- Request_Approvals table (multi-approval system)

**Optional**: Add custom audit events:

```typescript
await conn.execute(
  `INSERT INTO Audit_Events (event_type, user_id, resource_type, resource_id, event_data, created_at)
   VALUES (?, ?, ?, ?, ?, NOW())`,
  [
    'training_created',
    userId,
    'training',
    trainingId,
    JSON.stringify({ training_title: input.training_title })
  ]
);
```

### **Step 5.4: Role Permissions**

Add permissions to `roles` and `role_permissions` tables:

```sql
-- Add permissions
INSERT INTO permissions (permission_name, description, category) VALUES
('training:create', 'Create training requests', 'training'),
('training:view', 'View training requests', 'training'),
('training:approve', 'Approve training requests', 'training'),
('training:admin', 'Full training management access', 'training');

-- Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.role_name = 'EMPLOYEE' AND p.permission_name = 'training:create';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.role_name = 'MANAGER' AND p.permission_name IN ('training:view', 'training:approve');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.role_name = 'ADMIN' AND p.permission_name = 'training:admin';
```

---

## **PHASE 6: Testing**

### **Step 6.1: Unit Tests**

**File**: `Backend/tests/training/training.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import * as trainingService from '../../src/modules/training/training.service';

describe('Training Service', () => {
  it('should create training request', async () => {
    const input = {
      training_title: 'Leadership Training',
      training_type: 'external',
      start_date: '2025-12-01',
      end_date: '2025-12-05',
      justification: 'Important for career development'
    };

    const result = await trainingService.createTraining(1, input);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('message');
  });

  it('should get user trainings', async () => {
    const trainings = await trainingService.getUserTrainings(1);
    expect(Array.isArray(trainings)).toBe(true);
  });
});
```

### **Step 6.2: Integration Tests**

**File**: `Backend/tests/training/training.routes.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Training API Endpoints', () => {
  let authToken: string;

  before(async () => {
    // Get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@dev.local', password: 'employee123' });
    authToken = loginRes.body.token;
  });

  it('POST /api/training - should create training request', async () => {
    const res = await request(app)
      .post('/api/training')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        training_title: 'Test Training',
        training_type: 'online',
        start_date: '2025-12-01',
        end_date: '2025-12-05',
        justification: 'Test justification text here'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/employee/trainings - should get user trainings', async () => {
    const res = await request(app)
      .get('/api/employee/trainings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

### **Step 6.3: Manual Testing Checklist**

- [ ] Employee can submit training request
- [ ] Form validation works correctly
- [ ] Request appears in employee dashboard
- [ ] Request appears in admin dashboard
- [ ] Manager receives approval notification
- [ ] Manager can approve request
- [ ] Employee receives approval notification
- [ ] Request status updates correctly
- [ ] Approval progress tracks correctly
- [ ] Rejection workflow works
- [ ] All audit logs are created
- [ ] Role permissions are enforced

---

## 🎯 Stakeholder Perspective

### **From Employee View**:
1. ✅ Can easily submit training requests via intuitive form
2. ✅ Sees request status on dashboard
3. ✅ Receives notifications on approval/rejection
4. ✅ Can view request history and details

### **From Manager View**:
1. ✅ Receives notification when request needs approval
2. ✅ Can view request details and justification
3. ✅ Can approve/reject with notes
4. ✅ Sees approval progress (e.g., "1 of 2 approvals")
5. ✅ Can track pending approvals in inbox

### **From Admin View**:
1. ✅ Can view all training requests system-wide
2. ✅ Can filter by status, employee, date
3. ✅ Can see approval workflow progress
4. ✅ Can generate reports and statistics
5. ✅ Can manually update status if needed
6. ✅ Has full audit trail access

### **From System View**:
1. ✅ All actions are logged for audit
2. ✅ Multi-approval workflow is automated
3. ✅ Notifications are sent automatically
4. ✅ Status is updated in real-time
5. ✅ Data integrity is maintained

---

## 📋 Final Checklist

Before considering the request type "production-ready", verify:

### **Database**:
- [ ] Main request table created with all required fields
- [ ] Status history table created
- [ ] Foreign keys and indexes defined
- [ ] Triggers for audit logging (if needed)

### **Backend**:
- [ ] TypeScript types defined
- [ ] Validation schemas created
- [ ] Service layer implemented (CRUD + business logic)
- [ ] Controllers created for all endpoints
- [ ] Routes defined and registered
- [ ] Multi-approval integration complete
- [ ] Permission checks in place
- [ ] Error handling comprehensive

### **Frontend**:
- [ ] Employee submission form created
- [ ] Form validation implemented
- [ ] Employee list/detail views created
- [ ] Admin list/detail views created
- [ ] Dashboard widgets added
- [ ] API client methods added
- [ ] Navigation menu updated

### **Integration**:
- [ ] Multi-approval system integrated
- [ ] Notifications configured
- [ ] Audit logging working
- [ ] Role permissions assigned
- [ ] Status workflow complete

### **Testing**:
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Edge cases handled
- [ ] Error scenarios tested

### **Documentation**:
- [ ] API endpoints documented
- [ ] User guide created
- [ ] Admin guide created
- [ ] Code commented
- [ ] README updated

---

## 🎓 Common Patterns & Best Practices

### **1. Always Use Status History**
Track every status change for audit compliance:

```typescript
await conn.execute(
  `INSERT INTO {Type}_Request_Status_History 
   (request_id, old_status, new_status, changed_by, change_notes)
   VALUES (?, ?, ?, ?, ?)`,
  [requestId, oldStatus, newStatus, userId, notes]
);
```

### **2. Initialize Multi-Approval Immediately**
After creating request, initialize approvals:

```typescript
await initializeRequestApprovals('training', trainingId, conn);
```

### **3. Use Consistent Naming**
- Table: `{Type}_Requests` (Pascal_Case)
- Routes: `/api/{type}` (lowercase)
- Controller: `{Type}Controller` (PascalCase)
- Service: `{type}Service` (camelCase)

### **4. Return Meaningful Messages**
Always return Arabic messages for user feedback:

```typescript
return {
  message: 'تم تقديم طلب التدريب بنجاح',
  id: requestId
};
```

### **5. Handle Errors Gracefully**
Use AppError for consistent error handling:

```typescript
throw new AppError({
  statusCode: 404,
  message: 'الطلب غير موجود',
  code: 'NOT_FOUND'
});
```

---

## 🚀 Quick Start Template

Use this as a starting point for any new request type:

```bash
# 1. Copy template
cp -r Backend/src/modules/training Backend/src/modules/YOUR_TYPE

# 2. Find and replace "training" with "YOUR_TYPE" in all files

# 3. Update schema fields in:
#    - YOUR_TYPE.types.ts
#    - YOUR_TYPE.schema.ts
#    - YOUR_TYPE.service.ts

# 4. Create database tables
mysql -u root -p < Backend/migrations/add_YOUR_TYPE.sql

# 5. Register routes
# Edit Backend/src/routes/index.ts

# 6. Create frontend forms
cp Frontend/HTML/employee-training-request.html Frontend/HTML/employee-YOUR_TYPE-request.html

# 7. Test everything!
npm test
```

---

## 📞 Support & Questions

If you encounter issues while implementing a new request type:

1. **Check this guide** for the complete flow
2. **Review existing implementations** (clearance, onboarding, training)
3. **Check the multi-approval system** documentation
4. **Test incrementally** - don't wait until everything is done
5. **Ask the team** if stuck

---

## 🎉 Success Criteria

Your new request type is ready when:

✅ **Employee** can submit, view status, and receive notifications  
✅ **Manager** can review, approve/reject, and track progress  
✅ **Admin** can view all requests and generate reports  
✅ **System** logs all actions and enforces permissions  
✅ **Tests** pass and cover all scenarios  
✅ **Stakeholders** are satisfied with the workflow  

---

**Document Version**: 1.0.0  
**Last Updated**: November 15, 2025  
**Status**: Production Ready

🏥 **Hospital Request Management System - Complete Implementation Guide**

