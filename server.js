require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

/* ------------------------------
   Conexión a MySQL
------------------------------ */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3308,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Error al conectar a MySQL:", err);
        return;
    }
    console.log("Conectado a la base de datos MySQL");
    connection.release();
});

// Exportar para rutas
global.db = db;

/* ------------------------------
   Servir archivos estáticos
------------------------------ */
console.log("STATIC PATH:", path.join(__dirname, "public"));

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get('/clases.html', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "clases.html"));
});

/* ------------------------------
   Middleware de autenticación
------------------------------ */
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

/* ------------------------------
   Registro
------------------------------ */
app.post('/api/auth/register', async (req, res) => {
    const { nombre, email, contraseña, rol } = req.body;

    try {
        const [existing] = await db.promise().query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);

        await db.promise().query(
            'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol]
        );

        res.json({ message: 'Usuario registrado correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/* ------------------------------
   Login
------------------------------ */
app.post('/api/auth/login', async (req, res) => {
    const { email, contraseña } = req.body;

    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (rows.length === 0)
            return res.status(400).json({ error: 'Usuario no encontrado' });

        const user = rows[0];

        const isMatch = await bcrypt.compare(contraseña, user.contraseña);
        if (!isMatch)
            return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id_usuario: user.id_usuario, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, rol: user.rol });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/* ------------------------------
   Rutas de clases
------------------------------ */
const classesRoutes = require('./routes/classes');
app.use('/api/clases', classesRoutes);

/* ------------------------------
   Iniciar servidor
------------------------------ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});