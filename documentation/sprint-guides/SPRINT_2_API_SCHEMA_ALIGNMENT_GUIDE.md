# 🔧 Sprint 2: API Schema Alignment - Claude Sonnet 3.5 Execution Guide

## 📖 Project Context & Mission

### **System Overview**
You are the **API Schema Alignment Specialist** for a Hospital Request Management System serving Saudi healthcare institutions. Your mission is to fix the disconnect between frontend expectations and backend validation schemas that's causing widespread API validation failures.

### **Current Crisis - Your Specific Domain**
- **API Validation Failures**: 7/7 request types failing with validation errors (HTTP 422)
- **Schema Drift**: Frontend sends different field names than backend expects  
- **Parameter Binding Issues**: Undefined values causing SQL errors
- **Data Type Mismatches**: Inconsistent validation between different request types

### **Your Sprint Dependencies**
- **Depends On**: Sprint 1 (Database Foundation) - **MUST COMPLETE FIRST**
- **Runs Parallel With**: Sprint 3 (Missing Endpoints), Sprint 4 (Authentication)
- **Coordination Required**: Daily sync on shared validation schemas

### **Why Claude Sonnet 3.5 Excels at API Schema Work**
- **TypeScript/NestJS Expertise**: Deep understanding of validation decorators and DTOs
- **Pattern Recognition**: Can identify schema inconsistencies across multiple endpoints
- **Systematic Validation**: Methodical approach to testing each request type
- **Large Context Analysis**: Can analyze frontend-backend integration patterns simultaneously
- **Error Prevention**: Proactive identification of edge cases and validation gaps

---

## 🎯 Sprint 2 Objectives & Success Criteria

### **Primary Goal**: Eliminate ALL API validation errors and parameter binding issues

### **Success Metrics**:
- ✅ **Zero HTTP 422 errors** across all 7 request types
- ✅ **Zero "invalid_type" validation messages**  
- ✅ **Zero SQL parameter binding errors**
- ✅ **100% schema alignment** between frontend and backend
- ✅ **Consistent validation patterns** across all request modules

### **Specific Failures to Fix**:
1. **Internal Transfer**: Missing `currentPosition`, `targetPosition` fields
2. **Certificate**: Missing `occupation` field validation
3. **Experience**: Column name mismatch (`position` vs `job_title`)
4. **Delegation**: Missing `referenceNumber`, `requestDate` validation
5. **Leave Request**: SQL binding errors with undefined parameters
6. **Clearance/Onboarding**: HTTP 422 validation failures

---

## 🧠 Claude Sonnet's Pre-Execution Analysis Framework

### **Phase 1: Current Schema State Analysis**

#### **1.1 DTO Structure Mapping**
```bash
# First, analyze current DTO structures across all modules
find Backend/src/modules -name "*.dto.ts" -exec echo "=== {} ===" \; -exec cat {} \;

# Expected modules to analyze:
# - assignment/assignment.dto.ts
# - assignment-termination/assignment-termination.dto.ts  
# - internal-transfer/internal-transfer.dto.ts
# - certificate/certificate.dto.ts
# - experience-certificate/experience-certificate.dto.ts
# - delegation/delegation.dto.ts
# - clearance/clearance.dto.ts
# - onboarding/onboarding.dto.ts
# - leave-request/leave-request.dto.ts
```

#### **1.2 Frontend Request Analysis**
```javascript
// Analyze test scripts to understand frontend data format
// Look at: scripts/comprehensive-test-suite.js
// Extract the test data structures used in API calls

// Example patterns to identify:
const assignmentTestData = {
  employeeName: 'اسيل محمود عربي المغربي',
  currentPosition: 'Test Position',     // ← Frontend sends this
  newRole: 'Test Assignment Role',
  assignmentReason: 'تكليف للاختبار',
  startDate: '2025-12-01',
  assignmentType: 'temporary'
};

// vs Backend DTO expects:
class CreateInternalTransferDto {
  currentPosition: string;    // ← Backend expects this
  targetPosition: string;     // ← But frontend sends targetDepartment
}
```

#### **1.3 Database Column Mapping**
```sql
-- After Sprint 1 completion, verify actual database columns
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nora_database'
AND TABLE_NAME IN (
    'Assignment_Requests',
    'Assignment_Termination_Requests', 
    'Internal_Transfer_Requests',
    'Certificate_Requests',
    'Experience_Certificate_Requests',
    'Delegation_Requests',
    'Clearance_Requests',
    'Leave_Requests',
    'Onboarding_Requests'
)
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

### **Phase 2: Gap Analysis & Coordination Check**

#### **2.1 Sprint 1 Completion Verification**
```bash
# CRITICAL: Verify Sprint 1 completed successfully before proceeding
node scripts/quick-test.js

