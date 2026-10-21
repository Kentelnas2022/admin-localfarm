-- =============================================================================
-- LocalFarm System & Mobile App - Unified Master Database Schema
-- =============================================================================
-- Target DBMS       : MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Engine            : InnoDB
-- Character Set     : utf8mb4
-- Collation         : utf8mb4_unicode_ci
-- Applications      : LocalFarm Mobile App (Expo/React Native) + Admin Web Portal (Next.js)
-- Default Database  : localfarm
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Database Creation & Initialization
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `localfarm`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `localfarm`;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- Drop Existing Triggers
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_post_comments_count_insert`;
DROP TRIGGER IF EXISTS `trg_post_comments_count_delete`;
DROP TRIGGER IF EXISTS `trg_post_likes_count_insert`;
DROP TRIGGER IF EXISTS `trg_post_likes_count_delete`;
DROP TRIGGER IF EXISTS `trg_post_shares_count_insert`;

-- -----------------------------------------------------------------------------
-- Drop Existing Procedures
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_prune_activity_logs`;
DROP PROCEDURE IF EXISTS `sp_clean_expired_stories`;
DROP PROCEDURE IF EXISTS `sp_get_admin_dashboard_kpis`;

-- -----------------------------------------------------------------------------
-- Drop Existing Views
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_active_farmers_directory`;
DROP VIEW IF EXISTS `v_posts_detailed`;
DROP VIEW IF EXISTS `v_moderation_queue`;

-- -----------------------------------------------------------------------------
-- Drop Existing Tables (Clean Unified Re-creation)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `announcement_reads`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `story_reactions`;
DROP TABLE IF EXISTS `story_views`;
DROP TABLE IF EXISTS `stories`;
DROP TABLE IF EXISTS `saved_posts`;
DROP TABLE IF EXISTS `post_shares`;
DROP TABLE IF EXISTS `comment_likes`;
DROP TABLE IF EXISTS `post_comments`;
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `connections`;
DROP TABLE IF EXISTS `otps`;
DROP TABLE IF EXISTS `farmer_profiles`;
DROP TABLE IF EXISTS `admin_activity_logs`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- 1. Table: users
-- Shared authentication & profile registry for mobile app & admin portal
-- =============================================================================
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique sequential user identifier',
  `first_name` VARCHAR(100) DEFAULT NULL COMMENT 'Given name',
  `last_name` VARCHAR(100) DEFAULT NULL COMMENT 'Family surname',
  `full_name` VARCHAR(200) DEFAULT NULL COMMENT 'Full display name (e.g. John Doe)',
  `username` VARCHAR(100) UNIQUE DEFAULT NULL COMMENT 'Unique public handle without @ symbol',
  `email` VARCHAR(191) NOT NULL UNIQUE COMMENT 'Primary authentication email address',
  `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt encrypted password hash',
  `phone_number` VARCHAR(50) DEFAULT NULL COMMENT 'Contact mobile / telephone number',
  `gender` ENUM('Male', 'Female', 'Other', 'Prefer not to say') DEFAULT 'Prefer not to say',
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Access tier: admin = Admin portal, user = Mobile farmer/buyer',
  `avatar_url` LONGTEXT DEFAULT NULL COMMENT 'URL or Base64 encoded portrait image',
  `bio` TEXT DEFAULT NULL COMMENT 'Personal biography or farm mission statement',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if verified producer, 0 otherwise',
  `status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active' COMMENT 'Account standing',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration timestamp',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last modification timestamp',

  -- Performance Indexes
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_created_at` (`created_at` DESC),
  INDEX `idx_users_lookup` (`email`, `username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master accounts table for Local Farm App and Admin Portal';


-- =============================================================================
-- 2. Table: farmer_profiles
-- Extended agronomy and verification details used by Admin Portal & Profiles
-- =============================================================================
CREATE TABLE `farmer_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE COMMENT 'Foreign key referencing users(id)',
  `farmer_code` VARCHAR(50) UNIQUE DEFAULT NULL COMMENT 'Accreditation ID (e.g. FAR-9021)',
  `farm_name` VARCHAR(150) NOT NULL COMMENT 'Farm / plantation name',
  `crops` VARCHAR(255) NOT NULL COMMENT 'Cultivated crops (e.g. Lettuce, Spinach, Herbs)',
  `farm_location` VARCHAR(255) NOT NULL COMMENT 'Farm location or sector',
  `hectares` DECIMAL(10,2) NOT NULL DEFAULT 1.00 COMMENT 'Farm land size in hectares',
  `yield_trend` VARCHAR(50) NOT NULL DEFAULT '+20% YoY' COMMENT 'Year-over-year harvest yield rate',
  `verification_status` ENUM('verified', 'pending', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Audit status',
  `certifications` VARCHAR(255) DEFAULT NULL COMMENT 'GAP / Organic certificates',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_farmer_status` (`verification_status`),
  INDEX `idx_farmer_location` (`farm_location`),
  CONSTRAINT `fk_farmer_profiles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agricultural producer profiles & verification credentials';


-- =============================================================================
-- 3. Table: otps
-- One-time passwords for mobile registration & password recovery
-- =============================================================================
CREATE TABLE `otps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL COMMENT 'Recipient email address',
  `otp` VARCHAR(10) NOT NULL COMMENT 'Verification numeric code',
  `type` ENUM('signup', 'recovery') NOT NULL DEFAULT 'signup',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL COMMENT 'Expiry datetime of OTP',

  INDEX `idx_otps_lookup` (`email`, `otp`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mobile authentication OTPs and password reset tokens';


-- =============================================================================
-- 4. Table: connections
-- Trade network connections & friend requests between farmers/buyers
-- =============================================================================
CREATE TABLE `connections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT UNSIGNED NOT NULL COMMENT 'User requesting connection',
  `receiver_id` INT UNSIGNED NOT NULL COMMENT 'User receiving connection request',
  `status` ENUM('pending', 'accepted', 'declined', 'blocked') NOT NULL DEFAULT 'pending',
  `collection_name` VARCHAR(100) NOT NULL DEFAULT 'All Connections' COMMENT 'Mobile contact category grouping',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_connection` (`sender_id`, `receiver_id`),
  INDEX `idx_connections_receiver` (`receiver_id`, `status`),
  INDEX `idx_connections_sender` (`sender_id`, `status`),
  CONSTRAINT `fk_connections_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_connections_receiver`
    FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Peer farmer and buyer network connections';


-- =============================================================================
-- 5. Table: conversations
-- Chat channel threads between pairs of users for Mobile Direct Messaging
-- =============================================================================
CREATE TABLE `conversations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user1_id` INT UNSIGNED NOT NULL,
  `user2_id` INT UNSIGNED NOT NULL,
  `last_message` TEXT DEFAULT NULL COMMENT 'Snippet of most recent message text',
  `last_message_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_pair` (`user1_id`, `user2_id`),
  INDEX `idx_conversations_user1` (`user1_id`),
  INDEX `idx_conversations_user2` (`user2_id`),
  CONSTRAINT `fk_conversations_user1`
    FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_conversations_user2`
    FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Direct chat conversation channels';


-- =============================================================================
-- 6. Table: messages
-- Individual chat messages exchanged within conversations
-- =============================================================================
CREATE TABLE `messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NULL COMMENT 'FK referencing conversations(id)',
  `sender_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing users(id)',
  `receiver_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing users(id)',
  `message_text` LONGTEXT NOT NULL COMMENT 'Message content',
  `message_type` ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text',
  `image_url` LONGTEXT DEFAULT NULL COMMENT 'Attachment image URL / Base64',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if read, 0 if unread',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_messages_conversation` (`conversation_id`, `created_at` DESC),
  INDEX `idx_messages_sender_receiver` (`sender_id`, `receiver_id`, `created_at` DESC),
  INDEX `idx_messages_unread` (`receiver_id`, `is_read`),
  CONSTRAINT `fk_messages_conversation`
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_receiver`
    FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Direct chat messages';


-- =============================================================================
-- 7. Table: posts
-- Newsfeed produce listings, farming tips, and reshared posts
-- =============================================================================
CREATE TABLE `posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Author user FK',
  `original_post_id` INT UNSIGNED DEFAULT NULL COMMENT 'Referenced post if reshared',
  `content` LONGTEXT NOT NULL COMMENT 'Post body text',
  `image_url` LONGTEXT DEFAULT NULL COMMENT 'Media photograph attachment URL / Base64',
  `category` ENUM('Field', 'Wholesaler', 'Temporary', 'General') NOT NULL DEFAULT 'General' COMMENT 'Produce category',
  `privacy` ENUM('Public', 'Friends', 'Only me', 'public', 'connections', 'private') NOT NULL DEFAULT 'Public',
  `location` VARCHAR(255) DEFAULT 'Iligan City, Philippines',
  `likes_count` INT NOT NULL DEFAULT 0,
  `comments_count` INT NOT NULL DEFAULT 0,
  `shares_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_posts_user` (`user_id`),
  INDEX `idx_posts_category` (`category`),
  INDEX `idx_posts_created_at` (`created_at` DESC),
  INDEX `idx_posts_original` (`original_post_id`),
  CONSTRAINT `fk_posts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_original`
    FOREIGN KEY (`original_post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Community produce feeds and harvest announcements';


-- =============================================================================
-- 8. Table: post_likes
-- Likes tracking per user and post
-- =============================================================================
CREATE TABLE `post_likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_like` (`post_id`, `user_id`),
  INDEX `idx_post_likes_user` (`user_id`),
  CONSTRAINT `fk_post_likes_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_post_likes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Post likes registry';


-- =============================================================================
-- 9. Table: post_comments
-- Threaded comments and negotiations on produce posts
-- Note: Includes both `content` (mobile app) and `comment` (admin alias)
-- =============================================================================
CREATE TABLE `post_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing posts(id)',
  `user_id` INT UNSIGNED NOT NULL COMMENT 'FK referencing users(id)',
  `parent_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK referencing parent post_comments(id) for replies',
  `content` TEXT NOT NULL COMMENT 'Comment body text',
  `comment` TEXT DEFAULT NULL COMMENT 'Legacy alias field',
  `likes_count` INT NOT NULL DEFAULT 0 COMMENT 'Number of likes on comment',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_post_comments_post` (`post_id`, `created_at` ASC),
  INDEX `idx_post_comments_user` (`user_id`),
  INDEX `idx_post_comments_parent` (`parent_id`),
  CONSTRAINT `fk_post_comments_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_post_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_post_comments_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Post comments and reply threads';


-- =============================================================================
-- 10. Table: comment_likes
-- Likes tracking on individual comments
-- =============================================================================
CREATE TABLE `comment_likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `comment_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_comment_like` (`comment_id`, `user_id`),
  INDEX `idx_comment_likes_user` (`user_id`),
  CONSTRAINT `fk_comment_likes_comment`
    FOREIGN KEY (`comment_id`) REFERENCES `post_comments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_likes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Comment likes tracking';


-- =============================================================================
-- 11. Table: post_shares
-- Post share tracking across feed and external destinations
-- =============================================================================
CREATE TABLE `post_shares` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `share_type` VARCHAR(50) NOT NULL DEFAULT 'public' COMMENT 'Destination: feed, public, direct_chat',
  `platform` VARCHAR(50) DEFAULT 'feed' COMMENT 'Channel alias',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_post_shares_post` (`post_id`),
  INDEX `idx_post_shares_user` (`user_id`),
  CONSTRAINT `fk_post_shares_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_post_shares_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Post share analytics';


-- =============================================================================
-- 12. Table: saved_posts
-- User bookmarks / saved produce posts categorized by collections
-- =============================================================================
CREATE TABLE `saved_posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `post_id` INT UNSIGNED NOT NULL,
  `collection_name` VARCHAR(100) NOT NULL DEFAULT 'All Saved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_user_saved_post` (`user_id`, `post_id`),
  INDEX `idx_saved_posts_user` (`user_id`, `collection_name`),
  CONSTRAINT `fk_saved_posts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_posts_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bookmarked and saved produce listings';


-- =============================================================================
-- 13. Table: stories
-- 24-hour disappearing agricultural stories and live field broadcasts
-- =============================================================================
CREATE TABLE `stories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `media_type` ENUM('image', 'video', 'text') NOT NULL DEFAULT 'image',
  `media_url` LONGTEXT DEFAULT NULL,
  `text_content` TEXT DEFAULT NULL,
  `caption` VARCHAR(255) DEFAULT NULL,
  `background_color` VARCHAR(30) DEFAULT '#1e293b',
  `music_title` VARCHAR(150) DEFAULT NULL,
  `privacy` ENUM('Public', 'Friends', 'Only me') NOT NULL DEFAULT 'Public',
  `views_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),

  INDEX `idx_stories_user_expires` (`user_id`, `expires_at`),
  INDEX `idx_stories_expires` (`expires_at`),
  CONSTRAINT `fk_stories_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='24-hour agricultural stories and field broadcasts';


-- =============================================================================
-- 14. Table: story_views
-- View receipts tracking who watched which story
-- =============================================================================
CREATE TABLE `story_views` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT UNSIGNED NOT NULL,
  `viewer_id` INT UNSIGNED NOT NULL,
  `viewed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_story_view` (`story_id`, `viewer_id`),
  INDEX `idx_story_views_viewer` (`viewer_id`),
  CONSTRAINT `fk_story_views_story`
    FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_story_views_viewer`
    FOREIGN KEY (`viewer_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Story viewer receipts';


-- =============================================================================
-- 15. Table: story_reactions
-- Quick reactions (like, love, clap, etc.) on stories
-- =============================================================================
CREATE TABLE `story_reactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `reaction_type` VARCHAR(50) NOT NULL DEFAULT 'like',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_story_reactions_story` (`story_id`),
  CONSTRAINT `fk_story_reactions_story`
    FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_story_reactions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Story quick reactions';


-- =============================================================================
-- 16. Table: notifications
-- In-app alert notifications delivered to user accounts
-- =============================================================================
CREATE TABLE `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Recipient user FK',
  `actor_id` INT UNSIGNED DEFAULT NULL COMMENT 'Actor initiating event FK',
  `type` VARCHAR(50) NOT NULL DEFAULT 'system',
  `title` VARCHAR(255) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `entity_name` VARCHAR(255) DEFAULT 'broadcast',
  `target_id` INT DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_notif_user_read` (`user_id`, `is_read`),
  INDEX `idx_notif_user_created` (`user_id`, `created_at` DESC),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_notifications_actor`
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User and system push notifications';


-- =============================================================================
-- 17. Table: announcements
-- Public platform announcements, security alerts, and feature broadcasts
-- =============================================================================
CREATE TABLE `announcements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) UNIQUE DEFAULT NULL COMMENT 'Reference code (e.g. ann-1)',
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` ENUM(
    'Scam Alert',
    'New Feature',
    'Platform Maintenance',
    'Community Guidelines',
    'General Notice'
  ) NOT NULL DEFAULT 'General Notice',
  `priority` ENUM('Urgent', 'High', 'Normal') NOT NULL DEFAULT 'Normal',
  `target_audience` VARCHAR(100) NOT NULL DEFAULT 'All Farmers & Buyers',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `reach_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `read_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `author` VARCHAR(100) DEFAULT 'System Admin',
  `author_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_announcements_pinned_created` (`is_pinned`, `created_at` DESC),
  INDEX `idx_announcements_category` (`category`),
  INDEX `idx_announcements_archived` (`is_archived`),
  CONSTRAINT `fk_announcements_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Platform announcements and administrative broadcasts';


-- =============================================================================
-- 18. Table: announcement_reads
-- Per-user read receipt tracker for announcements
-- =============================================================================
CREATE TABLE `announcement_reads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `announcement_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_user_announcement_read` (`announcement_id`, `user_id`),
  INDEX `idx_announcement_reads_user` (`user_id`),
  CONSTRAINT `fk_reads_announcement`
    FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reads_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User announcement read tracking';


-- =============================================================================
-- 19. Table: reports
-- Moderation incident queue (Chat, Post Content, Fake Users, Scams)
-- =============================================================================
CREATE TABLE `reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `report_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Human-readable case code (e.g. RPT- 1)',
  `reporter_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK referencing users(id)',
  `reporter_name` VARCHAR(150) NOT NULL COMMENT 'Display name of reporter',
  `reported_user_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK referencing accused users(id)',
  `reported_user_name` VARCHAR(150) NOT NULL COMMENT 'Display name of accused user/store',
  `report_type` ENUM('chat', 'content', 'user') NOT NULL DEFAULT 'content',
  `target_id` INT UNSIGNED DEFAULT NULL COMMENT 'Message, Post, or User ID',
  `reason` VARCHAR(150) NOT NULL,
  `statement` TEXT NOT NULL,
  `date_reported` VARCHAR(50) NOT NULL,
  `url` VARCHAR(255) NOT NULL DEFAULT 'www.link123',
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'high_risk', 'escalated', 'resolved', 'dismissed', 'suspended') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_reports_status` (`status`),
  INDEX `idx_reports_type` (`report_type`),
  INDEX `idx_reports_severity` (`severity`),
  INDEX `idx_reports_created` (`created_at` DESC),
  CONSTRAINT `fk_reports_reporter`
    FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_reported`
    FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moderation complaints and scam incidents';


-- =============================================================================
-- 20. Table: system_settings
-- System configuration, organization branding, and administrative policies
-- =============================================================================
CREATE TABLE `system_settings` (
  `id` INT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
  `system_name` VARCHAR(150) NOT NULL DEFAULT 'AgroGuard Marketplace',
  `org_name` VARCHAR(150) NOT NULL DEFAULT 'Department of Agriculture',
  `email_address` VARCHAR(150) NOT NULL DEFAULT 'admin@agroguard.ph',
  `contact_number` VARCHAR(50) NOT NULL DEFAULT '+63 912 345 6789',
  `language` VARCHAR(50) NOT NULL DEFAULT 'English',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
  `theme_preference` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'dark',
  `logo_url` LONGTEXT DEFAULT NULL,
  `two_factor_auth` TINYINT(1) NOT NULL DEFAULT 1,
  `session_timeout_minutes` INT NOT NULL DEFAULT 120,
  `notify_scam_reports` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_farmer_verifications` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_security_alerts` TINYINT(1) NOT NULL DEFAULT 1,
  `app_version` VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
  `environment` VARCHAR(50) NOT NULL DEFAULT 'Production',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Platform-wide configuration and administrative settings';


-- =============================================================================
-- 21. Table: admin_activity_logs
-- Immutable audit log for security, administrative actions, and logins
-- =============================================================================
CREATE TABLE `admin_activity_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(150) NOT NULL,
  `detail` TEXT NOT NULL,
  `type` ENUM('auth', 'announcements', 'system', 'security') NOT NULL DEFAULT 'system',
  `user` VARCHAR(150) NOT NULL DEFAULT 'admin@localfarm.com',
  `ip` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  `status` ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_admin_logs_type` (`type`),
  INDEX `idx_admin_logs_status` (`status`),
  INDEX `idx_admin_logs_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail of administrative actions and security events';


-- =============================================================================
-- 22. Automated Database Triggers
-- Keeps post counters (comments, likes, shares) synchronized automatically
-- =============================================================================

-- Increment post comments_count
CREATE TRIGGER `trg_post_comments_count_insert`
AFTER INSERT ON `post_comments`
FOR EACH ROW
UPDATE `posts` SET `comments_count` = `comments_count` + 1 WHERE `id` = NEW.`post_id`;

-- Decrement post comments_count
CREATE TRIGGER `trg_post_comments_count_delete`
AFTER DELETE ON `post_comments`
FOR EACH ROW
UPDATE `posts` SET `comments_count` = GREATEST(0, CAST(`comments_count` AS SIGNED) - 1) WHERE `id` = OLD.`post_id`;

-- Increment post likes_count
CREATE TRIGGER `trg_post_likes_count_insert`
AFTER INSERT ON `post_likes`
FOR EACH ROW
UPDATE `posts` SET `likes_count` = `likes_count` + 1 WHERE `id` = NEW.`post_id`;

-- Decrement post likes_count
CREATE TRIGGER `trg_post_likes_count_delete`
AFTER DELETE ON `post_likes`
FOR EACH ROW
UPDATE `posts` SET `likes_count` = GREATEST(0, CAST(`likes_count` AS SIGNED) - 1) WHERE `id` = OLD.`post_id`;

-- Increment post shares_count
CREATE TRIGGER `trg_post_shares_count_insert`
AFTER INSERT ON `post_shares`
FOR EACH ROW
UPDATE `posts` SET `shares_count` = `shares_count` + 1 WHERE `id` = NEW.`post_id`;


-- =============================================================================
-- 23. Useful Database Views
-- =============================================================================

-- View 1: Active Farmers Directory with Activity Metrics
CREATE OR REPLACE VIEW `v_active_farmers_directory` AS
SELECT 
  u.id,
  u.full_name,
  u.username,
  u.email,
  u.phone_number,
  u.avatar_url,
  u.is_verified,
  u.status AS account_status,
  u.created_at AS joined_at,
  fp.farmer_code,
  fp.farm_name,
  fp.crops,
  fp.farm_location,
  fp.hectares,
  fp.yield_trend,
  fp.verification_status,
  (SELECT COUNT(*) FROM `posts` WHERE `user_id` = u.id) AS total_posts,
  (SELECT COUNT(*) FROM `stories` WHERE `user_id` = u.id AND `expires_at` > NOW()) AS active_stories,
  (SELECT COUNT(*) FROM `connections` WHERE (`sender_id` = u.id OR `receiver_id` = u.id) AND `status` = 'accepted') AS total_connections
FROM `users` u
LEFT JOIN `farmer_profiles` fp ON u.id = fp.user_id
WHERE u.role = 'user';

-- View 2: Posts with Author Information
CREATE OR REPLACE VIEW `v_posts_detailed` AS
SELECT 
  p.id,
  p.user_id,
  u.full_name AS author_name,
  u.username AS author_username,
  u.avatar_url AS author_avatar,
  u.role AS author_role,
  p.content,
  p.image_url,
  p.category,
  p.privacy,
  p.location,
  p.likes_count,
  p.comments_count,
  p.shares_count,
  p.created_at,
  p.updated_at
FROM `posts` p
INNER JOIN `users` u ON p.user_id = u.id;

-- View 3: Moderation Queue with Participant Profiles
CREATE OR REPLACE VIEW `v_moderation_queue` AS
SELECT 
  r.id,
  r.report_code,
  r.report_type,
  r.reason,
  r.severity,
  r.status,
  r.reporter_id,
  r.reporter_name,
  u_rep.email AS reporter_email,
  r.reported_user_id,
  r.reported_user_name,
  u_bad.email AS reported_email,
  u_bad.status AS reported_account_status,
  r.statement,
  r.url,
  r.date_reported,
  r.created_at
FROM `reports` r
LEFT JOIN `users` u_rep ON r.reporter_id = u_rep.id
LEFT JOIN `users` u_bad ON r.reported_user_id = u_bad.id;


-- =============================================================================
-- 24. Stored Procedures
-- =============================================================================

-- Procedure 1: Prune Old Activity Logs
CREATE PROCEDURE `sp_prune_activity_logs`(IN `days_to_keep` INT)
DELETE FROM `admin_activity_logs`
WHERE `created_at` < NOW() - INTERVAL `days_to_keep` DAY;

-- Procedure 2: Clean Expired Stories
CREATE PROCEDURE `sp_clean_expired_stories`()
DELETE FROM `stories`
WHERE `expires_at` < NOW() - INTERVAL 7 DAY;

-- Procedure 3: Rapid Dashboard KPI Statistics Query
CREATE PROCEDURE `sp_get_admin_dashboard_kpis`()
SELECT 
  (SELECT COUNT(*) FROM `users` WHERE `role` = 'user') AS totalFarmers,
  (SELECT COUNT(*) FROM `users`) AS totalUsers,
  (SELECT COUNT(*) FROM `users` WHERE `created_at` >= NOW() - INTERVAL 7 DAY) AS newSignups,
  (SELECT COUNT(*) FROM `posts`) AS totalPosts,
  (SELECT COUNT(*) FROM `stories` WHERE `expires_at` > NOW()) AS activeStories,
  (SELECT COUNT(*) FROM `connections` WHERE `status` = 'pending') AS pendingConnections,
  (SELECT COUNT(*) FROM `reports` WHERE `status` = 'pending') AS pendingReports,
  (SELECT COUNT(*) FROM `reports`) AS totalReports,
  (SELECT COUNT(*) FROM `messages`) AS totalMessages,
  (SELECT COUNT(*) FROM `post_comments`) AS totalComments,
  (SELECT COUNT(*) FROM `post_shares`) AS totalShares;


-- =============================================================================
-- 25. Initial Comprehensive Seed Data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Seed: system_settings
-- -----------------------------------------------------------------------------
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


-- -----------------------------------------------------------------------------
-- Seed: users
-- Passwords:
-- - admin@localfarm.com: admin123 (hashed with bcrypt 10 rounds)
-- - Standard users: farmer123 (hashed with bcrypt 10 rounds)
-- -----------------------------------------------------------------------------
INSERT INTO `users`
  (`id`, `first_name`, `last_name`, `full_name`, `username`, `email`, `password`, `phone_number`, `gender`, `role`, `avatar_url`, `is_verified`, `status`, `created_at`)
VALUES
  -- 1. Main Admin Account
  (1, 'System', 'Admin', 'System Administrator', 'admin', 'admin@localfarm.com', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 912 345 6789', 'Prefer not to say', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 1, 'active', '2025-01-01 00:00:00'),

  -- 2-5. Verified Farmers from Admin Preview Modal & Mobile Directory
  (2, 'Maria', 'Santos', 'Maria Santos', 'mariasantos', 'maria.santos@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 917 111 2233', 'Female', 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', 1, 'active', '2025-08-14 09:15:00'),
  (3, 'John', 'Delgado', 'John Delgado', 'johndelgado', 'john.delgado@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 918 222 3344', 'Male', 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 1, 'active', '2025-10-02 11:30:00'),
  (4, 'Arthur', 'Sterling', 'Arthur Sterling', 'arthursterling', 'arthur.sterling@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 919 333 4455', 'Male', 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 0, 'pending', '2026-02-18 14:20:00'),
  (5, 'Elena', 'Rostova', 'Elena Rostova', 'elenarostova', 'elena.rostova@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 920 444 5566', 'Female', 'user', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80', 1, 'active', '2025-11-29 16:45:00'),

  -- 6-9. Active Community Farmers & Reporters
  (6, 'Kent', 'Elnas', 'kent elnas', 'kentelnas', 'kent.elnas@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 921 555 6677', 'Male', 'user', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-01-10 10:00:00'),
  (7, 'Paulbert', 'Cruz', 'Paulbert', 'paulbert', 'paulbert@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 922 666 7788', 'Male', 'user', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-01-15 08:30:00'),
  (8, 'Romarc', 'Landicho', 'romarc landicho', 'romarclandicho', 'romarc.landicho@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 923 777 8899', 'Male', 'user', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-02-01 13:00:00'),
  (9, 'Farmer', 'John', 'Farmer John', 'farmerjohn', 'farmer@localfarm.com', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '09987654321', 'Male', 'user', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-02-15 15:10:00'),

  -- 10-14. Community Farmers & Mobile App Seed Users
  (10, 'Grace', 'Bautista', 'Grace Bautista', 'graceagro', 'grace.bautista@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 925 999 0011', 'Female', 'user', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-03-05 09:20:00'),
  (11, 'Mateo', 'Ramos', 'Mateo Ramos', 'mateoramos', 'mateo.ramos@localfarm.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 926 000 1122', 'Male', 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-03-22 14:40:00'),
  (12, 'Mark Paul', 'Cosido', 'Mark Paul Cosido', 'markpaul', 'markpaul@localfarm.com', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '09112233445', 'Male', 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-04-10 10:00:00'),
  (13, 'Fritz', 'Subrabas', 'Fritz Subrabas', 'fritz', 'fritz@localfarm.com', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '09223344556', 'Male', 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-04-15 11:30:00'),
  (14, 'Noel', 'Garcia', 'Noel Garcia', 'noel', 'noel@localfarm.com', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '09334455667', 'Male', 'user', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80', 1, 'active', '2026-05-01 14:20:00'),

  -- 101-110. Flagged / Reported Accounts from Moderation Incident Cases
  (101, 'Chris', 'Manual', 'Chris manual', 'chrismanual', 'chris.manual@badactor.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 930 444 6677', 'Male', 'user', NULL, 0, 'suspended', '2026-07-01 08:00:00'),
  (102, 'ScamAgri', 'Wholesale', 'ScamAgri Wholesale', 'scamagri', 'contact@scamagri.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 931 555 7788', 'Other', 'user', NULL, 0, 'suspended', '2026-07-05 09:00:00'),
  (103, 'FastCash', 'Agro', 'FastCash Agro', 'fastcashagro', 'fastcash@suspicious.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 932 666 8899', 'Other', 'user', NULL, 0, 'suspended', '2026-07-08 12:00:00'),
  (104, 'EastChem', 'Store', 'EastChem Store', 'eastchem', 'eastchem@synthetic.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 933 777 9900', 'Other', 'user', NULL, 0, 'suspended', '2026-07-10 14:00:00'),
  (105, 'Bataan', 'Traders', 'Bataan Agro Traders', 'bataantraders', 'bataan@faketraders.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 934 888 0011', 'Other', 'user', NULL, 0, 'suspended', '2026-07-12 15:30:00'),
  (106, 'Bulacan', 'Seedlings', 'Bulacan Seedlings', 'bulacanseedlings', 'bulacan@rootstock.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 935 999 1122', 'Other', 'user', NULL, 0, 'active', '2026-07-15 10:45:00'),
  (107, 'Laguna', 'FarmHub', 'Laguna Farm Hub', 'lagunafarmhub', 'laguna@gouging.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 936 000 2233', 'Other', 'user', NULL, 0, 'active', '2026-07-18 11:20:00'),
  (108, 'BotPromoter', '99', 'BotPromoter99', 'botpromoter99', 'bot99@autospam.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 937 111 3344', 'Other', 'user', NULL, 0, 'suspended', '2026-07-20 13:10:00'),
  (109, 'Zambales', 'Mangoes', 'Zambales Mangoes', 'zambalesmangoes', 'mangoes@oldphotos.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 938 222 4455', 'Other', 'user', NULL, 0, 'active', '2026-07-22 09:30:00'),
  (110, 'Tarlac', 'Fertilizer', 'Tarlac Fertilizer Co', 'tarlacfertilizer', 'tarlac@unregchem.ph', '$2b$10$Q4/Cv8YH67rkGlGrh9BpiOGcgtY2c2sK0KECh0wWHG4jugoSKJKCq', '+63 939 333 5566', 'Other', 'user', NULL, 0, 'suspended', '2026-07-24 16:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: farmer_profiles
-- -----------------------------------------------------------------------------
INSERT INTO `farmer_profiles`
  (`id`, `user_id`, `farmer_code`, `farm_name`, `crops`, `farm_location`, `hectares`, `yield_trend`, `verification_status`, `certifications`)
VALUES
  (1, 2, 'FAR-9021', 'Verdant Fields Organic', 'Lettuce, Spinach, Herbs', 'Northern Valley, Sec 4', 4.50, '+24% YoY', 'verified', 'PhilGAP Certified Organic'),
  (2, 3, 'FAR-9022', 'Green Valley Co-op', 'Hydroponic Greens, Tomatoes', 'Central Plain, Bay 12', 8.20, '+38% YoY', 'verified', 'Hydroponic Quality Mark'),
  (3, 4, 'FAR-9023', 'Sterling Orchard & Apiary', 'Honey, Apples, Peaches', 'East Ridge Hills', 12.00, 'Audit in progress', 'pending', 'Natural Pollinator Guild'),
  (4, 5, 'FAR-9024', 'BioFlora Aquaponics', 'Tilapia, Bok Choy, Kale', 'Delta Waterways', 3.80, '+19% YoY', 'verified', 'Aquaculture Green Seal'),
  (5, 6, 'FAR-9025', 'Highland Root Crops Farm', 'Carrots, Potatoes, Beets', 'Benguet Highlands', 6.00, '+15% YoY', 'verified', 'Mountain Produce Certified'),
  (6, 7, 'FAR-9026', 'Sunshine Citrus Groves', 'Calamansi, Pomelo, Lemons', 'Batangas Agricultural Zone', 10.50, '+28% YoY', 'verified', 'Good Agricultural Practices'),
  (7, 8, 'FAR-9027', 'Golden Grain Rice Estate', 'Jasponica, Black Rice, Heirloom Grain', 'Nueva Ecija Grain Basin', 15.00, '+22% YoY', 'verified', 'PhilRice Heritage Seed Partner'),
  (8, 9, 'FAR-9028', 'Fresh Harvest Organic Veggies', 'Bell Peppers, Eggplants, Squash', 'Cavite Bio-Park', 5.20, '+18% YoY', 'verified', 'Local Farm Verified'),
  (9, 10, 'FAR-9029', 'Tropical Spice & Herb Haven', 'Turmeric, Ginger, Lemongrass', 'Davao Organic District', 7.40, '+31% YoY', 'verified', 'DTI Certified Organic Exporter'),
  (10, 11, 'FAR-9030', 'Valley Mushroom Nursery', 'Oyster Mushroom, Shiitake', 'Rizal Eco-Farms', 2.10, '+42% YoY', 'verified', 'BioTech Organic Spawn License'),
  (11, 12, 'FAR-9031', 'Highland Berry Haven', 'Strawberries, Blueberries, Mint', 'La Trinidad Valley, Sec 2', 3.50, '+15% YoY', 'pending', 'Benguet Organic Alliance (Under Review)'),
  (12, 13, 'FAR-9032', 'Sunvalley Citrus Estate', 'Valencia Orange, Calamansi, Pomelo', 'Bukidnon Highlands Sector 4', 8.40, '+28% YoY', 'pending', 'Mindanao GAP Certification (Pending)'),
  (13, 14, 'FAR-9033', 'Garcia Heritage Rice Farm', 'Heirloom Red Rice, Jasmine, Glutinous', 'Isabela Grain Corridor', 14.20, '+18% YoY', 'pending', 'DA Organic Seed Certification (Submitted)')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: otps (Sample OTP codes for testing)
-- -----------------------------------------------------------------------------
INSERT INTO `otps` (`id`, `email`, `otp`, `type`, `expires_at`) VALUES
  (1, 'farmer@localfarm.com', '123456', 'signup', NOW() + INTERVAL 1 HOUR),
  (2, 'maria.santos@localfarm.ph', '654321', 'recovery', NOW() + INTERVAL 1 HOUR)
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: connections (Friendships and trade links)
-- -----------------------------------------------------------------------------
INSERT INTO `connections` (`id`, `sender_id`, `receiver_id`, `status`, `collection_name`, `created_at`) VALUES
  (1, 2, 3, 'accepted', 'Co-op Partners', '2025-10-10 10:00:00'),
  (2, 2, 5, 'accepted', 'Aquaponics Guild', '2025-12-01 11:30:00'),
  (3, 3, 6, 'accepted', 'Wholesalers', '2026-01-20 14:00:00'),
  (4, 6, 7, 'accepted', 'All Connections', '2026-02-05 09:15:00'),
  (5, 7, 8, 'accepted', 'All Connections', '2026-02-18 16:20:00'),
  (6, 8, 9, 'accepted', 'All Connections', '2026-03-01 10:40:00'),
  (7, 4, 2, 'pending', 'All Connections', NOW() - INTERVAL 1 DAY),
  (8, 10, 3, 'pending', 'All Connections', NOW() - INTERVAL 2 DAY),
  (9, 11, 2, 'pending', 'All Connections', NOW() - INTERVAL 3 DAY),
  (10, 12, 9, 'accepted', 'All Connections', '2026-04-12 09:00:00'),
  (11, 13, 9, 'accepted', 'All Connections', '2026-04-18 10:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: conversations (Chat threads)
-- -----------------------------------------------------------------------------
INSERT INTO `conversations` (`id`, `user1_id`, `user2_id`, `last_message`, `last_message_time`) VALUES
  (1, 2, 3, 'Good day Maria! Yes, 5 carboys available at our Central Plain warehouse.', '2026-07-28 08:45:00'),
  (2, 6, 7, 'Yes Kent, we are presenting our organic pest-management results at the main hall.', '2026-07-29 10:15:00'),
  (3, 8, 2, 'Hi Maria, would like to inquire about bulk culinary herb supply for our hotel chain.', NOW() - INTERVAL 3 HOUR),
  (4, 9, 3, 'Hello John! Need 3 crates of beefsteak tomatoes for Saturday market.', NOW() - INTERVAL 1 HOUR),
  (5, 7, 101, 'Pay now or you will regret it. No refunds. I know which farm is yours.', '2026-07-21 16:40:00'),
  (6, 8, 103, 'Click this link immediately to verify your account or be banned: http://fastcash-agro-phish.biz', '2026-07-22 14:20:00'),
  (7, 6, 106, 'The seedlings are fine, just water them. Not our problem anymore.', '2026-07-24 11:30:00'),
  (8, 8, 107, 'Prices went up 50% on road. Take it or we dump the crates.', '2026-07-24 15:10:00'),
  (9, 7, 110, 'We have 20 bags of unlisted chemical fertilizer ready for secret night drop.', '2026-07-26 19:45:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: messages
-- -----------------------------------------------------------------------------
INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `receiver_id`, `message_text`, `message_type`, `is_read`, `created_at`) VALUES
  (1, 1, 2, 3, 'Good day John, do you have surplus hydroponic nutrient solution A/B formula available for dispatch?', 'text', 1, '2026-07-28 08:30:00'),
  (2, 1, 3, 2, 'Good day Maria! Yes, 5 carboys available at our Central Plain warehouse.', 'text', 1, '2026-07-28 08:45:00'),
  (3, 2, 6, 7, 'Paulbert, are you joining the provincial agricultural trade summit next week?', 'text', 1, '2026-07-29 10:00:00'),
  (4, 2, 7, 6, 'Yes Kent, we are presenting our organic pest-management results at the main hall.', 'text', 1, '2026-07-29 10:15:00'),
  (5, 3, 8, 2, 'Hi Maria, would like to inquire about bulk culinary herb supply for our hotel chain.', 'text', 0, NOW() - INTERVAL 3 HOUR),
  (6, 4, 9, 3, 'Hello John! Need 3 crates of beefsteak tomatoes for Saturday market.', 'text', 0, NOW() - INTERVAL 1 HOUR),
  (7, 5, 7, 101, 'Hello, I made payment for 5 sacks of fertilizer two days ago. Can I have the tracking number?', 'text', 1, '2026-07-21 16:30:00'),
  (8, 5, 101, 7, 'Stop asking questions or I will cancel your order and keep the money.', 'text', 1, '2026-07-21 16:32:00'),
  (9, 5, 7, 101, 'Excuse me? That is completely unprofessional. Please send the delivery receipt or refund immediately.', 'text', 1, '2026-07-21 16:35:00'),
  (10, 5, 101, 7, 'Pay now or you will regret it. No refunds. I know which farm is yours.', 'text', 0, '2026-07-21 16:40:00'),
  (11, 6, 103, 8, 'Urgent security alert from LocalFarm Support! Your merchant wallet has been frozen due to compliance.', 'text', 1, '2026-07-22 14:10:00'),
  (12, 6, 103, 8, 'Click this link immediately to verify your account or be banned: http://fastcash-agro-phish.biz', 'text', 1, '2026-07-22 14:12:00'),
  (13, 6, 8, 103, 'This is an unauthorized link. I am reporting this direct message to system administration immediately.', 'text', 1, '2026-07-22 14:20:00'),
  (14, 7, 6, 106, 'The F1 hybrid seedlings you sent arrived wilted and dead. They look like rejected stock.', 'text', 1, '2026-07-24 11:20:00'),
  (15, 7, 106, 6, 'The seedlings are fine, just water them. Not our problem anymore.', 'text', 0, '2026-07-24 11:30:00'),
  (16, 8, 107, 8, 'Prices went up 50% on road. Take it or we dump the crates.', 'text', 0, '2026-07-24 15:10:00'),
  (17, 9, 110, 7, 'We have 20 bags of unlisted chemical fertilizer ready for secret night drop behind the barn.', 'text', 0, '2026-07-26 19:45:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: posts
-- Matches categories: Field, Wholesaler, Temporary, General
-- -----------------------------------------------------------------------------
INSERT INTO `posts`
  (`id`, `user_id`, `original_post_id`, `content`, `image_url`, `category`, `privacy`, `location`, `likes_count`, `comments_count`, `shares_count`, `created_at`)
VALUES
  -- Field Posts
  (1, 2, NULL, '🥬 Crisp romaine and organic butterhead lettuce harvested early dawn! Grown with natural spring water, zero synthetic chemical sprays. Available for same-day delivery.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 'Field', 'Public', 'Northern Valley, Benguet', 34, 6, 8, '2026-01-20 07:30:00'),
  (2, 3, NULL, '🍅 Hydroponic vine-ripened beefsteak tomatoes ready for harvest this weekend. Sugar brix rating 7.2. Fresh crates open for booking.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', 'Field', 'Public', 'Central Plain Bay 12', 45, 9, 12, '2026-02-14 09:00:00'),
  (3, 6, NULL, '🥕 Clean Highland baby carrots harvested from volcanic soil. Fresh, sweet, and rich in carotene. Direct from farm gate to market.', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80', 'Field', 'Public', 'La Trinidad, Benguet', 28, 4, 3, '2026-03-10 08:15:00'),
  (4, 7, NULL, '🍋 Juicy calamansi and sweet Batangas pomelo harvest in progress. 500 crates packed for cooperative wholesale trade.', 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80', 'Field', 'Public', 'Batangas Agricultural Zone', 52, 11, 15, '2026-04-18 10:45:00'),

  -- Wholesaler Posts
  (5, 8, NULL, '🌾 Premium export-quality heirloom black rice & aromatic Jasponica. Minimum bulk order: 20 sacks (50kg/sack). Trade certification provided.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 'Wholesaler', 'Public', 'Nueva Ecija Grain Basin', 61, 14, 21, '2026-05-08 11:20:00'),
  (6, 10, NULL, '🌱 Pure organic turmeric rhizomes and yellow ginger for commercial food processors and pharmaceutical labs. Volume discount applies.', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80', 'Wholesaler', 'Public', 'Davao Organic District', 39, 8, 11, '2026-06-15 13:50:00'),
  (7, 2, NULL, '📦 Bulk contract growing slot open for commercial restaurants: Organic culinary herbs (Basil, Rosemary, Thyme, Mint). Monthly scheduled supply.', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80', 'Wholesaler', 'Public', 'Benguet Highlands', 48, 12, 19, '2026-07-02 14:10:00'),

  -- Temporary (Seasonal / Flash Produce) Posts
  (8, 5, NULL, '🐟 Live pond-harvested Tilapia and fresh watercress flash sale! Farmgate pickup available today until 4:00 PM.', 'https://images.unsplash.com/photo-1534043464124-3be32fe00099?auto=format&fit=crop&w=800&q=80', 'Temporary', 'Public', 'Delta Waterways', 23, 5, 4, '2026-07-15 06:45:00'),
  (9, 11, NULL, '🍄 Freshly plucked organic White Oyster & Grey Oyster mushrooms. Packed in 250g biodegradable trays. 40kg remaining!', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80', 'Temporary', 'Public', 'Rizal Eco-Farms', 31, 7, 6, '2026-07-20 15:30:00'),

  -- General Posts (Community advice, soil management, agronomy discussions)
  (10, 9, NULL, '🌻 Companion planting trial: Intercropping marigolds between bell peppers has reduced our pest damage by nearly 40% without using sprays!', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80', 'General', 'Public', 'Cavite Bio-Park', 78, 19, 25, '2026-08-01 10:00:00'),
  (11, 4, NULL, '🐝 Wildflower honey harvest season is here. Our apiary hives produced rich, unfiltered golden honey with hints of citrus blossoms.', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', 'General', 'Public', 'East Ridge Hills', 64, 15, 18, '2026-08-12 11:30:00'),
  (12, 2, NULL, '🌧️ Heavy monsoon rains expected across Central Luzon. Reminder to all vegetable farmers to check ridge drainage and trench gutters.', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80', 'General', 'Public', 'Northern Valley', 92, 23, 31, '2026-08-25 14:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: post_likes
-- -----------------------------------------------------------------------------
INSERT INTO `post_likes` (`post_id`, `user_id`, `created_at`) VALUES
  (1, 3, '2026-01-20 08:00:00'),
  (1, 4, '2026-01-20 08:30:00'),
  (1, 5, '2026-01-20 09:00:00'),
  (2, 2, '2026-02-14 09:30:00'),
  (2, 6, '2026-02-14 10:00:00'),
  (5, 2, '2026-05-08 12:00:00'),
  (5, 3, '2026-05-08 12:30:00'),
  (5, 7, '2026-05-08 13:00:00'),
  (10, 2, '2026-08-01 11:00:00'),
  (10, 3, '2026-08-01 11:30:00'),
  (10, 6, '2026-08-01 12:00:00'),
  (12, 3, '2026-08-25 14:30:00'),
  (12, 6, '2026-08-25 15:00:00'),
  (12, 7, '2026-08-25 15:30:00')
ON DUPLICATE KEY UPDATE `post_id` = `post_id`;


-- -----------------------------------------------------------------------------
-- Seed: post_comments (Compatible with both `content` and `comment`)
-- -----------------------------------------------------------------------------
INSERT INTO `post_comments`
  (`id`, `post_id`, `user_id`, `parent_id`, `content`, `comment`, `likes_count`, `created_at`)
VALUES
  (1, 1, 3, NULL, 'Can you supply 50 kg of romaine to our co-op depot this Friday?', 'Can you supply 50 kg of romaine to our co-op depot this Friday?', 2, '2026-01-20 09:12:00'),
  (2, 1, 2, 1,    'Yes John! Packed and ready for morning transport.', 'Yes John! Packed and ready for morning transport.', 1, '2026-01-20 09:30:00'),
  (3, 2, 6, NULL, 'Those beefsteak tomatoes look top tier. What cultivar did you plant?', 'Those beefsteak tomatoes look top tier. What cultivar did you plant?', 1, '2026-02-14 10:45:00'),
  (4, 2, 3, 3,    'F1 Diamante Max from East-West Seed. Very high wilt resistance!', 'F1 Diamante Max from East-West Seed. Very high wilt resistance!', 3, '2026-02-14 11:15:00'),
  (5, 5, 7, NULL, 'Interested in 30 sacks of black rice for Manila gourmet deli.', 'Interested in 30 sacks of black rice for Manila gourmet deli.', 0, '2026-05-08 14:00:00'),
  (6, 10, 8, NULL, 'Thanks for sharing the marigold tip! Going to test this on my eggplant plot.', 'Thanks for sharing the marigold tip! Going to test this on my eggplant plot.', 4, '2026-08-01 12:20:00'),
  (7, 10, 5, 6,    'We use the same method in our aquaponic greenhouse perimeter. Works wonders.', 'We use the same method in our aquaponic greenhouse perimeter. Works wonders.', 2, '2026-08-01 13:45:00'),
  (8, 12, 6, NULL, 'Thanks for the weather heads up Maria! Reinforcing our nursery plastic now.', 'Thanks for the weather heads up Maria! Reinforcing our nursery plastic now.', 1, '2026-08-25 15:30:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: comment_likes
-- -----------------------------------------------------------------------------
INSERT INTO `comment_likes` (`id`, `comment_id`, `user_id`, `created_at`) VALUES
  (1, 1, 2, '2026-01-20 09:20:00'),
  (2, 1, 6, '2026-01-20 09:25:00'),
  (3, 4, 6, '2026-02-14 11:30:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: post_shares
-- -----------------------------------------------------------------------------
INSERT INTO `post_shares` (`id`, `post_id`, `user_id`, `share_type`, `platform`, `created_at`) VALUES
  (1, 1, 3, 'feed', 'feed', '2026-01-20 10:00:00'),
  (2, 2, 6, 'public', 'facebook', '2026-02-14 11:30:00'),
  (3, 5, 7, 'direct_chat', 'direct_chat', '2026-05-08 15:00:00'),
  (4, 10, 8, 'feed', 'feed', '2026-08-01 14:00:00'),
  (5, 12, 6, 'feed', 'feed', '2026-08-25 16:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: saved_posts (Mobile bookmarks)
-- -----------------------------------------------------------------------------
INSERT INTO `saved_posts` (`id`, `user_id`, `post_id`, `collection_name`, `created_at`) VALUES
  (1, 3, 1, 'All Saved', '2026-01-20 10:30:00'),
  (2, 3, 10, 'Farming Guides', '2026-08-01 15:00:00'),
  (3, 2, 2, 'Wholesale Seeds', '2026-02-15 08:00:00'),
  (4, 9, 12, 'Weather Alerts', '2026-08-25 16:30:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: stories
-- Includes active stories with expires_at > NOW() for live mobile feeds
-- -----------------------------------------------------------------------------
INSERT INTO `stories`
  (`id`, `user_id`, `media_type`, `media_url`, `text_content`, `caption`, `background_color`, `music_title`, `privacy`, `views_count`, `created_at`, `expires_at`)
VALUES
  (1, 2, 'image', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', NULL, '🌅 Sunrise over the organic romaine rows', '#1e293b', 'Morning Acoustic - Farm Breeze', 'Public', 142, NOW() - INTERVAL 2 HOUR, NOW() + INTERVAL 22 HOUR),
  (2, 3, 'image', 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80', NULL, '💧 Automated drip irrigation running smoothly', '#1e293b', NULL, 'Public', 98, NOW() - INTERVAL 5 HOUR, NOW() + INTERVAL 19 HOUR),
  (3, 5, 'image', 'https://images.unsplash.com/photo-1534043464124-3be32fe00099?auto=format&fit=crop&w=800&q=80', NULL, '🐟 Morning feeding in the bio-aquaponics tank', '#1e293b', NULL, 'Public', 115, NOW() - INTERVAL 8 HOUR, NOW() + INTERVAL 16 HOUR),
  (4, 6, 'image', 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80', NULL, '🚜 Soil aeration completed for next batch of root crops', '#1e293b', NULL, 'Public', 76, NOW() - INTERVAL 12 HOUR, NOW() + INTERVAL 12 HOUR),
  (5, 7, 'image', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80', NULL, '📦 Crate loading for weekend farmers market', '#1e293b', NULL, 'Public', 210, NOW() - INTERVAL 48 HOUR, NOW() - INTERVAL 24 HOUR)
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: story_views
-- -----------------------------------------------------------------------------
INSERT INTO `story_views` (`id`, `story_id`, `viewer_id`, `viewed_at`) VALUES
  (1, 1, 3, NOW() - INTERVAL 1 HOUR),
  (2, 1, 6, NOW() - INTERVAL 1 HOUR),
  (3, 1, 9, NOW() - INTERVAL 30 MINUTE),
  (4, 2, 2, NOW() - INTERVAL 4 HOUR)
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: story_reactions
-- -----------------------------------------------------------------------------
INSERT INTO `story_reactions` (`id`, `story_id`, `user_id`, `reaction_type`, `created_at`) VALUES
  (1, 1, 3, 'love', NOW() - INTERVAL 1 HOUR),
  (2, 1, 6, 'fire', NOW() - INTERVAL 45 MINUTE),
  (3, 2, 2, 'like', NOW() - INTERVAL 3 HOUR)
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: notifications
-- -----------------------------------------------------------------------------
INSERT INTO `notifications`
  (`id`, `user_id`, `actor_id`, `type`, `title`, `content`, `entity_name`, `target_id`, `is_read`, `created_at`)
VALUES
  (1, 2, 1, 'announcement', '🚨 Scam Alert: Fraudulent Seed & Fertilizer Vendors Demanding GCash Downpayments', 'Multiple farmers have reported unverified profiles posing as accredited fertilizer and hybrid seed distributors...', 'broadcast', 1, 0, '2026-08-29 08:30:00'),
  (2, 3, 1, 'announcement', '🚨 Scam Alert: Fraudulent Seed & Fertilizer Vendors Demanding GCash Downpayments', 'Multiple farmers have reported unverified profiles posing as accredited fertilizer and hybrid seed distributors...', 'broadcast', 1, 0, '2026-08-29 08:30:00'),
  (3, 6, 1, 'announcement', '🚨 Scam Alert: Fraudulent Seed & Fertilizer Vendors Demanding GCash Downpayments', 'Multiple farmers have reported unverified profiles posing as accredited fertilizer and hybrid seed distributors...', 'broadcast', 1, 1, '2026-08-29 08:30:00'),
  (4, 2, 3, 'connection_request', 'New Connection Request', 'John Delgado from Green Valley Co-op sent you a trade connection request.', 'connection', 1, 1, '2026-08-20 14:00:00'),
  (5, 3, 6, 'comment', 'New Comment on Your Produce', 'Kent Elnas commented on your hydroponic tomatoes post.', 'post', 2, 0, '2026-08-21 10:45:00')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: announcements
-- -----------------------------------------------------------------------------
INSERT INTO `announcements` 
  (`id`, `slug`, `title`, `content`, `category`, `priority`, `target_audience`, `is_pinned`, `is_archived`, `reach_count`, `read_count`, `author`, `author_id`, `created_at`)
VALUES
  (
    1,
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
    1,
    '2026-08-29 08:30:00'
  ),
  (
    2,
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
    1,
    '2026-08-25 10:15:00'
  ),
  (
    3,
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
    1,
    '2026-08-22 14:00:00'
  ),
  (
    4,
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
    1,
    '2026-08-18 11:45:00'
  ),
  (
    5,
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
    1,
    '2026-08-12 09:00:00'
  )
ON DUPLICATE KEY UPDATE `id` = `id`;


-- -----------------------------------------------------------------------------
-- Seed: announcement_reads
-- -----------------------------------------------------------------------------
INSERT INTO `announcement_reads` (`announcement_id`, `user_id`, `read_at`) VALUES
  (1, 2, '2026-08-29 09:00:00'),
  (1, 3, '2026-08-29 09:15:00'),
  (1, 6, '2026-08-29 09:30:00'),
  (2, 2, '2026-08-25 11:00:00'),
  (2, 5, '2026-08-25 11:30:00')
ON DUPLICATE KEY UPDATE `announcement_id` = `announcement_id`;


-- -----------------------------------------------------------------------------
-- Seed: reports
-- Exactly matches reports_schema.sql and AdminModeration component
-- (15 reports, 7 Pending, 10 High Risk, 2 Escalated)
-- -----------------------------------------------------------------------------
INSERT INTO `reports` 
  (`id`, `report_code`, `reporter_id`, `reporter_name`, `reported_user_id`, `reported_user_name`, `report_type`, `target_id`, `reason`, `statement`, `date_reported`, `url`, `severity`, `status`) 
VALUES
  (1,  'RPT- 1', 7, 'Paulbert', 101, 'Chris manual', 'chat',    1,  'Harrassment',          'I am reporting this seller for sending abusive messages after asking for shipping details.', 'July 21, 2026', 'www.link123', 'high', 'pending'),
  (2,  'RPT- 2', 7, 'Paulbert', 101, 'Chris manual', 'chat',    2,  'Harrassment',          'Continued threatening voice calls and aggressive chat demand for personal bank transfer.',   'July 21, 2026', 'www.link123', 'high', 'pending'),
  (3,  'RPT- 3', 7, 'Paulbert', 101, 'Chris manual', 'content', 12, 'Harrassment',          'User posted targeted derogatory remarks in the organic vegetable discussion thread.',        'July 21, 2026', 'www.link123', 'high', 'pending'),
  (4,  'RPT- 4', 7, 'Paulbert', 101, 'Chris manual', 'content', 14, 'Harrassment',          'False claims regarding farm certification posted publicly on marketplace listing.',           'July 21, 2026', 'www.link123', 'high', 'pending'),
  (5,  'RPT- 5', 7, 'Paulbert', 101, 'Chris manual', 'chat',    3,  'Harrassment',          'Unsolicited spam messages containing fake promotional links.',                                'July 21, 2026', 'www.link123', 'high', 'pending'),
  (6,  'RPT- 6', 7, 'Paulbert', 101, 'Chris manual', 'chat',    4,  'Harrassment',          'Repeated harassment after being explicitly asked to cease communication.',                     'July 21, 2026', 'www.link123', 'high', 'pending'),
  (7,  'RPT- 7', 6, 'kent elnas', 102, 'ScamAgri Wholesale', 'content', 19, 'Scam / Fraud',   'Fake farm seller demanding advance GCash payment for 100 sacks of corn yield.',             'July 22, 2026', 'www.link123', 'high', 'pending'),
  (8,  'RPT- 8', 8, 'romarc landicho', 103, 'FastCash Agro', 'chat', 5, 'Phishing Links',      'User sending phishing links pretending to be the official LocalFarm admin team.',            'July 22, 2026', 'www.link123', 'high', 'high_risk'),
  (9,  'RPT- 9', 9, 'Farmer John', 104, 'EastChem Store', 'content', 22, 'Counterfeit Goods', 'Selling fake synthetic pesticide labeled as certified organic botanical spray.',            'July 23, 2026', 'www.link123', 'high', 'high_risk'),
  (10, 'RPT- 10', 7, 'Paulbert', 105, 'Bataan Agro Traders', 'content', 25, 'Fake Identity',   'Stolen business permit photo used on new vendor profile.',                                    'July 23, 2026', 'www.link123', 'high', 'high_risk'),
  (11, 'RPT- 11', 6, 'kent elnas', 106, 'Bulacan Seedlings', 'chat', 6, 'Misleading Offer',   'Offered F1 hybrid seedlings but delivered ordinary dead rootstock.',                         'July 24, 2026', 'www.link123', 'medium', 'escalated'),
  (12, 'RPT- 12', 8, 'romarc landicho', 107, 'Laguna Farm Hub', 'chat', 7, 'Price Gouging',    'Refused agreed price upon delivery demanding 50% additional cash on delivery.',              'July 24, 2026', 'www.link123', 'medium', 'escalated'),
  (13, 'RPT- 13', 9, 'Farmer John', 108, 'BotPromoter99', 'content', 30, 'Spam & Bots',       'Automated script spamming Telegram loan bot invites in produce comment sections.',           'July 25, 2026', 'www.link123', 'low', 'resolved'),
  (14, 'RPT- 14', 6, 'kent elnas', 109, 'Zambales Mangoes', 'content', 32, 'False Advertising', 'Advertised export grade Carabao mangoes using internet stock photos from 2018.',        'July 25, 2026', 'www.link123', 'medium', 'dismissed'),
  (15, 'RPT- 15', 7, 'Paulbert', 110, 'Tarlac Fertilizer Co', 'chat', 8, 'Unregistered Chemical', 'Direct messaging farmers prohibited ammonium nitrate compounds.',                        'July 26, 2026', 'www.link123', 'critical', 'suspended')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `reason` = VALUES(`reason`), `severity` = VALUES(`severity`);


-- -----------------------------------------------------------------------------
-- Seed: admin_activity_logs
-- -----------------------------------------------------------------------------
INSERT INTO `admin_activity_logs`
  (`id`, `action`, `detail`, `type`, `user`, `ip`, `status`, `created_at`)
VALUES
  (1, 'System Initialized', 'Master MySQL database schema created with unified tables for mobile and web', 'system', 'admin@localfarm.com', '127.0.0.1', 'success', '2026-08-01 00:00:00'),
  (2, 'Admin Signed In', 'Successful password authentication for administrator account (admin@localfarm.com)', 'auth', 'admin@localfarm.com', '127.0.0.1', 'success', '2026-08-29 08:00:00'),
  (3, 'Published Public Announcement', 'Broadcasted announcement "Scam Alert: Fraudulent Seed & Fertilizer Vendors" to 4,820 farmers', 'announcements', 'admin@localfarm.com', '127.0.0.1', 'success', '2026-08-29 08:30:00'),
  (4, 'User Account Updated', 'Administrator verified farmer profile #2 (Maria Santos) for PhilGAP accreditation', 'system', 'admin@localfarm.com', '127.0.0.1', 'success', '2026-08-30 11:20:00'),
  (5, 'User Suspended for Violations', 'Enforced suspension on user "Chris manual" regarding report RPT- 1 (Harrassment)', 'security', 'admin@localfarm.com', '127.0.0.1', 'failed', '2026-08-31 14:15:00'),
  (6, 'MySQL Database Synced', 'Database records verified with 0 errors across Mobile App & Admin Portal', 'system', 'admin@localfarm.com', '127.0.0.1', 'success', '2026-09-01 09:00:00')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- =============================================================================
-- End of Unified LocalFarm Database Schema & Seed Data
-- =============================================================================
