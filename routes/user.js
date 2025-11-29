const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = global.db;

// Middleware para autenticar token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Configuración multer para subir fotos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'avatar_' + req.user.id_usuario + ext);
    }
});
const upload = multer({ storage: storage });

// Obtener info del usuario
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id_usuario, nombre, email, foto_perfil FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario]);
        if (rows.length === 0) return res.sendStatus(404);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// Subir foto de perfil
router.post('/foto', authenticateToken, upload.single('foto'), async (req, res) => {
    try {
        const filename = req.file.filename;
        await db.promise().query('UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?', [filename, req.user.id_usuario]);
        res.json({ foto: filename });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'No se pudo actualizar la foto' });
    }
});

module.exports = router;
