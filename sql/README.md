# SQL Scripts Organization

This folder contains all SQL scripts organized by their purpose and usage.

## Folder Structure

### `/setup/`
Contains initialization and setup scripts:
- Employee data import scripts
- Role assignment scripts
- Initial data seeding
- Test data creation
- Commissioner ticket creation

**Usage**: Run these scripts when setting up a new database or adding initial data.

### `/migrations/`
Contains schema changes and migrations:
- Table structure modifications
- Column additions
- Schema updates
- Test data for new features

**Usage**: Apply these in order when updating the database schema.

### `/maintenance/`
Contains maintenance, fixes, and debugging queries:
- Data validation queries (CHECK_*.sql)
- Data fixes and corrections (FIX_*.sql)
- Cleanup scripts (CLEANUP_*.sql)
- Status verification queries
- Debugging queries (DEBUG_*.sql)

**Usage**: Run these as needed for troubleshooting, fixing data issues, or verifying system state.

## Related Locations

- **Backend/migrations/** - Official migration files managed by the backend system
- **Backend/scripts/** - Backend utility scripts (both JS and SQL)

## Best Practices

1. Always backup your database before running any scripts
2. Test scripts in a development environment first
3. Review scripts before execution, especially FIX_*.sql files
4. Check for safe mode settings (SQL_SAFE_UPDATES) before updates
5. Keep track of which scripts have been run in production

## Notes

Some scripts may be outdated as they were created during development. Always verify the script's relevance to your current database schema before execution.

