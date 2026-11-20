const { createClient } = require('@libsql/client');
require('dotenv').config();

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  // Crear tablas si no existen
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id TEXT PRIMARY KEY,
      doc TEXT UNIQUE NOT NULL,
      tipodoc TEXT,
      apellidos TEXT NOT NULL,
      nombres TEXT NOT NULL,
      genero TEXT,
      fechaNacimiento TEXT,
      eps TEXT,
      discapacidad TEXT,
      activo INTEGER DEFAULT 1,
      grado INTEGER,
      idioma TEXT,
      caminoSol TEXT,
      caminoLuna TEXT
    );

    CREATE TABLE IF NOT EXISTS grupos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estudiante_grupo (
      estudiante_id TEXT,
      grupo_id TEXT,
      PRIMARY KEY (estudiante_id, grupo_id),
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
      FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS estudiantes_eliminados (
      id TEXT PRIMARY KEY,
      doc TEXT,
      tipodoc TEXT,
      apellidos TEXT,
      nombres TEXT,
      genero TEXT,
      fechaNacimiento TEXT,
      eps TEXT,
      discapacidad TEXT,
      activo INTEGER,
      grado INTEGER,
      idioma TEXT,
      caminoSol TEXT,
      caminoLuna TEXT,
      motivo TEXT,
      fechaEliminacion TEXT
    );

    CREATE TABLE IF NOT EXISTS acudientes (
      id TEXT PRIMARY KEY,
      nombres TEXT NOT NULL,
      documento TEXT,
      parentesco TEXT,
      telefono TEXT,
      direccion TEXT
    );

    CREATE TABLE IF NOT EXISTS acudiente_estudiante (
      acudiente_id TEXT,
      estudiante_id TEXT,
      PRIMARY KEY (acudiente_id, estudiante_id),
      FOREIGN KEY (acudiente_id) REFERENCES acudientes(id) ON DELETE CASCADE,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
    );
  `);

  await runMigrations(client);

  // Adaptador: expone la misma API que usaba el paquete "sqlite"
  // (db.all / db.get / db.run) para no tener que tocar las rutas.
  dbInstance = {
    // Ejecuta varias sentencias en una sola transacción (todo o nada).
    // statements: [{ sql, args }]
    async batch(statements) {
      const res = await client.batch(statements, 'write');
      return res.map(r => ({ changes: r.rowsAffected }));
    },

    async all(sql, params = []) {
      const args = Array.isArray(params) ? params : [params];
      const res = await client.execute({ sql, args });
      return res.rows.map(row => ({ ...row }));
    },

    async get(sql, params = []) {
      const args = Array.isArray(params) ? params : [params];
      const res = await client.execute({ sql, args });
      return res.rows[0] ? { ...res.rows[0] } : undefined;
    },

    async run(sql, params = []) {
      const args = Array.isArray(params) ? params : [params];
      const res = await client.execute({ sql, args });
      return { lastID: res.lastInsertRowid, changes: res.rowsAffected };
    }
  };

  return dbInstance;
}

// Migraciones aditivas e idempotentes: solo agregan columnas/tablas nuevas,
// nunca borran ni modifican datos existentes. Seguras para producción.
async function runMigrations(client) {
  const cols = await client.execute('PRAGMA table_info(estudiantes)');
  const names = cols.rows.map(r => r.name);

  // Resultado académico del año en curso: PENDIENTE | APROBADO | REPROBADO
  if (!names.includes('estadoAcademico')) {
    await client.execute("ALTER TABLE estudiantes ADD COLUMN estadoAcademico TEXT DEFAULT 'PENDIENTE'");
  }

  // Fecha en que se registró el estudiante (para el grupo automático NUEVO).
  // Los estudiantes existentes quedan con NULL: no se consideran nuevos.
  if (!names.includes('fechaCreacion')) {
    await client.execute('ALTER TABLE estudiantes ADD COLUMN fechaCreacion TEXT');
  }

  // Graduados por año. Se llenan al promover (grado 11 aprobado) o
  // subiendo graduados de años anteriores. Un documento solo puede
  // graduarse una vez por año.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS graduados (
      id TEXT PRIMARY KEY,
      doc TEXT NOT NULL,
      tipodoc TEXT,
      apellidos TEXT NOT NULL,
      nombres TEXT NOT NULL,
      genero TEXT,
      fechaNacimiento TEXT,
      anioGraduacion INTEGER NOT NULL,
      estudiante_id TEXT,
      lote TEXT,
      observaciones TEXT,
      fechaRegistro TEXT NOT NULL,
      UNIQUE (doc, anioGraduacion)
    )
  `);

  // Registro de migraciones de datos que deben correr una sola vez.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      nombre TEXT PRIMARY KEY,
      fecha TEXT NOT NULL
    )
  `);

  // Historial de promociones: permite auditar y deshacer un lote completo.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS promociones_historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lote TEXT NOT NULL,
      estudiante_id TEXT NOT NULL,
      doc TEXT,
      gradoAnterior INTEGER,
      gradoNuevo INTEGER,
      resultado TEXT,
      activoAnterior INTEGER,
      activoNuevo INTEGER,
      fecha TEXT NOT NULL
    )
  `);

  // Una sola vez: pasar a "graduados" a quienes se graduaron en promociones
  // hechas antes de que existiera la sección (mismo lote, para que
  // "deshacer" también los quite).
  await correrUnaVez(client, '2026-11-graduados-desde-historial', [
    {
      sql: `
        INSERT OR IGNORE INTO graduados
          (id, doc, tipodoc, apellidos, nombres, genero, fechaNacimiento, anioGraduacion, estudiante_id, lote, fechaRegistro)
        SELECT 'g' || lower(hex(randomblob(8))), e.doc, e.tipodoc, e.apellidos, e.nombres, e.genero, e.fechaNacimiento,
               CAST(substr(h.fecha, 1, 4) AS INTEGER), e.id, h.lote, h.fecha
        FROM promociones_historial h
        JOIN estudiantes e ON e.id = h.estudiante_id
        WHERE h.resultado = 'APROBADO' AND h.activoAnterior = 1 AND h.activoNuevo = 0
      `,
      args: []
    }
  ]);
}

async function correrUnaVez(client, nombre, statements) {
  const ya = await client.execute({ sql: 'SELECT 1 FROM migraciones_aplicadas WHERE nombre = ?', args: [nombre] });
  if (ya.rows.length) return;
  await client.batch([
    ...statements,
    { sql: 'INSERT INTO migraciones_aplicadas (nombre, fecha) VALUES (?, ?)', args: [nombre, new Date().toISOString()] }
  ], 'write');
}

module.exports = { getDb, runMigrations };
