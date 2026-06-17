# Hospital Request System - Data Backup and Analysis

This directory contains comprehensive scripts for backing up and analyzing the current hospital request system data before implementing schema consolidation and backend unification.

## Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `01-comprehensive-backup.sql` | Full data backup for all 11 request types | Run in MySQL to create backup tables |
| `02-field-mapping-analysis.sql` | Schema conflict analysis and field mapping | Run in MySQL for detailed field analysis |
| `03-data-patterns-report.md` | Complete analysis report with recommendations | Read for understanding current system state |
| `04-execute-backup.js` | Node.js automation script with validation | Run with Node.js for automated backup |

## Quick Start

### Option 1: Automated Backup (Recommended)
```bash
# Install dependencies (if needed)
npm install mysql2

# Check database connection
node 04-execute-backup.js --check-db

# List current request tables
node 04-execute-backup.js --list-tables

# Execute full backup with validation
node 04-execute-backup.js
```

### Option 2: Manual SQL Execution
```bash
# 1. Execute backup script
mysql -u root -p hospital_management < 01-comprehensive-backup.sql

# 2. Execute analysis script
mysql -u root -p hospital_management < 02-field-mapping-analysis.sql

# 3. Review the analysis report
cat 03-data-patterns-report.md
```

## Environment Configuration

Set these environment variables for database connection:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=hospital_management
```

## Expected Outputs

### Backup Tables Created
- `backup_onboarding_requests`
- `backup_clearance_requests`
- `backup_delegation_requests`
- `backup_certificate_requests`
- `backup_experience_certificate_requests`
- `backup_exit_requests`
- `backup_assignment_requests`
- `backup_assignment_termination_requests`
- `backup_internal_transfer_requests`
- `backup_maternity_leave_requests`
- `backup_housing_allowance_requests`
- `backup_multi_approval_requests`
- `backup_approval_steps`

### Log Files Generated
- `backup-log-YYYY-MM-DD-HH-MM-SS.txt` - Detailed execution log
- `backup-validation-YYYY-MM-DD-HH-MM-SS.json` - Data integrity validation results

## Data Integrity Validation

The backup script automatically validates that:
1. All backup tables have the same record count as originals
2. No data was lost during the backup process
3. All critical fields are preserved correctly

## Critical Findings Summary

### 1. Dual Implementation Conflicts
- **Clearance Requests**: Two different schemas in use
- **Onboarding Requests**: Simple vs comprehensive implementations

### 2. Schema Inconsistencies
- Field naming conflicts (`last_working_day` vs `last_work_day`)
- Status value inconsistencies (Arabic vs English, different formats)
- Multi-approval integration incomplete

### 3. Data Preservation Requirements
- **High Priority**: Clearance and Onboarding data (employee critical data)
- **Medium Priority**: Certificate, Assignment, Experience data
- **Standard Priority**: All other request types

## Next Steps After Backup

1. **Verify Backup Integrity**: Check validation JSON file shows 100% success
2. **Review Analysis Report**: Read `03-data-patterns-report.md` thoroughly  
3. **Plan Schema Consolidation**: Use field mapping analysis for migration planning
4. **Test Migration**: Consider testing with a small subset of data first
5. **Implement Unified Backend**: Proceed with hybrid service architecture

## Rollback Procedures

If issues occur during migration:
1. **Immediate Rollback**: Restore from backup tables using reverse migration scripts
2. **Partial Rollback**: Use backup tables to restore specific request types
3. **Data Recovery**: Use backup validation JSON to identify missing records

## Safety Notes

⚠️ **CRITICAL**: Do not proceed with schema changes until:
- Backup validation shows 100% data integrity
- All backup tables are created successfully  
- You have reviewed the data patterns report
- You have tested the rollback procedures

✅ **Safe to Proceed**: When backup validation passes and you understand all schema conflicts identified in the analysis report.
