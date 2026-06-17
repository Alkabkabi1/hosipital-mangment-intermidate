# SQL Maintenance Scripts

This folder contains scripts for debugging, fixing data issues, and maintaining database integrity.

## Script Categories

### Verification Scripts (CHECK_*.sql)
Query scripts to check data status and integrity:
- `CHECK_ALL_REQUESTS_EXIST.sql` - Verify all requests are in database
- `CHECK_APPROVAL_DATABASE.sql` - Check approval system data
- `CHECK_CLEARANCE_*.sql` - Various clearance data checks
- `CHECK_REQUEST_*.sql` - Request-specific verification queries

### Fix Scripts (FIX_*.sql)
Scripts to correct data issues:
- `FIX_CLEARANCE_6.sql` - Fix specific clearance issue
- `FIX_DUPLICATE_APPROVERS_AND_ROLES.sql` - Remove duplicate approvers
- `FIX_INCONSISTENT_STATUSES.sql` - Fix status inconsistencies
- `FIX_PASSWORDS.sql` - Password-related fixes
- `FIX_SAFE_UPDATE.sql`, `FIX_ULTRA_SAFE_UPDATE.sql` - Safe update procedures

### Cleanup Scripts (CLEANUP_*.sql)
Scripts to clean up invalid or orphaned data:
- `CLEANUP_INVALID_APPROVERS.sql` - Remove invalid approver records
- `cleanup_orphaned_approvals.sql` - Clean up orphaned approval records

### Assignment Scripts (ASSIGN_*.sql)
Scripts to assign roles and permissions:
- `ASSIGN_ADMIN_ROLE_TO_SYSTEM_ADMIN.sql` - Assign admin role
- `ASSIGN_ALL_ADMIN_ROLES.sql` - Bulk admin role assignment

### Other Maintenance Scripts
- `check_credentials.sql` - Credential verification
- `check-delegation-columns.sql` - Delegation table structure check
- `DEBUG_REQUEST_6_STATUS.sql` - Debug specific request
- `FIND_UNAPPROVED_REQUESTS.sql` - Find pending approvals
- `MANUAL_FIX_BY_ID.sql` - Manual fix template
- `SIMPLE_*.sql` - Simple verification queries
- `VIEW_ALL_PENDING_REQUESTS.sql` - View all pending items
- `fix-view-FINAL-CORRECT.sql` - View correction script

## ⚠️ Important Safety Notes

1. **Always backup** before running fix scripts
2. **Test in development** environment first
3. **Review the script** - understand what it does
4. **Check SQL_SAFE_UPDATES** setting before updates
5. **Run verification scripts** before and after fixes
6. **Document** which scripts you've run and when

## Recommended Workflow

1. **Identify the issue** - Use CHECK_*.sql scripts to diagnose
2. **Review the fix** - Find appropriate FIX_*.sql script and review it
3. **Backup database** - Always have a recovery point
4. **Test fix** - Run in development/staging first
5. **Apply fix** - Run in production during maintenance window
6. **Verify** - Use CHECK_*.sql scripts to confirm fix
7. **Document** - Record what was fixed and when

## Notes

Many of these scripts were created during development to address specific issues. Some may be outdated or superseded by backend fixes. Always verify the script is relevant to your current database schema and issue before execution.

