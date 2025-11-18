const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// -------------------------------------------------------
// Obtener lista de clases con instructor
// -------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await global.db.promise().query(
      `SELECT 
          c.id_clase, 
          c.titulo, 
          c.descripcion, 
          c.precio, 
          c.horario, 
          c.cupo_maximo,
          u.nombre AS instructor
       FROM clases c
       INNER JOIN usuarios u ON c.id_instructor = u.id_usuario`
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las clases" });
  }
});

// -------------------------------------------------------
// Reservar clase
// -------------------------------------------------------
router.post('/reservar/:id_clase', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { id_clase } = req.params;

  try {
    await global.db.promise().query(
      "INSERT INTO reservas (id_usuario, id_clase) VALUES (?, ?)",
      [id_usuario, id_clase]
    );

    res.json({ message: "Clase reservada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al reservar la clase" });
  }
});

// -------------------------------------------------------
// Ver clases reservadas por el estudiante
// -------------------------------------------------------
router.get('/mis-reservas', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id_usuario;

  try {
    const [rows] = await global.db.promise().query(
      `SELECT 
          r.id_reserva,
          c.id_clase,
          c.titulo,
          c.descripcion,
          c.precio,
          c.horario,
          u.nombre AS instructor
       FROM reservas r
       INNER JOIN clases c ON r.id_clase = c.id_clase
       INNER JOIN usuarios u ON c.id_instructor = u.id_usuario
       WHERE r.id_usuario = ?`,
      [id_usuario]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener reservas del usuario" });
  }
});

// -------------------------------------------------------
// NUEVA RUTA: Cancelar / eliminar una reserva
// -------------------------------------------------------
router.delete('/cancelar/:id_reserva', authenticateToken, async (req, res) => {
  const { id_reserva } = req.params;
  const id_usuario = req.user.id_usuario;

  try {
    const [result] = await global.db.promise().query(
      "DELETE FROM reservas WHERE id_reserva = ? AND id_usuario = ?",
      [id_reserva, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No se encontró la reserva o no te pertenece" });
    }

    res.json({ message: "Reserva cancelada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
});

module.exports = router;
