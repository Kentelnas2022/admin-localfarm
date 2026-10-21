/**
 * LocalFarm Database Automated Setup & Migration Runner
 * 
 * Usage:
 *   node database/setup.js
 *   or: npm run db:setup
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSetup() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'localfarm';

  console.log('------------------------------------------------------------');
  console.log(`🌾 LocalFarm Database Setup`);
  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  console.log('------------------------------------------------------------');

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    const schemaPath = path.join(__dirname, 'localfarm_complete_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Applying complete schema and seed dataset to "${database}"...`);
    await connection.query(sqlContent);
    console.log(` Schema applied successfully!\n`);

    // Verify created objects
    const [tables] = await connection.query(`SHOW FULL TABLES FROM \`${database}\``);
    console.log(`Created Database Objects in \`${database}\`:`);
    console.table(
      tables.map((t) => ({
        Name: Object.values(t)[0],
        Type: Object.values(t)[1],
      }))
    );

    // Summary of seeded counts
    const [counts] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM \`${database}\`.\`users\`) AS users,
        (SELECT COUNT(*) FROM \`${database}\`.\`farmer_profiles\`) AS farmer_profiles,
        (SELECT COUNT(*) FROM \`${database}\`.\`posts\`) AS posts,
        (SELECT COUNT(*) FROM \`${database}\`.\`post_comments\`) AS comments,
        (SELECT COUNT(*) FROM \`${database}\`.\`stories\`) AS stories,
        (SELECT COUNT(*) FROM \`${database}\`.\`announcements\`) AS announcements,
        (SELECT COUNT(*) FROM \`${database}\`.\`reports\`) AS reports,
        (SELECT COUNT(*) FROM \`${database}\`.\`admin_activity_logs\`) AS logs
    `);

    console.log('Seeded Record Counts:');
    console.table(counts);

    console.log('------------------------------------------------------------');
    console.log(' Default Admin Credentials:');
    console.log('   Email    : admin@localfarm.com');
    console.log('   Password : admin123');
    console.log('   Role     : admin');
    console.log('------------------------------------------------------------\n');

  } catch (err) {
    console.error(' Database setup failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSetup();
