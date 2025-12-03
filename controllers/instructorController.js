const db = require("../db/backlog_db");

// ✅ Crear nueva clase
exports.crearClase = async (req, res) => {
    try {
        const { titulo, descripcion, horario, cupo_maximo, precio } = req.body;

        // El ID del instructor viene del token
        const id_instructor = req.user.id_usuario;

        await db.query(
            `INSERT INTO clases (titulo, descripcion, horario, cupo_maximo, precio, instructor_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [titulo, descripcion, horario, cupo_maximo, precio, id_instructor]
        );

        res.json({ message: "Clase creada exitosamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Ver clases del instructor
exports.misClases = async (req, res) => {
    try {
        const id_instructor = req.user.id_usuario;

        const [rows] = await db.query(
            `SELECT * FROM clases WHERE instructor_id = ?`,
            [id_instructor]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