# Expected results indicating Sprint 1 success:
# - Backend Health Check: PASS
# - Database Connectivity: PASS  
# - Assignment Request Creation should improve from SKIP to better status

# If Sprint 1 not complete, coordinate with Database Agent immediately
```

#### **2.2 Coordination Protocol with Other Sprints**
```markdown
## Daily Sync Checklist with Parallel Sprints:

### With Sprint 3 (Missing Endpoints):
- [ ] Share updated DTO structures for new endpoints
- [ ] Coordinate on response format standardization
- [ ] Align error message formats

### With Sprint 4 (Authentication):  
- [ ] Share user context validation requirements
- [ ] Coordinate on permission-based field validation
- [ ] Align on token payload structure expectations

### Integration Points:
- [ ] Shared validation utilities
- [ ] Common error response formats
- [ ] Consistent field naming conventions
```

---

## 📋 Detailed Sprint 2 Execution Plan

### **Day 1-2: DTO Alignment & Field Mapping**

#### **Task 2.1: Internal Transfer DTO Fix (Priority: CRITICAL)**

**Current Issue**: Missing `currentPosition` and `targetPosition` fields
```typescript
// File: src/modules/internal-transfer/internal-transfer.dto.ts
// BEFORE (causing validation failures):
export class CreateInternalTransferDto {
  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @IsString() 
  @IsNotEmpty()
  currentDepartment: string;

  @IsString()
  @IsNotEmpty()
  targetDepartment: string;
  
  // Missing: currentPosition, targetPosition
}
```

**Claude Sonnet's Systematic Fix**:
```typescript
// AFTER - Complete alignment with frontend expectations:
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInternalTransferDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  employeeName: string;

  @IsString()
  @IsNotEmpty()  
  @Transform(({ value }) => value?.trim())
  currentDepartment: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  targetDepartment: string;

  // ADD: Missing required fields that frontend sends
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  currentPosition: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  targetPosition: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  transferReason: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;

  @IsString()
  @IsIn(['permanent', 'temporary'])
  transferType: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

#### **Task 2.2: Certificate Request DTO Fix**

**Current Issue**: Missing `occupation` field
```typescript
// File: src/modules/certificate/certificate.dto.ts
// ADD this field to align with database schema (added in Sprint 1):

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  employeeName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  department: string;

  // ADD: Missing occupation field (Sprint 1 added to database)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  occupation: string;

  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;
}
```

#### **Task 2.3: Experience Certificate DTO Fix**

**Current Issue**: Field name mismatch (`position` vs `job_title`)
```typescript
// File: src/modules/experience-certificate/experience-certificate.dto.ts
// Align with Sprint 1 database changes:

export class CreateExperienceCertificateDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  employeeName: string;

  // CHANGE: Align with database column added in Sprint 1
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  job_title: string;  // Changed from 'position' to match database

  // ALSO support the old field name for backward compatibility
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  position?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  department: string;

  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
```

#### **Task 2.4: Delegation Request DTO Fix**

**Current Issue**: Missing `referenceNumber` and `requestDate`
```typescript
// File: src/modules/delegation/delegation.dto.ts
// Add fields that Sprint 1 added to database:

export class CreateDelegationDto {
  // ADD: Missing fields from Sprint 1 database changes
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  referenceNumber: string;

  @IsDateString()
  @IsNotEmpty()
  requestDate: string;

  @IsString()
  @IsIn(['temporary', 'permanent', 'special'])
  delegationType: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  reason: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

#### **Day 1-2 Validation Protocol**:
```bash
# After each DTO fix, validate immediately:

# 1. TypeScript compilation check
cd Backend && npm run build

# 2. Test specific endpoint 
node -e "
const axios = require('axios');
axios.post('http://localhost:3037/api/internal-transfer', {
  employeeName: 'Test User',
  currentDepartment: 'IT', 
  targetDepartment: 'HR',
  currentPosition: 'Developer',
  targetPosition: 'HR Specialist', 
  transferReason: 'Career development',
  effectiveDate: '2025-12-15',
  transferType: 'permanent'
}, {
  headers: { 'Authorization': 'Bearer [TOKEN]' }
}).then(r => console.log('✅ SUCCESS:', r.status))
.catch(e => console.log('❌ ERROR:', e.response?.data));
"

# 3. Check error reduction in comprehensive test
node scripts/comprehensive-test-suite.js | grep -A5 "PHASE2"
```

---

### **Day 3: SQL Parameter Binding Fixes**

#### **Task 3.1: Leave Request Parameter Binding Fix**

**Current Issue**: "Bind parameters must not contain undefined"
```typescript
// File: src/modules/leave-request/leave-request.service.ts
// Fix undefined parameter handling:

