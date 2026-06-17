# Tests Directory

This directory contains all test files organized by category and type.

## 📁 Directory Structure

### Database Tests (`database/`)
- **`test-database-flow.js`** - Complete database flow testing (insert, retrieve, count operations)
- **`test-experience-db.js`** - Experience certificate database testing and validation

### Network Tests (`network/`)
- **`test_network_deployment.ps1`** - PowerShell script for testing network deployment
  - Tests server health, frontend pages, API endpoints, and database connectivity
  - Validates deployment at IP address `http://10.99.28.30:3037`

### Backend Tests (`Backend/tests/`)
- Unit tests for various modules (auth, commissioner, contract, health, etc.)
- Integration tests for API endpoints

## 🧪 Running Tests

### Database Tests
```bash
# Test complete database flow
node tests/database/test-database-flow.js

# Test experience certificate functionality
node tests/database/test-experience-db.js
```

### Network Deployment Tests
```powershell
# Run network deployment validation
.\tests\network\test_network_deployment.ps1
```

### Backend Unit Tests
```bash
cd Backend
npm test
```

### Test Coverage
```bash
cd Backend
npm run test:cover
```

## 📊 Test Categories

### Database Integration Tests
- **Connection Testing**: Verify database connectivity
- **CRUD Operations**: Test create, read, update, delete operations
- **Data Validation**: Ensure data integrity and constraints
- **Query Performance**: Basic performance validation

### Network & Deployment Tests
- **Health Checks**: Server and service availability
- **API Endpoint Testing**: Verify all endpoints respond correctly
- **Frontend Page Loading**: Ensure all pages are accessible
- **Cross-Origin Requests**: CORS configuration validation

### Unit Tests
- **Authentication**: Login, token validation, role-based access
- **Business Logic**: Core application functionality
- **API Contracts**: Request/response validation
- **Error Handling**: Exception and error response testing

## 🔧 Test Configuration

### Database Test Setup
Tests use the following database configuration:
- Host: `127.0.0.1`
- User: `nora` 
- Password: `nora123`
- Database: `hospital_management` or `nora_database`

### Network Test Configuration
Network tests target:
- Local server: `http://localhost:3037`
- Network deployment: `http://10.99.28.30:3037`
- Test credentials: `admin@example.com` / `Admin@123`

## 📝 Test Results Interpretation

### Database Tests
- ✅ **Success**: All operations complete without errors
- ❌ **Failure**: Connection issues, query failures, or data inconsistencies

### Network Tests
- ✅ **Green**: Service is accessible and responding correctly
- ❌ **Red**: Service unavailable or returning errors
- 💡 **Yellow**: Informational messages and suggestions

### Backend Tests
- Uses Vitest framework for modern testing
- Includes coverage reporting
- Supports both unit and integration tests

## 🚨 Troubleshooting

### Database Connection Issues
1. Verify database server is running
2. Check credentials in test files
3. Ensure database exists and is accessible
4. Verify network connectivity

### Network Test Failures
1. Ensure backend server is running (`npm run dev`)
2. Check firewall and network settings
3. Verify API endpoints are responding
4. Test database connectivity separately

### Backend Test Issues
1. Install dependencies: `npm install`
2. Check TypeScript compilation: `npm run build`
3. Verify test configuration in `tsconfig.test.json`
4. Review environment variables

---

**Last Updated**: November 11, 2025
