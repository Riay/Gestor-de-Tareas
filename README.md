![icons](images/icons.png)
---
📌 Gestor de Tareas – Sistemas S.A. de C.V.

Aplicación web full-stack desarrollada con JavaScript, Node.js, Express y SQLite, creada para gestionar tareas, controlar avances de proyectos y asignar cargas de trabajo entre desarrolladores.

---

🚀 Características principales

---

✔ 🔐 Autenticación real

Inicio de sesión con usuario y contraseña

Contraseñas encriptadas con bcrypt

Sesiones validadas con JSON Web Tokens (JWT)

---

✔ 🗂️ Gestión completa de tareas (CRUD)

Crear tareas

Consultar tareas

Editar tareas

Eliminar tareas

Estatus inicial por defecto: “Por hacer”

---

✔ 🛡️ Validaciones completas

Campos obligatorios

ID numérico

Fechas válidas

Cliente solo texto

Limpieza automática del formulario usando callback

---

✔ 📊 Tabla dinámica de tareas

Datos actualizados desde el backend

Indicador automático de tareas atrasadas

Filtros por:

Estatus

Cliente

Proyecto

---

✔ ⚙️ Backend real

Node.js + Express

Base de datos SQLite persistente

API REST modular con rutas, controladores y middleware

---

✔ 🎨 Frontend intuitivo

HTML5 + CSS3 + JavaScript

Consumo de API con fetch

Dashboard que muestra el nombre del usuario autenticado

---

```text
📁 Estructura del proyecto
gestion-tareas-fullstack/
│── server/
│   ├── database.sqlite
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   ├── controllers/
│   └── middleware/
│
│── client/
│    ├── index.html
│    ├── estilos.css
│    ├── app.js
│
└── README.md
    .gitignore
```
---

▶️ Cómo ejecutar el proyecto

---

1️⃣ Instalar dependencias
npm install

---

2️⃣ Iniciar el servidor
npm run dev

---

3️⃣ Abrir el frontend

Abre directamente el archivo:

client/index.html

---

🧪 Pruebas realizadas

---

Backend probado con Postman

Pruebas manuales en frontend

Verificación de errores en la consola del navegador

Seguridad validada con:

bcrypt (hash de contraseñas)

JWT almacenado en localStorage

---

🛠️ Tecnologías usadas

---
Categoría	Tecnologías
Backend	Node.js, Express, SQLite
Seguridad	bcrypt, JWT
Frontend	HTML5, CSS3, JavaScript
Herramientas	VS Code, npm
