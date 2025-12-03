const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/* ------------------------------------------
✅ Ver TODAS las clases del sistema
   (incluye nombre del instructor)
------------------------------------------- */
router.get('/todas', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    try {
        const [rows] = await global.db.promise().query(`
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
        await global.db.promise().query(
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

        const [rows] = await global.db.promise().query(
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
        const [result] = await global.db.promise().query(
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
        const [result] = await global.db.promise().query(
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
        const [rows] = await global.db.promise().query(
            `SELECT 
                u.id_usuario,
                u.nombre,
                u.email,
                u.foto,
                r.fecha_reserva
            FROM reservas r
            INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
            INNER JOIN clases c ON r.id_clase = c.id_clase
            WHERE r.id_clase = ? AND c.id_instructor = ? AND r.estado = 'confirmada'
            ORDER BY r.fecha_reserva DESC`,
            [id, id_instructor]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Ver notificaciones del instructor
------------------------------------------- */
router.get('/notificaciones', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const id_instructor = req.user.id_usuario;

    try {
        const [rows] = await global.db.promise().query(
            `SELECT 
                n.id_notificacion,
                n.id_alumno,
                n.id_clase,
                n.mensaje,
                n.leida,
                n.fecha,
                u.nombre AS alumno_nombre,
                u.email AS alumno_email,
                c.titulo AS clase_titulo,
                c.horario AS clase_horario
            FROM notificaciones n
            LEFT JOIN usuarios u ON n.id_alumno = u.id_usuario
            LEFT JOIN clases c ON n.id_clase = c.id_clase
            WHERE n.id_instructor = ?
            ORDER BY n.fecha DESC`,
            [id_instructor]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Marcar notificación como leída
------------------------------------------- */
router.put('/notificacion/:id/leer', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { id } = req.params;
    const id_instructor = req.user.id_usuario;

    try {
        const [result] = await global.db.promise().query(
            `UPDATE notificaciones 
            SET leida = TRUE 
            WHERE id_notificacion = ? AND id_instructor = ?`,
            [id, id_instructor]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "No puedes actualizar una notificación que no es tuya" });
        }

        res.json({ message: "Notificación marcada como leída" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------
✅ Contar notificaciones sin leer
------------------------------------------- */
router.get('/notificaciones/sin-leer/count', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const id_instructor = req.user.id_usuario;

    try {
        const [rows] = await global.db.promise().query(
            `SELECT COUNT(*) as sin_leer FROM notificaciones 
            WHERE id_instructor = ? AND leida = FALSE`,
            [id_instructor]
        );

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
