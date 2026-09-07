const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Obtener todos los acudientes (con los ids de los estudiantes a su cargo)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const acudientes = await db.all('SELECT * FROM acudientes');
    const result = [];
    for (const ac of acudientes) {
      const estudiantes = await db.all(`
        SELECT estudiante_id FROM acudiente_estudiante WHERE acudiente_id = ?
      `, ac.id);
      result.push({ ...ac, estudiantesIds: estudiantes.map(e => e.estudiante_id) });
    }
    res.json(result);
  } catch (err) {
    console.error('Error al obtener acudientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Crear acudiente
router.post('/', async (req, res) => {
  const { id, nombres, documento, parentesco, telefono, direccion, estudiantesIds } = req.body;

  try {
    const db = await getDb();
    await db.run(`
      INSERT INTO acudientes (id, nombres, documento, parentesco, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      nombres,
      documento || null,
      parentesco || null,
      telefono || null,
      direccion || null
    ]);

    if (estudiantesIds && estudiantesIds.length) {
      for (const eid of estudiantesIds) {
        await db.run(`INSERT INTO acudiente_estudiante (acudiente_id, estudiante_id) VALUES (?, ?)`, [id, eid]);
      }
    }

    res.status(201).json({ message: 'Acudiente creado exitosamente' });
  } catch (err) {
    console.error('Error al crear acudiente:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar acudiente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, documento, parentesco, telefono, direccion, estudiantesIds } = req.body;

  try {
    const db = await getDb();
    await db.run(`
      UPDATE acudientes SET
        nombres = ?,
        documento = ?,
        parentesco = ?,
        telefono = ?,
        direccion = ?
      WHERE id = ?
    `, [
      nombres,
      documento || null,
      parentesco || null,
      telefono || null,
      direccion || null,
      id
    ]);

    await db.run(`DELETE FROM acudiente_estudiante WHERE acudiente_id = ?`, [id]);
    if (estudiantesIds && estudiantesIds.length) {
      for (const eid of estudiantesIds) {
        await db.run(`INSERT INTO acudiente_estudiante (acudiente_id, estudiante_id) VALUES (?, ?)`, [id, eid]);
      }
    }

    res.json({ message: 'Acudiente actualizado' });
  } catch (err) {
    console.error('Error al actualizar acudiente:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar acudiente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    await db.run(`DELETE FROM acudiente_estudiante WHERE acudiente_id = ?`, [id]);
    await db.run(`DELETE FROM acudientes WHERE id = ?`, [id]);
    res.json({ message: 'Acudiente eliminado' });
  } catch (err) {
    console.error('Error al eliminar acudiente:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