export class LeaveRequestService {
  async create(createLeaveRequestDto: CreateLeaveRequestDto, userId: number) {
    // BEFORE (causing SQL binding errors):
    const query = `
      INSERT INTO Leave_Requests (
        employee_name, leave_from_date, leave_to_date, 
        leave_type, reason, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // FIXED parameter handling:
    const values = [
      createLeaveRequestDto.employeeName || null,
      createLeaveRequestDto.leaveFromDate || null,
      createLeaveRequestDto.leaveToDate || null,
      createLeaveRequestDto.leaveType || null,
      createLeaveRequestDto.reason || null,
      userId || null,
      'قيد الاعتماد'
    ].map(value => value === undefined ? null : value);

    try {
      const [result] = await this.db.execute(query, values);
      return {
        success: true,
        data: {
          id: result.insertId,
          ...createLeaveRequestDto,
          status: 'قيد الاعتماد',
          created_at: new Date()
        }
      };
    } catch (error) {
      console.error('Leave request creation error:', error);
      throw new Error(`Leave request creation failed: ${error.message}`);
    }
  }
}
```

#### **Task 3.2: Universal Parameter Binding Utility**

Create shared utility for consistent parameter handling:
```typescript
// File: src/shared/utils/sql-parameter-handler.ts
export class SqlParameterHandler {
  /**
   * Converts undefined values to null for SQL binding
   * Handles Arabic text encoding properly
   */
  static sanitizeParameters(params: any[]): any[] {
    return params.map(param => {
      if (param === undefined) return null;
      if (typeof param === 'string') return param.trim();
      return param;
    });
  }

  /**
   * Validates required fields are not null/undefined
   */
  static validateRequired(data: object, requiredFields: string[]): string[] {
    const errors: string[] = [];
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        errors.push(`${field} is required`);
      }
    });
    return errors;
  }

  /**
   * Handles Arabic text for database insertion
   */
  static handleArabicText(text: string): string {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ');
  }
}
```

#### **Task 3.3: Apply Parameter Fixes to All Services**

Update all service files to use consistent parameter handling:
```typescript
// Pattern to apply across all services:
import { SqlParameterHandler } from '../../shared/utils/sql-parameter-handler';

export class [ServiceName] {
  async create(dto: any, userId: number) {
    // Validate required fields first
    const requiredFields = ['employeeName', /* other required fields */];
    const validationErrors = SqlParameterHandler.validateRequired(dto, requiredFields);
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join(', '));
    }

    const query = `INSERT INTO [TableName] (...) VALUES (...)`;
    const values = SqlParameterHandler.sanitizeParameters([
      dto.employeeName,
      dto.otherField,
      userId,
      // ... other parameters
    ]);

    // Execute with proper error handling
    try {
      const [result] = await this.db.execute(query, values);
      return { success: true, data: { id: result.insertId, ...dto }};
    } catch (error) {
      console.error(`${this.constructor.name} creation error:`, error);
      throw new InternalServerErrorException(`Request creation failed: ${error.message}`);
    }
  }
}
```

---

### **Day 4: Validation Standardization & Testing**

#### **Task 4.1: Create Universal Validation Patterns**

```typescript
// File: src/shared/decorators/validation.decorators.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString, ValidationOptions } from 'class-validator';
import { Transform } from 'class-transformer';

// Arabic-compatible string validation
export function IsArabicString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    IsString(validationOptions)(object, propertyName);
    IsNotEmpty(validationOptions)(object, propertyName);
    Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))(object, propertyName);
  };
}

// Employee name validation (supports Arabic)
export function IsEmployeeName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    IsArabicString(validationOptions)(object, propertyName);
    // Add custom employee name validation if needed
  };
}

// Saudi date format validation
export function IsSaudiDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    IsDateString(validationOptions)(object, propertyName);
  };
}
```

#### **Task 4.2: Standardize All DTOs**

Apply consistent patterns across all DTOs:
```typescript
// Example standardized pattern:
export class CreateRequestDto {
  @IsEmployeeName()
  employeeName: string;

  @IsArabicString()
  @IsOptional()
  reason?: string;

  @IsSaudiDate()
  requestDate: string;

  // Use consistent validation patterns
}
```

#### **Task 4.3: Comprehensive Validation Testing**

```bash
# Create test script for all endpoints:
# File: test-all-validations.js

const testCases = [
  {
    endpoint: '/assignment',
    validData: { /* valid data */ },
    invalidData: [
      { /* missing employeeName */ },
      { /* invalid date format */ },
      { /* Arabic text encoding issues */ }
    ]
  },
  // ... for all 7 request types
];

// Test each endpoint with valid and invalid data
// Expected: valid data succeeds, invalid data returns proper 422 errors
```

---

## 🔄 Parallel Sprint Coordination Protocol

### **Daily Sync Requirements (15 minutes/day)**

#### **Morning Coordination (9 AM)**
```markdown
## Sprint 2 Daily Report Template:

**Date**: [DATE]
**Sprint 2 Status**: [% Complete]

### Completed Today:
- [ ] DTO fixes: [List completed]
- [ ] Parameter binding fixes: [List completed]  
- [ ] Validation standardization: [List completed]

### Blocking Issues:
- [ ] Waiting on Sprint 1: [If applicable]
- [ ] Coordination needed with Sprint 3: [Details]
- [ ] Coordination needed with Sprint 4: [Details]

### Testing Results:
- HTTP 422 errors reduced: [Before] → [After]
- Parameter binding errors: [Before] → [After]
- Request types working: [X/7]

### Tomorrow's Plan:
- [ ] [Specific tasks]
```

#### **Integration Points with Other Sprints**

**With Sprint 3 (Missing Endpoints)**:
- Share standardized error response formats
- Coordinate on new endpoint DTO structures
- Align on HTTP status code usage

**With Sprint 4 (Authentication)**:
- Share user context validation requirements
- Coordinate on permission-based validation
- Align on JWT payload structure expectations

### **Critical Coordination Scenarios**

#### **Scenario 1: Sprint 1 Delays**
```bash
# If Sprint 1 incomplete, coordinate immediately:
# 1. Identify which database changes are needed for your work
# 2. Request priority on specific tables/columns
# 3. Adjust timeline based on database availability
```

#### **Scenario 2: Conflicting Changes**
```bash
# If Sprint 3/4 modify same files:
# 1. Use branch coordination strategy
# 2. Daily merge conflict resolution
# 3. Shared testing environment protocols
```

---

## ✅ Success Validation & Testing Protocol

### **Continuous Integration Testing**

#### **After Each DTO Fix**:
```bash
# 1. Compilation check
npm run build

# 2. Individual endpoint test
curl -X POST http://localhost:3037/api/[endpoint] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '[test-data]'

# 3. Validation error format check
# Expected: Proper error messages, not generic 500 errors
```

#### **End-of-Day Full Validation**:
```bash
# Run comprehensive test to measure progress
node scripts/comprehensive-test-suite.js

# Track improvement in Phase 2 results:
# Target: 0 PASS → 6-7 PASS for request type creation
```

### **Sprint 2 Success Criteria Checklist**

#### **Technical Validation**:
- [ ] All 7 request DTOs compile without TypeScript errors
- [ ] All required fields properly validated with descriptive errors
- [ ] Parameter binding handles null/undefined values gracefully
- [ ] Arabic text properly encoded in all request fields
- [ ] Consistent validation error response format across all endpoints

#### **Functional Validation**:
- [ ] Internal transfer request accepts all required fields
- [ ] Certificate request validates occupation field
- [ ] Experience request handles both position and job_title
- [ ] Delegation request validates reference number format
- [ ] Leave request creates without SQL binding errors
- [ ] All requests return proper success/error responses

#### **Integration Validation**:
- [ ] No conflicts with Sprint 3 endpoint implementations
- [ ] Authentication validation aligns with Sprint 4 requirements  
- [ ] Database operations use Sprint 1 completed schema
- [ ] Shared utilities work across all modules

### **Final Sprint 2 Deliverables**

#### **Code Changes**:
- Updated DTO files for all 7 request types
- Shared validation utilities and decorators
- Parameter binding fixes in all service files
- Comprehensive error handling improvements

#### **Documentation**:
- `SPRINT_2_COMPLETION_REPORT.md` with before/after metrics
- Updated API documentation with proper validation rules
- Integration guide for Sprint 3/4 teams

#### **Testing Results**:
- Comprehensive test suite showing Phase 2 improvement
- Individual endpoint test results
- Performance impact assessment

---

## 🎯 Claude Sonnet 3.5 Optimization Notes

### **Leverage Your Strengths**:
1. **Pattern Recognition**: Identify validation inconsistencies across similar endpoints
2. **Type System Expertise**: Use TypeScript's advanced validation features effectively
3. **Error Prevention**: Anticipate edge cases in Arabic text handling and date formats
4. **Systematic Testing**: Methodical validation of each change before proceeding
5. **Integration Thinking**: Consider impacts on parallel sprints during implementation

### **Expected Outcomes**:
- **Phase 2 Test Results**: 0/7 PASS → 6-7/7 PASS
- **HTTP 422 Errors**: Eliminated across all request types
- **SQL Binding Errors**: Zero undefined parameter issues
- **Overall System Success**: 32% → 60-70% (combined with Sprint 1)

**Remember**: You're the API validation expert. Every request type should work flawlessly after your systematic fixes. Take the methodical approach that makes Claude Sonnet 3.5 excel at complex integration work.

---

*Sprint 2 is critical for user experience - no one can submit requests if validation fails. Your systematic approach to schema alignment will enable the entire system to function properly.*
