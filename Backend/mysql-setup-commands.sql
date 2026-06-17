-- MySQL commands to allow passwordless access for development
-- Run these in MySQL Workbench or MySQL command line

-- Option A: Allow root user without password
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;

-- Option B: Create a new user without password (alternative)
-- CREATE USER 'appuser'@'localhost';
-- GRANT ALL PRIVILEGES ON hospital_management.* TO 'appuser'@'localhost';
-- FLUSH PRIVILEGES;

-- Verify the setup
SHOW DATABASES;
SELECT user, host, authentication_string FROM mysql.user WHERE user IN ('root', 'appuser');
