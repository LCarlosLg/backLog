const db = require('../server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { nombre, email, contraseña, rol } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        const query = 'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, ?)';
        db.query(query, [nombre, email, hashedPassword, rol], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Usuario registrado correctamente' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = (req, res) => {
    const { email, contraseña } = req.body;
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        const usuario = results[0];
        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id_usuario: usuario.id_usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login exitoso', token });
    });
};

module.exports = { register, login };
