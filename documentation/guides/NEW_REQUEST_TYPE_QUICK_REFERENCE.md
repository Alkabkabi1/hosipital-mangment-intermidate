# 🚀 Quick Reference: Adding New Request Types

**5-Minute Overview** | For experienced developers

---

## 📋 Checklist

```
DATABASE
☐ Create {Type}_Requests table
☐ Create {Type}_Request_Status_History table
☐ Add foreign keys + indexes

BACKEND
☐ Create module folder: Backend/src/modules/{type}/
☐ Define types ({type}.types.ts)
☐ Create schemas ({type}.schema.ts)
☐ Implement service ({type}.service.ts)
☐ Create controllers ({type}.controller.ts)
☐ Define routes ({type}.routes.ts)
☐ Register in Backend/src/routes/index.ts
☐ Add to multi-approval config

FRONTEND
☐ Create submission form (employee-{type}-request.html)
☐ Add API client methods (Frontend/jS/api-client.js)
☐ Add to employee dashboard
☐ Create admin views (admin-{type}-list.html)
☐ Add to admin dashboard

INTEGRATION
☐ Call initializeRequestApprovals() after creation
☐ Add notifications
☐ Configure permissions

TESTING
☐ Unit tests
☐ Integration tests
☐ Manual walkthrough
```

---

## 🏗️ Required Database Columns

**Minimum required in {Type}_Requests table:**

```sql
-- Identity
id INT PRIMARY KEY AUTO_INCREMENT
employee_id INT NOT NULL
employee_name VARCHAR(255) NOT NULL

-- Your custom fields here
-- ...

-- Approval fields (REQUIRED for multi-approval)
status VARCHAR(50) DEFAULT 'submitted'
approval_stage VARCHAR(100) DEFAULT 'Pending Review'
final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
approved_count INT DEFAULT 0
total_approvers INT DEFAULT 0

-- Audit fields (REQUIRED)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- Foreign key
FOREIGN KEY (employee_id) REFERENCES App_Users(id)
```

---

## 🔄 Request Flow

```
1. Employee submits form
   └─> POST /api/{type} → Create request
       └─> initializeRequestApprovals('type', id)

2. Multi-approval workflow (automatic)
   └─> Managers receive notifications
       └─> Each manager approves/rejects
           └─> Status updates automatically

3. Final result
   └─> Employee receives notification
       └─> Request marked complete/rejected
```

---

## 📝 Code Templates

### **Service Layer (Minimum)**

```typescript
// Create
export async function create{Type}(userId: number, input: Create{Type}Input) {
  return withConnection(async (conn) => {
    // 1. Insert into {Type}_Requests
    const [result] = await conn.execute(`INSERT INTO {Type}_Requests ...`);
    const id = (result as any).insertId;
    
    // 2. Add status history
    await conn.execute(`INSERT INTO {Type}_Request_Status_History ...`);
    
    // 3. Initialize multi-approval
    await initializeRequestApprovals('{type}', id, conn);
    
    return { id, message: 'تم تقديم الطلب بنجاح' };
  });
}

// Get user's requests
export async function getUser{Type}s(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, ..., status, created_at 
       FROM {Type}_Requests 
       WHERE employee_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}
```

### **Routes (Minimum)**

```typescript
import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './{type}.controller';

export const {type}Router = Router();

// Employee: Create + View
{type}Router.post('/', authenticate, controller.create);
{type}Router.get('/:id', authenticate, controller.getById);

// Admin: View all + Update status
{type}Router.get('/all', authenticate, requireRoles(['ADMIN', 'MANAGER']), controller.getAll);
{type}Router.put('/:id/status', authenticate, requireRoles(['ADMIN', 'MANAGER']), controller.updateStatus);

// Employee route for dashboard
export const employee{Type}Router = Router();
employee{Type}Router.get('/', authenticate, controller.getMy{Type}s);
```

### **Frontend Form (Minimum)**

```html
<form id="{type}Form">
  <!-- Your fields here -->
  
  <button type="submit">تقديم الطلب</button>
</form>

<script>
window.waitForDependencies(async () => {
  const form = document.getElementById('{type}Form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { /* collect form data */ };
    
    await window.apiClient.makeRequest('/api/{type}', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    window.NotificationUtils.showSuccess('تم تقديم الطلب');
    window.location.href = 'employee-dashboard.html';
  });
}, ['apiClient', 'NotificationUtils']);
</script>
```

---

## 🎯 Multi-Approval Integration

**One line of code** (in your service after creating request):

```typescript
await initializeRequestApprovals('your_type', requestId, conn);
```

This automatically:
- ✅ Creates approval records for all managers
- ✅ Tracks approval progress
- ✅ Updates approved_count and total_approvers
- ✅ Sets final_decision when complete
- ✅ Sends notifications

**Requirements**:
- Table name: `{Type}_Requests`
- Required columns: `status`, `approval_stage`, `final_decision`, `approved_count`, `total_approvers`

---

## 🔐 Permissions

Add to database:

```sql
INSERT INTO permissions (permission_name, description, category) VALUES
('{type}:create', 'Create {type} requests', '{type}'),
('{type}:view', 'View {type} requests', '{type}'),
('{type}:approve', 'Approve {type} requests', '{type}'),
('{type}:admin', 'Manage all {type}', '{type}');

-- Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'EMPLOYEE' AND p.permission_name = '{type}:create';
```

---

## 📍 File Locations

```
Backend/src/modules/{type}/
  ├── {type}.routes.ts
  ├── {type}.controller.ts
  ├── {type}.service.ts
  ├── {type}.schema.ts
  └── {type}.types.ts

Backend/migrations/
  └── add_{type}_request.sql

Frontend/HTML/
  ├── employee-{type}-request.html     (submission form)
  ├── employee-{type}-list.html        (view own)
  └── admin-{type}-list.html           (view all)

Frontend/jS/
  └── api-client.js                     (add methods)
```

---

## ⚡ Copy-Paste Starter

```bash
# 1. Copy template from training module
cp -r Backend/src/modules/training Backend/src/modules/YOUR_TYPE

# 2. Find/replace in all files:
#    training → YOUR_TYPE
#    Training → YourType
#    TRAINING → YOUR_TYPE

# 3. Update field definitions in:
#    - YOUR_TYPE.types.ts (interface)
#    - YOUR_TYPE.schema.ts (validation)
#    - YOUR_TYPE.service.ts (SQL)

# 4. Create database tables
# 5. Register routes
# 6. Create frontend
# 7. Test!
```

---

## ✅ Done Criteria

Your request type is complete when:

1. ✅ Employee can submit → sees in dashboard → receives notifications
2. ✅ Manager can approve → sees progress → notified on decision
3. ✅ Admin can view all → filter/search → update status
4. ✅ Multi-approval workflow works automatically
5. ✅ All actions are audit logged
6. ✅ Tests pass

---

## 🐛 Common Mistakes

| Issue | Solution |
|-------|----------|
| 404 route not found | Check route registration in `routes/index.ts` |
| Multi-approval not working | Ensure table name is `{Type}_Requests` |
| Approval counts not updating | Check required columns exist |
| SQL errors | Verify column names match |
| Frontend form not submitting | Check API client method exists |

---

## 📚 Full Documentation

See: `NEW_REQUEST_TYPE_IMPLEMENTATION_GUIDE.md` for complete details

---

**Quick Reference v1.0** | Nov 15, 2025 | Hospital Request System

