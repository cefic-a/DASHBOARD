const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const grupos = db.prepare('SELECT * FROM grupos').all();
  res.json(grupos);
});

router.post('/', (req, res) => {
  const { id, nombre } = req.body;
  try {
    db.prepare('INSERT INTO grupos (id, nombre) VALUES (?, ?)').run(id, nombre);
    res.status(201).json({ message: 'Grupo creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    db.prepare('UPDATE grupos SET nombre = ? WHERE id = ?').run(nombre, id);
    res.json({ message: 'Actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM grupos WHERE id = ?').run(id);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;