-- Add accepted_at column to Commissioner_Tickets table
-- This tracks when an employee accepts the commissioner invitation

USE nora_database;

-- Add the accepted_at column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'Commissioner_Tickets';
SET @columnname = 'accepted_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " DATETIME NULL AFTER revoked_at")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
DESCRIBE Commissioner_Tickets;

