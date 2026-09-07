import { useState } from 'react';
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import AcudienteModal from './AcudienteModal';

const AcudientesTable = ({ acudientes, students, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcudiente, setEditingAcudiente] = useState(null);

  const openNew = () => { setEditingAcudiente(null); setIsModalOpen(true); };
  const openEdit = (ac) => { setEditingAcudiente(ac); setIsModalOpen(true); };

  const handleSave = (data) => {
    if (editingAcudiente) onEdit(data);
    else onAdd(data);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este acudiente? Esto no elimina a los estudiantes asociados.')) onDelete(id);
  };

  const nombreEstudiantes = (ids) => {
    if (!ids || ids.length === 0) return <span className="text-gray-400">Sin estudiantes asignados</span>;
    return students
      .filter(s => ids.includes(s.id))
      .map(s => `${s.apellidos} ${s.nombres}`)
      .join(', ');
  };

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2"><UserCheck size={20} className="text-indigo-600" /> Acudientes</h2>
        <button onClick={openNew} className="bg-indigo-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1">
          <Plus size={16} /> Nuevo acudiente
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Nombres</th>
              <th className="text-left p-3">Documento</th>
              <th className="text-left p-3">Parentesco</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Estudiantes a cargo</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {acudientes.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No hay acudientes registrados.</td></tr>
            )}
            {acudientes.map(ac => (
              <tr key={ac.id} className="border-t">
                <td className="p-3">{ac.nombres}</td>
                <td className="p-3">{ac.documento || '-'}</td>
                <td className="p-3">{ac.parentesco || '-'}</td>
                <td className="p-3">{ac.telefono || '-'}</td>
                <td className="p-3">{nombreEstudiantes(ac.estudiantesIds)}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(ac)} className="text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(ac.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AcudienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingAcudiente}
        students={students}
      />
    </div>
  );
};

export default AcudientesTable;
