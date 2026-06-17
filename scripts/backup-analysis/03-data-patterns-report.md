# Hospital Request System - Data Patterns Analysis Report

## Executive Summary

This report documents the current data patterns in the hospital request management system, identifying key areas that require attention during schema consolidation and backend unification.

## Current System State

### 1. Request Tables Inventory

| Table Name | Backend Module | Status | Critical Fields |
|------------|---------------|--------|-----------------|
| `Onboarding_Requests` | `employee-requests` + `onboarding` | Dual Implementation | `payload_json`, `start_date` |
| `Clearance_Requests` | `employee-requests` + `clearance` | Dual Implementation | `last_work_day`, `clearance_type` |
| `Delegation_Requests` | `delegation` | Single Implementation | Standard fields |
| `Certificate_Requests` | `certificate` | Single Implementation | Standard fields |
| `Experience_Certificate_Requests` | `experience` | Single Implementation | Standard fields |
| `Exit_Requests` | `exit` | Single Implementation | Open-ended text fields |
| `Assignment_Requests` | `assignment` | Single Implementation | Multi-approval enabled |
| `Assignment_Termination_Requests` | `assignment-termination` | Single Implementation | Multi-approval enabled |
| `Internal_Transfer_Requests` | `internal-transfer` | Single Implementation | Multi-approval enabled |
| `Maternity_Leave_Requests` | `maternity-leave` | Single Implementation | Date-focused fields |
| `Housing_Allowance_Requests` | `housing-allowance` | Single Implementation | **Missing Frontend** |

### 2. Critical Schema Conflicts

#### A. Clearance Requests Dual Schema
**Problem**: Two different database schemas in use

**Schema A (employee-requests)**:
```sql
- last_work_day (DATE)
- status (VARCHAR)
- clearance_type (ENUM)
- specific_reason (VARCHAR)
- document_number (VARCHAR)
- payload_json (LONGTEXT)
```

**Schema B (clearance module)**:
```sql
- last_working_day (DATE) -- CONFLICT!
- status_id (INT) -- CONFLICT!
- reason (VARCHAR)
- notes (TEXT)
```

**Resolution Strategy**: Consolidate to Schema A with field mapping:
- `last_working_day` → `last_work_day`
- `status_id` → resolve to `status` with lookup table
- Preserve all existing data through migration scripts

#### B. Onboarding Requests Complexity Mismatch
**Problem**: Simple vs comprehensive form implementations

**Simple Implementation** (onboarding module):
```sql
- referenceNumber
- requestDate
- startDate
- positionTitle (optional)
- notes (optional)
```

**Comprehensive Implementation** (employee-requests):
```sql
- All above fields PLUS:
- employee_name, employee_dept
- document_number, transaction_number
- employee_status, employment_type
- onboarding_reason, reason_for_job
- payload_json (stores complex form data)
```

**Resolution Strategy**: Use comprehensive schema as base, support both simple and complex submissions

### 3. Multi-Approval System Integration

#### Current Status
- **Fully Integrated**: Assignment, Assignment Termination, Internal Transfer
- **Partially Integrated**: Clearance, Onboarding (have fields but inconsistent usage)
- **Not Integrated**: Certificate, Experience, Exit, Maternity Leave, Housing Allowance

#### Required Fields for Multi-Approval
```sql
approval_stage VARCHAR(50) DEFAULT 'pending'
total_approvers INT DEFAULT 0
approved_count INT DEFAULT 0
final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
last_approval_at TIMESTAMP NULL
```

### 4. Reference Number Patterns

| Prefix | Request Type | Pattern | Example |
|--------|-------------|---------|---------|
| `CLR-` | Clearance | CLR-{timestamp}-{random} | CLR-20250114-A1B2 |
| `ONB-` | Onboarding | ONB-{timestamp}-{random} | ONB-20250114-C3D4 |
| `DLG-` | Delegation | DLG-{timestamp}-{random} | DLG-20250114-E5F6 |
| `CRT-` | Certificate | CRT-{timestamp}-{random} | CRT-20250114-G7H8 |

### 5. Employee Linkage Patterns

#### Current Implementation
- **Primary Key**: `employee_id` (links to App_Users.id)
- **Secondary Key**: `employee_email` (for lookup flexibility)
- **Display Fields**: `employee_name`, `employee_dept`

#### Data Integrity Issues Found
- Some records have `employee_id` without `employee_email`
- Some records have `employee_email` without matching `employee_id`
- Inconsistent employee name storage across tables

### 6. Status Standardization Requirements

#### Current Status Values (Inconsistent)
```sql
-- Arabic statuses (most common)
'قيد الاعتماد' (pending approval)
'مكتمل' (completed)
'مرفوض' (rejected)

-- English statuses (some tables)  
'pending', 'approved', 'rejected'
'submitted', 'in_review', 'completed'

-- Mixed usage causes dashboard display issues
```

#### Proposed Standardization
```sql
-- Primary internal status (English)
'pending', 'approved', 'rejected', 'in_progress'

-- Display mapping (Arabic)
'قيد الاعتماد', 'مكتمل', 'مرفوض', 'قيد المراجعة'
```

## Data Volume Analysis

### Estimated Current Data Volumes
(Based on typical hospital system usage patterns)

| Request Type | Est. Records | Critical Data | Migration Complexity |
|-------------|--------------|---------------|---------------------|
| Clearance | 50-200 | High (employee termination data) | **HIGH** |
| Onboarding | 100-500 | High (employee start data) | **HIGH** |
| Certificate | 200-1000 | Medium | Low |
| Assignment | 20-100 | Medium | Low |
| Delegation | 50-300 | Medium | Low |
| Exit | 30-150 | High (feedback data) | Medium |
| Experience | 100-400 | Medium | Low |
| Others | 10-50 each | Low-Medium | Low |

## Migration Risk Assessment

### High Risk Areas
1. **Clearance/Onboarding Dual Schemas** - Data loss possible without careful mapping
2. **Status Value Inconsistency** - Could break dashboard displays
3. **Multi-approval Integration** - Workflow disruption possible

### Medium Risk Areas
1. **Reference Number Collisions** - Unlikely but possible
2. **Employee Linkage Cleanup** - Some orphaned references possible
3. **Payload JSON Migration** - Complex data structure preservation

### Low Risk Areas
1. **Single Implementation Tables** - Straightforward migration
2. **Standard Field Addition** - No data conflicts
3. **Index Recreation** - Performance impact only

## Recommendations

### 1. Migration Sequence
1. **Phase 1**: Backup all data (CRITICAL)
2. **Phase 2**: Resolve clearance/onboarding conflicts  
3. **Phase 3**: Standardize status values across all tables
4. **Phase 4**: Integrate multi-approval system
5. **Phase 5**: Clean up employee linkages
6. **Phase 6**: Performance optimization

### 2. Data Preservation Strategy
- Create timestamped backup tables for all request types
- Generate validation queries to verify 100% data preservation
- Implement rollback procedures for each migration step
- Maintain audit logs of all data transformations

### 3. Testing Requirements
- Validate data integrity after each migration step
- Test all request type workflows end-to-end
- Verify dashboard functionality with migrated data
- Performance testing with production data volumes

## Success Metrics

- **Zero Data Loss**: 100% preservation of existing request data
- **Schema Consistency**: Single source of truth for each request type
- **Dashboard Functionality**: All request types display correctly
- **Performance Maintained**: No degradation in response times
- **Clean Architecture**: No duplicate implementations remaining
