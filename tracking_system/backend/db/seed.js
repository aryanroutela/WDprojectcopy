import pg from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database with sample data...');

    // Seed Users
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('driver123', 10);

    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES 
        ($1, $2, $3, $4),
        ($1, $2, $3, $5)
    `, ['John Doe', 'john@example.com', hashedPassword1, 'passenger']);

    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
    `, ['Driver One', 'driver@example.com', hashedPassword2, 'driver']);

    console.log('✅ Users seeded.');

    // Seed Routes
    const route1Waypoints = JSON.stringify([
      { lat: 40.7128, lng: -74.0060 }, // Times Square
      { lat: 40.7489, lng: -73.9680 }, // Grand Central
      { lat: 40.7614, lng: -73.9776 }  // Central Park
    ]);

    const route2Waypoints = JSON.stringify([
      { lat: 40.7505, lng: -73.9972 }, // Times Square South
      { lat: 40.7549, lng: -73.9840 }, // Bryant Park
      { lat: 40.7614, lng: -73.9776 }  // Central Park North
    ]);

    const routeRes1 = await client.query(`
      INSERT INTO routes (name, number, description, waypoints)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['Uptown Express', 'M1', 'Times Square to Central Park', route1Waypoints]);

    const routeRes2 = await client.query(`
      INSERT INTO routes (name, number, description, waypoints)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['Downtown Express', 'M2', 'Bryant Park to Central Park', route2Waypoints]);

    console.log('✅ Routes seeded.');

    const route1Id = routeRes1.rows[0].id;
    const route2Id = routeRes2.rows[0].id;

    // Seed Stops
    await client.query(`
      INSERT INTO stops (route_id, name, lat, lng, stop_order)
      VALUES 
        ($1, $2, $3, $4, 1),
        ($1, $2, $3, $4, 2),
        ($1, $2, $3, $4, 3)
    `, [route1Id, 'Times Square', 40.7128, -74.0060]);

    await client.query(`
      INSERT INTO stops (route_id, name, lat, lng, stop_order)
      VALUES 
        ($1, $2, $3, $4, 1),
        ($1, $2, $3, $4, 2),
        ($1, $2, $3, $4, 3)
    `, [route1Id, 'Grand Central', 40.7489, -73.9680]);

    await client.query(`
      INSERT INTO stops (route_id, name, lat, lng, stop_order)
      VALUES 
        ($1, $2, $3, $4, 1),
        ($1, $2, $3, $4, 2),
        ($1, $2, $3, $4, 3)
    `, [route1Id, 'Central Park', 40.7614, -73.9776]);

    console.log('✅ Stops seeded.');

    // Seed Active Bus
    const busRes = await client.query(`
      INSERT INTO active_buses (route_id, session_id, current_lat, current_lng, avg_speed, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [route1Id, `BUS_M1_001_${Date.now()}`, 40.7128, -74.0060, 25, true]);

    console.log('✅ Active buses seeded.');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    if (error.code !== '23505') { // Ignore unique constraint violations
      console.error('❌ Error seeding database:', error);
    } else {
      console.log('ℹ️ Sample data already exists.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
