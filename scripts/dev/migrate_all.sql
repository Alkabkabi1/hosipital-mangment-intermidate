-- Idempotent migration bundle (dev only)
SOURCE Backend/migrations/001_bootstrap_admin.sql;
SOURCE Backend/migrations/002_fk_constraints.sql;
SOURCE Backend/migrations/003_commissioner_tickets.sql;
SOURCE Backend/migrations/004_status_canonical.sql;
SOURCE Backend/migrations/005_department_jobtitle_normalize.sql;
SOURCE Backend/migrations/006_audit_events.sql;

