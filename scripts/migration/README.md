# Unified Database Migration - Execution Guide

This directory contains the execution scripts for migrating the hospital request system to the unified architecture with 100% data preservation.

## Overview

The migration process consolidates all request implementations and resolves dual implementation conflicts while preserving every piece of existing data.

## Migration Components

| File | Purpose | Usage |
|------|---------|-------|
| `01-execute-unified-migration.js` | Main migration execution script with validation | Run with Node.js |
| `README.md` | This documentation file | Reference |

## Prerequisites

### 1. **Backup Validation**
Ensure comprehensive backup has been completed:
```bash
cd ../backup-analysis
node 04-execute-backup.js
```

### 2. **Dependencies**
Install required Node.js packages:
```bash
npm install mysql2
```

### 3. **Database Access**
Ensure you have full database privileges for:
- Creating/dropping tables
- Inserting/updating data
- Reading system tables

## Migration Execution

### Option 1: Dry Run (Recommended First)
```bash
# Validate migration plan without making changes
node 01-execute-unified-migration.js --dry-run

# Or using environment variable
DRY_RUN=true node 01-execute-unified-migration.js
```

### Option 2: Live Migration
```bash
# Execute full migration with data preservation
node 01-execute-unified-migration.js

# With custom database settings
DB_NAME=my_hospital DB_USER=admin node 01-execute-unified-migration.js
```

## Migration Phases

### Phase 1: Pre-Migration Validation
- ✅ Analyze current database schema
- ✅ Count existing records across all request types
- ✅ Validate backup table integrity
- ✅ Check for conflicting unified tables

### Phase 2: Unified Schema Creation
- ✅ Create unified request tables alongside existing ones
- ✅ Add support tables (status mapping, reference sequences)
- ✅ Establish proper indexes and constraints
- ✅ Verify table creation success

### Phase 3: Data Migration with Preservation
- ✅ Migrate clearance requests (resolve field conflicts)
- ✅ Migrate onboarding requests (handle complexity variations)
- ✅ Migrate all other request types with field mapping
- ✅ Extract structured data from JSON payloads
- ✅ Preserve 100% of existing data

### Phase 4: Data Integrity Validation
- ✅ Compare record counts (original vs unified)
- ✅ Validate field mapping accuracy
- ✅ Check reference number preservation
- ✅ Verify status standardization
- ✅ Ensure no data loss occurred

### Phase 5: Schema Replacement (Manual)
- 🔧 Replace original tables with unified ones (after validation)
- 🔧 Update backend services to use unified schema
- 🔧 Remove legacy backup tables (after full validation)

## Environment Configuration

Set these environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=hospital_management
export DRY_RUN=false
```

## Expected Outputs

### Migration Log Files
- `migration-log-YYYY-MM-DD-HH-MM-SS.txt` - Detailed execution log
- `validation-results-YYYY-MM-DD-HH-MM-SS.json` - Data integrity validation
- `migration-report-YYYY-MM-DD-HH-MM-SS.md` - Comprehensive migration report

### Database Changes (Live Migration)
- **New Tables Created**: 11 unified request tables with `Unified_` prefix
- **Support Tables**: Reference sequences, status mapping, migration log
- **Data Preservation**: All existing data copied to unified tables
- **Original Tables**: Remain unchanged for safety

## Data Integrity Validation

The migration automatically validates:

### Record Count Matching
```sql
-- Example validation query
SELECT 
    'Clearance Requests' as table_name,
    (SELECT COUNT(*) FROM Clearance_Requests) as original_count,
    (SELECT COUNT(*) FROM Unified_Clearance_Requests) as migrated_count,
    CASE WHEN original_count = migrated_count THEN 'PASSED' ELSE 'FAILED' END as status;
```

### Field Mapping Validation
- ✅ `last_working_day` → `last_work_day` (clearance)
- ✅ `rejection_reason` → `decision_note` (consolidated)
- ✅ JSON payload extraction to structured fields
- ✅ Status standardization across all tables

### Reference Number Preservation
- ✅ Existing reference numbers maintained
- ✅ Generated reference numbers for records without them
- ✅ No duplicates or collisions

## Rollback Procedures

### Automatic Rollback
If migration fails, the script automatically:
1. Drops any created unified tables
2. Preserves original tables unchanged
3. Logs rollback actions
4. Provides recovery instructions

### Manual Rollback (if needed)
```sql
-- Emergency rollback commands
DROP TABLE IF EXISTS Unified_Clearance_Requests;
DROP TABLE IF EXISTS Unified_Onboarding_Requests;
-- ... (for all unified tables)

