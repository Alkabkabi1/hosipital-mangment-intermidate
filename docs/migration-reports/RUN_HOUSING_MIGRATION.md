# Housing Allowance Migration - Quick Fix

## Problem
The Housing_Allowance_Requests table doesn't exist in the database, so requests can't be saved.

## Solution
Run the migration file to create the table.

## Steps to Fix

### Option 1: Run via MySQL Command Line
```bash
mysql -u root -p hospital_system < Backend/migrations/015_housing_allowance_requests.sql
```

### Option 2: Run via MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open the file: `Backend/migrations/015_housing_allowance_requests.sql`
4. Execute the script

### Option 3: Run via HeidiSQL/phpMyAdmin
1. Open your database management tool
2. Select the database (e.g., `hospital_system` or `kauh_db`)
3. Go to Query tab
4. Copy and paste the contents of `Backend/migrations/015_housing_allowance_requests.sql`
5. Execute

### Option 4: Quick PowerShell Script
```powershell
# Set your database credentials
$dbHost = "localhost"
$dbUser = "root"
$dbPassword = "your_password"
$dbName = "hospital_system"
$migrationFile = "Backend\migrations\015_housing_allowance_requests.sql"

# Run migration
mysql -h $dbHost -u $dbUser -p$dbPassword $dbName < $migrationFile
```

## Verify Table Creation

After running the migration, verify the table exists:

```sql
-- Check if table exists
SHOW TABLES LIKE 'Housing_Allowance_Requests';

-- Check table structure
DESCRIBE Housing_Allowance_Requests;

-- Check status history table
DESCRIBE Housing_Allowance_Status_History;
```

## What the Migration Creates

1. **Housing_Allowance_Requests** table with:
   - Employee information
   - Letter details
   - Period details
   - Notes from various parties
   - Status tracking
   - Approval tracking
   - Audit fields

2. **Housing_Allowance_Status_History** table for tracking status changes

3. Auto-increment trigger for reference numbers (HA-000001, HA-000002, etc.)

## After Running Migration

1. Restart your backend server
2. Submit a new housing allowance request
3. It should now appear in:
   - Employee dashboard
   - Admin dashboard
   - Admin unified inbox
   - Admin housing allowance inbox

## Test Query

After migration, you can test with:

```sql
-- Insert a test request
INSERT INTO Housing_Allowance_Requests 
(employee_id, employee_name, job_title, department, letter_date, status)
VALUES 
((SELECT id FROM App_Users LIMIT 1), 'د. محمد أحمد', 'طبيب استشاري', 'الطوارئ', CURDATE(), 'قيد الاعتماد');

-- Verify it was created
SELECT * FROM Housing_Allowance_Requests ORDER BY id DESC LIMIT 1;
```

