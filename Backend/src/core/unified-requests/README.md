# Unified Request System - Hybrid Backend Architecture

This module implements a hybrid backend architecture that combines the comprehensive field handling from the `employee-requests` service with the clean service patterns from dedicated modules (`clearance`, `onboarding`, etc.). It provides a single source of truth for all request operations while maintaining backward compatibility.

## Architecture Overview

### Hybrid Approach Benefits
- **Comprehensive Field Handling**: Preserves complex form data processing capabilities
- **Clean Service Patterns**: Maintains modular, testable service architecture
- **Single Source of Truth**: Eliminates dual implementation conflicts
- **Backward Compatibility**: Supports existing API endpoints during transition
- **Consistent Validation**: Unified validation schemas across all request types

## Module Structure

```
unified-requests/
├── index.ts                      # Module exports
├── unified-request.service.ts     # Core hybrid service layer
├── unified-request.controller.ts  # Unified API controllers  
├── unified-request.routes.ts      # Centralized routing
├── unified-request.schema.ts      # Validation schemas
└── README.md                     # This documentation
```

## Core Components

### 1. UnifiedRequestService Class

The main service class that handles all request operations:

```typescript
class UnifiedRequestService {
  // Create any type of request with unified interface
  static async createRequest(data: CreateRequestData): Promise<{ id: number; reference_number: string }>
  
  // Retrieve requests with flexible filtering
  static async getRequests(options: RequestQueryOptions): Promise<any[]>
  
  // Update requests with consistent interface
  static async updateRequest(requestType: RequestType, requestId: number, updateData: UpdateRequestData): Promise<void>
}
```

**Key Features:**
- Dynamic table mapping based on request type
- Type-specific field validation and mapping
- Automatic reference number generation
- Multi-approval workflow integration
- JSON payload handling for complex forms

### 2. Comprehensive Validation Schemas

Unified validation using Zod schemas for all 11 request types:

```typescript
// Base schema inherited by all request types
const baseRequestSchema = z.object({
  employee_email: email,
  employee_name: nonEmptyString,
  employee_dept: optionalString,
  request_date: isoDate.optional(),
  status: z.string().optional(),
});

// Type-specific schemas
export const clearanceRequestSchema = baseRequestSchema.extend({...});
export const onboardingRequestSchema = z.union([simpleOnboardingSchema, comprehensiveOnboardingSchema]);
// ... all other request types
```

**Validation Features:**
- Type-specific field validation
- Support for both simple and comprehensive forms (onboarding)
- Multi-approval system field validation
- Backward compatibility with legacy field names

### 3. Unified API Interface

Single set of endpoints for all request operations:

```
POST   /api/unified-requests                    # Create any request type
GET    /api/unified-requests                    # Get all requests (filtered)
GET    /api/unified-requests/my-requests        # Get user's requests
GET    /api/unified-requests/:type/:id          # Get specific request
PATCH  /api/unified-requests/:type/:id          # Update specific request

# Admin endpoints
GET    /api/unified-requests/admin/stats        # Admin dashboard statistics
GET    /api/unified-requests/admin/all          # All requests for admin
POST   /api/unified-requests/admin/:type/:id/approve  # Approve request
POST   /api/unified-requests/admin/:type/:id/reject   # Reject request

# Type-specific convenience endpoints
POST   /api/unified-requests/clearance          # Create clearance request
POST   /api/unified-requests/onboarding         # Create onboarding request
# ... endpoints for all 11 request types
```

## Request Types Supported

| Type | Description | Schema | Special Features |
|------|-------------|--------|------------------|
| `clearance` | Employee termination/clearance | `clearanceRequestSchema` | Field name consolidation |
| `onboarding` | Employee onboarding/hiring | `onboardingRequestSchema` | Simple + comprehensive forms |
| `delegation` | Authority delegation | `delegationRequestSchema` | Date range validation |
| `certificate` | Identity certificate | `certificateRequestSchema` | Document number handling |
| `experience` | Experience certificate | `experienceRequestSchema` | Duration calculations |
| `exit` | Exit interviews/feedback | `exitRequestSchema` | Text field processing |
| `assignment` | Role assignments | `assignmentRequestSchema` | Multi-approval enabled |
| `assignment_termination` | Assignment endings | `assignmentTerminationRequestSchema` | Reference to original |
| `internal_transfer` | Internal transfers | `internalTransferRequestSchema` | Department validation |
| `maternity_leave` | Maternity leave | `maternityLeaveRequestSchema` | Medical info handling |
| `housing_allowance` | Housing allowance | `housingAllowanceRequestSchema` | Financial calculations |

## Usage Examples

### Creating a Request

