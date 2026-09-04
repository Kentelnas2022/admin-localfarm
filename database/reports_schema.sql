-- ==========================================================
-- LocalFarm Moderation & Reports Schema
-- Supports chat reports, content (posts) reports, user flags
-- ==========================================================

CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `report_code` VARCHAR(50) NOT NULL UNIQUE,
  `reporter_id` INT UNSIGNED NULL,
  `reporter_name` VARCHAR(150) NOT NULL,
  `reported_user_id` INT UNSIGNED NULL,
  `reported_user_name` VARCHAR(150) NOT NULL,
  `report_type` ENUM('chat', 'content', 'user') NOT NULL DEFAULT 'content',
  `target_id` INT UNSIGNED NULL COMMENT 'References message_id, post_id, or user_id',
  `reason` VARCHAR(150) NOT NULL,
  `statement` TEXT NOT NULL,
  `date_reported` VARCHAR(50) NOT NULL,
  `url` VARCHAR(255) NOT NULL DEFAULT 'www.link123',
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'high_risk', 'escalated', 'resolved', 'dismissed', 'suspended') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reports_status` (`status`),
  INDEX `idx_reports_type` (`report_type`),
  INDEX `idx_reports_severity` (`severity`),
  INDEX `idx_reports_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial reports dataset matching Moderation KPI metrics:
-- 15 Total Reports, 7 Pending, 10 High Risk, 2 Escalated
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
