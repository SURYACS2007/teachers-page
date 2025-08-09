require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Fetch all students
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM stdmark';
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    return res.json(data);
  });
});

// Insert student marks
app.post('/create', (req, res) => {
  const { name, roll, jp, ds, vccf, daa, dpco } = req.body;
  const sql = `
    INSERT INTO stdmark (NAME, ROLL, JP, DS, VCCF, DAA, DPCO)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [name, roll, jp, ds, vccf, daa, dpco];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Insert failed' });
    }
    return res.json({ message: 'Success', insertedId: result.insertId });
  });
});

// Run server on environment port or 5000 locally
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
