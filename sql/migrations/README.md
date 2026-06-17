# SQL Migration Scripts

This folder contains database schema changes and migrations.

## Scripts Overview

- **ADD_MULTI_APPROVAL_COLUMNS_TO_CLEARANCE.sql** - Adds multi-approval system columns
- **employee_credentials_schema.sql** - Employee credentials table schema
- **leave_request_schema.sql** - Leave request system schema
- **test-experience-data.sql** - Test data for experience certificates
- **test-certificate-status.sql** - Test data for certificate status
- **verify_excel_import.sql** - Excel import verification queries

## Important Notes

⚠️ **Note**: The official migration system is located in **Backend/migrations/**

This folder contains:
- Standalone schema files
- Test data for new features
- Schema verification scripts
- One-off migrations from development

For production migrations, refer to the Backend/migrations/ folder which contains:
- Sequentially numbered migrations
- Complete database schemas
- Official migration history

## Usage

1. Review the script to understand the changes
2. Backup your database
3. Test in development first
4. Apply to production with caution
5. Verify the changes were applied correctly

