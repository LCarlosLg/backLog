const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
        db.query(sql, [nombre, email, hashedPassword, rol], (err) => {
            if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
            res.json({ message: 'Usuario registrado correctamente' });
        });
    } catch {
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Error en el servidor' });
            if (results.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });

            const user = results[0];

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });

            //  INCLUIMOS EL ROL EN EL TOKEN
            const token = jwt.sign(
                { id: user.id, email: user.email, rol: user.rol },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                message: 'Login exitoso',
                token,
                rol: user.rol
            });
        });
    } catch {
        res.status(500).json({ error: 'Error del servidor' });
    }
};