import { useState } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';

const GroupManager = ({ isOpen, onClose, groups, onAddGroup, onUpdateGroup, onDeleteGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newGroupName.trim()) {
      onAddGroup({ id: Date.now().toString(), nombre: newGroupName.trim() });
      setNewGroupName('');
    }
  };

  const handleUpdate = () => {
    if (editName.trim() && editingGroup) {
      onUpdateGroup({ ...editingGroup, nombre: editName.trim() });
      setEditingGroup(null);
      setEditName('');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar grupo?')) onDeleteGroup(id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Gestionar grupos</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Nombre del grupo" className="flex-1 border rounded px-3 py-2 text-sm" />
            <button onClick={handleAdd} className="bg-indigo-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1"><Plus size={16} /> Agregar</button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {groups.length === 0 && <p className="text-gray-500 text-sm">No hay grupos.</p>}
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between border rounded-lg p-2">
                {editingGroup?.id === group.id ? (
                  <div className="flex-1 flex gap-2"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" autoFocus /><button onClick={handleUpdate} className="text-green-600 text-sm">Guardar</button><button onClick={() => setEditingGroup(null)} className="text-gray-500 text-sm">Cancelar</button></div>
                ) : (
                  <>
                    <span className="text-sm">{group.nombre}</span>
                    <div className="flex gap-1"><button onClick={() => { setEditingGroup(group); setEditName(group.nombre); }} className="text-blue-600"><Edit size={16} /></button><button onClick={() => handleDelete(group.id)} className="text-red-600"><Trash2 size={16} /></button></div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManager;