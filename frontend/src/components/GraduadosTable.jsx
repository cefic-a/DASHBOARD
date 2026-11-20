import { useRef, useState } from 'react';
import { GraduationCap, Plus, Upload, Download, Printer, Search, Edit, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const anioActual = new Date().getFullYear();
const VACIO = { doc: '', tipodoc: 'TI', apellidos: '', nombres: '', genero: 'MASCULINO', fechaNacimiento: '', anioGraduacion: anioActual, observaciones: '' };

// Encabezados aceptados en el Excel (se ignoran tildes y mayúsculas)
const COLUMNAS = {
  doc: ['documento', 'doc'],
  tipodoc: ['tipodocumento', 'tipo_doc', 'tipodoc'],
  apellidos: ['apellidos'],
  nombres: ['nombres'],
  genero: ['genero'],
  fechaNacimiento: ['fechanacimiento', 'f.nac'],
  anioGraduacion: ['aniograduacion', 'anograduacion', 'ano', 'anio', 'promocion'],
  observaciones: ['observaciones'],
};
const normKey = k => String(k).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();

const fechaExcel = (val) => {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
  if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString().split('T')[0];
  const s = String(val).trim().split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/AAAA
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
};

const tipoDoc = (v) => {
  const s = String(v || '').toUpperCase();
  if (s.startsWith('CC')) return 'CC';
  if (s.startsWith('RC')) return 'RC';
  if (s.startsWith('TI')) return 'TI';
  return s || null;
};

const genero = (v) => {
  const s = String(v || '').toUpperCase();
  if (s.startsWith('F')) return 'FEMENINO';
  if (s.startsWith('M')) return 'MASCULINO';
  return null;
};

const formatFecha = (f) => {
  if (!f) return '—';
  const p = String(f).split('T')[0].split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
};

const GraduadoModal = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial ? { ...VACIO, ...initial, fechaNacimiento: (initial.fechaNacimiento || '').split('T')[0] } : VACIO);
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave({ ...form, anioGraduacion: Number(form.anioGraduacion) }); onClose(); }
    catch { /* el error ya se mostró */ }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{initial ? 'Editar graduado' : 'Registrar graduado'}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><label className="block font-medium">Documento *</label><input name="doc" value={form.doc} onChange={set} required className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block font-medium">Tipo documento</label>
            <select name="tipodoc" value={form.tipodoc || ''} onChange={set} className="w-full border rounded px-3 py-2">
              <option value="TI">TI</option><option value="CC">CC</option><option value="RC">RC</option>
            </select></div>
          <div><label className="block font-medium">Apellidos *</label><input name="apellidos" value={form.apellidos} onChange={set} required className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block font-medium">Nombres *</label><input name="nombres" value={form.nombres} onChange={set} required className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block font-medium">Género</label>
            <select name="genero" value={form.genero || ''} onChange={set} className="w-full border rounded px-3 py-2">
              <option value="MASCULINO">Masculino</option><option value="FEMENINO">Femenino</option>
            </select></div>
          <div><label className="block font-medium">Fecha de nacimiento</label><input type="date" name="fechaNacimiento" value={form.fechaNacimiento || ''} onChange={set} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block font-medium">Año de graduación *</label><input type="number" name="anioGraduacion" value={form.anioGraduacion} onChange={set} min="1950" max={anioActual + 1} required className="w-full border rounded px-3 py-2" /></div>
          <div className="sm:col-span-2"><label className="block font-medium">Observaciones</label><textarea name="observaciones" value={form.observaciones || ''} onChange={set} rows={2} className="w-full border rounded px-3 py-2" /></div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
};

