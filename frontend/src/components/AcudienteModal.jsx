import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EntitySelector from './EntitySelector';

const PARENTESCOS = ['Madre', 'Padre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor/a', 'Otro'];

const emptyForm = {
  id: '',
  nombres: '',
  documento: '',
  parentesco: 'Madre',
  telefono: '',
  direccion: ''
};

const AcudienteModal = ({ isOpen, onClose, onSave, initialData, students }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedStudents(initialData.estudiantesIds || []);
    } else {
      setFormData(emptyForm);
      setSelectedStudents([]);
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombres.trim()) {
      alert('El nombre del acudiente es obligatorio');
      return;
    }
    const finalData = { ...formData, estudiantesIds: selectedStudents };
    if (!finalData.id) finalData.id = `a${Date.now()}`;
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  const studentItems = students.map(s => ({ id: s.id, label: `${s.apellidos} ${s.nombres}` }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{initialData ? 'Editar acudiente' : 'Nuevo acudiente'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Nombres y apellidos *</label>
            <input name="nombres" value={formData.nombres} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Documento</label>
            <input name="documento" value={formData.documento} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Parentesco</label>
            <select name="parentesco" value={formData.parentesco} onChange={handleChange} className="w-full border rounded px-3 py-2">
              {PARENTESCOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Dirección</label>
            <input name="direccion" value={formData.direccion} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Estudiantes a cargo</label>
            <EntitySelector items={studentItems} selectedIds={selectedStudents} onChange={setSelectedStudents} placeholder="Seleccionar estudiantes" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcudienteModal;
