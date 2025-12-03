require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json());

/* ------------------------------
✅ Conexión a MySQL
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
        console.error("❌ Error al conectar a MySQL:", err);
        return;
    }
    console.log("✅ Conectado a la base de datos MySQL");
    connection.release();
});

global.db = db;

/* ------------------------------
✅ Servir archivos estáticos
------------------------------ */
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ------------------------------
✅ Middleware de autenticación
------------------------------ */
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

/* ------------------------------
✅ Registro
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
            'INSERT INTO usuarios (nombre, email, contraseña, rol, foto) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol, 'default.png']
        );

        res.json({ message: 'Usuario registrado correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/* ------------------------------
✅ Login
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

        res.json({ token, rol: user.rol, foto: user.foto });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/* ------------------------------
✅ Obtener perfil (NUEVA RUTA CORRECTA)
------------------------------ */
app.get('/api/usuarios/perfil', authenticateToken, async (req, res) => {
    try {
        const id = req.user.id_usuario;

        const [rows] = await db.promise().query(
            'SELECT nombre, foto FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------
✅ Multer configuración
------------------------------ */
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `user_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

/* ------------------------------
✅ Subir foto (NUEVA RUTA CORRECTA)
------------------------------ */
app.post('/api/usuarios/foto', authenticateToken, upload.single('foto'), async (req, res) => {
    const id_usuario = req.user.id_usuario;
    const fileName = req.file.filename;

    try {
        await db.promise().query(
            'UPDATE usuarios SET foto = ? WHERE id_usuario = ?',
            [fileName, id_usuario]
        );

        res.json({
            success: true,
            foto: fileName
        });

    } catch (err) {
        res.status(500).json({ error: 'Error al guardar la foto' });
    }
});

/* ------------------------------
✅ Rutas de clases
------------------------------ */
const classesRoutes = require('./routes/classes');
app.use('/api/clases', classesRoutes);

/* ------------------------------
✅ Rutas de instructor
------------------------------ */
const instructorRoutes = require('./routes/instructor');
app.use('/api/instructor', instructorRoutes);

/* ------------------------------
✅ Iniciar servidor
------------------------------ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
