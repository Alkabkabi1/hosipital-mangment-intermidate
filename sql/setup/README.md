# SQL Setup Scripts

This folder contains scripts for initial database setup, data seeding, and system initialization.

## Scripts Overview

- **add_50_new_employees.sql** - Adds 50 test employees to the system
- **assign-employee-role-to-all-users.sql** - Assigns employee role to all users
- **create-commissioner-ticket.sql** - Creates commissioner tickets
- **initialize-existing-requests.sql** - Initializes existing request data
- **initialize-requests-simple.sql** - Simple request initialization
- **insert-test-data.sql** - General test data insertion

## Usage

These scripts are typically run once during:
- Initial database setup
- Development environment setup
- Testing environment preparation
- Demo data creation

## Important Notes

⚠️ **Warning**: These scripts insert data into the database. Make sure you understand what each script does before running it.

- Review the script content before execution
- Consider running in a transaction for safety
- Backup your database before running setup scripts
- Some scripts may conflict with existing data

