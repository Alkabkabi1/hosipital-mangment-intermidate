# 🔐 Sprint 4: Authentication & Authorization - Claude Sonnet 3.5 Execution Guide

## 📖 Project Context & Mission

### **System Overview**
You are the **Security & Access Control Specialist** for a Hospital Request Management System. Your mission is to fix authentication middleware, resolve authorization issues, and ensure proper role-based access control across the entire system.

### **Current Crisis - Your Security Domain**
- **Admin Access Blocked**: Valid admin tokens rejected with "Forbidden" errors
- **Employee Authorization Failures**: "غير مصرح" (Unauthorized) errors for legitimate access
- **Inconsistent Permission Checks**: Different endpoints use different authorization logic
- **Token Validation Issues**: JWT tokens not properly validated across all routes

### **Your Sprint Dependencies**
- **Depends On**: Sprint 1 (Database Foundation) - **25% dependency**
- **Runs Parallel With**: Sprint 2 (API Schema), Sprint 3 (Missing Endpoints)
- **Coordination Required**: Share authentication guards and permission patterns

### **Why Claude Sonnet 3.5 Excels at Security Implementation**
- **Security-First Mindset**: Deep understanding of authentication vulnerabilities and best practices
- **Systematic Permission Design**: Methodical approach to role-based access control
- **JWT & Middleware Expertise**: Advanced knowledge of NestJS security patterns
- **Edge Case Analysis**: Comprehensive coverage of authorization scenarios
- **Integration Security**: Ensures security measures don't break functionality

---

## 🎯 Sprint 4 Objectives & Success Criteria

### **Primary Goal**: Establish rock-solid authentication and authorization across all endpoints

### **Success Metrics**:
- ✅ **Zero "Forbidden" errors** for valid admin access
- ✅ **Zero "غير مصرح" errors** for legitimate employee access  
- ✅ **Consistent RBAC implementation** across all endpoints
- ✅ **Proper JWT token validation** with comprehensive error handling
- ✅ **Security without breaking functionality** - no over-restrictive permissions

### **Specific Security Issues to Fix**:
1. **Admin Middleware Failure**: Valid admin tokens rejected
2. **Employee Own-Resource Access**: Can't access own requests ("غير مصرح")
3. **Inconsistent Role Checking**: Different role validation patterns across endpoints
4. **JWT Token Structure**: Token validation and payload inconsistencies
5. **Permission Escalation Prevention**: Ensure proper access boundaries

---

## 🧠 Claude Sonnet's Security Analysis Framework

### **Phase 1: Current Security State Assessment**

#### **1.1 Authentication System Inventory**
```bash
# Analyze current authentication structure
find Backend/src -name "*auth*" -type f -exec echo "=== {} ===" \; -exec cat {} \;

# Expected files to analyze:
# - auth/auth.controller.ts
# - auth/auth.service.ts  
# - auth/jwt-auth.guard.ts
# - auth/local-auth.guard.ts
# - auth/auth.module.ts
# - middleware/auth.middleware.ts
```

#### **1.2 JWT Token Structure Analysis**
```javascript
// Decode current JWT tokens to understand structure
// From test results, we know these work:
// Admin: admin@hospital.sa / 123456
// Employee: aseelma@moh.gov.sa / password123

// Expected token payload structure:
{
  "sub": 1,  // or 6426 for employee
  "email": "admin@hospital.sa",
  "roles": ["ADMIN"],  // or ["EMPLOYEE"]
  "type": "access",
  "iat": 1763205629,
  "exp": 1763206529
}
```

#### **1.3 Current Permission Patterns Audit**
```typescript
// Find all current guard usage patterns
grep -r "@UseGuards" Backend/src/ --include="*.ts"
grep -r "req.user" Backend/src/ --include="*.ts"
grep -r "roles" Backend/src/ --include="*.ts"

// Identify inconsistencies:
// - Different role checking methods
// - Inconsistent user property access
// - Varying error message formats
```

### **Phase 2: Security Gap Analysis**

#### **2.1 Admin Access Failure Analysis**
```bash
# Test current admin token validation
curl -X GET http://localhost:3037/api/admin/stats \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -v

# Expected issue: 403 Forbidden despite valid token
# Root cause: AdminGuard or role checking logic error
```

