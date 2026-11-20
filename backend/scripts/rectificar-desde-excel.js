/*
 * Rectifica la base de datos a partir del archivo
 * "FORMATO APROBADOS Y REPROBADOS" (hoja con columnas GRADO_COD, DOC, ...,
 * columna K = resultado: PROMOCION | REPRUEBA | MOVILIDAD TRASLADO | NO EXISTE).
 *
 * Uso:
 *   node scripts/rectificar-desde-excel.js "<ruta.xlsx>"            -> SIMULACIÓN (no escribe nada)
 *   node scripts/rectificar-desde-excel.js "<ruta.xlsx>" --aplicar  -> aplica los cambios
 *
 * Opcional: --grados=0-9 (rango de grados a rectificar, por defecto 0-9)
 *
 * Qué corrige (solo estudiantes que están en el archivo y en el rango de grados):
 *   - grado               := GRADO_COD del archivo
 *   - estadoAcademico     := APROBADO (PROMOCION) | REPROBADO (REPRUEBA)
 *   - activo = 0          si el archivo dice MOVILIDAD TRASLADO o NO EXISTE
 * Qué NO toca: nombres, documentos, tipo de documento, grupos, acudientes.
 * Esas diferencias solo se reportan para revisión manual.
 *
 * Antes de aplicar guarda un respaldo JSON completo en backend/db/respaldos/.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const XLSX = require('xlsx');
const { createClient } = require('@libsql/client');
const { runMigrations } = require('../src/db');

const args = process.argv.slice(2);
const archivo = args.find(a => !a.startsWith('--'));
const aplicar = args.includes('--aplicar');
const rango = (args.find(a => a.startsWith('--grados=')) || '--grados=0-9').split('=')[1].split('-').map(Number);
const [GMIN, GMAX] = rango;

if (!archivo || !fs.existsSync(archivo)) {
  console.error('Indica la ruta del archivo .xlsx. Ej: node scripts/rectificar-desde-excel.js "D:\\FORMATO.xlsx"');
  process.exit(1);
}

const RESULTADO = {
  'PROMOCION': { estadoAcademico: 'APROBADO', activo: 1 },
  'REPRUEBA': { estadoAcademico: 'REPROBADO', activo: 1 },
  'MOVILIDAD TRASLADO': { estadoAcademico: 'PENDIENTE', activo: 0 },
  'NO EXISTE': { estadoAcademico: 'PENDIENTE', activo: 0 },
};

const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f\uFFFD]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

function leerExcel(ruta) {
  const wb = XLSX.readFile(ruta, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const iHeader = filas.findIndex(f => f && f.includes('GRADO_COD') && f.includes('DOC'));
  if (iHeader < 0) throw new Error('No se encontró la fila de encabezados (GRADO_COD, DOC)');
  const h = filas[iHeader];
  const col = n => h.indexOf(n);
  const cGrado = col('GRADO_COD'), cDoc = col('DOC');
  // La columna de resultado no tiene encabezado: es la que sigue a F.NAC
  const cRes = col('F.NAC') + 1;
  const out = [];
  for (const f of filas.slice(iHeader + 1)) {
    if (!f || f[cDoc] == null || f[cDoc] === '') continue;
    out.push({
      doc: String(f[cDoc]).trim(),
      grado: Number(f[cGrado]),
      apellidos: [f[col('APELLIDO_1')], f[col('APELLIDO_2')]].filter(Boolean).join(' '),
      nombres: [f[col('NOMBRE_1')], f[col('NOMBRE_2')]].filter(Boolean).join(' '),
      resultado: norm(f[cRes]),
    });
  }
  return out;
}

(async () => {
  const excel = leerExcel(archivo).filter(e => e.grado >= GMIN && e.grado <= GMAX);
  const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

  const cols = (await client.execute('PRAGMA table_info(estudiantes)')).rows.map(r => r.name);
  const tieneEstado = cols.includes('estadoAcademico');
  const estudiantes = (await client.execute('SELECT * FROM estudiantes')).rows.map(r => ({ ...r }));
  const eliminados = (await client.execute('SELECT id, doc, apellidos, nombres, grado, motivo FROM estudiantes_eliminados')).rows.map(r => ({ ...r }));
  const porDoc = new Map(estudiantes.map(e => [String(e.doc).trim(), e]));
  const eliPorDoc = new Map(eliminados.map(e => [String(e.doc).trim(), e]));
  const docsExcel = new Set(excel.map(e => e.doc));

  const cambios = [];      // { est, set: {campo: valor}, detalle }
  const avisos = [];

  for (const e of excel) {
    const regla = RESULTADO[e.resultado];
    if (!regla) { avisos.push(`Resultado desconocido "${e.resultado}" para ${e.doc} ${e.apellidos} ${e.nombres}`); continue; }
    const est = porDoc.get(e.doc);
    if (!est) {
      const eli = eliPorDoc.get(e.doc);
      avisos.push(`${e.doc} ${e.apellidos} ${e.nombres} (grado ${e.grado}, ${e.resultado}) no está en estudiantes activos` +
        (eli ? ` — está en ELIMINADOS (motivo: ${eli.motivo || '—'})` : ' — NO existe en la base de datos'));
      continue;
    }
    const set = {};
    if (est.grado !== e.grado) set.grado = e.grado;
    if (Number(est.activo) !== regla.activo && regla.activo === 0) set.activo = 0;
    const estadoActual = tieneEstado ? (est.estadoAcademico || 'PENDIENTE') : 'PENDIENTE';
    if (estadoActual !== regla.estadoAcademico) set.estadoAcademico = regla.estadoAcademico;
    if (Number(est.activo) === 0 && regla.activo === 1) {
      avisos.push(`${e.doc} ${est.apellidos} ${est.nombres}: el archivo dice ${e.resultado} pero está INACTIVO en la BD (no se reactiva automáticamente)`);
    }
    if (norm(est.apellidos) !== norm(e.apellidos) || norm(est.nombres) !== norm(e.nombres)) {
      avisos.push(`${e.doc}: nombre distinto. BD="${est.nombres} ${est.apellidos}" Excel="${e.nombres} ${e.apellidos}" (no se modifica)`);
    }
    if (Object.keys(set).length) cambios.push({ est, set, resultado: e.resultado });
  }

  for (const est of estudiantes) {
    if (est.grado >= GMIN && est.grado <= GMAX && !docsExcel.has(String(est.doc).trim())) {
      avisos.push(`${est.doc} ${est.apellidos} ${est.nombres} está en grado ${est.grado} en la BD pero NO aparece en el archivo`);
    }
  }

  console.log(`\nArchivo: ${path.basename(archivo)} — ${excel.length} estudiantes en grados ${GMIN}-${GMAX}`);
  console.log(`BD: ${estudiantes.length} estudiantes, columna estadoAcademico ${tieneEstado ? 'existe' : 'NO existe aún (se creará al aplicar)'}`);
  console.log(`\n=== CAMBIOS (${cambios.length}) ===`);
  for (const c of cambios) {
    const det = Object.entries(c.set).map(([k, v]) => `${k}: ${k === 'estadoAcademico' && !tieneEstado ? '—' : c.est[k]} -> ${v}`).join(', ');
    console.log(`  ${c.est.doc}  ${c.est.apellidos} ${c.est.nombres} [${c.resultado}]  ${det}`);
  }
  console.log(`\n=== AVISOS PARA REVISIÓN MANUAL (${avisos.length}) ===`);
  avisos.forEach(a => console.log('  - ' + a));

  if (!aplicar) {
    console.log('\nSIMULACIÓN: no se escribió nada. Agrega --aplicar para ejecutar los cambios.\n');
    return;
  }

  // Respaldo completo antes de escribir
  const dirResp = path.join(__dirname, '..', 'db', 'respaldos');
  fs.mkdirSync(dirResp, { recursive: true });
  const respaldo = {};
  for (const t of ['estudiantes', 'grupos', 'estudiante_grupo', 'estudiantes_eliminados', 'acudientes', 'acudiente_estudiante']) {
    respaldo[t] = (await client.execute(`SELECT * FROM ${t}`)).rows.map(r => ({ ...r }));
  }
  const fResp = path.join(dirResp, `respaldo_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(fResp, JSON.stringify(respaldo, null, 1));
  console.log(`\nRespaldo guardado en ${fResp}`);

  await runMigrations(client);
  const stmts = cambios.map(c => {
    const campos = Object.keys(c.set);
    return {
      sql: `UPDATE estudiantes SET ${campos.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
      args: [...campos.map(k => c.set[k]), c.est.id],
    };
  });
  if (stmts.length) await client.batch(stmts, 'write');
  console.log(`APLICADO: ${stmts.length} estudiantes actualizados en una sola transacción.\n`);
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
