# Unified Request System Database Schema

This directory contains the complete unified database schema design that consolidates all request implementations and resolves dual-implementation conflicts while preserving 100% of existing data.

## Overview

The unified schema addresses critical issues found in the current system:
- **Dual Implementation Conflicts**: Clearance and Onboarding had two different backend implementations
- **Schema Inconsistencies**: Field naming conflicts, status handling differences  
- **Multi-approval Integration**: Incomplete multi-approval system across request types
- **Data Preservation**: All existing data must be preserved during consolidation

## File Structure

| File | Purpose | Usage Order |
|------|---------|-------------|
| `00-unified-master-schema.sql` | Complete deployable schema | **Run this for fresh install** |
| `01-unified-request-tables.sql` | Core unified table definitions | Migration step 1 |
| `02-remaining-request-types.sql` | Complete remaining table definitions | Migration step 2 |
| `03-data-migration.sql` | Data preservation migration scripts | Migration step 3 |
| `README.md` | This documentation file | - |

## Deployment Options

### Option 1: Fresh Database Installation (Recommended)
```sql
-- For new installations or test environments
mysql -u root -p hospital_management < 00-unified-master-schema.sql
```

### Option 2: Production Migration (Existing Data)
```bash
# Step 1: Backup existing data
mysql -u root -p hospital_management < ../../backup-analysis/01-comprehensive-backup.sql

# Step 2: Create unified tables alongside existing ones
mysql -u root -p hospital_management < 01-unified-request-tables.sql
mysql -u root -p hospital_management < 02-remaining-request-types.sql

# Step 3: Migrate data with validation
mysql -u root -p hospital_management < 03-data-migration.sql

# Step 4: Validate migration success, then replace tables
```

## Schema Design Principles

### 1. **Field Consolidation Strategy**
- **Preserve ALL fields** from both implementations
- **Standardize naming**: Use most descriptive field names
- **Handle conflicts**: Map conflicting fields (e.g., `last_working_day` → `last_work_day`)
- **Extend capabilities**: Add multi-approval support to all request types

### 2. **Status Standardization**
```sql
-- Unified status handling
canonical_status VARCHAR(50)  -- Internal system status
display_status_ar VARCHAR(50) -- Arabic display status  
display_status_en VARCHAR(50) -- English display status
status_category ENUM('pending', 'approved', 'rejected', 'in_progress')
```

### 3. **Multi-Approval Integration**
All request types now include:
```sql
approval_stage VARCHAR(50) DEFAULT 'pending'
total_approvers INT DEFAULT 0
approved_count INT DEFAULT 0  
final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
last_approval_at TIMESTAMP NULL
```

### 4. **Reference Number Management**
Centralized reference number generation:
```sql
-- Automated sequence management per request type
Request_Reference_Sequences table
GenerateRequestReference() function
Collision-prevention mechanisms
```

## Unified Request Tables

### Core Request Types (Resolved Conflicts)

#### 1. **Clearance_Requests** (Consolidated)
**Problem Solved**: Merged two different schemas with conflicting fields

**Before** (Dual Implementation):
- Schema A: `last_work_day`, `status`, comprehensive fields
- Schema B: `last_working_day`, `status_id`, simple fields  

**After** (Unified):
```sql
CREATE TABLE Clearance_Requests (
    -- Standard fields
    id, reference_number, employee_id, employee_email, employee_name, employee_dept,
    
    -- Consolidated clearance fields  
    last_work_day DATE,              -- Unified field name
    clearance_type ENUM(...),        -- From comprehensive schema
    specific_reason VARCHAR(100),    -- From comprehensive schema
    document_number VARCHAR(50),     -- From comprehensive schema
    reason VARCHAR(500),             -- From both schemas
    
    -- Multi-approval integration
    approval_stage, total_approvers, approved_count, final_decision,
    
    -- Extended data storage
    payload_json LONGTEXT           -- Preserves complex form data
);
```

#### 2. **Onboarding_Requests** (Consolidated)
**Problem Solved**: Merged simple and comprehensive implementations

**Before** (Conflicting Complexity):
- Simple: Basic fields only (referenceNumber, startDate, positionTitle)
- Comprehensive: 20+ fields including employee details, transaction info

**After** (Unified):
```sql
CREATE TABLE Onboarding_Requests (
    -- Supports both simple and comprehensive submissions
    -- Basic fields (always present)
    id, reference_number, employee_id, start_date, position_title,
    
    -- Comprehensive fields (optional, from payload_json)  
    document_number, transaction_number, employee_status,
    employment_type, onboarding_reason, employee_number,
    nationality, gender, birth_date, appointment_date,
    
    -- Flexible data storage
    payload_json LONGTEXT          -- Preserves complex form data
);
```

### Standard Request Types (Enhanced)

All remaining request types standardized with:
- Consistent field naming patterns
- Multi-approval system integration  
- Comprehensive indexing strategy
- Foreign key constraint consistency

