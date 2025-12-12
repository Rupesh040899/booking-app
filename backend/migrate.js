const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ticketdb' });

async function migrate(){
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS shows (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_time TIMESTAMP NOT NULL,
      total_seats INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`);
    await client.query(`CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
      seat_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE'
    );`);
    await client.query(`CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY,
      show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
      seats JSONB NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`);
    console.log('migrations applied');
  } catch (e){
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
