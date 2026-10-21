# LocalFarm Database Documentation & SQL Schema

This directory contains the complete MySQL / MariaDB relational database schema for the **LocalFarm Platform and Admin Portal**.

---

## Quick Start (Automated Setup)

Ensure your MySQL server is running (e.g. via XAMPP, Docker, or native service on `127.0.0.1:3306`), then run:

```bash
npm run db:setup
```

This automated runner connects to MySQL, creates the `localfarm` database, provisions all 15 relational tables, creates triggers, stored procedures, database views, and seeds initial data matching all portal metrics.

---

## Files in this Directory

| File | Description |
| :--- | :--- |
| `localfarm_complete_schema.sql` | **Master complete schema file** containing all tables, constraints, indexes, triggers, views, stored procedures, and seed datasets. |
| `schema.sql` | Convenience mirror of `localfarm_complete_schema.sql` for standard migration tools. |
| `setup.js` | Node.js automation script executed by `npm run db:setup`. |
| `activity_logs_schema.sql` | Component schema for administrative audit logging. |
| `announcements_schema.sql` | Component schema for announcements and user read receipts. |
| `reports_schema.sql` | Component schema for moderation and report incidents. |
| `settings_schema.sql` | Component schema for system settings and security policies. |

---

## Schema Architecture & Tables Overview

### 1. Identity & Farm Profiles
* **`users`**: Core user registry supporting Admins, Farmers, and Buyers. Contains bcrypt password hashes, contact details, roles (`admin` \| `user`), and account standing.
* **`farmer_profiles`**: Detailed agronomic records linked 1-to-1 with `users`. Stores farm name, accreditation code (e.g. `FAR-9021`), cultivated crops, regional locations, acreage/hectares, yield trends, and verification status.

### 2. Marketplace & Social Feed
* **`posts`**: Produce listings, harvest announcements, and community updates categorized under `Field`, `Wholesaler`, `Temporary`, and `General`.
* **`post_comments`**: Bilateral threaded comments and negotiations on produce posts.
* **`post_likes`**: User endorsements with unique constraint per user and post.
* **`post_shares`**: Shared post metrics across feed and external channels.
* **`stories`**: Ephemeral 24-hour agricultural stories and field live streams with automatic expiration timestamps (`expires_at`).

### 3. Messaging & Network Connections
* **`connections`**: Peer trade relationships between farmers and commercial wholesalers (`pending`, `accepted`, `declined`, `blocked`).
* **`messages`**: One-on-one direct wholesale messages and inquiries.
* **`notifications`**: User alert inbox for announcements, trade requests, and system events.

### 4. Moderation & Compliance
* **`reports`**: Full moderation complaint queue covering chat abuse, produce fraud, counterfeit goods, and fake identities (`pending`, `high_risk`, `escalated`, `resolved`, `dismissed`, `suspended`). Matches `RPT- 1` through `RPT- 15`.

### 5. Administration & System Management
* **`announcements`**: Platform broadcast notices with priority ratings (`Urgent`, `High`, `Normal`), targeted recipient audiences, and engagement counters (`reach_count`, `read_count`).
* **`announcement_reads`**: Tracks individual user read receipts to prevent redundant dismissal popups.
* **`system_settings`**: Global platform policies, two-factor authentication toggles, session timeouts, and notification dispatch flags.
* **`admin_activity_logs`**: Immutable audit log recording administrative logins, user edits, suspensions, and database syncs.

---

## Database Views

1. **`v_active_farmers_directory`**: Combines user profiles with farmer details, crop specializations, total posts, active stories, and connection counts.
2. **`v_posts_detailed`**: Joins produce listings with author profiles and real-time engagement numbers.
3. **`v_moderation_queue`**: Consolidated moderation queue linking reporter and accused user details.

---

## Triggers

* **`trg_post_comments_count_insert`** / **`trg_post_comments_count_delete`**: Synchronizes `posts.comments_count` automatically.
* **`trg_post_likes_count_insert`** / **`trg_post_likes_count_delete`**: Synchronizes `posts.likes_count` automatically.
* **`trg_post_shares_count_insert`**: Synchronizes `posts.shares_count` automatically.

---

## Stored Procedures

* **`sp_prune_activity_logs(days_to_keep)`**: Routine to purge audit logs older than *N* days.
* **`sp_clean_expired_stories()`**: Clean up past expired temporary stories.
* **`sp_get_admin_dashboard_kpis()`**: Single-call query returning all dashboard KPI counters.

---

## Default Credentials

| Field | Value |
| :--- | :--- |
| **Email** | `admin@localfarm.com` |
| **Password** | `admin123` |
| **Role** | `admin` |
