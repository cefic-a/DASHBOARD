const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const grupos = await db.all('SELECT * FROM grupos');
    res.json(grupos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, nombre } = req.body;
  try {
    const db = await getDb();
    await db.run('INSERT INTO grupos (id, nombre) VALUES (?, ?)', [id, nombre]);
    res.status(201).json({ message: 'Grupo creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const db = await getDb();
    await db.run('UPDATE grupos SET nombre = ? WHERE id = ?', [nombre, id]);
    res.json({ message: 'Actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run('DELETE FROM grupos WHERE id = ?', [id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;