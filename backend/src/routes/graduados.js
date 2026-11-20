const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

const nuevoId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const anioActual = () => Number(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota', year: 'numeric' }));

// Normaliza y valida un graduado. Devuelve { data } o { error }.
function validar(g = {}) {
  const doc = String(g.doc ?? '').trim();
  const apellidos = String(g.apellidos ?? '').trim();
  const nombres = String(g.nombres ?? '').trim();
  const anio = parseInt(g.anioGraduacion, 10);
  if (!doc) return { error: 'Falta el documento' };
  if (!apellidos || !nombres) return { error: 'Faltan nombres o apellidos' };
  if (!Number.isInteger(anio) || anio < 1950 || anio > anioActual() + 1) {
    return { error: `Año de graduación inválido (${g.anioGraduacion ?? 'vacío'})` };
  }
  return {
    data: {
      doc,
      tipodoc: g.tipodoc ? String(g.tipodoc).trim() : null,
      apellidos,
      nombres,
      genero: g.genero || null,
      fechaNacimiento: g.fechaNacimiento || null,
      anioGraduacion: anio,
      observaciones: g.observaciones ? String(g.observaciones).trim() : null,
    }
  };
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const graduados = await db.all('SELECT * FROM graduados ORDER BY anioGraduacion DESC, apellidos, nombres');
    res.json(graduados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, error } = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const db = await getDb();
    const existe = await db.get('SELECT id FROM graduados WHERE doc = ? AND anioGraduacion = ?', [data.doc, data.anioGraduacion]);
    if (existe) return res.status(409).json({ error: `El documento ${data.doc} ya está registrado como graduado en ${data.anioGraduacion}` });
    await db.run(`
      INSERT INTO graduados (id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento, anioGraduacion, observaciones, fechaRegistro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nuevoId(), data.doc, data.tipodoc, data.apellidos, data.nombres, data.genero, data.fechaNacimiento, data.anioGraduacion, data.observaciones, new Date().toISOString()]);
    res.status(201).json({ message: 'Graduado registrado' });
  } catch (err) {
    console.error('Error al crear graduado:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Carga masiva de graduados de años anteriores.
// body: { graduados: [...] }. Inserta los válidos y omite duplicados
// (mismo documento y año). Todo en una sola transacción.
router.post('/importar', async (req, res) => {
  const lista = Array.isArray(req.body?.graduados) ? req.body.graduados : null;
  if (!lista || lista.length === 0) return res.status(400).json({ error: 'No hay graduados para importar' });
  if (lista.length > 2000) return res.status(400).json({ error: 'Máximo 2000 registros por archivo' });

  const errores = [];
  const validos = [];
  const vistos = new Set();
  lista.forEach((g, i) => {
    const { data, error } = validar(g);
    if (error) { errores.push({ fila: g.fila ?? i + 2, error }); return; }
    const clave = `${data.doc}|${data.anioGraduacion}`;
    if (vistos.has(clave)) { errores.push({ fila: g.fila ?? i + 2, error: `Documento ${data.doc} repetido en el archivo para ${data.anioGraduacion}` }); return; }
    vistos.add(clave);
    validos.push(data);
  });

  try {
    const db = await getDb();
    const fecha = new Date().toISOString();
    const resultados = validos.length ? await db.batch(validos.map(d => ({
      sql: `INSERT OR IGNORE INTO graduados (id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento, anioGraduacion, observaciones, fechaRegistro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [nuevoId(), d.doc, d.tipodoc, d.apellidos, d.nombres, d.genero, d.fechaNacimiento, d.anioGraduacion, d.observaciones, fecha]
    }))) : [];
    const insertados = resultados.filter(r => r.changes > 0).length;
    res.json({
      message: 'Importación terminada',
      insertados,
      yaExistian: validos.length - insertados,
      errores,
    });
  } catch (err) {
    console.error('Error al importar graduados:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { data, error } = validar(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const db = await getDb();
    const choque = await db.get('SELECT id FROM graduados WHERE doc = ? AND anioGraduacion = ? AND id <> ?', [data.doc, data.anioGraduacion, req.params.id]);
    if (choque) return res.status(409).json({ error: `El documento ${data.doc} ya está registrado como graduado en ${data.anioGraduacion}` });
    const r = await db.run(`
      UPDATE graduados SET doc = ?, tipodoc = ?, apellidos = ?, nombres = ?, genero = ?, fechaNacimiento = ?, anioGraduacion = ?, observaciones = ?
      WHERE id = ?
    `, [data.doc, data.tipodoc, data.apellidos, data.nombres, data.genero, data.fechaNacimiento, data.anioGraduacion, data.observaciones, req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Graduado no encontrado' });
    res.json({ message: 'Graduado actualizado' });
  } catch (err) {
    console.error('Error al actualizar graduado:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const r = await db.run('DELETE FROM graduados WHERE id = ?', [req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Graduado no encontrado' });
    res.json({ message: 'Graduado eliminado' });
  } catch (err) {
    console.error('Error al eliminar graduado:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
