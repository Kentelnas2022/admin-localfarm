import mysql from 'mysql2/promise';

async function initFeatures() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'localfarm';

  console.log(`Connecting to ${database}...`);
  const conn = await mysql.createConnection({ host, port, user, password, database });

  console.log('1. Creating commodity_prices table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`commodity_prices\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`commodity_name\` VARCHAR(150) NOT NULL,
      \`category\` ENUM('Vegetables', 'Fruits', 'Grains & Rice', 'Fish & Aquaculture', 'Herbs & Spices', 'Commercial Crops') NOT NULL DEFAULT 'Vegetables',
      \`min_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      \`max_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      \`suggested_srp\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      \`unit\` VARCHAR(50) NOT NULL DEFAULT 'kg',
      \`price_trend\` ENUM('stable', 'increasing', 'decreasing', 'alert') NOT NULL DEFAULT 'stable',
      \`change_percentage\` VARCHAR(20) NOT NULL DEFAULT '0%',
      \`market_source\` VARCHAR(150) NOT NULL DEFAULT 'Metro Agritrade & Local Cooperatives',
      \`notes\` VARCHAR(255) DEFAULT NULL,
      \`updated_by\` VARCHAR(150) DEFAULT 'admin@localfarm.com',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_prices_category\` (\`category\`),
      INDEX \`idx_prices_trend\` (\`price_trend\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('2. Checking is_featured column in stories...');
  try {
    await conn.query('ALTER TABLE `stories` ADD COLUMN `is_featured` TINYINT(1) NOT NULL DEFAULT 0 AFTER `views_count`');
    console.log('Added is_featured column to stories.');
  } catch (err) {
    if (!err.message.includes('Duplicate column')) {
      console.log('Notice regarding stories column:', err.message);
    }
  }

  console.log('3. Seeding commodity_prices table...');
  const [existing] = await conn.query('SELECT COUNT(*) as c FROM `commodity_prices`');
  if (existing[0].c === 0) {
    await conn.query(`
      INSERT INTO \`commodity_prices\` 
        (\`commodity_name\`, \`category\`, \`min_price\`, \`max_price\`, \`suggested_srp\`, \`unit\`, \`price_trend\`, \`change_percentage\`, \`market_source\`, \`notes\`)
      VALUES
        ('Romaine & Green Ice Lettuce', 'Vegetables', 90.00, 130.00, 110.00, 'kg', 'stable', '+2%', 'Benguet Highland Depot', 'Good seasonal supply from hydroponic growers'),
        ('Beefsteak & Salad Tomatoes', 'Vegetables', 55.00, 85.00, 70.00, 'kg', 'decreasing', '-8%', 'Central Plain Trading Post', 'Peak harvest influx from Nueva Ecija'),
        ('Highland Baby Carrots', 'Vegetables', 70.00, 100.00, 85.00, 'kg', 'stable', '0%', 'La Trinidad Cooperative', 'Consistent quality and steady supply'),
        ('Batangas Calamansi & Pomelo', 'Fruits', 45.00, 75.00, 60.00, 'kg', 'increasing', '+12%', 'Batangas Agricultural Terminal', 'Higher demand from beverage processors'),
        ('Jasponica & Black Heirloom Rice', 'Grains & Rice', 2200.00, 2750.00, 2500.00, 'sack (50kg)', 'stable', '+1%', 'Nueva Ecija Grain Basin', 'Certified heritage harvest stocks'),
        ('Fresh Pond Tilapia & Hito', 'Fish & Aquaculture', 130.00, 170.00, 150.00, 'kg', 'stable', '0%', 'Delta Aquaculture Zone', 'Live farmgate pricing standard'),
        ('White & Grey Oyster Mushrooms', 'Vegetables', 180.00, 240.00, 200.00, 'kg', 'stable', '+3%', 'Rizal Eco-Farms', 'Packaged in 250g biodegradable trays'),
        ('Red Native Chili (Siling Labuyo)', 'Herbs & Spices', 280.00, 420.00, 350.00, 'kg', 'alert', '+28%', 'Southern Luzon Wholesale Hub', 'Supply constricted by recent monsoon rain'),
        ('Organic Yellow Ginger & Turmeric', 'Herbs & Spices', 110.00, 160.00, 135.00, 'kg', 'stable', '-2%', 'Davao Organic District', 'Export volume discount available'),
        ('Sweet Carabao Mangoes', 'Fruits', 120.00, 180.00, 150.00, 'kg', 'increasing', '+15%', 'Zambales Fruit Growers Guild', 'Export grade selection')
    `);
    console.log('Seeded 10 commodity price benchmarks.');
  } else {
    console.log(`Commodity prices already populated (${existing[0].c} records).`);
  }

  // Update stories so at least one is featured for demo
  await conn.query('UPDATE `stories` SET `is_featured` = 1 WHERE `id` = 1');

  console.log('Initialization completed successfully!');
  await conn.end();
}

initFeatures().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
