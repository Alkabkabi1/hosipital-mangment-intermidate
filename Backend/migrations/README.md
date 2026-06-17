# Hospital Management Database Migrations

## 🎯 Single Source of Truth

This directory contains **one unified migration file** that sets up the complete database schema:

### **Main Migration File**
- **`000_complete_hospital_schema.sql`** - Complete database schema with all features

### **What It Includes**
- ✅ All core tables (Users, Employees, Departments, Job Titles)
- ✅ Request management (Onboarding, Clearance, Delegation)
- ✅ Role-based access control
- ✅ Audit logging system
- ✅ Commissioner delegation system
- ✅ Foreign key constraints and indexes
- ✅ Data normalization
- ✅ Default admin user setup
- ✅ Sample data for development

## 🚀 How to Use

### **For Fresh Database Setup**
```bash
# Connect to MySQL
mysql -u nora -p

# Run the complete schema
source Backend/migrations/000_complete_hospital_schema.sql
```

### **For Production Setup**
1. **Review the admin password hash** in the script
2. **Change the default credentials** before running
3. **Remove sample data section** if not needed
4. Run the script on your production database

## 📋 Default Credentials

**Admin User (CHANGE IN PRODUCTION!):**
- Email: `admin@dev.local`
- Password: `admin123`
- Role: `admin`

## 🗂️ Archive Folder

The `archive/` folder contains the old migration files that were consolidated:
- `001_bootstrap_admin.sql`
- `002_fk_constraints.sql`
- `003_commissioner_tickets.sql`
- `004_status_canonical.sql`
- `005_department_jobtitle_normalize.sql`
- `006_audit_events.sql`
- `007_add_username.sql`
- `unified_hospital_management_schema.sql`
- `README_SEED_ADMIN.md`

These are kept for reference but **should not be used** anymore.

## ⚠️ Important Notes

1. **Always backup** your database before running migrations
2. **Test on development** environment first
3. **Review security settings** before production use
4. The unified migration is **idempotent** - safe to run multiple times
5. All tables use **utf8mb4** encoding for proper Arabic support

## 🔧 Troubleshooting

If you encounter issues:
1. Check MySQL version compatibility (5.7+ recommended)
2. Ensure proper user permissions
3. Verify database encoding settings
4. Check the error logs for specific issues

## 📞 Support

For issues with the database schema, check:
- Table relationships and foreign keys
- Index performance
- Data integrity constraints
- User permissions and roles
