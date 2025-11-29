const API_BASE = '';

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const displayUser = document.getElementById('display-user');
const btnLogout = document.getElementById('btn-logout');

const taskForm = document.getElementById('task-form');
const taskError = document.getElementById('task-error');
const tasksTableBody = document.querySelector('#tasks-table tbody');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

const fields = {
  id: document.getElementById('task-id'),
  title: document.getElementById('task-title'),
  date: document.getElementById('task-date'),
  project: document.getElementById('task-project'),
  client: document.getElementById('task-client'),
  description: document.getElementById('task-desc'),
  comments: document.getElementById('task-comments'),
  status: document.getElementById('task-status'),
  dev: document.getElementById('task-dev')
};

const filterQ = document.getElementById('filter-q');
const filterProject = document.getElementById('filter-project');
const filterClient = document.getElementById('filter-client');
const filterStatus = document.getElementById('filter-status');
const btnFilter = document.getElementById('btn-filter');
const btnClearFilters = document.getElementById('btn-clear-filters');
const btnExport = document.getElementById('btn-export');
const btnExportPdf = document.getElementById('btn-export-pdf');

let editingId = null;

function setAuth(token, user) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
function getToken() { return sessionStorage.getItem('token'); }

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  try {
    const res = await fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})
    });
    const data = await res.json();
    if (!res.ok) { loginError.textContent = data.error || 'Error'; return; }
    setAuth(data.token, data.user);
    showApp();
  } catch (err) {
    loginError.textContent = 'Error de red';
  }
});

btnLogout.addEventListener('click', () => {
  clearAuth();
  hideApp();
});

function showApp() {
  const u = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (!u) return hideApp();
  displayUser.textContent = u.displayName;
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  loadTasks();
}

function hideApp() {
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  loginForm.reset();
}

if (getToken()) showApp();

function validateTaskPayload(p) {
  if (!p.task_id) return 'ID negocio obligatorio';
  if (!/^\d+$/.test(p.task_id)) return 'El ID negocio debe ser numérico';
  if (!p.title || p.title.trim().length < 3) return 'Título debe tener >=3 caracteres';
  if (!p.start_date) return 'Fecha de inicio obligatoria';
  if (!p.client) return 'Cliente obligatorio';
  if (!p.project_id) return 'Id del proyecto obligatorio';
  return null;
}

async function loadTasks() {
  tasksTableBody.innerHTML = '';
  const qs = new URLSearchParams();
  if (filterQ.value) qs.set('q', filterQ.value);
  if (filterProject.value) qs.set('project', filterProject.value);
  if (filterClient.value) qs.set('client', filterClient.value);
  if (filterStatus.value) qs.set('status', filterStatus.value);
  const url = '/api/tasks' + (qs.toString() ? ('?'+qs.toString()) : '');
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + getToken() }});
  const data = await res.json();
  if (!res.ok) { alert('Error al cargar tareas: '+(data.error||res.statusText)); return; }
  data.tasks.forEach(renderTaskRow);
}

function daysBetween(d1, d2) {
  const msPerDay = 24*60*60*1000;
  return Math.floor((d2 - d1) / msPerDay);
}

function renderTaskRow(t) {
  const tr = document.createElement('tr');
  const start = new Date(t.start_date);
  const today = new Date(); today.setHours(0,0,0,0);
  const late = (start < today && t.status !== 'Terminado');
  if (late) tr.classList.add('row-late');
  const daysLate = late ? daysBetween(start, today) : 0;
  tr.innerHTML = `
    <td>${escapeHtml(t.task_id)}</td>
    <td>${escapeHtml(t.title)}</td>
    <td>${escapeHtml(t.start_date)}</td>
    <td>${escapeHtml(t.client)}</td>
    <td>${escapeHtml(t.project_id)}</td>
    <td>${escapeHtml(t.developer || '')}</td>
    <td>${escapeHtml(t.status)}</td>
    <td>${late ? '<span class="retraso-badge">-'+daysLate+'d</span>' : ''}</td>
    <td>
      <button class="btn-edit" data-id="${t.id}">Editar</button>
      <button class="btn-del" data-id="${t.id}">Eliminar</button>
    </td>
  `;
  tasksTableBody.appendChild(tr);
  tr.querySelector('.btn-edit').addEventListener('click', () => startEdit(t));
  tr.querySelector('.btn-del').addEventListener('click', () => deleteTask(t.id));
}

