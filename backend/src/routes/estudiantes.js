const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los estudiantes (con sus grupos)
router.get('/', (req, res) => {
  const estudiantes = db.prepare('SELECT * FROM estudiantes').all();
  const result = estudiantes.map(est => {
    const grupos = db.prepare(`
      SELECT g.id, g.nombre 
      FROM grupos g
      JOIN estudiante_grupo eg ON eg.grupo_id = g.id
      WHERE eg.estudiante_id = ?
    `).all(est.id);
    return { ...est, gruposIds: grupos.map(g => g.id) };
  });
  res.json(result);
});

// Crear estudiante (POST)
router.post('/', (req, res) => {
  // Extraer TODOS los campos del body
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
    // Insertar en la tabla estudiantes
    const stmt = db.prepare(`
      INSERT INTO estudiantes (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
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
    );

    // Asignar grupos personalizados (si existen)
    if (gruposIds && gruposIds.length) {
      const insertGrupo = db.prepare(`INSERT INTO estudiante_grupo (estudiante_id, grupo_id) VALUES (?, ?)`);
      for (const gid of gruposIds) {
        insertGrupo.run(id, gid);
      }
    }

    res.status(201).json({ message: 'Estudiante creado exitosamente' });
  } catch (err) {
    console.error('Error al crear estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estudiante (PUT)
router.put('/:id', (req, res) => {
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
    const stmt = db.prepare(`
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
    `);
    stmt.run(
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
    );

    // Actualizar grupos personalizados
    db.prepare(`DELETE FROM estudiante_grupo WHERE estudiante_id = ?`).run(id);
    if (gruposIds && gruposIds.length) {
      const insertGrupo = db.prepare(`INSERT INTO estudiante_grupo (estudiante_id, grupo_id) VALUES (?, ?)`);
      for (const gid of gruposIds) {
        insertGrupo.run(id, gid);
      }
    }

    res.json({ message: 'Estudiante actualizado' });
  } catch (err) {
    console.error('Error al actualizar estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar (mover a eliminados con motivo)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    // Obtener el estudiante antes de borrarlo
    const estudiante = db.prepare('SELECT * FROM estudiantes WHERE id = ?').get(id);
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Insertar en la tabla de eliminados (con todos los campos, incluyendo los nuevos)
    const insertElim = db.prepare(`
      INSERT INTO estudiantes_eliminados (
        id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento,
        eps, discapacidad, activo, grado, idioma, caminoSol, caminoLuna,
        motivo, fechaEliminacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertElim.run(
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
    );

    // Eliminar de la tabla principal y sus relaciones
    db.prepare(`DELETE FROM estudiante_grupo WHERE estudiante_id = ?`).run(id);
    db.prepare(`DELETE FROM estudiantes WHERE id = ?`).run(id);

    res.json({ message: 'Estudiante eliminado (movido a histórico)' });
  } catch (err) {
    console.error('Error al eliminar estudiante:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;