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

// Get all students
app.get('/', (req, res) => {
  db.query('SELECT * FROM stdmark ORDER BY NAME', (err, data) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(data);
  });
});

// Update student marks by id
app.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { jp, ds, vccf, daa, dpco } = req.body;
  const sql = 'UPDATE stdmark SET JP=?, DS=?, VCCF=?, DAA=?, DPCO=? WHERE id=?';
  db.query(sql, [jp, ds, vccf, daa, dpco, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Update failed' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  });
});

// Delete student by id
app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM stdmark WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  });
});

// Delete all students
app.delete('/deleteAll', (req, res) => {
  db.query('DELETE FROM stdmark', (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete all failed' });
    res.json({ message: `Deleted ${result.affectedRows} rows` });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