const GraduadosTable = ({ graduados = [], onAdd, onEdit, onDelete, onImport }) => {
  const [search, setSearch] = useState('');
  const [anio, setAnio] = useState('todos');
  const [modal, setModal] = useState(null); // null | 'nuevo' | graduado
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const anios = [...new Set(graduados.map(g => g.anioGraduacion))].sort((a, b) => b - a);
  const porAnio = anios.map(a => ({ anio: a, total: graduados.filter(g => g.anioGraduacion === a).length }));
  const filtered = graduados.filter(g => {
    const txt = `${g.apellidos || ''} ${g.nombres || ''}`.toLowerCase();
    return (anio === 'todos' || g.anioGraduacion === anio) &&
      (txt.includes(search.toLowerCase()) || String(g.doc || '').includes(search));
  });

  const descargarPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Documento', 'TipoDocumento', 'Apellidos', 'Nombres', 'Genero', 'FechaNacimiento', 'AnioGraduacion', 'Observaciones'],
      ['1234567890', 'TI', 'APELLIDO1 APELLIDO2', 'NOMBRE1 NOMBRE2', 'F', '2005-03-15', 2023, ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Graduados');
    XLSX.writeFile(wb, 'plantilla_graduados.xlsx');
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const lista = [];
      rows.forEach((row, i) => {
        const r = {};
        for (const [k, v] of Object.entries(row)) {
          const campo = Object.keys(COLUMNAS).find(c => COLUMNAS[c].includes(normKey(k)));
          if (campo) r[campo] = v;
        }
        if (!r.doc && !r.apellidos && !r.nombres) return; // fila vacía
        lista.push({
          fila: i + 2,
          doc: String(r.doc ?? '').trim(),
          tipodoc: tipoDoc(r.tipodoc),
          apellidos: String(r.apellidos ?? '').trim(),
          nombres: String(r.nombres ?? '').trim(),
          genero: genero(r.genero),
          fechaNacimiento: fechaExcel(r.fechaNacimiento),
          anioGraduacion: parseInt(r.anioGraduacion, 10),
          observaciones: String(r.observaciones ?? '').trim(),
        });
      });
      if (lista.length === 0) {
        alert('El archivo no tiene filas con datos. Revisa que tenga los encabezados de la plantilla.');
        return;
      }
      const r = await onImport(lista);
      const errs = (r.errores || []).slice(0, 10).map(x => `Fila ${x.fila}: ${x.error}`).join('\n');
      alert(`Importación terminada:\n• ${r.insertados} graduados nuevos\n• ${r.yaExistian} ya estaban registrados\n• ${(r.errores || []).length} filas con errores${errs ? `\n\n${errs}` : ''}`);
    } catch (err) {
      console.error('Error al importar graduados:', err);
      alert(`No se pudo importar el archivo: ${err.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = (g) => {
    if (window.confirm(`¿Eliminar a ${g.nombres} ${g.apellidos} de los graduados de ${g.anioGraduacion}?`)) onDelete(g.id);
  };

  return (
    <div className="space-y-6">
      <style>{`
        .print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>

      {/* Tarjetas por año */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total graduados</p>
          <p className="text-2xl font-bold">{graduados.length}</p>
        </div>
        {porAnio.map(p => (
          <button key={p.anio} onClick={() => setAnio(anio === p.anio ? 'todos' : p.anio)}
            className={`rounded-xl shadow p-4 text-left ${anio === p.anio ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
            <p className={`text-sm ${anio === p.anio ? 'text-indigo-100' : 'text-gray-500'}`}>Promoción {p.anio}</p>
            <p className="text-2xl font-bold">{p.total}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><GraduationCap size={22} /> Graduados</h2>
            <p className="text-sm text-gray-500">Se agregan solos al promover a grado 11; los de años anteriores se pueden subir desde Excel.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => fileRef.current.click()} disabled={importing} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
              <Upload size={18} /> {importing ? 'Importando...' : 'Subir graduados (Excel)'}
            </button>
            <button onClick={descargarPlantilla} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Download size={18} /> Plantilla
            </button>
            <button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Printer size={18} /> Exportar / Imprimir
            </button>
            <button onClick={() => setModal('nuevo')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Plus size={18} /> Agregar
            </button>
          </div>
        </div>
        <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 no-print">
          <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1">
            <Search size={18} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o documento..." className="outline-none text-sm w-48 md:w-64" />
          </div>
          <select value={anio} onChange={e => setAnio(e.target.value === 'todos' ? 'todos' : Number(e.target.value))} className="border rounded-lg px-3 py-1 text-sm">
            <option value="todos">Año (todos)</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto no-print">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-3 text-left">Año</th>
                <th className="px-3 py-3 text-left">Documento</th>
                <th className="px-3 py-3 text-left">Nombres y Apellidos</th>
                <th className="px-3 py-3 text-left">Género</th>
                <th className="px-3 py-3 text-left">Fecha nac.</th>
                <th className="px-3 py-3 text-left">Origen</th>
                <th className="px-3 py-3 text-left">Observaciones</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{g.anioGraduacion}</td>
                  <td className="px-3 py-2">{g.tipodoc ? `${g.tipodoc} ` : ''}{g.doc}</td>
                  <td className="px-3 py-2">{`${g.nombres || ''} ${g.apellidos || ''}`}</td>
                  <td className="px-3 py-2">{g.genero === 'FEMENINO' ? 'F' : g.genero === 'MASCULINO' ? 'M' : '—'}</td>
                  <td className="px-3 py-2">{formatFecha(g.fechaNacimiento)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${g.lote ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {g.lote ? 'Promoción' : 'Registro manual'}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[220px] truncate" title={g.observaciones || ''}>{g.observaciones || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setModal(g)} className="text-blue-600 hover:text-blue-800" title="Editar"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(g)} className="text-red-600 hover:text-red-800" title="Eliminar"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="text-center py-8 text-gray-500">No hay graduados registrados</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="print-area p-4">
          <h2 className="text-lg font-bold mb-1">Graduados{anio !== 'todos' ? ` — Promoción ${anio}` : ''}</h2>
          <p className="text-xs text-gray-600 mb-3">Exportado el {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} · {filtered.length} graduado{filtered.length === 1 ? '' : 's'}</p>
          <table className="w-full text-xs border-collapse">
            <thead><tr>
              {['Año', 'Documento', 'Nombres y Apellidos', 'Género', 'Fecha nac.', 'Observaciones'].map(h => <th key={h} className="border px-2 py-1 text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td className="border px-2 py-1">{g.anioGraduacion}</td>
                  <td className="border px-2 py-1">{g.tipodoc ? `${g.tipodoc} ` : ''}{g.doc}</td>
                  <td className="border px-2 py-1">{`${g.nombres || ''} ${g.apellidos || ''}`}</td>
                  <td className="border px-2 py-1">{g.genero === 'FEMENINO' ? 'F' : g.genero === 'MASCULINO' ? 'M' : '—'}</td>
                  <td className="border px-2 py-1">{formatFecha(g.fechaNacimiento)}</td>
                  <td className="border px-2 py-1">{g.observaciones || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <GraduadoModal
          initial={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={(data) => modal === 'nuevo' ? onAdd(data) : onEdit({ ...data, id: modal.id })}
        />
      )}
    </div>
  );
};

export default GraduadosTable;
