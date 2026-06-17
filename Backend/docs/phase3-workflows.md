# Phase 3 Workflow Notes

## Data Model Summary

### Clearance
- Clearance_Forms: employee-initiated separation workflow with status_id pointing to ClearanceStatuses.
- Clearance_Signatures: captures department sign-off with unique constraint per department.
- ClearanceStatuses: lookup table describing Pending/Approved/Rejected states.

### Delegation
- delegation_forms: delegation request with textual status column.
- Delegation_Signatures: department approvals for delegation.
- DelegationStatuses: audit log of status changes (optional but supported).

### Onboarding
- onboarding_forms: onboarding requests (start date, department, supervisor) with textual status column.
- Onboarding_Signatures: departmental approvals for onboarding steps.

### Shared Tables
- Departments: signature routing / department metadata.
- App_Users & Employees: associate accounts to employee records that drive workflow ownership.

## Module Responsibilities

| Module     | Responsibilities |
|------------|------------------|
| Clearance  | Employee CRUD lifecycle, status transitions via status_id, departmental sign-off, admin reporting. |
| Delegation | Delegation lifecycle with textual statuses, signature capture, admin monitoring. |
| Onboarding | Onboarding pipeline (request/start dates, departmental approvals, supervisor metadata). |
| Shared     | Status normalization, signature persistence, employee lookup helpers, audit-friendly transitions. |

## Implemented Services
- Repository layer per workflow encapsulating SQL (forms, admin views, status updates).
- Service layer orchestrating validation, transitions, and authorization checks.
- Controller layer exposing employee/admin endpoints with Zod validation and role-aware middleware.
- Shared signature helper (src/shared/utils/signatures.ts) for duplicate-check + insert across clearance/delegation/onboarding.
- Shared status helper (src/shared/utils/status.ts) for clearance status caching/normalization and workflow status enums.

## Notes
- Clearance relies on numeric status IDs stored in ClearanceStatuses.
- Delegation/Onboarding store textual statuses normalized via STANDARD_WORKFLOW_STATUSES before persisting.
- Integration specs seed employees, roles, departments, and walk the create ? list ? approve ? sign flows for each module.
