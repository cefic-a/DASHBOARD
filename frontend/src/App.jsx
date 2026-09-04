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
    await createStudent(student);
    await loadData();
  };

  const editStudent = async (student) => {
    await updateStudent(student.id, student);
    await loadData();
  };

  const removeStudent = async (id, motivo) => {
    await deleteStudent(id, motivo);
    await loadData();
  };

  const addGroup = async (group) => {
    await createGroup(group);
    await loadData();
  };

  const editGroup = async (group) => {
    await updateGroup(group.id, group);
    await loadData();
  };

  const removeGroup = async (id) => {
    await deleteGroup(id);
    await loadData();
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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