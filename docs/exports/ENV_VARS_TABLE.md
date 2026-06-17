### Environment Variables

| Variable | Default | Required | Notes |
|---|---|---|---|
| NODE_ENV | development | no | development|staging|production|test |
| PORT | 3037 | no | API port |
| HOST | - | no | Bind host |
| DEV_EASY | false | no | Relaxed local dev (CORS/CSP/rate-limit) |
| DB_HOST | - | yes | Database host |
| DB_PORT | 3306 | no | Database port |
| DB_NAME | - | yes | Database name |
| DB_USER | - | yes | Database user |
| DB_PASSWORD | '' | no | Database password |
| DB_CONNECTION_LIMIT | 10 | no | Pool size |
| JWT_SECRET | - | yes | Min 32 chars |
| ACCESS_TTL | 15m | no | Token TTL (s|m|h|d) |
| REFRESH_TTL | 7d | no | Refresh TTL |
| CORS_ALLOWED_ORIGINS | - | no | CSV; merges legacy CORS_ORIGINS |
| CORS_ORIGINS | - | no | Legacy; merged if set |
| COMMISSIONER_SERVER_ENABLED | - | no | Feature flag |
| UPLOAD_SCAN_ENABLED | - | no | Enable AV scan |
| TRUST_PROXY | - | no | Trust proxy headers |
| LOG_LEVEL | info | no | fatal|error|warn|info|debug|trace |
| RATE_LIMIT_WINDOW_MS | 900000 | no | Global window ms |
| RATE_LIMIT_MAX | 100 | no | Global max per window |
| ENABLE_REQUEST_LOGGING | false | no | Verbose request logs |
| DEFAULT_ADMIN_EMAIL | - | no | Bootstrap |
| DEFAULT_ADMIN_PASSWORD | - | no | Bootstrap (min 8) |
| DEFAULT_ADMIN_NAME | - | no | Bootstrap |
| DEFAULT_ADMIN_EMPLOYEE_NUMBER | - | no | Bootstrap |
| DEFAULT_ADMIN_DEPARTMENT_CODE | - | no | Bootstrap |
| DEFAULT_ADMIN_PHONE | - | no | Bootstrap |
| DEFAULT_ADMIN_FULL_NAME_AR | - | no | Bootstrap |
| DEFAULT_ADMIN_POSITION | - | no | Bootstrap |
| UPLOAD_MAX_SIZE | 10485760 | no | 10 MB |
| UPLOAD_ALLOWED_TYPES | - | no | CSV MIME types |
| UPLOAD_STORAGE_PATH | - | no | Upload directory |


