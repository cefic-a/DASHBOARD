import { useState, useRef } from 'react';
import { Edit, Trash2, Plus, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import StudentModal from './StudentModal';
import GroupManager from './GroupManager';
import DeleteMotivoModal from './DeleteMotivoModal';

const StudentTable = ({ students, groups, onAdd, onEdit, onDelete, onAddGroup, onUpdateGroup, onDeleteGroup }) => {
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('todos');
  const [filterActive, setFilterActive] = useState('todos');
  const [selectedGrade, setSelectedGrade] = useState('todos');
  const [filterGroup, setFilterGroup] = useState('todos');
  const [filterDiscapacidad, setFilterDiscapacidad] = useState('todos');
  const [filterIdioma, setFilterIdioma] = useState('todos');
  const [filterCaminoSol, setFilterCaminoSol] = useState('todos');
  const [filterCaminoLuna, setFilterCaminoLuna] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [importing, setImporting] = useState(false);

  // Referencia al input file oculto
  const fileInputRef = useRef(null);

  // Obtener opciones únicas para filtros (manejo seguro de null/undefined)
  const discapacidadOpts = ['todos', ...new Set(students.map(s => s.discapacidad).filter(v => v))];
  const idiomaOpts = ['todos', ...new Set(students.map(s => s.idioma).filter(v => v))];
  const caminoSolOpts = ['todos', ...new Set(students.map(s => s.caminoSol).filter(v => v))];
  const caminoLunaOpts = ['todos', ...new Set(students.map(s => s.caminoLuna).filter(v => v))];
  const gradosUnicos = ['todos', ...new Set(students.map(s => s.grado).filter(v => v !== undefined))].sort((a,b) => a === 'todos' ? -1 : a - b);

  // Función para formatear fecha (DD/MM/YYYY)
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const partes = fechaStr.split(' ')[0].split('-');
      if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
      const d = new Date(fechaStr);
      if (!isNaN(d)) return d.toLocaleDateString('es-ES');
      return fechaStr;
    } catch { return fechaStr; }
  };

  // Calcular edad
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '—';
    try {
      const hoy = new Date();
      const nac = new Date(fechaNac.split(' ')[0]);
      if (isNaN(nac)) return '—';
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
      return edad;
    } catch { return '—'; }
  };

  // Aplicar filtros
  const filtered = students.filter(s => {
    const fullName = `${s.apellidos || ''} ${s.nombres || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || (s.doc || '').includes(searchTerm);
    const matchesGender = filterGender === 'todos' || s.genero === filterGender;
    const matchesActive = filterActive === 'todos' || (filterActive === 'activo' ? s.activo : !s.activo);
    const matchesGrade = selectedGrade === 'todos' || s.grado === selectedGrade;
    const matchesGroup = filterGroup === 'todos' || (s.gruposIds && s.gruposIds.includes(filterGroup));
    const matchesDiscap = filterDiscapacidad === 'todos' || s.discapacidad === filterDiscapacidad;
    const matchesIdioma = filterIdioma === 'todos' || s.idioma === filterIdioma;
    const matchesCaminoSol = filterCaminoSol === 'todos' || s.caminoSol === filterCaminoSol;
    const matchesCaminoLuna = filterCaminoLuna === 'todos' || s.caminoLuna === filterCaminoLuna;
    return matchesSearch && matchesGender && matchesActive && matchesGrade && matchesGroup &&
           matchesDiscap && matchesIdioma && matchesCaminoSol && matchesCaminoLuna;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Manejadores
  const handleEdit = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = (motivo) => {
    if (studentToDelete) {
      onDelete(studentToDelete.id, motivo);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSave = (studentData) => {
    if (editingStudent) {
      onEdit(studentData);
    } else {
      onAdd(studentData);
    }
    setModalOpen(false);
    setEditingStudent(null);
  };

  // =================== IMPORTAR EXCEL ===================
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Mapear columnas del Excel a campos de la base de datos
      for (const row of rows) {
        // Saltar filas vacías (sin documento, apellidos ni nombres)
        if (!row['Documento'] && !row['Apellidos'] && !row['Nombres']) continue;

        const estudiante = {
          id: `s${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          doc: String(row['Documento'] || ''),
          tipodoc: row['TipoDocumento'] || 'RC',
          apellidos: String(row['Apellidos'] || ''),
          nombres: String(row['Nombres'] || ''),
          eps: row['EPS'] || '',
          genero: row['Genero'] === 'F' ? 'FEMENINO' : 'MASCULINO',
          fechaNacimiento: row['FechaNacimiento'] 
          ? (() => {
              const val = row['FechaNacimiento'];
              // Si es un número (serial de Excel), convertirlo
              if (typeof val === 'number') {
                // Excel serial: días desde 1900-01-01 (con error de 1900)
                const utc_days = Math.floor(val - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                return date_info.toISOString().split('T')[0];
              }
              // Si es cadena, intentar parsear
              if (typeof val === 'string') {
                const partes = val.split(' ')[0].split('-');
                if (partes.length === 3) {
                  // Ya está en formato YYYY-MM-DD
                  return val.split(' ')[0];
                }
                // Intentar con Date
                const d = new Date(val);
                if (!isNaN(d)) {
                  return d.toISOString().split('T')[0];
                }
                return '';
              }
              return '';
            })()
        : '',
          discapacidad: row['Discapacidad'] === 'SI' ? 'SI' : 'NO',
          activo: true,
          grado: parseInt(row['Grado']) || 0,
          idioma: row['Idioma'] === 'SI' ? 'SI' : 'NO',
          caminoSol: row['CaminoSol'] || '',
          caminoLuna: row['CaminoLuna'] || '',
          gruposIds: []
        };
        // Enviar al backend (o al estado local si usas API)
        await onAdd(estudiante);
      }
      alert('Datos importados correctamente');
    } catch (error) {
      console.error('Error al importar:', error);
      alert('Error al importar el archivo. Verifica el formato.');
    } finally {
      setImporting(false);
      e.target.value = ''; // reset input
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="p-4 border-b flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Lista de estudiantes</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={18} /> {importing ? 'Importando...' : 'Importar Excel'}
          </button>
          <button onClick={() => setGroupManagerOpen(true)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm">
            Gestionar grupos
          </button>
          <button onClick={() => { setEditingStudent(null); setModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Plus size={18} /> Agregar
          </button>
        </div>
      </div>

      {/* Input file oculto */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Filtros */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none text-sm w-48 md:w-64"
          />
        </div>
        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          <option value="todos">Género (todos)</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          <option value="todos">Estado (todos)</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value === 'todos' ? 'todos' : Number(e.target.value))} className="border rounded-lg px-3 py-1 text-sm">
          {gradosUnicos.map(g => (<option key={g} value={g}>{g === 'todos' ? 'Grado (todos)' : `Grado ${g}`}</option>))}
        </select>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          <option value="todos">Grupo (todos)</option>
          {groups.map(g => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
        </select>
        <select value={filterDiscapacidad} onChange={(e) => setFilterDiscapacidad(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          {discapacidadOpts.map(op => <option key={op} value={op}>{op === 'todos' ? 'Discapacidad (todos)' : op}</option>)}
        </select>
        <select value={filterIdioma} onChange={(e) => setFilterIdioma(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          {idiomaOpts.map(op => <option key={op} value={op}>{op === 'todos' ? 'Idioma (todos)' : op}</option>)}
        </select>
        <select value={filterCaminoSol} onChange={(e) => setFilterCaminoSol(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          {caminoSolOpts.map(op => <option key={op} value={op}>{op === 'todos' ? 'Camino Sol (todos)' : op}</option>)}
        </select>
        <select value={filterCaminoLuna} onChange={(e) => setFilterCaminoLuna(e.target.value)} className="border rounded-lg px-3 py-1 text-sm">
          {caminoLunaOpts.map(op => <option key={op} value={op}>{op === 'todos' ? 'Camino Luna (todos)' : op}</option>)}
        </select>
      </div>

    {/* Tabla */}
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-3 text-left w-[10%]">Documento</th>
            <th className="px-3 py-3 text-left w-[25%]">Nombres y Apellidos</th> {/* Cambio de título */}
            <th className="px-3 py-3 text-left w-[5%]">Género</th>
            <th className="px-3 py-3 text-left w-[10%]">Fecha nac.</th>
            <th className="px-3 py-3 text-left w-[5%]">Edad</th>
            <th className="px-3 py-3 text-left w-[5%]">EPS</th>
            <th className="px-3 py-3 text-left w-[6%]">Discap.</th>
            <th className="px-3 py-3 text-left w-[6%]">Idioma</th>
            <th className="px-3 py-3 text-left w-[8%]">Camino Sol</th>
            <th className="px-3 py-3 text-left w-[8%]">Camino Luna</th>
            <th className="px-3 py-3 text-left w-[12%]">Grupos</th>
            <th className="px-3 py-3 text-center w-[5%]">Estado</th>
            <th className="px-3 py-3 text-center w-[8%]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((student) => (
            <tr key={student.doc} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">{student.doc}</td>
              {/* Cambio aquí: Nombres primero, luego Apellidos, sin truncar, con whitespace-normal */}
              <td className="px-3 py-2 whitespace-normal break-words" style={{ maxWidth: '200px' }}>
                {`${student.nombres || ''} ${student.apellidos || ''}`}
              </td>
              <td className="px-3 py-2">{student.genero === 'MASCULINO' ? 'M' : 'F'}</td>
              <td className="px-3 py-2">{formatFecha(student.fechaNacimiento)}</td>
              <td className="px-3 py-2">{calcularEdad(student.fechaNacimiento)}</td>
              <td className="px-3 py-2 truncate max-w-[100px]">{student.eps}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${student.discapacidad === 'SI' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {student.discapacidad === 'SI' ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="px-3 py-2">{student.idioma === 'SI' ? 'Sí' : 'No'}</td>
              <td className="px-3 py-2 whitespace-normal break-words" style={{ maxWidth: '120px' }}>
                {student.caminoSol || '—'}
              </td>
              <td className="px-3 py-2 whitespace-normal break-words" style={{ maxWidth: '120px' }}>
                {student.caminoLuna || '—'}
              </td>
              <td className="px-3 py-2">
                {student.gruposIds && student.gruposIds.map(gid => {
                  const group = groups.find(g => g.id === gid);
                  return group ? <span key={gid} className="inline-block bg-gray-100 rounded px-2 py-0.5 text-xs mr-1 mb-1">{group.nombre}</span> : null;
                })}
              </td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-block w-3 h-3 rounded-full ${student.activo ? 'bg-green-500' : 'bg-red-500'}`} title={student.activo ? 'Activo' : 'Inactivo'}></span>
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex justify-center gap-2">
                  <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(student)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && <tr><td colSpan="13" className="text-center py-8 text-gray-500">No hay estudiantes</td></tr>}
        </tbody>
      </table>
    </div>

      {/* Paginación */}
      <div className="p-4 border-t flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span>Mostrar</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border rounded px-2 py-1">
            <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
          </select>
          <span>por página</span>
        </div>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <span className="px-3 py-1">Pág. {currentPage} de {totalPages || 1}</span>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
        </div>
      </div>

      <StudentModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingStudent(null); }} onSave={handleSave} initialData={editingStudent} groups={groups} />
      <GroupManager isOpen={groupManagerOpen} onClose={() => setGroupManagerOpen(false)} groups={groups} onAddGroup={onAddGroup} onUpdateGroup={onUpdateGroup} onDeleteGroup={onDeleteGroup} />
      <DeleteMotivoModal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setStudentToDelete(null); }} onConfirm={handleConfirmDelete} studentName={studentToDelete ? `${studentToDelete.apellidos} ${studentToDelete.nombres}` : ''} />
    </div>
  );
};

export default StudentTable;