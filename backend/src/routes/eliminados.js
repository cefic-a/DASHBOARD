const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const eliminados = await db.all('SELECT * FROM estudiantes_eliminados');
    res.json(eliminados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run('DELETE FROM estudiantes_eliminados WHERE id = ?', [id]);
    res.json({ message: 'Eliminado permanentemente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/restaurar', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const eliminado = await db.get('SELECT * FROM estudiantes_eliminados WHERE id = ?', [id]);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });

    const { motivo, fechaEliminacion, ...estudiante } = eliminado;

    await db.run(`
      INSERT INTO estudiantes (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    await db.run('DELETE FROM estudiantes_eliminados WHERE id = ?', [id]);
    res.json({ message: 'Restaurado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;