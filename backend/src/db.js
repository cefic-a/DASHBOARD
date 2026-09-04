const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/database.sqlite'));

db.exec(`
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

module.exports = db;