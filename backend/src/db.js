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
  `);

  // Adaptador: expone la misma API que usaba el paquete "sqlite"
  // (db.all / db.get / db.run) para no tener que tocar las rutas.
  dbInstance = {
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

module.exports = { getDb };
