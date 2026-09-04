const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Obtener todos los estudiantes (con sus grupos)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const estudiantes = await db.all('SELECT * FROM estudiantes');
    const result = [];
    for (const est of estudiantes) {
      const grupos = await db.all(`
        SELECT g.id, g.nombre 
        FROM grupos g
        JOIN estudiante_grupo eg ON eg.grupo_id = g.id
        WHERE eg.estudiante_id = ?
      `, est.id);
      result.push({ ...est, gruposIds: grupos.map(g => g.id) });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Crear estudiante (POST)
router.post('/', async (req, res) => {
  const {
    id,
    doc,
    tipodoc,
    apellidos,
    nombres,
    genero,
    fechaNacimiento,
    eps,
    discapacidad,
    activo,
    grado,
    idioma,
    caminoSol,
    caminoLuna,
    gruposIds
  } = req.body;

  try {
    const db = await getDb();
    await db.run(`
      INSERT INTO estudiantes (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      doc,
      tipodoc,
      apellidos,
      nombres,
      genero,
      fechaNacimiento,
      eps,
      discapacidad,
      activo ? 1 : 0,
      grado,
      idioma || null,
      caminoSol || null,
      caminoLuna || null
    ]);

    if (gruposIds && gruposIds.length) {
      for (const gid of gruposIds) {
        await db.run(`INSERT INTO estudiante_grupo (estudiante_id, grupo_id) VALUES (?, ?)`, [id, gid]);
      }
    }

    res.status(201).json({ message: 'Estudiante creado exitosamente' });
  } catch (err) {
    console.error('Error al crear estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estudiante (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    doc,
    tipodoc,
    apellidos,
    nombres,
    genero,
    fechaNacimiento,
    eps,
    discapacidad,
    activo,
    grado,
    idioma,
    caminoSol,
    caminoLuna,
    gruposIds
  } = req.body;

  try {
    const db = await getDb();
    await db.run(`
      UPDATE estudiantes SET
        doc = ?,
        tipodoc = ?,
        apellidos = ?,
        nombres = ?,
        genero = ?,
        fechaNacimiento = ?,
        eps = ?,
        discapacidad = ?,
        activo = ?,
        grado = ?,
        idioma = ?,
        caminoSol = ?,
        caminoLuna = ?
      WHERE id = ?
    `, [
      doc,
      tipodoc,
      apellidos,
      nombres,
      genero,
      fechaNacimiento,
      eps,
      discapacidad,
      activo ? 1 : 0,
      grado,
      idioma || null,
      caminoSol || null,
      caminoLuna || null,
      id
    ]);

    await db.run(`DELETE FROM estudiante_grupo WHERE estudiante_id = ?`, [id]);
    if (gruposIds && gruposIds.length) {
      for (const gid of gruposIds) {
        await db.run(`INSERT INTO estudiante_grupo (estudiante_id, grupo_id) VALUES (?, ?)`, [id, gid]);
      }
    }

    res.json({ message: 'Estudiante actualizado' });
  } catch (err) {
    console.error('Error al actualizar estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar (mover a eliminados con motivo)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const db = await getDb();
    const estudiante = await db.get('SELECT * FROM estudiantes WHERE id = ?', [id]);
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });

    await db.run(`
      INSERT INTO estudiantes_eliminados (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna,
        motivo, fechaEliminacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      estudiante.caminoLuna || null,
      motivo,
      new Date().toISOString()
    ]);

    await db.run(`DELETE FROM estudiante_grupo WHERE estudiante_id = ?`, [id]);
    await db.run(`DELETE FROM estudiantes WHERE id = ?`, [id]);

    res.json({ message: 'Estudiante eliminado (movido a histórico)' });
  } catch (err) {
    console.error('Error al eliminar estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;