const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los eliminados
router.get('/', (req, res) => {
  const eliminados = db.prepare('SELECT * FROM estudiantes_eliminados').all();
  res.json(eliminados);
});

// Eliminar permanentemente (borrado físico)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM estudiantes_eliminados WHERE id = ?').run(id);
    res.json({ message: 'Eliminado permanentemente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restaurar (mover de eliminados a estudiantes activos)
router.post('/:id/restaurar', (req, res) => {
  const { id } = req.params;
  try {
    // Obtener el registro eliminado
    const eliminado = db.prepare('SELECT * FROM estudiantes_eliminados WHERE id = ?').get(id);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });

    // Extraer solo los campos del estudiante (excluir motivo y fechaEliminacion)
    const { motivo, fechaEliminacion, ...estudiante } = eliminado;

    // Insertar de vuelta en la tabla estudiantes (con todos los campos, incluyendo los nuevos)
    const stmt = db.prepare(`
      INSERT INTO estudiantes (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      estudiante.id,
      estudiante.doc,
      estudiante.tipodoc,
      estudiante.apellidos,
      estudiante.nombres,
      estudiante.genero,
      estudiante.fechaNacimiento,
      estudiante.eps,
      estudiante.discapacidad,
      estudiante.activo,
      estudiante.grado,
      estudiante.idioma,
      estudiante.caminoSol || null,
      estudiante.caminoLuna || null
    );

    // Eliminar el registro de la tabla de eliminados
    db.prepare('DELETE FROM estudiantes_eliminados WHERE id = ?').run(id);

    res.json({ message: 'Restaurado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;