```typescript
// Create a clearance request
const clearanceData = {
  request_type: 'clearance',
  form_data: {
    employee_email: 'john.doe@hospital.com',
    employee_name: 'John Doe',
    employee_dept: 'IT',
    last_work_day: '2025-02-01',
    clearance_type: 'end_of_service',
    reason: 'Voluntary resignation'
  }
};

const result = await UnifiedRequestService.createRequest(clearanceData);
// Returns: { id: 123, reference_number: 'CLR-20250114-0001' }
```

### Querying Requests

```typescript
// Get all pending clearance and onboarding requests
const requests = await UnifiedRequestService.getRequests({
  request_type: ['clearance', 'onboarding'],
  status: ['قيد الاعتماد'],
  limit: 50
});
```

### Updating a Request

```typescript
// Approve a request
await UnifiedRequestService.updateRequest(
  'clearance',
  123,
  {
    status: 'مكتمل',
    final_decision: 'approved',
    decision_note: 'Approved by HR manager'
  },
  approverId
);
```

## Conflict Resolution

### Clearance Requests
**Problem**: Two different schemas with conflicting field names
- `last_working_day` (old) → `last_work_day` (unified)
- `status_id` (old) → `status` with lookup (unified)
- `rejection_reason` (old) → `decision_note` (unified)

**Solution**: Field mapping in `applyTypeSpecificFieldMapping()` method

### Onboarding Requests  
**Problem**: Simple vs comprehensive form implementations
- Simple: Basic fields only
- Comprehensive: 20+ fields with JSON payload

**Solution**: Union schema that accepts both formats:
```typescript
export const onboardingRequestSchema = z.union([
  simpleOnboardingSchema,
  comprehensiveOnboardingSchema
]);
```

## Backward Compatibility

### Legacy Endpoint Support
The system maintains backward compatibility with existing endpoints:

```typescript
// Legacy employee-requests endpoints still work
POST /api/unified-requests/employee/requests/clearance
POST /api/unified-requests/employee/requests/onboarding
GET  /api/unified-requests/employee/requests/clearance
```

These endpoints internally transform requests to unified format.

### Field Name Mapping
Legacy field names are automatically mapped:
- `lastWorkDay` → `last_work_day`
- `jobTitle` → `position_title`
- Form composition: `firstName + secondName + thirdName` → `employee_name`

## Multi-Approval Integration

All request types now support multi-approval workflows:

```typescript
// Multi-approval fields added to all tables
approval_stage: 'pending' | 'in_review' | 'completed' | 'rejected'
total_approvers: number
approved_count: number  
final_decision: 'pending' | 'approved' | 'rejected'
last_approval_at: timestamp
```

## Reference Number Management

Centralized reference number generation prevents collisions:

```typescript
const prefixes = {
  clearance: 'CLR',
  onboarding: 'ONB', 
  delegation: 'DLG',
  // ... all request types
};

// Generated format: PREFIX-YYYYMMDD-SEQUENCE
// Example: CLR-20250114-0001
```

## Error Handling

Comprehensive error handling with specific error codes:

```typescript
// Validation errors
{ code: 'VALIDATION_ERROR', details: [...] }

// Request creation failures  
{ code: 'REQUEST_CREATION_FAILED', message: '...' }

// Authentication issues
{ code: 'AUTHENTICATION_REQUIRED' }

// Not found errors
{ code: 'REQUEST_NOT_FOUND' }
```

## Performance Optimizations

### Database Query Optimization
- Dynamic UNION queries for multi-type requests
- Proper indexing on all searchable fields
- Connection pooling with transaction support

### Caching Strategy
- Status mapping caching
- Reference number sequence caching  
- Request type metadata caching

## Integration with Existing System

### Phase 1: Parallel Operation
- Unified system runs alongside existing modules
- Both systems write to same database tables
- Gradual migration of endpoints

### Phase 2: Full Migration
- All requests route through unified system
- Legacy modules deprecated
- Clean up duplicate code

### Phase 3: Optimization
- Performance tuning based on usage patterns
- Advanced multi-approval workflows
- Enhanced reporting and analytics

## Testing Strategy

### Unit Tests
- Service layer methods
- Validation schema edge cases
- Field mapping transformations

### Integration Tests  
- End-to-end request creation workflows
- Multi-approval process testing
- Backward compatibility validation

### Load Tests
- High-volume request creation
- Complex query performance
- Concurrent approval workflows

## Deployment Considerations

### Database Migration
1. Deploy unified schema alongside existing tables
2. Data migration scripts preserve 100% data integrity  
3. Gradual cutover to unified system
4. Remove legacy tables after validation

### API Versioning
- Unified endpoints under `/api/v2/requests`
- Legacy endpoints maintained during transition
- Clear deprecation timeline and migration guide

### Monitoring
- Request creation success rates by type
- Average approval processing times
- Error rate monitoring and alerting
- Performance metrics tracking
