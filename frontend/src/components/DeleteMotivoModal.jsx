import { useState } from 'react';
import { X } from 'lucide-react';

const DeleteMotivoModal = ({ isOpen, onClose, onConfirm, studentName }) => {
  const [motivo, setMotivo] = useState('');
  const motivos = ['Graduado', 'Retiro voluntario', 'Deserción', 'Traslado', 'Otro'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo) { alert('Selecciona un motivo'); return; }
    onConfirm(motivo);
    setMotivo('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold">Eliminar estudiante</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="p-4">
          <p className="mb-4 text-gray-700">Estás por eliminar a <strong>{studentName}</strong>. Indica el motivo:</p>
          <div className="space-y-2 mb-4">{motivos.map(m => <label key={m} className="flex items-center gap-2"><input type="radio" name="motivo" value={m} checked={motivo === m} onChange={(e) => setMotivo(e.target.value)} /><span>{m}</span></label>)}</div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Eliminar y registrar</button></div>
        </form>
      </div>
    </div>
  );
};

export default DeleteMotivoModal;