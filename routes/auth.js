const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const {
    register,
    login,
    getPerfil,
    uploadFoto
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/authMiddleware');

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
✅ Rutas de autenticación
------------------------------ */

// Registro
router.post('/register', register);

// Login
router.post('/login', login);

// Obtener perfil del usuario logueado
router.get('/perfil', authenticateToken, getPerfil);

// Subir/Actualizar foto de perfil
router.post('/foto', authenticateToken, upload.single('foto'), uploadFoto);

module.exports = router;
