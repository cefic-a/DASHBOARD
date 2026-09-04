const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  
  dbInstance = await open({
    filename: path.join(__dirname, '../db/database.sqlite'),
    driver: sqlite3.Database
  });

  // Crear tablas si no existen
  await dbInstance.exec(`
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

  return dbInstance;
}

module.exports = { getDb };