import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database...');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME;
    try {
      await client.query(`CREATE DATABASE ${dbName};`);
      console.log(`✅ Database '${dbName}' created.`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️ Database '${dbName}' already exists.`);
      } else {
        throw error;
      }
    }

    // Disconnect from postgres database
    client.release();
  } catch (error) {
    client.release();
    console.error('❌ Error creating database:', error);
    process.exit(1);
  }

  // Connect to the newly created database
  const pool2 = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const client2 = await pool2.connect();
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client2.query(schema);
    console.log('✅ Schema created successfully.');

    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Error executing schema:', error);
    process.exit(1);
  } finally {
    client2.release();
    await pool.end();
    await pool2.end();
  }
}

initializeDatabase().catch(console.error);
