-- =============================================================================
-- MySQL Schema for LocalFarm Admin Activity Logs
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE TABLE IF NOT EXISTS `admin_activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique sequential log entry ID',
  `action` VARCHAR(150) NOT NULL COMMENT 'Human-readable action title (e.g. Admin Signed In, Published Announcement)',
  `detail` TEXT NOT NULL COMMENT 'Comprehensive description of the event including modified records and parameters',
  `type` ENUM('auth', 'announcements', 'system', 'security') NOT NULL DEFAULT 'system' COMMENT 'Categorical classification of the activity',
  `user` VARCHAR(150) NOT NULL DEFAULT 'admin@localfarm.com' COMMENT 'Email or identifier of administrator / automated worker responsible',
  `ip` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1' COMMENT 'IPv4 or IPv6 address originating the action',
  `status` ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success' COMMENT 'Operational outcome status',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Exact UTC timestamp of activity execution',
  
  -- Performance Indexes for Real-Time Querying & Filtering
  INDEX `idx_activity_logs_type` (`type`),
  INDEX `idx_activity_logs_status` (`status`),
  INDEX `idx_activity_logs_user` (`user`),
  INDEX `idx_activity_logs_created` (`created_at` DESC),
  INDEX `idx_activity_logs_composite` (`type`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail of all administrative events, authentication actions, and system jobs';


-- =============================================================================
-- Stored Procedure: Prune Logs Older Than N Days (Maintenance Routine)
-- =============================================================================
DROP PROCEDURE IF EXISTS `sp_prune_activity_logs`;
DELIMITER //
CREATE PROCEDURE `sp_prune_activity_logs`(IN `days_to_keep` INT)
BEGIN
  DELETE FROM `admin_activity_logs`
  WHERE `created_at` < NOW() - INTERVAL `days_to_keep` DAY;
END //
DELIMITER ;


-- =============================================================================

-- =============================================================================
-- Common Analytical Queries for Dashboard Metrics
-- =============================================================================
-- 1. Get recent 50 logs with category filter:
-- SELECT * FROM admin_activity_logs WHERE type = 'auth' ORDER BY created_at DESC LIMIT 50;

-- 2. Daily event count per category:
-- SELECT DATE(created_at) AS log_date, type, COUNT(*) AS total_events
-- FROM admin_activity_logs
-- GROUP BY log_date, type
-- ORDER BY log_date DESC;

-- 3. Security failure warnings count in the last 24 hours:
-- SELECT COUNT(*) AS security_warnings
-- FROM admin_activity_logs
-- WHERE status IN ('warning', 'failed') AND created_at >= NOW() - INTERVAL 24 HOUR;
