-- Add foreign key constraints and supporting indexes (idempotent, MySQL-safe)
-- Tables use configurable variables; override in CI as needed.

SET @T_USERS := COALESCE(@T_USERS, 'App_Users');

-- Helper: add index if missing
-- Params: table, index_name, column
SET @table := NULL; SET @index := NULL; SET @column := NULL; SET @sql := NULL; SET @exists := NULL;

-- Ensure indexes for FK columns on Onboarding_Requests
SET @table := 'Onboarding_Requests';
SET @index := 'idx_onb_created_by_user'; SET @column := 'created_by_user';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_onb_approved_by'; SET @column := 'approved_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_onb_rejected_by'; SET @column := 'rejected_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure indexes for FK columns on Clearance_Requests
SET @table := 'Clearance_Requests';
SET @index := 'idx_clr_created_by_user'; SET @column := 'created_by_user';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_clr_approved_by'; SET @column := 'approved_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_clr_rejected_by'; SET @column := 'rejected_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure indexes for FK columns on Delegation_Requests
SET @table := 'Delegation_Requests';
SET @index := 'idx_dlg_created_by_user'; SET @column := 'created_by_user';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_dlg_approved_by'; SET @column := 'approved_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index := 'idx_dlg_rejected_by'; SET @column := 'rejected_by';
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = @table AND index_name = @index
);
SET @sql := IF(@exists = 0 AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name=@table AND column_name=@column),
  CONCAT('CREATE INDEX ', @index, ' ON ', @table, ' (', @column, ')'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add FKs to users table (if columns exist and constraint missing)
-- Helper procedure pattern per column
-- Onboarding_Requests.created_by_user -> users.id
SET @table := 'Onboarding_Requests'; SET @column := 'created_by_user'; SET @constraint := 'fk_onb_created_by_user';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clearance_Requests.created_by_user
SET @table := 'Clearance_Requests'; SET @column := 'created_by_user'; SET @constraint := 'fk_clr_created_by_user';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Delegation_Requests.created_by_user
SET @table := 'Delegation_Requests'; SET @column := 'created_by_user'; SET @constraint := 'fk_dlg_created_by_user';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- approved_by / rejected_by variants (if columns exist)
SET @table := 'Onboarding_Requests'; SET @column := 'approved_by'; SET @constraint := 'fk_onb_approved_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @table := 'Onboarding_Requests'; SET @column := 'rejected_by'; SET @constraint := 'fk_onb_rejected_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @table := 'Clearance_Requests'; SET @column := 'approved_by'; SET @constraint := 'fk_clr_approved_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @table := 'Clearance_Requests'; SET @column := 'rejected_by'; SET @constraint := 'fk_clr_rejected_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @table := 'Delegation_Requests'; SET @column := 'approved_by'; SET @constraint := 'fk_dlg_approved_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @table := 'Delegation_Requests'; SET @column := 'rejected_by'; SET @constraint := 'fk_dlg_rejected_by';
SET @sql := IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@column)
  AND NOT EXISTS(SELECT 1 FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND constraint_name=@constraint),
  CONCAT('ALTER TABLE ', @table, ' ADD CONSTRAINT ', @constraint, ' FOREIGN KEY (', @column, ') REFERENCES ', @T_USERS, '(id) ON DELETE SET NULL'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

