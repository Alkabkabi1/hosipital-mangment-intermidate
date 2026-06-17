-- Create Notifications table for delegation and commissioner notifications
-- Run this to enable notification functionality

CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  title_ar VARCHAR(255),
  message TEXT,
  message_ar TEXT,
  type VARCHAR(50) NOT NULL,
  reference_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes are included in CREATE TABLE statement above

