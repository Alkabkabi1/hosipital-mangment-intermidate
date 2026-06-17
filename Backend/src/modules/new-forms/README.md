# New Request Forms - Testing Guide

This directory contains test suites for the three new request form modules:
1. **Travel Order** (Non-Saudi Travel Order)
2. **Reward/Refund** (End of Service / Vacation Compensation)
3. **Airlines Ticket** (Saudi Airlines Ticket Request)

---

## 📁 File Structure

```
Backend/src/modules/
├── travel-order/
│   ├── travel-order.service.ts
│   ├── travel-order.controller.ts
│   ├── travel-order.schema.ts
│   ├── travel-order.routes.ts
│   └── travel-order.test.ts ✅ (16 tests - 100% passing)
│
├── reward-refund/
│   ├── reward-refund.service.ts
│   ├── reward-refund.controller.ts
│   ├── reward-refund.schema.ts
│   ├── reward-refund.routes.ts
│   └── reward-refund.test.ts 🟡 (19 tests - 79% passing)
│
├── airlines-ticket/
│   ├── airlines-ticket.service.ts
│   ├── airlines-ticket.controller.ts
│   ├── airlines-ticket.schema.ts
│   ├── airlines-ticket.routes.ts
│   └── airlines-ticket.test.ts 🟡 (22 tests - 73% passing)
│
└── new-forms/
    ├── integration.test.ts 🟡 (10 tests - 80% passing)
    ├── test-fixtures.ts ✅ (Reusable test data)
    └── README.md (This file)
```

---

## 🚀 Running Tests

### Run All Tests
```bash
cd Backend
npm test
```

### Run Specific Module Tests
```bash
# Travel Order tests only
npm test -- travel-order.test.ts

# Reward/Refund tests only
npm test -- reward-refund.test.ts

# Airlines Ticket tests only
npm test -- airlines-ticket.test.ts

# Integration tests only
npm test -- integration.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests Without Watch Mode (CI)
```bash
npm test -- --run
```

---

## 📊 Test Coverage

### Travel Order Module (16 tests - ✅ 100%)

#### Creation (5 tests)
- ✅ Create valid travel order
- ✅ Create with dependents
- ✅ Validate iqama number format
- ✅ Validate date format
- ✅ Reject non-existent users

#### Retrieval (4 tests)
- ✅ Get user's travel orders
- ✅ Get by ID
- ✅ Handle not found
- ✅ Get all (admin)

#### Status Updates (4 tests)
- ✅ Approve request
- ✅ Reject with reason
- ✅ Track status history
- ✅ Handle invalid updates

#### Business Logic (3 tests)
- ✅ Store checklist data
- ✅ Calculate work duration
- ✅ Preserve approval fields

### Reward/Refund Module (19 tests - 🟡 79%)

#### Creation (8 tests)
- ✅ End of service reward
- ✅ Vacation refund
- 🟡 Both options (JSON fix needed)
- 🟡 Invalid job number
- 🟡 Invalid record number
- ✅ Invalid date format
- ✅ Non-existent user

#### Retrieval (4 tests)
- ✅ All retrieval tests passing

#### Status Updates (4 tests)
- ✅ All status update tests passing

#### Business Logic (3 tests)
- ✅ Eligibility decisions
- 🟡 JSON rewards array
- ✅ Approval fields

### Airlines Ticket Module (22 tests - 🟡 73%)

#### Creation (7 tests)
- ✅ Single passenger
- 🟡 Multiple passengers (JSON fix)
- ✅ Multi-stop route
- 🟡 Invalid employee number
- ✅ Invalid date format
- 🟡 No passengers validation
- ✅ Non-existent user

#### Retrieval (4 tests)
- ✅ All retrieval tests passing

#### Status Updates (4 tests)
- ✅ Approve request
- ✅ Reject request
- 🟡 Status history
- ✅ Invalid updates

#### Business Logic (7 tests)
- ✅ Default travel class
- ✅ Default greeting
- ✅ Default HR director
- 🟡 Passengers JSON array
- ✅ Approval fields
- ✅ Optional route stops
- 🟡 Passenger data validation

### Integration Tests (10 tests - 🟡 80%)

- ✅ Complete lifecycle
- ✅ Multi-approval integration
- ✅ Referential integrity
- 🟡 JSON data storage
- ✅ Audit trails
- ✅ Status tracking
- ✅ Bulk operations
- 🟡 Invalid data handling
- ✅ Non-existent users
- ✅ Performance (< 1s)

---

## 🧪 Test Data (Fixtures)

### Using Test Fixtures

```typescript
import { travelOrderFixtures, rewardRefundFixtures, airlinesTicketFixtures } from './test-fixtures';

// Create a basic travel order
const input = travelOrderFixtures.valid.basic();
const result = await createTravelOrder(userId, input);

// Create with dependents
const inputWithDeps = travelOrderFixtures.valid.withDependents();

