-- =============================================================================
-- MySQL Schema for LocalFarm Announcement System
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =============================================================================

-- 1. Main Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) UNIQUE NULL COMMENT 'Optional unique identifier or slug (e.g. ann-1)',
  `title` VARCHAR(255) NOT NULL COMMENT 'Headline of the announcement',
  `content` TEXT NOT NULL COMMENT 'Full body content (supports markdown and plain text)',
  `category` ENUM(
    'Scam Alert',
    'New Feature',
    'Platform Maintenance',
    'Community Guidelines',
    'General Notice'
  ) NOT NULL DEFAULT 'General Notice' COMMENT 'Classification category',
  `priority` ENUM('Urgent', 'High', 'Normal') NOT NULL DEFAULT 'Normal' COMMENT 'Broadcast importance level',
  `target_audience` VARCHAR(100) NOT NULL DEFAULT 'All Farmers & Buyers' COMMENT 'Target recipient segment',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if pinned to top banner, 0 otherwise',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if archived, 0 if active',
  `reach_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of farmer accounts reached',
  `read_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of times opened/read',
  `author` VARCHAR(100) DEFAULT 'System Admin' COMMENT 'Display name of admin author',
  `author_id` INT UNSIGNED NULL COMMENT 'Foreign key referencing users(id)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Publication timestamp',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last modified timestamp',
  
  -- Performance Indexes
  INDEX `idx_announcements_pinned_created` (`is_pinned`, `created_at` DESC),
  INDEX `idx_announcements_category` (`category`),
  INDEX `idx_announcements_archived` (`is_archived`),
  INDEX `idx_announcements_priority` (`priority`),
  INDEX `idx_announcements_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. User Read Receipts Tracking Table (Optional / Recommended)
-- Tracks individual farmer read receipts to prevent re-displaying dismissed notices
CREATE TABLE IF NOT EXISTS `announcement_reads` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `announcement_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing announcements(id)',
  `user_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing users(id)',
  `read_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY `unique_user_announcement_read` (`announcement_id`, `user_id`),
  INDEX `idx_announcement_reads_user` (`user_id`),
  
  CONSTRAINT `fk_reads_announcement`
    FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- Initial Sample / Seed Data
-- =============================================================================

INSERT INTO `announcements` 
  (`slug`, `title`, `content`, `category`, `priority`, `target_audience`, `is_pinned`, `is_archived`, `reach_count`, `read_count`, `author`, `created_at`)
VALUES
  (
    'ann-1',
    '🚨 Scam Alert: Fraudulent Seed & Fertilizer Vendors Demanding GCash Downpayments',
    'Multiple farmers have reported unverified profiles posing as accredited fertilizer and hybrid seed distributors requesting 50% upfront GCash transfers. Never send advance deposits to unverified contacts. Always insist on cash-on-delivery (COD) or transact through verified cooperative hubs. If you encounter suspicious accounts, report them immediately via Moderation.',
    'Scam Alert',
    'Urgent',
    'All Farmers & Buyers',
    1,
    0,
    4820,
    4627,
    'Security Admin (admin@localfarm.com)',
    '2026-08-29 08:30:00'
  ),
  (
    'ann-2',
    '✨ New Feature: Direct Wholesaler Messaging & Real-Time Price Negotiation Now Live',
    'We are thrilled to launch Direct Wholesaler Inquiries! Farmers can now negotiate bulk purchase deals directly with certified commercial buyers straight from their produce feed. Includes built-in trade receipts, pickup scheduling, and verified buyer verification badges to protect transaction integrity.',
    'New Feature',
    'High',
    'All Farmers',
    1,
    0,
    4650,
    4138,
    'Product Team (admin@localfarm.com)',
    '2026-08-25 10:15:00'
  ),
  (
    'ann-3',
    '🛠️ Scheduled System Maintenance: Server Infrastructure Upgrade on Sunday 1:00 AM - 3:00 AM',
    'The LocalFarm platform and mobile application API will undergo scheduled database re-indexing and server capacity expansion this Sunday between 1:00 AM and 3:00 AM PHT. Mobile feeds, story publishing, and direct chats may be intermittently paused during this 2-hour maintenance window. All data remains secure.',
    'Platform Maintenance',
    'Normal',
    'All Platform Users',
    0,
    0,
    4210,
    3283,
    'DevOps Team (admin@localfarm.com)',
    '2026-08-22 14:00:00'
  ),
  (
    'ann-4',
    '📜 Community Guidelines: Honest Produce Grading & Transparent Pricing Policy',
    'To uphold a trusted marketplace for local growers and buyers, all sellers are required to post actual, unedited photos of current harvest stocks and state exact unit pricing per kilogram or sack. Listings using stock internet imagery or deceptive weight claims will be suspended.',
    'Community Guidelines',
    'Normal',
    'All Farmers & Sellers',
    0,
    0,
    3940,
    2836,
    'Compliance Admin (admin@localfarm.com)',
    '2026-08-18 11:45:00'
  ),
  (
    'ann-5',
    '📢 Verified Farmer Cooperative Badge: Free On-Site Identity Authentication',
    'Registered agricultural cooperatives can now claim their green \"Verified Producer\" badge at local municipal trade offices. Verified profiles gain priority listing placement on buyer search feeds and receive an estimated 3x higher direct connection rate.',
    'General Notice',
    'Normal',
    'Cooperative Farmers',
    0,
    0,
    3620,
    2410,
    'Admin (admin@localfarm.com)',
    '2026-08-12 09:00:00'
  )
ON DUPLICATE KEY UPDATE `id` = `id`;
