### Frontend Page → API Endpoints

| Page | Endpoints |
|---|---|
| admin-dashboard.html | /api/admin/stats; /api/approvals/pending; /api/admin/users; /api/admin/requests/recent; /api/admin/requests/summary |
| admin-approval-status.html | /api/approvals/pending; /api/requests/:type/:id/approvals; /api/admin/approvals/fix-request |
| admin-role-management.html | /api/roles; /api/roles/users; /api/roles/assign; /api/roles/remove; /api/users/departments; /api/users/job-titles |
| admin-credentials-approval.html | /api/employee/admin/pending-credentials |
| admin-commissioner.html | /api/commissioner/tickets; /api/commissioner/tickets/:id/revoke |
| admin-unified-inbox.html | /api/admin/requests/recent; /api/admin/requests/summary |
| employee-dashboard.html | /api/employee/requests; /api/approvals/pending |
| employee-profile.html | /api/profile/me (GET, PUT); /api/profile/change-password |
| assignment-request.html | /api/assignment |
| assignment-termination-request.html | /api/assignment-termination |
| internal-transfer-request.html | /api/internal-transfer |
| clearance-request.html | /api/employee/requests/clearance; /api/clearance/:id/status; /api/clearance/admin/pending |
| delegation-request.html | /api/delegation; /api/delegation/mine |
| employee-certificate-request.html | /api/experience-certificate |
| employee-exit-request.html | /api/exit-request |
| leave (various) | /api/leave-request; /api/leave-request/mine; /api/leave-request/:id/(approve|reject|status|comments|history) |
| uploads (various) | /api/upload/profile-picture; /api/upload/documents; /api/upload/:type-documents; /api/upload/info/:filename; /api/upload/:filename |


