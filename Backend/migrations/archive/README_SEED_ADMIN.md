# Admin Seed Variables (Development)

This migration seeds essential roles and one admin user in a safe, idempotent way.

Important:
- Never commit real secrets or password hashes to source control.
- Provide `@ADMIN_PASSWORD_HASH` at runtime (CI/CD or `mysql` client) as a bcrypt hash.

## Variables

You can override these at runtime:

```sql
SET @ADMIN_EMAIL = 'admin@dev.local';
SET @ADMIN_NAME = 'Dev Admin';
SET @ADMIN_PASSWORD_HASH = '$2b$12$YOUR_SECURE_BCRYPT_HASH_HERE';
```

Table names are configurable (defaults shown):

```sql
SET @T_USERS = 'App_Users';
SET @T_USER_ROLES = 'user_roles';
SET @T_ROLES = 'roles';
```

## Generating a bcrypt hash

Example (Node.js REPL):

```js
// Node 18+
const bcrypt = await import('bcrypt');
const hash = await bcrypt.hash('ChangeMe!123', 12);
console.log(hash);
```

Or using `openssl` and a small script; any standard bcrypt generator is fine.

## Running the migration

```bash
mysql -u root -p hospital_management \
  -e "SET @ADMIN_EMAIL='admin@dev.local'; SET @ADMIN_NAME='Dev Admin'; SET @ADMIN_PASSWORD_HASH='$2b$12$...'; SOURCE Backend/migrations/001_bootstrap_admin.sql;"
```

Idempotency checks:
- Running twice should not error.
- Unique key on `user_roles(user_id, role_id)` exists.
- Admin user exists with `ADMIN` role assigned.

