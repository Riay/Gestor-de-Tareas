const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const SECRET = 'cambiar_por_un_secreto_local'; // cambiar en producción
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// inicializa DB
const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
db.exec(initSql, (err) => {
  if (err) console.error('Error init DB:', err);
  else console.log('Tablas creadas/ya existentes.');

  // crear usuario demo si no existe
  const demoUser = { username: 'dev', password: '1234', displayName: 'Desarrollador Demo' };
  db.get('SELECT * FROM users WHERE username = ?', [demoUser.username], (err, row) => {
    if (err) return console.error(err);
    if (!row) {
      const hash = bcrypt.hashSync(demoUser.password, 10);
      db.run('INSERT INTO users (username, password_hash, displayName) VALUES (?,?,?)',
        [demoUser.username, hash, demoUser.displayName], (err2) => {
          if (err2) console.error('No pudo crear demo user', err2);
          else console.log('Usuario demo creado: dev / 1234');
        });
    } else console.log('Usuario demo ya existe.');
  });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.split(' ')[1];
  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload;
    next();
  });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    if (!user) return res.status(401).json({ error: 'Usuario/contraseña inválidos' });
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Usuario/contraseña inválidos' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, SECRET, { expiresIn: '8h' });
    res.json({ token, user: { username: user.username, displayName: user.displayName } });
  });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const t = req.body;
  if (!t.task_id || !t.title || !t.start_date || !t.client || !t.project_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const sql = `INSERT INTO tasks (task_id,title,description,start_date,client,project_id,comments,status,developer)
               VALUES (?,?,?,?,?,?,?,?,?)`;
  db.run(sql, [t.task_id, t.title, t.description || '', t.start_date, t.client, t.project_id, t.comments || '', t.status || 'Por hacer', t.developer || null],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error guardando tarea' });
      db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err2,row) => {
        if (err2) return res.status(500).json({ error:'Error leyendo tarea creada' });
        res.json({ task: row });
      });
    });
});

app.get('/api/tasks', authMiddleware, (req, res) => {
  const { q, project, client, status, developer } = req.query;
  let base = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (q) { base += ' AND (title LIKE ? OR description LIKE ? OR task_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (project) { base += ' AND project_id = ?'; params.push(project); }
  if (client) { base += ' AND client = ?'; params.push(client); }
  if (status) { base += ' AND status = ?'; params.push(status); }
  if (developer) { base += ' AND developer = ?'; params.push(developer); }
  base += ' ORDER BY created_at DESC';
  db.all(base, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    res.json({ tasks: rows });
  });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const t = req.body;
  const sql = `UPDATE tasks SET task_id=?, title=?, description=?, start_date=?, client=?, project_id=?, comments=?, status=?, developer=? WHERE id=?`;
  db.run(sql, [t.task_id, t.title, t.description, t.start_date, t.client, t.project_id, t.comments, t.status, t.developer, id], function(err) {
    if (err) return res.status(500).json({ error: 'Error actualizando' });
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err2,row) => {
      if (err2) return res.status(500).json({ error: 'Error leyendo tarea' });
      res.json({ task: row });
    });
  });
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: 'Error eliminando' });
    res.json({ deleted: true });
  });
});

app.get('/api/tasks-export', authMiddleware, (req,res) => {
  const { q, project, client, status, developer } = req.query;
  let base = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (q) { base += ' AND (title LIKE ? OR description LIKE ? OR task_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (project) { base += ' AND project_id = ?'; params.push(project); }
  if (client) { base += ' AND client = ?'; params.push(client); }
  if (status) { base += ' AND status = ?'; params.push(status); }
  if (developer) { base += ' AND developer = ?'; params.push(developer); }
  db.all(base, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error DB' });
    let csv = 'ID_NEGOCIO,Título,Descripción,FechaInicio,Cliente,Proyecto,Comentarios,Estatus,Developer,CreadoEn\n';
    rows.forEach(r => {
      const line = [
        `"${(r.task_id||'').replace(/"/g,'""')}"`,
        `"${(r.title||'').replace(/"/g,'""')}"`,
        `"${(r.description||'').replace(/"/g,'""')}"`,
        r.start_date,
        `"${(r.client||'').replace(/"/g,'""')}"`,
        `"${(r.project_id||'').replace(/"/g,'""')}"`,
        `"${(r.comments||'').replace(/"/g,'""')}"`,
        r.status,
        `"${(r.developer||'').replace(/"/g,'""')}"`,
        r.created_at
      ];
      csv += line.join(',') + '\n';
    });
    res.setHeader('Content-disposition', 'attachment; filename=tareas_export.csv');
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
