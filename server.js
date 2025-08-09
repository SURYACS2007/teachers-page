export default Student;     require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();

// Simple CORS - allow all origins
app.use(cors());
app.use(express.json());

// Create connection pool instead of single connection
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // Handle disconnections
  handleDisconnects: true
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database successfully');
    connection.release();
  }
});

// Handle pool errors
db.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection lost, pool will reconnect automatically');
  }
});

// Test endpoint


// Get all students
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM stdmark ORDER BY NAME';
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(Fetched ${data.length} students);
    return res.json(data);
  });
});

// Add student marks
app.post('/create', (req, res) => {
  const { name, roll, jp, ds, vccf, daa, dpco } = req.body;
  
  console.log('Received data:', { name, roll, jp, ds, vccf, daa, dpco });
  
  // Basic validation
  if (!name || !roll) {
    return res.status(400).json({ error: 'Name and Roll are required' });
  }

  const sql = 'INSERT INTO stdmark (NAME, ROLL, JP, DS, VCCF, DAA, DPCO) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [
    name.trim(), 
    roll.trim(), 
    jp || null, 
    ds || null, 
    vccf || null, 
    daa || null, 
    dpco || null
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      
      // Handle duplicate entry
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Student already exists' });
      }
      
      return res.status(500).json({ error: 'Failed to insert data' });
    }
    
    console.log(✅ Inserted student: ${name} (${roll}));
    return res.json({ 
      message: 'Success', 
      id: result.insertId,
      student: { name, roll }
    });
  });
});

// Health check with database test
app.get('/health', (req, res) => {
  // Test database connection
  db.query('SELECT 1 as test', (err, results) => {
    if (err) {
      console.error('Health check failed:', err);
      return res.status(500).json({ 
        status: 'ERROR', 
        database: 'Disconnected',
        error: err.message 
      });
    }
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(🚀 Server running on port ${PORT});
  console.log(📍 Health check: /health);
  console.log(📍 Test endpoint: /test);
}); 