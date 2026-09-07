const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    console.error('ADVERTENCIA: faltan ADMIN_USER, ADMIN_PASSWORD o JWT_SECRET en las variables de entorno.');
    return res.status(500).json({ error: 'El servidor no tiene configurado el login. Contacta al administrador.' });
  }

  if (usuario === process.env.ADMIN_USER && contrasena === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token });
  }

  res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

module.exports = router;
