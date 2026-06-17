-- Create Commissioner Ticket for HR Employee
-- Subject: HR Employee (ID 5)
-- Scopes: clearance, onboarding
-- Duration: 48 hours from now

USE nora_database;

INSERT INTO Commissioner_Tickets 
  (issuer_user_id, subject_user_id, scopes_json, valid_from, valid_to, created_at)
VALUES 
  (
    1,  -- Issuer: Admin (user ID 1)
    5,  -- Subject: HR Employee (user ID 5)
    '["clearance","onboarding"]',  -- Scopes
    NOW(),  -- Valid from now
    DATE_ADD(NOW(), INTERVAL 48 HOUR),  -- Valid for 48 hours
    NOW()
  );

-- Verify ticket was created
SELECT * FROM Commissioner_Tickets WHERE subject_user_id = 5;

