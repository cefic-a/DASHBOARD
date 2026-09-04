import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import GroupSelector from './GroupSelector';

const GRADOS = [
  { value: 0, label: 'Grado 0 (Transición)' },
  { value: 1, label: 'Grado 1' },
  { value: 2, label: 'Grado 2' },
  { value: 3, label: 'Grado 3' },
  { value: 4, label: 'Grado 4' },
  { value: 5, label: 'Grado 5' },
  { value: 6, label: 'Grado 6' },
  { value: 7, label: 'Grado 7' },
  { value: 8, label: 'Grado 8' },
  { value: 9, label: 'Grado 9' },
  { value: 10, label: 'Grado 10' },
  { value: 11, label: 'Grado 11' },
];

// Opciones para Camino del Sol
const CAMINO_SOL_OPTS = [
  'Aguacero fuerte',
  'Sol picante',
  'Aguacero suave',
  'Sol con viento'
];

// Opciones para Camino de la Luna
const CAMINO_LUNA_OPTS = [
  'Luna Bebe',
  'Luna Niña',
  'Luna Señorita',
  'Luna Madre',
  'Luna Mayora',
  'Luna Brava',
  'Luna Abuela Tierna',
  'Luna Silenciosa'
];

const StudentModal = ({ isOpen, onClose, onSave, initialData, groups }) => {
  const [formData, setFormData] = useState({
    id: '',
    doc: '',
    tipodoc: 'RC',
    apellidos: '',
    nombres: '',
    genero: 'MASCULINO',
    fechaNacimiento: '',
    eps: 'AIC',
    discapacidad: 'NO',
    activo: true,
    grado: 0,
    idioma: 'NO',
    caminoSol: '',
    caminoLuna: ''
  });
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedGroups(initialData.gruposIds || []);
    } else {
      setFormData({
        id: '',
        doc: '',
        tipodoc: 'RC',
        apellidos: '',
        nombres: '',
        genero: 'MASCULINO',
        fechaNacimiento: '',
        eps: 'AIC',
        discapacidad: 'NO',
        activo: true,
        grado: 0,
        idioma: 'NO',
        caminoSol: '',
        caminoLuna: ''
      });
      setSelectedGroups([]);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.doc || !formData.apellidos || !formData.nombres || !formData.fechaNacimiento) {
      alert('Complete los campos obligatorios');
      return;
    }
    const finalData = { ...formData, gruposIds: selectedGroups };
    if (!finalData.id) finalData.id = `s${Date.now()}`;
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{initialData ? 'Editar estudiante' : 'Nuevo estudiante'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium">Documento *</label><input name="doc" value={formData.doc} onChange={handleChange} className="w-full border rounded px-3 py-2" required /></div>
          <div><label className="block text-sm font-medium">Tipo documento</label><select name="tipodoc" value={formData.tipodoc} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="RC">Registro Civil</option><option value="TI">Tarjeta de Identidad</option></select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium">Apellidos *</label><input name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full border rounded px-3 py-2" required /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium">Nombres *</label><input name="nombres" value={formData.nombres} onChange={handleChange} className="w-full border rounded px-3 py-2" required /></div>
          <div><label className="block text-sm font-medium">Género</label><select name="genero" value={formData.genero} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="MASCULINO">Masculino</option><option value="FEMENINO">Femenino</option></select></div>
          <div><label className="block text-sm font-medium">Fecha nacimiento *</label><input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="w-full border rounded px-3 py-2" required /></div>
          <div><label className="block text-sm font-medium">EPS</label><input name="eps" value={formData.eps} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">Discapacidad</label><select name="discapacidad" value={formData.discapacidad} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="NO">No</option><option value="SI">Sí</option></select></div>
          <div><label className="block text-sm font-medium">Grado *</label><select name="grado" value={formData.grado} onChange={handleChange} className="w-full border rounded px-3 py-2" required>{GRADOS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div>
          <div><label className="block text-sm font-medium">¿Habla NeesWewxi?</label><select name="idioma" value={formData.idioma} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="SI">Sí</option><option value="NO">No</option></select></div>
          <div><label className="block text-sm font-medium">Camino del Sol</label><select name="caminoSol" value={formData.caminoSol} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="">Seleccionar...</option>{CAMINO_SOL_OPTS.map(op => <option key={op} value={op}>{op}</option>)}</select></div>
          <div><label className="block text-sm font-medium">Camino de la Luna</label><select name="caminoLuna" value={formData.caminoLuna} onChange={handleChange} className="w-full border rounded px-3 py-2"><option value="">Seleccionar...</option>{CAMINO_LUNA_OPTS.map(op => <option key={op} value={op}>{op}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Grupos personalizados</label><GroupSelector groups={groups} selectedGroups={selectedGroups} onChange={setSelectedGroups} placeholder="Seleccionar grupos" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} /><label className="text-sm font-medium">Activo</label></div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button></div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;