-- Original tables remain functional
SELECT COUNT(*) FROM Clearance_Requests; -- Should work
```

### Restore from Backup (if corrupted)
```sql
-- If original tables are corrupted, restore from backup
DROP TABLE Clearance_Requests;
RENAME TABLE backup_clearance_requests TO Clearance_Requests;
-- ... (for all tables)
```

## Success Criteria

✅ **Zero Data Loss**: All existing request data preserved  
✅ **Schema Consistency**: Unified tables created successfully  
✅ **Field Mapping**: All field conflicts resolved  
✅ **Reference Preservation**: Reference numbers maintained  
✅ **Status Standardization**: Consistent status handling  
✅ **Performance**: Query performance maintained or improved  

## Troubleshooting

### Common Issues

#### "Unified tables already exist"
```bash
# Clean up previous migration attempt
mysql -u root -p -e "
DROP TABLE IF EXISTS Unified_Clearance_Requests;
DROP TABLE IF EXISTS Unified_Onboarding_Requests;
-- ... (for all unified tables)
"
```

#### "Backup validation failed"
```bash
# Re-run backup process
cd ../backup-analysis
node 04-execute-backup.js
```

#### "Data validation failed"
- Check migration log for specific table issues
- Verify backup table integrity
- Check for data corruption in original tables
- Contact administrator if issues persist

### Performance Issues
- **Large datasets**: Consider increasing timeout settings
- **Memory constraints**: Process tables individually if needed
- **Network timeouts**: Use local database connection if possible

## Post-Migration Steps

### Immediate Actions (After Successful Migration)
1. **Test Unified Schema**: Run queries against unified tables
2. **Backup Migration Results**: Create additional backup of unified tables  
3. **Verify Application Compatibility**: Test with unified backend services
4. **Performance Testing**: Check query performance with new schema

### When Ready to Go Live
1. **Schema Replacement**: Replace original tables with unified ones
2. **Backend Deployment**: Deploy updated services using unified schema
3. **Frontend Updates**: Deploy updated dashboard interfaces
4. **Legacy Cleanup**: Remove old service implementations
5. **Documentation**: Update system documentation

## Monitoring and Validation

### Key Metrics to Monitor
- **Request Creation Success Rate**: Should remain 100%
- **Dashboard Load Times**: Should be equal or better
- **API Response Times**: Monitor for performance regression
- **Error Rates**: Should not increase after migration

### Validation Queries
```sql
-- Verify all request types are working
SELECT 
    request_type,
    COUNT(*) as count,
    MAX(created_at) as latest_request
FROM (
    SELECT 'clearance' as request_type, created_at FROM Unified_Clearance_Requests
    UNION ALL
    SELECT 'onboarding' as request_type, created_at FROM Unified_Onboarding_Requests
    -- ... (for all types)
) combined
GROUP BY request_type
ORDER BY count DESC;
```

## Support and Recovery

### Contact Information
- **System Administrator**: [Your contact information]
- **Database Administrator**: [DBA contact information]
- **Development Team**: [Dev team contact information]

### Emergency Procedures
1. **Immediate Issues**: Use automatic rollback procedures
2. **Data Corruption**: Restore from backup tables
3. **Performance Problems**: Revert to original schema temporarily
4. **Application Errors**: Deploy rollback version of backend services

## Success Checklist

Before considering migration complete:

- [ ] All 11 request types can be created successfully
- [ ] Admin dashboard shows all request types correctly
- [ ] Employee dashboard displays all requests properly
- [ ] Detail pages work for all request types
- [ ] Approval workflows function correctly
- [ ] Performance is equal or better than before
- [ ] No increase in error rates
- [ ] All validation queries return expected results
- [ ] Backup procedures are documented and tested

## Version Information

- **Schema Version**: 2.0-unified
- **Migration Script Version**: 1.0
- **Database Compatibility**: MySQL 5.7+, MySQL 8.0+
- **Node.js Version**: 14+ recommended
