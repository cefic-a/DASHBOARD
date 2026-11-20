import { useEffect, useState } from 'react';
import { X, GraduationCap, Undo2 } from 'lucide-react';
import { fetchHistorialPromociones } from '../services/api';

const GRADO_MAXIMO = 11;

// Modal de confirmación: muestra por grado cuántos estudiantes activos
// serán promovidos, cuántos repiten y cuántos siguen PENDIENTES (no se tocan).
const PromocionModal = ({ isOpen, onClose, students = [], onConfirm, onUndo }) => {
  const [historial, setHistorial] = useState([]);
  const [working, setWorking] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setConfirmText('');
    fetchHistorialPromociones().then(setHistorial).catch(() => setHistorial([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const activos = students.filter(s => s.activo && s.grado !== null && s.grado !== undefined);
  const grados = [...new Set(activos.map(s => s.grado))].sort((a, b) => a - b);
  const filas = grados.map(g => {
    const delGrado = activos.filter(s => s.grado === g);
    return {
      grado: g,
      aprobados: delGrado.filter(s => s.estadoAcademico === 'APROBADO').length,
      reprobados: delGrado.filter(s => s.estadoAcademico === 'REPROBADO').length,
      pendientes: delGrado.filter(s => !s.estadoAcademico || s.estadoAcademico === 'PENDIENTE').length,
    };
  });
  const totalAprobados = filas.reduce((a, f) => a + f.aprobados, 0);
  const totalReprobados = filas.reduce((a, f) => a + f.reprobados, 0);
  const totalPendientes = filas.reduce((a, f) => a + f.pendientes, 0);
  const ultimo = historial[0];

  const handleConfirm = async () => {
    setWorking(true);
    try { await onConfirm(); onClose(); } finally { setWorking(false); }
  };

  const handleUndo = async () => {
    if (!ultimo) return;
    if (!window.confirm(`¿Deshacer la promoción del ${new Date(ultimo.fecha).toLocaleString('es-CO')}? Los ${ultimo.total} estudiantes volverán a su grado y estado anteriores.`)) return;
    setWorking(true);
    try { await onUndo(ultimo.lote); onClose(); } finally { setWorking(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2"><GraduationCap size={20} /> Promover al siguiente grado</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li><strong>Aprobados</strong> pasan al grado siguiente. En grado {GRADO_MAXIMO} quedan como <strong>Graduados</strong> (inactivos, no se borran).</li>
            <li><strong>Reprobados</strong> se quedan en el mismo grado.</li>
            <li><strong>Pendientes</strong> no se modifican.</li>
            <li>Después de promover, el resultado de todos vuelve a "Pendiente" para el nuevo año.</li>
          </ul>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Grado</th>
                <th className="px-2 py-1 text-right text-green-700">Aprobados</th>
                <th className="px-2 py-1 text-right text-red-700">Reprobados</th>
                <th className="px-2 py-1 text-right text-gray-600">Pendientes</th>
                <th className="px-2 py-1 text-left">Destino aprobados</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.grado} className="border-t">
                  <td className="px-2 py-1">Grado {f.grado}</td>
                  <td className="px-2 py-1 text-right">{f.aprobados}</td>
                  <td className="px-2 py-1 text-right">{f.reprobados}</td>
                  <td className={`px-2 py-1 text-right ${f.pendientes ? 'text-amber-700 font-semibold' : ''}`}>{f.pendientes}</td>
                  <td className="px-2 py-1">{f.grado >= GRADO_MAXIMO ? 'Graduado' : `Grado ${f.grado + 1}`}</td>
                </tr>
              ))}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-2 py-1">Total</td>
                <td className="px-2 py-1 text-right">{totalAprobados}</td>
                <td className="px-2 py-1 text-right">{totalReprobados}</td>
                <td className="px-2 py-1 text-right">{totalPendientes}</td>
                <td />
              </tr>
            </tbody>
          </table>

          {totalPendientes > 0 && (
            <p className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2">
              Hay {totalPendientes} estudiante(s) activos sin resultado. No serán promovidos hasta marcarlos como aprobados.
            </p>
          )}

          <div>
            <label className="block text-gray-700 mb-1">Escribe <strong>PROMOVER</strong> para confirmar:</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>

          {ultimo && (
            <div className="border-t pt-3 flex items-center justify-between gap-2 text-gray-600">
              <span>Última promoción: {new Date(ultimo.fecha).toLocaleString('es-CO')} · {ultimo.promovidos} promovidos, {ultimo.graduados} graduados</span>
              <button onClick={handleUndo} disabled={working} className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-gray-50 disabled:opacity-50">
                <Undo2 size={16} /> Deshacer
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={working || totalAprobados + totalReprobados === 0 || confirmText.trim().toUpperCase() !== 'PROMOVER'}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {working ? 'Procesando...' : `Promover ${totalAprobados} estudiante(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromocionModal;
