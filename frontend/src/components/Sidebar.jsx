import { Users, BarChart3, Trash2, Menu } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ activeTab, setActiveTab, collapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const menuItems = [
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'charts', label: 'Estadísticas', icon: BarChart3 },
    { id: 'deleted', label: 'Eliminados', icon: Trash2 },
  ];

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <>
      <button onClick={toggleMobile} className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md md:hidden"><Menu size={20} /></button>
      <div className={`fixed md:relative z-40 h-full bg-white shadow-lg transition-all duration-300 ${sidebarWidth} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className={`p-5 border-b ${collapsed ? 'text-center' : ''}`}>
            {!collapsed ? <><h1 className="text-xl font-bold text-indigo-700">CEFIC LA ESTRELLA IKH TUKH KIWE</h1><p className="text-xs text-gray-500">Gestión de estudiantes</p></> : <h1 className="text-xl font-bold text-indigo-700">E</h1>}
          </div>
          <nav className="flex-1 p-2 space-y-2">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }} className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? item.label : ''}>
                <item.icon size={20} /> {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>
      {isMobileOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;