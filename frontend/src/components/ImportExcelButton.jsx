import { useState } from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportExcelButton = ({ onImport }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear encabezados a los campos del estudiante
        const students = rows.map((row) => ({
          doc: String(row.Documento || row.doc || '').trim(),
          tipodoc: row.TipoDocumento || 'RC',
          apellidos: String(row.Apellidos || '').trim(),
          nombres: String(row.Nombres || '').trim(),
          genero: row.Genero === 'F' ? 'FEMENINO' : 'MASCULINO',
          fechaNacimiento: row.FechaNacimiento
            ? new Date(row.FechaNacimiento).toISOString().split('T')[0]
            : '',
          eps: row.EPS || 'AIC',
          discapacidad: row.Discapacidad || 'NO APLICA',
          activo: true,
          grado: parseInt(row.Grado) || 0,
          idioma: row.Idioma === 'SI' ? 'SI' : 'NO',
          caminoSol: row.CaminoSol || '',
          caminoLuna: row.CaminoLuna || '',
          gruposIds: [],
        }));

        // Generar IDs únicos para cada estudiante
        const studentsWithId = students.map((s) => ({
          ...s,
          id: `s${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        }));

        onImport(studentsWithId);
        setLoading(false);
      } catch (error) {
        console.error('Error al leer el archivo:', error);
        alert('Error al leer el archivo. Verifica que tenga el formato correcto.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    // Limpiar el input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  return (
    <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
      <Upload size={18} />
      {loading ? 'Importando...' : 'Importar Excel'}
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
        disabled={loading}
      />
    </label>
  );
};

export default ImportExcelButton;