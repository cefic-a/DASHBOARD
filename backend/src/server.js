const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: ['http://localhost:5173', 'https://cefic-a.github.io']
}));
app.use(express.json());

// Rutas
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/grupos', require('./routes/grupos'));
app.use('/api/eliminados', require('./routes/eliminados'));

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});