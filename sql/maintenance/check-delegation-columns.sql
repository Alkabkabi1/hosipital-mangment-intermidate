-- Check the actual column names in Delegation_Requests table
USE nora_database;

SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_KEY,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'nora_database'
  AND TABLE_NAME = 'Delegation_Requests'
ORDER BY ORDINAL_POSITION;

-- Show a sample row if any exists
SELECT * FROM Delegation_Requests LIMIT 1;

