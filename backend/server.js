const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Need increased limit for potentially large diagram data
app.use(express.json({ limit: '50mb' }));

// Initialize Postgres connection pool
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("CRITICAL: DATABASE_URL environment variable is not defined!");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

// Test connection and initialize schema
async function initDb() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL');
      
      // Create diagrams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS diagrams (
          key VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Database schema initialized');
      client.release();
      break;
    } catch (err) {
      console.error(`Failed to connect to DB, retrying... (${retries} left)`, err);
      retries -= 1;
      // Wait 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (retries === 0) {
    console.error('CRITICAL: Failed to connect to PostgreSQL database after multiple attempts.');
    process.exit(1);
  }
}

initDb();

app.post('/api/save', async (req, res) => {
  try {
    const { key, data } = req.body;
    
    if (!key || !data) {
      return res.status(400).json({ error: 'Missing key or data' });
    }

    const query = `
      INSERT INTO diagrams (key, data, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
    `;
    
    await pool.query(query, [key, JSON.stringify(data)]);
    
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (err) {
    console.error('Error saving data to database:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.get('/api/load', async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key' });
    }

    const query = 'SELECT data FROM diagrams WHERE key = $1;';
    const result = await pool.query(query, [key]);
    
    if (result.rows.length === 0) {
      // No entry exists yet, return null data
      return res.json({ success: true, data: null });
    }
    
    res.json({ success: true, data: result.rows[0].data });
  } catch (err) {
    console.error('Error loading data from database:', err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