#### 3. **Delegation_Requests** (Enhanced)
#### 4. **Certificate_Requests** (Enhanced)
#### 5. **Experience_Certificate_Requests** (Enhanced)
#### 6. **Exit_Requests** (Enhanced)
#### 7. **Assignment_Requests** (Standardized)
#### 8. **Assignment_Termination_Requests** (Standardized)
#### 9. **Internal_Transfer_Requests** (Standardized)  
#### 10. **Maternity_Leave_Requests** (Enhanced)
#### 11. **Housing_Allowance_Requests** (Enhanced)

## Data Migration Strategy

### Migration Process Flow
1. **Pre-Migration Validation**: Count existing records, analyze data patterns
2. **Field Mapping**: Transform conflicting field names and data types
3. **Status Standardization**: Map all status values to unified format
4. **Reference Number Preservation**: Maintain existing reference numbers
5. **JSON Payload Migration**: Extract structured data from JSON fields
6. **Multi-Approval Initialization**: Set appropriate approval stages
7. **Post-Migration Validation**: Verify 100% data preservation

### Critical Field Mappings

#### Clearance Requests
```sql  
-- Field name resolution
last_working_day → last_work_day
status_id → status (with lookup)
rejection_reason → decision_note
notes → decision_note (consolidated)

-- Status value standardization  
'pending', 'قيد الاعتماد', 'submitted' → 'قيد الاعتماد'
'approved', 'مكتمل', 'completed' → 'مكتمل'  
'rejected', 'مرفوض' → 'مرفوض'
```

#### Onboarding Requests
```sql
-- JSON extraction patterns
JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.jobTitle')) → position_title
JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.documentNumber')) → document_number
JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.employmentType')) → employment_type

-- Date handling
STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.birthDate')), '%Y-%m-%d') → birth_date
```

## Backward Compatibility

### Legacy Views
To ensure existing code continues working during transition:

```sql
-- Maps unified schema back to expected legacy field names
CREATE VIEW Legacy_Clearance_View AS
SELECT 
    id, reference_number, employee_id,
    last_work_day as last_working_day,    -- Field name mapping
    decision_note as rejection_reason,     -- Field name mapping
    -- ... other fields
FROM Clearance_Requests;
```

### API Compatibility
- Legacy backend services can use views during transition
- New unified services use tables directly  
- Gradual migration path supported

## Performance Optimizations

### Indexing Strategy
```sql
-- Standard indexes for all request tables
KEY idx_{table}_status (status)
KEY idx_{table}_employee_id (employee_id)  
KEY idx_{table}_approval_stage (approval_stage)
KEY idx_{table}_request_date (request_date)
KEY idx_{table}_final_decision (final_decision)

-- Request-specific indexes  
KEY idx_clearance_clearance_type (clearance_type)
KEY idx_onboarding_employment_type (employment_type)
KEY idx_assignment_assignment_type (assignment_type)
```

### Query Optimization
- Foreign key constraints ensure referential integrity
- Proper data types reduce storage overhead
- JSON fields indexed where frequently queried

## Validation and Testing

### Data Integrity Checks
```sql
-- Verify migration completeness
SELECT 
    'Clearance Requests' as table_name,
    (SELECT COUNT(*) FROM backup_clearance_requests) as original_count,
    (SELECT COUNT(*) FROM Clearance_Requests) as migrated_count,
    CASE WHEN original_count = migrated_count THEN 'PASSED' ELSE 'FAILED' END as status;
```

### Functional Testing Requirements
1. **All 11 request types** can be created successfully
2. **Dashboard integration** shows all request types correctly  
3. **Approval workflows** work with multi-approval system
4. **Reference number generation** avoids collisions
5. **Status transitions** work consistently across types
6. **Detail pages** display complete information for all requests

## Rollback Procedures  

### Emergency Rollback
```sql
-- If migration fails, restore from backup tables
DROP TABLE Clearance_Requests;
RENAME TABLE backup_clearance_requests TO Clearance_Requests;
-- Repeat for all tables...
```

### Selective Rollback
```sql  
-- Restore individual request types if needed
-- Backup tables preserved until migration fully validated
```

## Success Criteria

✅ **Zero Data Loss**: All existing request data preserved  
✅ **Schema Consistency**: Single source of truth for each request type  
✅ **Conflict Resolution**: No more dual implementations  
✅ **Multi-Approval Integration**: Consistent workflow system  
✅ **Performance Maintained**: Query performance equal or better  
✅ **Backward Compatibility**: Legacy systems continue working during transition  

## Next Steps After Schema Deployment

1. **Update Backend Services**: Implement unified service layer
2. **Frontend Integration**: Update forms to use unified endpoints
3. **Dashboard Updates**: Ensure all request types display correctly  
4. **Testing**: Complete end-to-end workflow testing
5. **Performance Tuning**: Optimize queries and indexes based on usage
6. **Documentation**: Update API documentation and user guides

## Support and Troubleshooting

### Common Issues
- **Migration Validation Failures**: Check backup table completeness
- **Reference Number Conflicts**: Reset sequence counters appropriately  
- **Status Display Issues**: Verify Request_Status_Mapping data
- **Foreign Key Violations**: Ensure referenced tables exist and are populated

### Log Files
- `Migration_Log` table contains detailed migration progress
- `Schema_Deployment_Log` tracks schema deployment status
- Check these tables for troubleshooting information
