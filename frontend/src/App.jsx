import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import StudentTable from './components/StudentTable';
import AnalyticsCharts from './components/AnalyticsCharts';
import DeletedStudentsTable from './components/DeletedStudentsTable';
import { fetchStudents, fetchGroups, createStudent, updateStudent, deleteStudent, createGroup, updateGroup, deleteGroup, fetchEliminados, restoreStudent, permanentDelete } from './services/api';

function App() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [eliminados, setEliminados] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadData = async () => {
    try {
      const [estudiantes, grupos, eliminadosList] = await Promise.all([
        fetchStudents(),
        fetchGroups(),
        fetchEliminados()
      ]);
      setStudents(estudiantes);
      setGroups(grupos);
      setEliminados(eliminadosList);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'students' && (
            <>
              <StatsCards students={students} groups={groups} />
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