function escapeHtml(s){ if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function startEdit(task) {
  editingId = task.id;
  fields.id.value = task.task_id;
  fields.title.value = task.title;
  fields.date.value = task.start_date;
  fields.project.value = task.project_id;
  fields.client.value = task.client;
  fields.description.value = task.description;
  fields.comments.value = task.comments;
  fields.status.value = task.status;
  fields.dev.value = task.developer || '';
  btnSave.textContent = 'Guardar cambios';
  btnCancelEdit.classList.remove('hidden');
}

btnCancelEdit.addEventListener('click', () => {
  editingId = null; taskForm.reset(); btnSave.textContent = 'Agregar';
  btnCancelEdit.classList.add('hidden');
});

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  taskError.textContent = '';
  const payload = {
    task_id: fields.id.value.trim(),
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    start_date: fields.date.value,
    client: fields.client.value.trim(),
    project_id: fields.project.value.trim(),
    comments: fields.comments.value.trim(),
    status: fields.status.value,
    developer: fields.dev.value.trim()
  };
  const v = validateTaskPayload(payload);
  if (v) { taskError.textContent = v; return; }

  try {
    if (!editingId) {
      const res = await fetch('/api/tasks', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + getToken() }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { taskError.textContent = data.error || 'Error al crear'; return; }
      renderTaskRow(data.task);
      taskForm.reset();
    } else {
      const res = await fetch(`/api/tasks/${editingId}`, { method:'PUT', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + getToken() }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { taskError.textContent = data.error || 'Error al editar'; return; }
      editingId = null; btnSave.textContent = 'Agregar'; btnCancelEdit.classList.add('hidden');
      taskForm.reset();
      await loadTasks();
    }
  } catch (err) {
    taskError.textContent = 'Error de red';
  }
});

async function deleteTask(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  const res = await fetch(`/api/tasks/${id}`, { method:'DELETE', headers: { Authorization: 'Bearer ' + getToken() }});
  const data = await res.json();
  if (!res.ok) { alert('Error al eliminar: '+(data.error||res.statusText)); return; }
  await loadTasks();
}

btnFilter.addEventListener('click', loadTasks);
btnClearFilters.addEventListener('click', () => { filterQ.value=''; filterProject.value=''; filterClient.value=''; filterStatus.value=''; loadTasks(); });

btnExport.addEventListener('click', () => {
  const qs = new URLSearchParams();
  if (filterQ.value) qs.set('q', filterQ.value);
  if (filterProject.value) qs.set('project', filterProject.value);
  if (filterClient.value) qs.set('client', filterClient.value);
  if (filterStatus.value) qs.set('status', filterStatus.value);
  const url = '/api/tasks-export' + (qs.toString() ? ('?'+qs.toString()) : '');
  const a = document.createElement('a'); a.href = url;
  a.setAttribute('download','tareas_export.csv');
  a.click();
});

btnExportPdf.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text('Export Tareas', 14, 20);
  const headers = ['ID','Título','Inicio','Cliente','Proyecto','Dev','Estatus'];
  const rows = [];
  const qs = new URLSearchParams();
  if (filterQ.value) qs.set('q', filterQ.value);
  if (filterProject.value) qs.set('project', filterProject.value);
  if (filterClient.value) qs.set('client', filterClient.value);
  if (filterStatus.value) qs.set('status', filterStatus.value);
  const res = await fetch('/api/tasks' + (qs.toString() ? ('?'+qs.toString()) : ''), { headers:{ Authorization:'Bearer '+getToken() }});
  const data = await res.json();
  data.tasks.forEach(t => rows.push([t.task_id, t.title.substring(0,30), t.start_date, t.client, t.project_id, t.developer||'', t.status]));
  let y = 30;
  doc.setFontSize(10);
  doc.text(headers.join(' | '), 14, y);
  y += 6;
  rows.forEach(r => {
    doc.text(r.join(' | '), 14, y);
    y += 6;
    if (y > 280) { doc.addPage(); y = 20; }
  });
  doc.save('tareas.pdf');
});

btnClear.addEventListener('click', () => { taskForm.reset(); editingId = null; btnSave.textContent='Agregar'; btnCancelEdit.classList.add('hidden'); taskError.textContent=''; });
