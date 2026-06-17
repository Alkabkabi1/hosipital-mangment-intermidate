-- ==========================================
-- Add Education Field to Certificate Requests
-- October 26, 2025
-- ==========================================

-- Add education place field to Certificate_Requests table
ALTER TABLE Certificate_Requests
ADD COLUMN education_place VARCHAR(255) AFTER nationality;

-- Note: request_date is automatically captured in created_at timestamp
-- No need to add a separate field for submission date

COMMIT;

