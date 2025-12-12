require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/*
DB schema:
- shows (id, name, start_time, total_seats, created_at)
- seats (id, show_id, seat_number, status) status: AVAILABLE, HELD, BOOKED
- bookings (id, show_id, seats jsonb, status, created_at, updated_at)
*/

app.get('/health', (req, res) => res.json({ok:true}));

// Admin: create show
app.post('/admin/shows', async (req, res) => {
  const { name, start_time, total_seats } = req.body;
  if (!name || !start_time || !total_seats) return res.status(400).json({error:'missing fields'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const showRes = await client.query(
      `INSERT INTO shows (name, start_time, total_seats) VALUES ($1,$2,$3) RETURNING *`,
      [name, start_time, total_seats]
    );
    const show = showRes.rows[0];
    const seatInserts = [];
    for (let i=1;i<=total_seats;i++){
      seatInserts.push(client.query(
        `INSERT INTO seats (show_id, seat_number, status) VALUES ($1,$2,'AVAILABLE')`,
        [show.id, i]
      ));
    }
    await Promise.all(seatInserts);
    await client.query('COMMIT');
    res.json(show);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({error: 'failed to create show'});
  } finally {
    client.release();
  }
});

// list shows
app.get('/shows', async (req, res) => {
  const result = await pool.query('SELECT * FROM shows ORDER BY start_time');
  res.json(result.rows);
});

// get seats for show
app.get('/shows/:id/seats', async (req, res) => {
  const showId = req.params.id;
  const result = await pool.query('SELECT id, seat_number, status FROM seats WHERE show_id=$1 ORDER BY seat_number', [showId]);
  res.json(result.rows);
});

// create booking: seats: [seat_number,...]
app.post('/shows/:id/book', async (req, res) => {
  const showId = req.params.id;
  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length===0) return res.status(400).json({error:'no seats'});
  const client = await pool.connect();
  const bookingId = uuidv4();
  try {
    await client.query('BEGIN');
    // lock the seat rows to prevent concurrent modifications
    const seatRowsRes = await client.query(
      `SELECT id, seat_number, status FROM seats WHERE show_id=$1 AND seat_number = ANY($2) FOR UPDATE`,
      [showId, seats]
    );
    if (seatRowsRes.rows.length !== seats.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({error:'one or more seats not found', status:'FAILED'});
    }
    // check availability
    const unavailable = seatRowsRes.rows.filter(r => r.status !== 'AVAILABLE');
    if (unavailable.length > 0){
      await client.query('ROLLBACK');
      return res.status(409).json({error:'seats not available', seats:unavailable.map(r=>r.seat_number), status:'FAILED'});
    }
    // mark seats as HELD and create booking with PENDING
    const seatIds = seatRowsRes.rows.map(r => r.id);
    await client.query(
      `UPDATE seats SET status='HELD' WHERE id = ANY($1)`,
      [seatIds]
    );
    await client.query(
      `INSERT INTO bookings (id, show_id, seats, status, created_at, updated_at) VALUES ($1,$2,$3,'PENDING', NOW(), NOW())`,
      [bookingId, showId, JSON.stringify(seats)]
    );
    await client.query('COMMIT');

    // Simulate asynchronous confirmation process: attempt to confirm immediately for demo purposes
    confirmBooking(bookingId).catch(err=>console.error('confirm err', err));
    res.json({booking_id: bookingId, status: 'PENDING'});
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({error:'booking failed', status:'FAILED'});
  } finally {
    client.release();
  }
});

// confirm booking - internal
async function confirmBooking(bookingId){
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bRes = await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE', [bookingId]);
    if (bRes.rows.length===0){
      await client.query('ROLLBACK');
      return;
    }
    const booking = bRes.rows[0];
    if (booking.status !== 'PENDING'){
      await client.query('ROLLBACK');
      return;
    }
    // mark seats as BOOKED
    await client.query(
      `UPDATE seats SET status='BOOKED' WHERE show_id=$1 AND seat_number = ANY($2)`,
      [booking.show_id, booking.seats]
    );
    await client.query(
      `UPDATE bookings SET status='CONFIRMED', updated_at=NOW() WHERE id=$1`,
      [bookingId]
    );
    await client.query('COMMIT');
  } catch (e){
    await client.query('ROLLBACK');
    console.error('confirmBooking error', e);
  } finally {
    client.release();
  }
}

// get booking
app.get('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const result = await pool.query('SELECT * FROM bookings WHERE id=$1', [id]);
  if (result.rows.length===0) return res.status(404).json({error:'not found'});
  res.json(result.rows[0]);
});

// background job to expire PENDING bookings older than 2 minutes
setInterval(async ()=>{
  try {
    const client = await pool.connect();
    await client.query('BEGIN');
    const res = await client.query(`SELECT id, show_id, seats FROM bookings WHERE status='PENDING' AND created_at < NOW() - INTERVAL '2 minutes' FOR UPDATE`);
    for (const b of res.rows){
      await client.query(`UPDATE seats SET status='AVAILABLE' WHERE show_id=$1 AND seat_number = ANY($2)`, [b.show_id, b.seats]);
      await client.query(`UPDATE bookings SET status='FAILED', updated_at=NOW() WHERE id=$1`, [b.id]);
    }
    await client.query('COMMIT');
    client.release();
  } catch (e){
    console.error('expiry job error', e);
  }
}, 15*1000); // run every 15s

app.listen(PORT, ()=>console.log('Server running on', PORT));
