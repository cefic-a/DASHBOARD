const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

const ESTADOS = ['PENDIENTE', 'APROBADO', 'REPROBADO'];
const GRADO_MAXIMO = 11;

// Marcar uno o varios estudiantes como APROBADO / REPROBADO / PENDIENTE
// body: { ids: string[], estado: 'APROBADO' | 'REPROBADO' | 'PENDIENTE' }
router.put('/estado', async (req, res) => {
  const { ids, estado } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debes indicar al menos un estudiante' });
  }
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(', ')}` });
  }
  try {
    const db = await getDb();
    const placeholders = ids.map(() => '?').join(',');
    const r = await db.run(
      `UPDATE estudiantes SET estadoAcademico = ? WHERE id IN (${placeholders})`,
      [estado, ...ids]
    );
    res.json({ message: 'Estado académico actualizado', actualizados: r.changes });
  } catch (err) {
    console.error('Error al actualizar estado académico:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Promover al siguiente grado a todos los estudiantes ACTIVOS marcados APROBADO.
//  - Grado < 11 y APROBADO  -> grado + 1, estado vuelve a PENDIENTE
//  - Grado 11 y APROBADO    -> se marca GRADUADO e inactivo (no se borra)
//  - REPROBADO              -> mantiene el grado, estado vuelve a PENDIENTE
// Todo ocurre en una sola transacción y queda registrado en el historial
// (lote) para poder deshacerlo.
router.post('/promover', async (req, res) => {
  if (!req.body || req.body.confirmar !== true) {
    return res.status(400).json({ error: 'Falta confirmar la promoción' });
  }
  const fecha = new Date().toISOString();
  const lote = `L${Date.now()}`;
  try {
    const db = await getDb();
    await db.batch([
      {
        sql: `
          INSERT INTO promociones_historial
            (lote, estudiante_id, doc, gradoAnterior, gradoNuevo, resultado, activoAnterior, activoNuevo, fecha)
          SELECT ?, id, doc, grado,
            CASE WHEN estadoAcademico = 'APROBADO' AND grado < ? THEN grado + 1 ELSE grado END,
            estadoAcademico,
            activo,
            CASE WHEN estadoAcademico = 'APROBADO' AND grado >= ? THEN 0 ELSE activo END,
            ?
          FROM estudiantes
          WHERE activo = 1 AND grado IS NOT NULL AND estadoAcademico IN ('APROBADO', 'REPROBADO')
        `,
        args: [lote, GRADO_MAXIMO, GRADO_MAXIMO, fecha]
      },
      {
        sql: `UPDATE estudiantes SET grado = grado + 1, estadoAcademico = 'PENDIENTE'
              WHERE activo = 1 AND estadoAcademico = 'APROBADO' AND grado IS NOT NULL AND grado < ?`,
        args: [GRADO_MAXIMO]
      },
      {
        sql: `UPDATE estudiantes SET activo = 0, estadoAcademico = 'GRADUADO'
              WHERE activo = 1 AND estadoAcademico = 'APROBADO' AND grado >= ?`,
        args: [GRADO_MAXIMO]
      },
      {
        sql: `UPDATE estudiantes SET estadoAcademico = 'PENDIENTE'
              WHERE activo = 1 AND estadoAcademico = 'REPROBADO' AND grado IS NOT NULL`,
        args: []
      }
    ]);

    const resumen = await db.get(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN resultado = 'APROBADO' AND gradoNuevo > gradoAnterior THEN 1 ELSE 0 END) AS promovidos,
        SUM(CASE WHEN resultado = 'APROBADO' AND activoNuevo = 0 THEN 1 ELSE 0 END) AS graduados,
        SUM(CASE WHEN resultado = 'REPROBADO' THEN 1 ELSE 0 END) AS reprobados
      FROM promociones_historial WHERE lote = ?
    `, [lote]);

    res.json({ message: 'Promoción realizada', lote, ...resumen });
  } catch (err) {
    console.error('Error al promover estudiantes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lista de lotes de promoción (más reciente primero)
router.get('/historial', async (req, res) => {
  try {
    const db = await getDb();
    const lotes = await db.all(`
      SELECT lote, MIN(fecha) AS fecha, COUNT(*) AS total,
        SUM(CASE WHEN resultado = 'APROBADO' AND gradoNuevo > gradoAnterior THEN 1 ELSE 0 END) AS promovidos,
        SUM(CASE WHEN resultado = 'APROBADO' AND activoNuevo = 0 THEN 1 ELSE 0 END) AS graduados,
        SUM(CASE WHEN resultado = 'REPROBADO' THEN 1 ELSE 0 END) AS reprobados
      FROM promociones_historial
      GROUP BY lote
      ORDER BY fecha DESC
    `);
    res.json(lotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Deshacer un lote de promoción. Solo se permite el más reciente, para no
// dejar grados inconsistentes si hubo varias promociones seguidas.
router.post('/deshacer/:lote', async (req, res) => {
  const { lote } = req.params;
  try {
    const db = await getDb();
    const ultimo = await db.get('SELECT lote FROM promociones_historial ORDER BY fecha DESC, id DESC LIMIT 1');
    if (!ultimo) return res.status(404).json({ error: 'No hay promociones para deshacer' });
    if (ultimo.lote !== lote) {
      return res.status(400).json({ error: 'Solo se puede deshacer la promoción más reciente' });
    }

    await db.batch([
      {
        sql: `
          UPDATE estudiantes SET
            grado = (SELECT h.gradoAnterior FROM promociones_historial h WHERE h.lote = ? AND h.estudiante_id = estudiantes.id),
            activo = (SELECT h.activoAnterior FROM promociones_historial h WHERE h.lote = ? AND h.estudiante_id = estudiantes.id),
            estadoAcademico = (SELECT h.resultado FROM promociones_historial h WHERE h.lote = ? AND h.estudiante_id = estudiantes.id)
          WHERE id IN (SELECT estudiante_id FROM promociones_historial WHERE lote = ?)
        `,
        args: [lote, lote, lote, lote]
      },
      { sql: 'DELETE FROM promociones_historial WHERE lote = ?', args: [lote] }
    ]);

    res.json({ message: 'Promoción deshecha', lote });
  } catch (err) {
    console.error('Error al deshacer promoción:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
