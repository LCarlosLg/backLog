const db = require('../db/backlog_db');

// Obtener clases con filtros
exports.getClasses = (req, res) => {
    const { prof, hour } = req.query;

    // Validación de rol → solo empleados pueden ver clases
    if (req.user.rol !== "empleado") {
        return res.status(403).json({ error: "No tienes permisos para ver esta información" });
    }

    let query = `
        SELECT 
            c.id_clase, 
            c.titulo, 
            c.descripcion, 
            c.precio, 
            c.horario, 
            c.cupo_maximo, 
            u.nombre AS instructor
        FROM clases c
        JOIN usuarios u ON c.id_instructor = u.id_usuario
        WHERE 1 = 1
    `;

    const params = [];

    // Filtro por nombre del profesor
    if (prof) {
        query += " AND u.nombre LIKE ?";
        params.push(`%${prof}%`);
    }

    // Filtro por fecha u hora
    if (hour) {
        query += " AND c.horario LIKE ?";
        params.push(`%${hour}%`);
    }

    db.query(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(rows);
    });
};