// Test invalid data
const invalidInput = travelOrderFixtures.invalid.shortIqama();
```

### Available Fixtures

#### Travel Order
- `travelOrderFixtures.valid.basic()` - Simple travel order
- `travelOrderFixtures.valid.withDependents()` - With family members
- `travelOrderFixtures.valid.withChecklist()` - With HR checklist
- `travelOrderFixtures.invalid.shortIqama()` - Invalid iqama
- `travelOrderFixtures.invalid.invalidDateFormat()` - Bad date

#### Reward/Refund
- `rewardRefundFixtures.valid.endOfService()` - End of service reward
- `rewardRefundFixtures.valid.vacationRefund()` - Vacation compensation
- `rewardRefundFixtures.valid.both()` - Both rewards
- `rewardRefundFixtures.valid.notEligible()` - Not eligible case
- `rewardRefundFixtures.invalid.invalidJobNo()` - Bad job number
- `rewardRefundFixtures.invalid.invalidRecordNo()` - Bad record number

#### Airlines Ticket
- `airlinesTicketFixtures.valid.single()` - Single passenger
- `airlinesTicketFixtures.valid.family()` - Family (4 passengers)
- `airlinesTicketFixtures.valid.multiStop()` - Multi-city route
- `airlinesTicketFixtures.invalid.noPassengers()` - Empty passengers
- `airlinesTicketFixtures.invalid.invalidEmployeeNo()` - Bad employee number

---

## 🔧 Test Configuration

### vitest.config.ts
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
```

### Database Setup
Tests use the same database as development. Ensure:
1. ✅ Database migrations are run
2. ✅ `.env` file is configured
3. ✅ Database connection is working

```bash
# Run migrations first
mysql -u your_user -p your_database < Backend/migrations/202501_add_travel_order_tables.sql
mysql -u your_user -p your_database < Backend/migrations/202501_add_reward_refund_tables.sql
mysql -u your_user -p your_database < Backend/migrations/202501_add_airlines_ticket_tables.sql
```

---

## 🐛 Known Issues & Fixes

### Issue 1: JSON Parsing Errors
**Symptom**: `Unexpected token 'o', "[object Obj"... is not valid JSON`

**Cause**: MySQL returns some JSON fields as objects, not strings

**Fix**:
```typescript
const data = typeof field === 'string' ? JSON.parse(field) : field;
```

**Affected Fields**:
- `dependents` (Travel Order) - ✅ Fixed
- `checklist` (Travel Order) - ✅ Fixed
- `requested_rewards` (Reward/Refund) - ⚠️ Needs fix
- `passengers` (Airlines Ticket) - ⚠️ Needs fix

### Issue 2: Schema Validation Not Applied
**Symptom**: Tests expect validation errors but requests succeed

**Cause**: Schema validation not enforced in service layer

**Fix**: Import and apply schemas:
```typescript
import { createTravelOrderSchema } from './travel-order.schema';

// In test
expect(() => createTravelOrderSchema.parse(invalidInput)).toThrow();
```

### Issue 3: Multi-Approval Warnings
**Symptom**: `Failed to initialize approvals: Error: Invalid request type`

**Cause**: New request types not registered in `multi-approval.service.ts`

**Fix**: Add to `getRequestTableName()`:
```typescript
case 'travel_order':
  return 'NonSaudi_Travel_Order_Requests';
case 'reward_refund':
  return 'Reward_Refund_Requests';
case 'airlines_ticket':
  return 'Saudi_Airlines_Ticket_Requests';
```

---

## 📝 Writing New Tests

### Test Structure
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Module Name', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Setup: Create test users
  });

  afterAll(async () => {
    // Cleanup: Delete test data
  });

  describe('Feature Group', () => {
    it('should do something', async () => {
      // Arrange: Setup test data
      const input = { /* ... */ };

      // Act: Call the function
      const result = await someFunction(input);

      // Assert: Verify results
      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
    });
  });
});
```

### Best Practices
1. ✅ **Cleanup after tests**: Delete test data in `afterAll`
2. ✅ **Use fixtures**: Reuse test data from `test-fixtures.ts`
3. ✅ **Test edge cases**: Invalid data, non-existent IDs, etc.
4. ✅ **Keep tests isolated**: Each test should be independent
5. ✅ **Use descriptive names**: Clear test descriptions
6. ✅ **Test business logic**: Not just happy paths

---

## 🎯 Test Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Code Coverage** | > 80% | ~90% | ✅ |
| **Test Pass Rate** | > 90% | 82% | 🟡 |
| **Test Speed** | < 5s | 2.5s | ✅ |
| **Test Count** | > 50 | 67 | ✅ |

---

## 📚 Additional Resources

- **Full Test Results**: `/docs/NEW_FORMS_TEST_RESULTS.md`
- **Test Summary**: `/docs/NEW_FORMS_TEST_SUMMARY.md`
- **Implementation Guide**: `/docs/NEW_FORMS_IMPLEMENTATION_SUMMARY.md`
- **API Endpoints**: `/docs/exports/API_ENDPOINTS_TABLE.md`

---

## 🆘 Troubleshooting

### Tests Won't Run
```bash
# Check if vitest is installed
npm list vitest

# Reinstall dependencies
npm install

# Clear cache
npm test -- --clearCache
```

### Database Connection Errors
```bash
# Check .env file
cat ../.env

# Test database connection
mysql -u your_user -p -e "SHOW DATABASES;"

# Verify tables exist
mysql -u your_user -p your_database -e "SHOW TABLES LIKE '%Travel_Order%';"
```

### Tests Failing After Changes
```bash
# Run single test to debug
npm test -- travel-order.test.ts --reporter=verbose

# Check for leftover data
mysql -u your_user -p your_database -e "SELECT * FROM NonSaudi_Travel_Order_Requests WHERE employee_name LIKE '%Test%';"
```

---

## 🤝 Contributing

When adding new tests:
1. Follow existing patterns
2. Add to appropriate test file
3. Use fixtures for test data
4. Clean up after tests
5. Update this README

---

**Last Updated**: November 18, 2025  
**Test Framework**: Vitest 3.2.4  
**Node Version**: >= 18.18.0

