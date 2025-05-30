require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(bodyParser.json());

// POST /events
app.post('/events', async (req, res) => {
  try {
    const { user_id, event_type, payload } = req.body;
    const validTypes = ['view', 'click', 'location'];

    if (!user_id || !event_type || !payload || !validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event data' });
    }

    const event_id = uuidv4();
    const timestamp = new Date().toISOString();

    await pool.query(
      'INSERT INTO events (event_id, user_id, event_type, timestamp, payload) VALUES ($1, $2, $3, $4, $5)',
      [event_id, user_id, event_type, timestamp, payload]
    );

    res.status(202).json({ message: 'Event recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /analytics/event-counts
app.get('/analytics/event-counts', async (req, res) => {
  try {
    const { event_type, start_date, end_date } = req.query;
    let query = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const values = [];
    let i = 1;

    if (event_type) {
      query += ` AND event_type = $${i++}`;
      values.push(event_type);
    }

    if (start_date) {
      query += ` AND timestamp >= $${i++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND timestamp <= $${i++}`;
      values.push(end_date);
    }

    const result = await pool.query(query, values);
    res.json({ total_events: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Bad request' });
  }
});

// GET /analytics/event-counts-by-type
app.get('/analytics/event-counts-by-type', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT event_type, COUNT(*) FROM events WHERE 1=1';
    const values = [];
    let i = 1;

    if (start_date) {
      query += ` AND timestamp >= $${i++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND timestamp <= $${i++}`;
      values.push(end_date);
    }

    query += ' GROUP BY event_type';
    const result = await pool.query(query, values);
    const response = {};
    result.rows.forEach(row => {
      response[row.event_type] = parseInt(row.count, 10);
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});