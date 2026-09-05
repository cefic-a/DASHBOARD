const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173', 'https://cefic-a.github.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
// Manejo explícito de preflight para todas las rutas
app.options('*', cors(corsOptions));

app.use(express.json());

// Aviso temprano y claro si faltan las credenciales de Turso,
// en vez de fallar de forma confusa en la primera consulta.
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('ADVERTENCIA: faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN. Configúralas en Railway → Variables.');
}

// Rutas
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/grupos', require('./routes/grupos'));
app.use('/api/eliminados', require('./routes/eliminados'));

// Evita que un error inesperado tumbe el proceso entero
// (lo cual dejaría el servicio sin responder y parecería un fallo de CORS).
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
  console.log(`TURSO_DATABASE_URL configurada: ${Boolean(process.env.TURSO_DATABASE_URL)}`);
  console.log(`TURSO_AUTH_TOKEN configurada: ${Boolean(process.env.TURSO_AUTH_TOKEN)}`);
});