#### **2.2 Employee Permission Boundary Analysis**
```bash  
# Test employee access to own resources
curl -X GET http://localhost:3037/api/clearance/[REQUEST_ID] \
  -H "Authorization: Bearer [EMPLOYEE_TOKEN]" \
  -v

# Expected issue: 403 "غير مصرح" for own requests  
# Root cause: Permission checking logic too restrictive
```

---

## 📋 Detailed Sprint 4 Execution Plan

### **Day 1: JWT Authentication & Token Validation Fixes**

#### **Task 4.1: JWT Authentication Guard Enhancement**

**Current Issue**: Inconsistent token validation across endpoints
**Solution**: Standardize JWT validation with comprehensive error handling

```typescript
// File: src/auth/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Access token is required',
        code: 'NO_TOKEN'
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'hospital-secret-key'
      });

      // Standardize user object across all endpoints
      request.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        role: payload.roles?.[0]?.toLowerCase() || 'employee', // backward compatibility
        tokenType: payload.type || 'access'
      };

      // Verify token is not expired (additional check)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return true;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid access token',
          code: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          success: false,
          message: 'Token has expired', 
          code: 'TOKEN_EXPIRED'
        });
      }

      throw error; // Re-throw if already UnauthorizedException
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) return undefined;

    const [type, token] = authorization.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### **Task 4.2: Admin Role Guard Fix**

**Current Issue**: Admin tokens rejected despite valid credentials
**Solution**: Create flexible admin guard with proper role checking

```typescript
// File: src/auth/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentication required',
        code: 'NO_USER'
      });
    }

    // Multiple ways to check admin role (handle different token formats)
    const isAdmin = this.checkAdminRole(user);

    if (!isAdmin) {
      throw new ForbiddenException({
        success: false,
        message: 'Administrator access required',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    return true;
  }

  private checkAdminRole(user: any): boolean {
    // Handle multiple role formats from different token structures
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(role => 
        role.toLowerCase() === 'admin' || 
        role.toUpperCase() === 'ADMIN'
      );
    }

    // Backward compatibility with role property
    if (user.role) {
      return user.role.toLowerCase() === 'admin';
    }

    // Check email-based admin (fallback)
    if (user.email) {
      const adminEmails = ['admin@hospital.sa', 'sadmin'];
      return adminEmails.includes(user.email);
    }

    return false;
  }
}
```

#### **Task 4.3: Employee Resource Access Guard**

**Current Issue**: Employees can't access their own requests
**Solution**: Flexible resource ownership validation

```typescript
// File: src/auth/resource-owner.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentication required',
        code: 'NO_USER'
      });
    }

    // Admins can access all resources
    if (this.isAdmin(user)) {
      return true;
    }

    // For non-admins, check resource ownership
    // This will be used in combination with service-level checks
    return true; // Let service handle ownership validation
  }

  private isAdmin(user: any): boolean {
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(role => 
        role.toLowerCase() === 'admin' || 
        role.toUpperCase() === 'ADMIN'
      );
    }
    
    return user.role?.toLowerCase() === 'admin';
  }
}
```

---

### **Day 2: Service-Level Authorization Implementation**

#### **Task 4.4: Clearance Request Authorization Fix**

**Current Issue**: "غير مصرح" errors when accessing own clearance requests
**Solution**: Proper ownership validation in service layer

```typescript
// File: src/modules/clearance/clearance.service.ts
export class ClearanceService {
  // ... existing methods ...

