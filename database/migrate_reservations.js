import mysql from 'mysql2/promise';

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'localfarm';

  console.log(`Connecting to MySQL database: ${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    // 1. Add pre-harvest columns to posts if not exist
    const [cols] = await conn.query(`SHOW COLUMNS FROM \`posts\``);
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes('is_pre_harvest')) {
      console.log('Adding pre-harvest columns to posts table...');
      await conn.query(`
        ALTER TABLE \`posts\`
        ADD COLUMN \`is_pre_harvest\` TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN \`expected_harvest_date\` DATE DEFAULT NULL,
        ADD COLUMN \`available_quantity\` DECIMAL(10, 2) DEFAULT NULL,
        ADD COLUMN \`reserved_quantity\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        ADD COLUMN \`crop_name\` VARCHAR(150) DEFAULT NULL,
        ADD COLUMN \`unit\` VARCHAR(20) DEFAULT 'kg',
        ADD COLUMN \`price_per_unit\` DECIMAL(10, 2) DEFAULT NULL,
        ADD COLUMN \`pickup_hub\` VARCHAR(255) DEFAULT 'Bogo City Public Market Hub';
      `);
      console.log('Pre-harvest columns added to posts.');
    } else {
      console.log('Pre-harvest columns already exist in posts.');
    }

    // 2. Create harvest_reservations table
    console.log('Creating harvest_reservations table if not exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`harvest_reservations\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`reservation_code\` VARCHAR(30) NOT NULL UNIQUE,
        \`post_id\` INT UNSIGNED NOT NULL,
        \`seller_id\` INT UNSIGNED NOT NULL,
        \`buyer_id\` INT UNSIGNED NOT NULL,
        \`crop_name\` VARCHAR(150) NOT NULL,
        \`quantity\` DECIMAL(10, 2) NOT NULL,
        \`unit\` VARCHAR(20) NOT NULL DEFAULT 'kg',
        \`price_per_unit\` DECIMAL(10, 2) NOT NULL,
        \`total_estimated_amount\` DECIMAL(10, 2) NOT NULL,
        \`actual_weighed_quantity\` DECIMAL(10, 2) DEFAULT NULL,
        \`final_settled_amount\` DECIMAL(10, 2) DEFAULT NULL,
        \`harvest_date\` DATE NOT NULL,
        \`pickup_location\` VARCHAR(255) NOT NULL DEFAULT 'Bogo City Public Market Hub',
        \`status\` ENUM('pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        \`qr_token\` VARCHAR(100) NOT NULL UNIQUE,
        \`buyer_notes\` TEXT DEFAULT NULL,
        \`seller_notes\` TEXT DEFAULT NULL,
        \`weighed_at\` DATETIME DEFAULT NULL,
        \`completed_at\` DATETIME DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX \`idx_reservations_post\` (\`post_id\`),
        INDEX \`idx_reservations_seller\` (\`seller_id\`),
        INDEX \`idx_reservations_buyer\` (\`buyer_id\`),
        INDEX \`idx_reservations_status\` (\`status\`),
        INDEX \`idx_reservations_code\` (\`reservation_code\`),
        INDEX \`idx_reservations_qr\` (\`qr_token\`),

        CONSTRAINT \`fk_reservations_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_reservations_seller\` FOREIGN KEY (\`seller_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_reservations_buyer\` FOREIGN KEY (\`buyer_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pre-harvest crop reservations and digital pickup receipts';
    `);
    console.log('harvest_reservations table is ready.');

    // 3. Mark at least 2 existing posts as pre-harvest batches for demo
    const [posts] = await conn.query(`SELECT id, content FROM \`posts\` LIMIT 3`);
    if (posts.length > 0) {
      const p1 = posts[0].id;
      await conn.query(`
        UPDATE \`posts\`
        SET is_pre_harvest = 1,
            crop_name = 'Sweet Yellow Corn',
            expected_harvest_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY),
            available_quantity = 150.00,
            reserved_quantity = 45.00,
            unit = 'kg',
            price_per_unit = 35.00,
            pickup_hub = 'Bogo City Public Market - Agriculture Hub'
        WHERE id = ?
      `, [p1]);

      if (posts.length > 1) {
        const p2 = posts[1].id;
        await conn.query(`
          UPDATE \`posts\`
          SET is_pre_harvest = 1,
              crop_name = 'Highland Red Tomatoes',
              expected_harvest_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY),
              available_quantity = 80.00,
              reserved_quantity = 30.00,
              unit = 'kg',
              price_per_unit = 45.00,
              pickup_hub = 'Nailon Farm Gate Hub, Bogo'
          WHERE id = ?
        `, [p2]);
      }
      console.log('Updated existing demo posts with pre-harvest metadata.');
    }

    // 4. Seed sample reservations if empty
    const [existingRes] = await conn.query(`SELECT COUNT(*) as count FROM \`harvest_reservations\``);
    if (existingRes[0].count === 0 && posts.length > 0) {
      console.log('Seeding initial sample harvest reservations...');
      const [users] = await conn.query(`SELECT id FROM \`users\` LIMIT 3`);
      const sellerId = users[0]?.id || 1;
      const buyerId = users[1]?.id || users[0]?.id || 1;
      const p1 = posts[0].id;

      await conn.query(`
        INSERT INTO \`harvest_reservations\` (
          reservation_code, post_id, seller_id, buyer_id, crop_name, quantity, unit,
          price_per_unit, total_estimated_amount, harvest_date, pickup_location,
          status, qr_token, buyer_notes
        ) VALUES 
        (
          'LF-RES-8421', ?, ?, ?, 'Sweet Yellow Corn', 25.00, 'kg',
          35.00, 875.00, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Bogo City Public Market - Agriculture Hub',
          'confirmed', 'QR_LF_8421_938174', 'Bringing own crates. Early morning pickup preferred.'
        ),
        (
          'LF-RES-8422', ?, ?, ?, 'Sweet Yellow Corn', 20.00, 'kg',
          35.00, 700.00, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Bogo City Public Market - Agriculture Hub',
          'ready_for_pickup', 'QR_LF_8422_192847', 'Please pack in 10kg batches.'
        ),
        (
          'LF-RES-7910', ?, ?, ?, 'Highland Red Tomatoes', 30.00, 'kg',
          45.00, 1350.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Nailon Farm Gate Hub, Bogo',
          'completed', 'QR_LF_7910_583920', 'Bulk order for family restaurant.'
        )
      `, [p1, sellerId, buyerId, p1, sellerId, buyerId, posts[1] ? posts[1].id : p1, sellerId, buyerId]);

      // Set actual weighed quantity for completed order
      await conn.query(`
        UPDATE \`harvest_reservations\`
        SET actual_weighed_quantity = 31.20,
            final_settled_amount = 1404.00,
            weighed_at = NOW(),
            completed_at = NOW()
        WHERE reservation_code = 'LF-RES-7910'
      `);

      console.log('Sample reservations seeded successfully.');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

migrate();
