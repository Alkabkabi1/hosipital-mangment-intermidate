-- Commissioner tickets table for serverized commissioner feature (idempotent)

SET @T_USERS := COALESCE(@T_USERS, 'App_Users');

CREATE TABLE IF NOT EXISTS Commissioner_Tickets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issuer_user_id   INT             NOT NULL,
  subject_user_id  INT             NOT NULL,
  scopes_json      LONGTEXT        NOT NULL,
  valid_from       DATETIME        NOT NULL,
  valid_to         DATETIME        NOT NULL,
  revoked_at       DATETIME        NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comm_subject_valid_to (subject_user_id, valid_to),
  KEY idx_comm_valid_to (valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add FKs only if not present
SET @exists := (
  SELECT COUNT(*) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_comm_issuer'
);
SET @sql := IF(@exists = 0,
  CONCAT('ALTER TABLE Commissioner_Tickets ADD CONSTRAINT fk_comm_issuer FOREIGN KEY (issuer_user_id) REFERENCES ', @T_USERS, '(id) ON DELETE RESTRICT'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND constraint_name = 'fk_comm_subject'
);
SET @sql := IF(@exists = 0,
  CONCAT('ALTER TABLE Commissioner_Tickets ADD CONSTRAINT fk_comm_subject FOREIGN KEY (subject_user_id) REFERENCES ', @T_USERS, '(id) ON DELETE RESTRICT'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

