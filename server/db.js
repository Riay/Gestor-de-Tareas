const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Error DB:', err);
  else console.log('Conectado a SQLite en', DB_PATH);
});
module.exports = db;
