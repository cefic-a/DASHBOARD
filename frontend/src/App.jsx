import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import StudentTable from './components/StudentTable';
import AnalyticsCharts from './components/AnalyticsCharts';
import DeletedStudentsTable from './components/DeletedStudentsTable';
import AcudientesTable from './components/AcudientesTable';
import Login from './components/Login';
import {
  fetchStudents, fetchGroups, createStudent, updateStudent, deleteStudent,
  createGroup, updateGroup, deleteGroup, fetchEliminados, restoreStudent, permanentDelete,
  fetchAcudientes, createAcudiente, updateAcudiente, deleteAcudiente
} from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [eliminados, setEliminados] = useState([]);
  const [acudientes, setAcudientes] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadData = async () => {
    try {
      const [estudiantes, grupos, eliminadosList, acudientesList] = await Promise.all([
        fetchStudents(),
        fetchGroups(),
        fetchEliminados(),
        fetchAcudientes()
      ]);
      setStudents(estudiantes);
      setGroups(grupos);
      setEliminados(eliminadosList);
      setAcudientes(acudientesList);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const addStudent = async (student) => {
    try {
      await createStudent(student);
      await loadData();
    } catch (error) {
      console.error('Error al crear estudiante:', error);
      alert(`No se pudo crear el estudiante: ${error.message}`);
      throw error;
    }
  };

  const editStudent = async (student) => {
    try {
      await updateStudent(student.id, student);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      alert(`No se pudo actualizar el estudiante: ${error.message}`);
      throw error;
    }
  };

  const removeStudent = async (id, motivo) => {
    try {
      await deleteStudent(id, motivo);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      alert(`No se pudo eliminar el estudiante: ${error.message}`);
      throw error;
    }
  };

  const addGroup = async (group) => {
    try {
      await createGroup(group);
      await loadData();
    } catch (error) {
      console.error('Error al crear grupo:', error);
      alert(`No se pudo crear el grupo: ${error.message}`);
      throw error;
    }
  };

  const editGroup = async (group) => {
    try {
      await updateGroup(group.id, group);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      alert(`No se pudo actualizar el grupo: ${error.message}`);
      throw error;
    }
  };

  const removeGroup = async (id) => {
    try {
      await deleteGroup(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      alert(`No se pudo eliminar el grupo: ${error.message}`);
      throw error;
    }
  };

  const handleRestore = async (id) => {
    await restoreStudent(id);
    await loadData();
  };

  const handlePermanentDelete = async (id) => {
    await permanentDelete(id);
    await loadData();
  };

  const addAcudiente = async (acudiente) => {
    try {
      await createAcudiente(acudiente);
      await loadData();
    } catch (error) {
      console.error('Error al crear acudiente:', error);
      alert(`No se pudo crear el acudiente: ${error.message}`);
      throw error;
    }
  };

  const editAcudiente = async (acudiente) => {
    try {
      await updateAcudiente(acudiente.id, acudiente);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar acudiente:', error);
      alert(`No se pudo actualizar el acudiente: ${error.message}`);
      throw error;
    }
  };

  const removeAcudiente = async (id) => {
    try {
      await deleteAcudiente(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar acudiente:', error);
      alert(`No se pudo eliminar el acudiente: ${error.message}`);
      throw error;
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'students' && (
            <>
              <StatsCards students={students} groups={groups} acudientes={acudientes} />
              <div className="mt-6">
                <StudentTable
                  students={students}
                  groups={groups}
                  onAdd={addStudent}
                  onEdit={editStudent}
                  onDelete={removeStudent}
                  onAddGroup={addGroup}
                  onUpdateGroup={editGroup}
                  onDeleteGroup={removeGroup}
                />
              </div>
            </>
          )}
          {activeTab === 'charts' && <AnalyticsCharts students={students} groups={groups} />}
          {activeTab === 'acudientes' && (
            <AcudientesTable
              acudientes={acudientes}
              students={students}
              onAdd={addAcudiente}
              onEdit={editAcudiente}
              onDelete={removeAcudiente}
            />
          )}
          {activeTab === 'deleted' && (
            <DeletedStudentsTable
              deleted={eliminados}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
