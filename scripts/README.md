# Scripts Directory

This directory contains utility scripts for various operational, development, and data management tasks.

## 📁 Directory Structure

### Data Import Scripts (`data-import/`)
- **`import_employees.py`** - Comprehensive employee data import script from Excel files
  - Supports both legacy and modern database schemas
  - Automatically creates departments and job titles
  - Handles Arabic names and data sanitization
  - Creates App_Users accounts for employees with email addresses
- **`الجديد هاني.xlsx`** - Sample Excel data file for employee import

### Operational Scripts (`ops/`)
- Deployment and operational management scripts
- System monitoring and maintenance utilities
- Production environment management tools

### CI/CD Scripts (`ci/`)
- Continuous integration and deployment scripts
- Automated testing and build processes
- Pipeline configuration utilities

### Development Scripts (`dev/`)
- Development environment setup scripts
- Database development utilities
- Local development helpers

## 🔧 Usage Instructions

### Employee Data Import
```bash
# Prerequisites
pip install mysql-connector-python openpyxl

# Place Excel file in the scripts/data-import directory
cd scripts/data-import

# Run the import script
python import_employees.py
```

### Script Categories

#### Data Management
- **Employee Import**: Bulk import of employee data from Excel
- **Data Validation**: Scripts to verify data integrity
- **Database Seeding**: Initial data population scripts

#### System Operations
- **Deployment**: Production deployment automation
- **Monitoring**: System health and performance monitoring
- **Maintenance**: Regular maintenance and cleanup tasks

#### Development Tools
- **Environment Setup**: Local development configuration
- **Database Tools**: Schema management and migrations
- **Testing Utilities**: Test data generation and validation

## 📋 Employee Import Script Features

### Schema Compatibility
- **Legacy Schema**: Supports older database structures
- **Modern Schema**: Works with updated table designs
- **Auto-Detection**: Automatically detects schema differences

### Data Processing
- **Name Parsing**: Intelligent Arabic name splitting
- **Email Validation**: Handles duplicate and placeholder emails
- **Phone Sanitization**: Cleans and formats phone numbers
- **Gender Detection**: Infers gender from names and job titles

### Department & Job Title Management
- **Auto-Creation**: Creates missing departments and job titles
- **Categorization**: Intelligent categorization of roles and departments
- **Code Generation**: Automatic generation of department and job title codes

### User Account Creation
- **App_Users Integration**: Creates user accounts for employees with emails
- **Role Assignment**: Intelligent role assignment based on job titles
- **Default Passwords**: Sets secure default passwords for new accounts

## 🔍 Data Import Process

### 1. File Detection
- Automatically finds Excel files in the current directory
- Supports `.xlsx` format files
- Processes the first sheet of the workbook

### 2. Data Validation
- Sanitizes all input data
- Handles Arabic text encoding
- Validates email formats and phone numbers
- Detects and handles duplicate emails

### 3. Database Preparation
- Detects existing departments and job titles
- Creates missing entries with auto-generated codes
- Builds lookup caches for efficient processing

### 4. Batch Processing
- Processes data in configurable batch sizes (default: 200)
- Commits changes in batches for better performance
- Provides progress feedback during import

### 5. User Account Creation
- Creates App_Users records for employees with valid emails
- Assigns roles based on job titles and positions
- Sets default password: "Admin@123" (users must change on first login)

## ⚙️ Configuration

### Database Connection
The import script uses these connection settings:
```python
connection = mysql.connector.connect(
    host='localhost',
    user='nora',
    password='nora123',
    database='hospital_management'
)
```

### Excel File Format
Expected columns (in order):
1. Full Name (Arabic)
2. National ID
3. Employee Number
4. Nationality
5. Department Name
6. Job Title
7. Phone Number
8. Email Address
9. Job Type (1=Saudi/Permanent, 2=Resident/Contract, 4=Visitor/Temporary)

### Role Assignment Logic
- **Manager**: Contains keywords like 'مدير', 'رئيس', 'مشرف'
- **HR**: Contains 'موارد بشرية', 'hr'
- **IT**: Contains 'تقنية', 'it', 'حاسوب'
- **Finance**: Contains 'مالية', 'محاسب', 'finance'
- **Employee**: Default role for all others

## 🚨 Troubleshooting

### Common Issues

#### Database Connection
```
Error: Access denied for user
Solution: Verify database credentials and permissions
```

#### Excel File Format
```
Error: Unexpected spreadsheet format
Solution: Ensure Excel file has at least 8 columns in correct order
```

#### Arabic Text Issues
```
Error: Character encoding problems
Solution: Ensure database charset is set to utf8mb4
```

#### Duplicate Emails
```
Warning: Duplicate email addresses found
Solution: Script automatically handles duplicates by assigning to first occurrence only
```

### Performance Optimization
- Use batch processing for large datasets
- Ensure database indexes are in place
- Run during off-peak hours for production imports

### Data Quality Tips
1. **Clean Source Data**: Remove empty rows and invalid entries
2. **Standardize Formats**: Ensure consistent phone and email formats
3. **Validate Names**: Check for proper Arabic name formatting
4. **Review Departments**: Ensure department names are consistent

---

**Last Updated**: November 11, 2025
