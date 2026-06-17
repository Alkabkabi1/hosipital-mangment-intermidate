# Tools Directory

This directory contains utility tools and scripts for database management, system monitoring, and maintenance tasks.

## 📁 Directory Structure

### Database Checks (`database-checks/`)
Utility scripts for monitoring and validating database state:

- **`check_statuses.js`** - Examines all status values across different request tables
  - Shows distinct status values and their counts
  - Helps identify inconsistent status formatting
  - Supports Arabic and English status values

- **`check_requests_status.js`** - Detailed analysis of request statuses
  - Reviews Experience Certificate, Onboarding, Clearance, and Certificate requests
  - Shows status and final_decision fields
  - Helps track request processing workflows

- **`check_clearance_data.js`** - Specialized clearance request analysis
  - Focuses on Clearance_Requests table
  - Includes Request_Approvals analysis for clearance type
  - Useful for debugging clearance workflows

## 🔧 Usage Instructions

### Database Status Checking
```bash
# Check all status values across tables
node tools/database-checks/check_statuses.js

# Analyze specific request statuses
node tools/database-checks/check_requests_status.js

# Focus on clearance data
node tools/database-checks/check_clearance_data.js
```

### Prerequisites
All database check tools require:
- Node.js with mysql2 and dotenv packages
- Database connection configured in `.env` file
- Access to the database with read permissions

## 📊 Tool Categories

### Status Analysis Tools
- **Status Validation**: Identify inconsistent status values
- **Workflow Tracking**: Monitor request progression through approval stages
- **Data Quality**: Detect data inconsistencies and formatting issues

### Database Monitoring
- **Request Counts**: Track volumes across different request types
- **Status Distribution**: Understand approval/rejection ratios
- **Data Integrity**: Verify relationships between tables

## 📝 Output Examples

### Status Check Output
```
=== فحص الحالات الموجودة في قاعدة البيانات ===

📋 Experience_Certificate_Requests:
   "قيد المراجعة": 15 طلب
   "موافق": 8 طلب
   "مرفوض": 2 طلب
```

### Request Status Analysis
```
📋 Experience Certificate Requests:
ID 1: John Doe - Status: قيد المراجعة, Final: N/A
ID 2: Jane Smith - Status: موافق, Final: approved
```

### Clearance Data Analysis
```
📋 Clearance_Requests table:
Found 10 clearance requests:
ID 1: Ahmed Ali - Status: قيد المراجعة, Created: 2025-11-01
```

## 🔍 Use Cases

### System Administration
- **Health Monitoring**: Regular status checks to ensure system health
- **Data Quality Assurance**: Identify and fix data inconsistencies
- **Workflow Analysis**: Understand bottlenecks in approval processes

### Development & Debugging
- **Status Normalization**: Verify status mapping implementations
- **Database Troubleshooting**: Diagnose data-related issues
- **Integration Testing**: Validate database state after changes

### Business Intelligence
- **Request Analytics**: Track request volumes and approval rates
- **Performance Monitoring**: Identify slow or stuck processes
- **Compliance Reporting**: Generate status reports for auditing

## ⚙️ Configuration

### Database Connection
Tools use environment variables from `.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=nora
DB_PASSWORD=nora123
DB_NAME=nora_database
```

### Supported Tables
- `Experience_Certificate_Requests`
- `Onboarding_Requests`
- `Clearance_Requests`
- `Delegation_Requests`
- `Request_Approvals`

## 🚨 Troubleshooting

### Connection Issues
1. Verify database server is running
2. Check credentials in `.env` file
3. Ensure database exists and is accessible
4. Test network connectivity to database

### Missing Tables
Some tools may report missing tables if:
- Database schema is incomplete
- Table names are different
- Permissions are insufficient

### Arabic Text Display
If Arabic text appears garbled:
1. Ensure terminal supports UTF-8
2. Check database charset settings
3. Verify proper collation configuration

---

**Last Updated**: November 11, 2025
