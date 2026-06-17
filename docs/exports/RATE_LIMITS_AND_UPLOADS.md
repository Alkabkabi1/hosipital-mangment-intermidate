### Per-Route Rate Limits

| Route group | Method | Path | Limit |
|---|---|---|---|
| auth | POST | /api/auth/login | 60/min |
| auth | POST | /api/auth/refresh | 60/min |
| auth | POST | /api/auth/revoke | 60/min |
| admin users | POST | /api/admin/users | 120/min |
| admin users | PUT | /api/admin/users/:id | 120/min |
| admin users | DELETE | /api/admin/users/:id | 60/min |
| admin approvals (sample) | POST | /api/admin/requests/:type/:id/approve | 120/min |
| admin approvals (sample) | POST | /api/admin/requests/:type/:id/reject | 120/min |
| users meta | GET | /api/users/(me/permissions|departments|job-titles) | 100/min |
| roles | POST | /api/roles/refresh-token | 60/min |
| roles | POST | /api/roles/(assign|remove) | 120/min |
| permissions | mixed | /api/permissions/* | 100/60/30 per endpoint |
| role-templates | mixed | /api/role-templates/* | 100/60/30 per endpoint |
| employee create | POST | /api/employee/requests/* | 120/min |
| global | mixed | /api/* | env window/max unless DEV_EASY |

### Upload Constraints

| Endpoint | Field(s) | Max files | Size limit | Type check | AV scan |
|---|---|---|---|---|---|
| POST /api/upload/profile-picture | profilePicture | 1 | UPLOAD_MAX_SIZE | validateMimeType | optional (UPLOAD_SCAN_ENABLED) |
| POST /api/upload/documents | documents[] | 10 | UPLOAD_MAX_SIZE | validateMimeType | optional |
| POST /api/upload/:type-documents | documents[] | 10 | UPLOAD_MAX_SIZE | validateMimeType | optional |
| GET /api/upload/allowed-types | - | - | - | getAllowedMimeTypes | - |


