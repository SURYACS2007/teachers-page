require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.getConnection((err, connection) => {
  if (err) console.error('DB connection failed:', err);
  else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

// -------------------- GET ALL STUDENTS --------------------
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM stdmark ORDER BY NAME';
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(data);
  });
});

// -------------------- CREATE STUDENT --------------------
app.post('/create', (req, res) => {
  const { name, roll, jp, ds, vccf, daa, dpco } = req.body;

  if (!name || !roll) return res.status(400).json({ error: 'Name and Roll required' });

  const sql = 'INSERT INTO stdmark (NAME, ROLL, JP, DS, VCCF, DAA, DPCO) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [name.trim(), roll.trim(), jp || null, ds || null, vccf || null, daa || null, dpco || null];

  db.query(sql, values, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Student exists' });
      return res.status(500).json({ error: 'Insert failed' });
    }
    res.json({ message: 'Success', id: result.insertId });
  });
});

// -------------------- GET JP STUDENTS --------------------
app.get('/jpstudent', (req, res) => {
  const sql = 'SELECT * FROM submark ORDER BY NAME';
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(data);
  });
});

// -------------------- CREATE/UPDATE JP --------------------
app.post('/createjp', (req, res) => {
  const { roll, jp } = req.body;

  if (!roll) {
    return res.status(400).json({ error: 'Roll required' });
  }

  // Insert if not exists, otherwise update
  const sql = `
    INSERT INTO submark (ROLL, JP)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE JP = VALUES(JP)
  `;
  db.query(sql, [roll.trim(), jp || null], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json({ message: 'Updated successfully' });
  });
});

// -------------------- DELETE SINGLE JP --------------------
app.delete('/deletejp/:roll', (req, res) => {
  const { roll } = req.params;
  const sql = 'DELETE FROM submark WHERE ROLL = ?';
  db.query(sql, [roll], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// -------------------- DELETE ALL JP --------------------
app.delete('/delete-alljp', (req, res) => {
  const sql = 'DELETE FROM submark';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete all failed' });
    res.json({ message: 'All students deleted successfully' });
  });
});

// -------------------- DELETE SINGLE STUDENT --------------------
app.delete('/delete/:roll', (req, res) => {
  const { roll } = req.params;
  const sql = 'DELETE FROM stdmark WHERE ROLL = ?';
  db.query(sql, [roll], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// -------------------- DELETE ALL STUDENTS --------------------
app.delete('/delete-all', (req, res) => {
  const sql = 'DELETE FROM stdmark';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete all failed' });
    res.json({ message: 'All students deleted successfully' });
  });
});

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