  async findById(id: string, userId: number, userRoles: string[] = []) {
    const query = `
      SELECT 
        cr.*,
        u.name as created_by_name
      FROM Clearance_Requests cr
      LEFT JOIN App_Users u ON cr.created_by = u.id
      WHERE cr.id = ?
    `;

    const [rows] = await this.db.execute(query, [id]);
    
    if (rows.length === 0) {
      throw new NotFoundException({
        success: false,
        message: 'Clearance request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    const clearanceRequest = rows[0];

    // Authorization check: Owner or Admin can access
    const isAdmin = userRoles.some(role => 
      role.toLowerCase() === 'admin' || role.toUpperCase() === 'ADMIN'
    );
    const isOwner = clearanceRequest.created_by === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        success: false,
        message: 'غير مصرح لك بالوصول إلى هذا الطلب',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    return clearanceRequest;
  }

  async findByUser(userId: number, requestingUserId: number, requestingUserRoles: string[] = []) {
    // Check if requesting user can access this user's requests
    const isAdmin = requestingUserRoles.some(role => 
      role.toLowerCase() === 'admin' || role.toUpperCase() === 'ADMIN'
    );
    const isSameUser = userId === requestingUserId;

    if (!isAdmin && !isSameUser) {
      throw new ForbiddenException({
        success: false,
        message: 'غير مصرح لك بالوصول إلى طلبات هذا المستخدم',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    const query = `
      SELECT * FROM Clearance_Requests 
      WHERE created_by = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await this.db.execute(query, [userId]);
    return rows;
  }
}
```

#### **Task 4.5: Universal Authorization Service**

Create shared authorization logic for consistent permission checking:

```typescript
// File: src/shared/services/authorization.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';

export interface AuthorizationContext {
  user: {
    id: number;
    roles: string[];
    email: string;
  };
  resource?: {
    id: string | number;
    ownerId?: number;
    createdBy?: number;
    type: string;
  };
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

@Injectable()
export class AuthorizationService {
  
  /**
   * Check if user can perform action on resource
   */
  async authorize(context: AuthorizationContext): Promise<boolean> {
    const { user, resource, action } = context;

    // Admin can do everything
    if (this.isAdmin(user)) {
      return true;
    }

    // Resource-specific authorization
    if (resource) {
      return this.checkResourcePermission(user, resource, action);
    }

    // Action-specific authorization
    return this.checkActionPermission(user, action);
  }

  /**
   * Throw error if not authorized
   */
  async requireAuthorization(context: AuthorizationContext): Promise<void> {
    const authorized = await this.authorize(context);
    
    if (!authorized) {
      throw new ForbiddenException({
        success: false,
        message: 'غير مصرح لك بتنفيذ هذا الإجراء',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
  }

  private isAdmin(user: any): boolean {
    return user.roles?.some(role => 
      role.toLowerCase() === 'admin' || role.toUpperCase() === 'ADMIN'
    ) || false;
  }

  private checkResourcePermission(user: any, resource: any, action: string): boolean {
    // Owner can read/update their own resources
    if (action === 'read' || action === 'update') {
      const isOwner = resource.ownerId === user.id || resource.createdBy === user.id;
      if (isOwner) return true;
    }

    // Approval actions require specific roles
    if (action === 'approve') {
      return this.canApprove(user, resource);
    }

    // Creation generally allowed for employees
    if (action === 'create') {
      return true;
    }

    return false;
  }

  private checkActionPermission(user: any, action: string): boolean {
    // Basic permissions for employees
    const employeeActions = ['create', 'read'];
    return employeeActions.includes(action);
  }

  private canApprove(user: any, resource: any): boolean {
    // Approval logic based on resource type and user role
    // This can be expanded based on business rules
    return user.roles?.some(role => 
      ['ADMIN', 'SUPERVISOR', 'HR_MANAGER'].includes(role.toUpperCase())
    ) || false;
  }
}
```

---

### **Day 3: Comprehensive Authorization Integration**

#### **Task 4.6: Apply Authorization to All Controllers**

Update all controllers to use consistent authorization:

```typescript
// Example pattern for all controllers:
// File: src/modules/[module]/[module].controller.ts

@Controller('[module]')
@UseGuards(JwtAuthGuard)
export class ExampleController {
  constructor(
    private readonly exampleService: ExampleService,
    private readonly authService: AuthorizationService
  ) {}

  @Get(':id')
  async getRequest(@Param('id') id: string, @Request() req) {
    // Use authorization service for consistent permission checking
    await this.authService.requireAuthorization({
      user: req.user,
      resource: { id, type: 'example' },
      action: 'read'
    });

    try {
      const result = await this.exampleService.findById(id, req.user.id, req.user.roles);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post()
  async createRequest(@Body() dto: any, @Request() req) {
    await this.authService.requireAuthorization({
      user: req.user,
      action: 'create'
    });

    try {
      const result = await this.exampleService.create(dto, req.user.id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
```

#### **Task 4.7: Admin Endpoints Security Hardening**

```typescript
// File: src/modules/admin/admin.controller.ts
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)  // Require both auth and admin role
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(@Request() req) {
    // Additional security log for admin actions
    console.log(`Admin stats accessed by: ${req.user.email} at ${new Date()}`);
    
    try {
      const stats = await this.adminService.getStatistics();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error(`Admin stats error for ${req.user.email}:`, error);
      return {
        success: false,
        message: 'Failed to retrieve statistics'
      };
    }
  }

  @Get('requests/recent')
  async getRecentRequests(
    @Query('limit') limit = 50,
    @Query('status') status?: string,
    @Request() req
  ) {
    console.log(`Admin recent requests accessed by: ${req.user.email}`);
    
    try {
      const requests = await this.adminService.getRecentRequests(limit, status);
      return {
        success: true,
        data: requests,
        count: requests.length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve recent requests'
      };
    }
  }
}
```

#### **Task 4.8: Multi-Approval Security Enhancement**

```typescript
// File: src/modules/multi-approval/multi-approval.controller.ts
@Controller('multi-approval')
@UseGuards(JwtAuthGuard)
export class MultiApprovalController {
  constructor(
    private readonly multiApprovalService: MultiApprovalService,
    private readonly authService: AuthorizationService
  ) {}

  @Post('approve')
  async approveRequest(@Body() approvalDto: any, @Request() req) {
    // Verify user can approve this type of request
    await this.authService.requireAuthorization({
      user: req.user,
      resource: {
        id: approvalDto.requestId,
        type: approvalDto.requestType
      },
      action: 'approve'
    });

    try {
      const result = await this.multiApprovalService.approveRequest(
        approvalDto.requestType,
        approvalDto.requestId,
        approvalDto.decision,
        req.user.id,
        approvalDto.note
      );

      // Security audit log
      console.log(`Approval action by ${req.user.email}: ${approvalDto.decision} for ${approvalDto.requestType}:${approvalDto.requestId}`);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Approval error by ${req.user.email}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}
```

---

## 🔄 Parallel Sprint Coordination Protocol

### **Security Integration with Other Sprints**

#### **With Sprint 2 (API Schema)**:
```typescript
// Provide validation decorators that include security context
export function IsAuthorizedField(roles: string[] = []) {
  return function (object: Object, propertyName: string) {
    // Implementation that checks user roles during validation
    // if certain fields require specific permissions to set
  };
}
```

#### **With Sprint 3 (Missing Endpoints)**:
```typescript
// Provide standard guard combinations for new endpoints
export const StandardGuards = [JwtAuthGuard];
export const AdminGuards = [JwtAuthGuard, AdminGuard];
export const ResourceOwnerGuards = [JwtAuthGuard, ResourceOwnerGuard];

// Usage in Sprint 3 controllers:
@UseGuards(...AdminGuards)
@Get('admin-endpoint')
async adminMethod() { /* implementation */ }
```

### **Daily Security Coordination**

#### **Security Review Checklist**:
```markdown
## Sprint 4 Daily Security Report:

### Authentication Status:
- [ ] JWT validation working across all endpoints
- [ ] Token expiration properly handled
- [ ] Error messages consistent and secure

### Authorization Status:  
- [ ] Admin access restored without over-permissive settings
- [ ] Employee resource access working correctly
- [ ] Role-based permissions properly implemented

### Integration Security:
- [ ] Sprint 2 DTOs include security validation
- [ ] Sprint 3 new endpoints properly secured
- [ ] No security gaps introduced by parallel work

### Security Testing:
- [ ] Admin endpoints accessible with valid tokens
- [ ] Employee "غير مصرح" errors eliminated for valid access
- [ ] Unauthorized access properly blocked
```

---

## ✅ Security Validation & Testing Protocol

### **Authentication Testing**

#### **Token Validation Tests**:
```bash
# Test 1: Valid admin token
curl -X GET http://localhost:3037/api/admin/stats \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
# Expected: 200 OK, not 403 Forbidden

# Test 2: Valid employee token for own resources
curl -X GET http://localhost:3037/api/clearance/[OWN_REQUEST_ID] \
  -H "Authorization: Bearer [EMPLOYEE_TOKEN]"
# Expected: 200 OK, not 403 "غير مصرح"

# Test 3: Employee accessing other's resources
curl -X GET http://localhost:3037/api/clearance/[OTHER_REQUEST_ID] \
  -H "Authorization: Bearer [EMPLOYEE_TOKEN]"
# Expected: 403 Forbidden (properly blocked)

# Test 4: No token
curl -X GET http://localhost:3037/api/admin/stats
# Expected: 401 Unauthorized

# Test 5: Invalid token
curl -X GET http://localhost:3037/api/admin/stats \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized
```

#### **Role-Based Access Tests**:
```javascript
// Comprehensive role testing script
const testCases = [
  {
    role: 'admin',
    token: '[ADMIN_TOKEN]',
    endpoints: [
      { url: '/api/admin/stats', expected: 200 },
      { url: '/api/admin/requests/recent', expected: 200 },
      { url: '/api/employee/requests/summary', expected: 200 }, // Admin can access employee endpoints
    ]
  },
  {
    role: 'employee', 
    token: '[EMPLOYEE_TOKEN]',
    endpoints: [
      { url: '/api/admin/stats', expected: 403 }, // Should be blocked
      { url: '/api/employee/requests/summary', expected: 200 },
      { url: '/api/clearance/[OWN_ID]', expected: 200 },
    ]
  }
];

// Run tests and verify proper access control
```

### **Sprint 4 Success Criteria Checklist**

#### **Authentication Fixes**:
- [ ] JWT tokens properly validated across all endpoints
- [ ] Token expiration handled gracefully
- [ ] Consistent error responses for auth failures
- [ ] Multiple token formats supported (backward compatibility)

#### **Authorization Fixes**:
- [ ] Admin endpoints accessible with valid admin tokens
- [ ] Employee "غير مصرح" errors eliminated for own resources
- [ ] Proper resource ownership validation
- [ ] Role-based access control consistent across system

#### **Security Hardening**:
- [ ] No over-permissive access grants
- [ ] Security audit logging for sensitive operations
- [ ] Consistent permission patterns across all modules
- [ ] Integration with other sprints maintains security

#### **Integration Quality**:
- [ ] Authorization service used consistently across controllers
- [ ] Shared guards available for other sprints
- [ ] No security conflicts with parallel implementations

### **Final Sprint 4 Deliverables**

#### **Security Infrastructure**:
- Enhanced JWT authentication guard with comprehensive validation
- Flexible admin guard supporting multiple role formats
- Resource ownership validation system
- Universal authorization service for consistent permission checking

#### **Controller Security**:
- All admin endpoints properly secured with AdminGuard
- Employee resource access fixed with proper ownership validation
- Consistent error handling and security logging
- Integration with Sprint 2/3 implementations

#### **Documentation & Testing**:
- `SPRINT_4_COMPLETION_REPORT.md` with security validation results
- Security testing protocols and test results
- Authorization patterns documentation for future development

---

## 🎯 Claude Sonnet 3.5 Security Optimization Notes

### **Leverage Your Security Expertise**:
1. **Defense in Depth**: Multiple layers of security validation (JWT + guards + service-level checks)
2. **Principle of Least Privilege**: Users get minimum necessary permissions
3. **Consistent Security Patterns**: Same authorization logic across all endpoints
4. **Security Audit Trail**: Logging for sensitive operations and access attempts
5. **Integration Security**: Ensure parallel sprint work doesn't introduce vulnerabilities

### **Expected Security Outcomes**:
- **Admin Access**: 100% success rate for valid admin operations
- **Employee Access**: Zero "غير مصرح" errors for legitimate resource access
- **Security Boundaries**: Proper blocking of unauthorized access attempts
- **Overall System Security**: Robust authentication and authorization foundation
- **Integration Success**: 80%+ → 95%+ system success rate (combined with other sprints)

**Remember**: Security is the foundation that enables all other functionality. Your systematic approach to authentication and authorization will ensure the hospital system is both secure and usable. Every permission decision should be explicit, auditable, and consistent with business requirements.

---

*Sprint 4 establishes the security perimeter that protects sensitive hospital data while enabling legitimate users to perform their daily tasks efficiently and securely.*
