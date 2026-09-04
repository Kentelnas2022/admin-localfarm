-- =============================================================================
-- MySQL Schema for LocalFarm Admin Settings & Activity Logs
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =============================================================================

-- 1. System Settings Table
-- Stores platform-wide configuration, company info, and global security policies
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
  `system_name` VARCHAR(150) NOT NULL DEFAULT 'AgroGuard Marketplace',
  `org_name` VARCHAR(150) NOT NULL DEFAULT 'Department of Agriculture',
  `email_address` VARCHAR(150) NOT NULL DEFAULT 'admin@agroguard.ph',
  `contact_number` VARCHAR(50) NOT NULL DEFAULT '+63 912 345 6789',
  `language` VARCHAR(50) NOT NULL DEFAULT 'English',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
  `theme_preference` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'dark',
  `logo_url` LONGTEXT NULL,
  
  -- Security Policies
  `two_factor_auth` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Enforced, 0 = Optional',
  `session_timeout_minutes` INT NOT NULL DEFAULT 120 COMMENT 'Idle session timeout in minutes',
  
  -- Notification Alerts
  `notify_scam_reports` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Immediate email alerts on flagged scams',
  `notify_farmer_verifications` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Daily summary of pending verification requests',
  `notify_security_alerts` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Alert on failed login attempts or credential changes',
  
  -- Metadata
  `app_version` VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
  `environment` VARCHAR(50) NOT NULL DEFAULT 'Production',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Admin Activity Logs Table
-- Audit trail of administrative events, security actions, and database syncs
CREATE TABLE IF NOT EXISTS `admin_activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(150) NOT NULL COMMENT 'Action headline (e.g. Admin Signed In, Profile Updated)',
  `detail` TEXT NOT NULL COMMENT 'Context and action description',
  `type` ENUM('auth', 'announcements', 'system', 'security') NOT NULL DEFAULT 'system',
  `user` VARCHAR(150) NOT NULL DEFAULT 'admin@localfarm.com' COMMENT 'Admin user email or name',
  `ip` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1' COMMENT 'Client IP address',
  `status` ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance Indexes
  INDEX `idx_admin_logs_type` (`type`),
  INDEX `idx_admin_logs_status` (`status`),
  INDEX `idx_admin_logs_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- Initial Seed Data
-- =============================================================================

-- Seed default system settings
INSERT INTO `system_settings` 
  (`id`, `system_name`, `org_name`, `email_address`, `contact_number`, `language`, `timezone`, `theme_preference`, `two_factor_auth`, `session_timeout_minutes`, `notify_scam_reports`, `notify_farmer_verifications`, `notify_security_alerts`, `app_version`, `environment`)
VALUES
  (
    1,
    'AgroGuard Marketplace',
    'Department of Agriculture',
    'admin@agroguard.ph',
    '+63 912 345 6789',
    'English',
    'Asia/Manila',
    'dark',
    1,
    120,
    1,
    1,
    1,
    'v1.0.0',
    'Production'
  )
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
