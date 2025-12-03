const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/* ------------------------------------------
✅ Ver TODAS las clases del sistema
   (incluye nombre del instructor)
------------------------------------------- */
router.get('/todas', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT 
                c.*, 
                u.nombre AS instructor_nombre
            FROM clases c
            LEFT JOIN usuarios u ON c.id_instructor = u.id_usuario
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Crear clase
------------------------------------------- */
router.post('/crear', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { titulo, descripcion, horario, cupo_maximo, precio } = req.body;
    const id_instructor = req.user.id_usuario;

    try {
        await db.promise().query(
            `INSERT INTO clases (titulo, descripcion, horario, cupo_maximo, precio, id_instructor)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [titulo, descripcion, horario, cupo_maximo, precio, id_instructor]
        );

        res.json({ message: "Clase creada exitosamente" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Ver SOLO MIS clases
   (incluye nombre del instructor logueado)
------------------------------------------- */
router.get('/mis-clases', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    try {
        const id_instructor = req.user.id_usuario;

        const [rows] = await db.promise().query(
            `SELECT 
                c.*, 
                u.nombre AS instructor_nombre
            FROM clases c
            LEFT JOIN usuarios u ON c.id_instructor = u.id_usuario
            WHERE c.id_instructor = ?`,
            [id_instructor]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Editar SOLO MIS clases
------------------------------------------- */
router.put('/editar/:id', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, horario, cupo_maximo, precio } = req.body;
    const id_instructor = req.user.id_usuario;

    try {
        const [result] = await db.promise().query(
            `UPDATE clases 
            SET titulo=?, descripcion=?, horario=?, cupo_maximo=?, precio=?
            WHERE id_clase=? AND id_instructor=?`,
            [titulo, descripcion, horario, cupo_maximo, precio, id, id_instructor]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "No puedes editar una clase que no es tuya" });
        }

        res.json({ message: "Clase actualizada" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Eliminar SOLO MIS clases
------------------------------------------- */
router.delete('/eliminar/:id', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { id } = req.params;
    const id_instructor = req.user.id_usuario;

    try {
        const [result] = await db.promise().query(
            `DELETE FROM clases 
            WHERE id_clase=? AND id_instructor=?`,
            [id, id_instructor]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "No puedes eliminar una clase que no es tuya" });
        }

        res.json({ message: "Clase eliminada" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Ver alumnos inscritos en una clase
------------------------------------------- */
router.get('/alumnos/:id', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { id } = req.params;
    const id_instructor = req.user.id_usuario;

    try {
        const [rows] = await db.promise().query(
            `SELECT 
                a.*, 
                u.nombre AS alumno_nombre,
                u.email AS alumno_email
            FROM alumnos_clases a
            LEFT JOIN usuarios u ON a.id_alumno = u.id_usuario
            LEFT JOIN clases c ON c.id_clase = a.id_clase
            WHERE a.id_clase = ? AND c.id_instructor = ?`,
            [id, id_instructor]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
