import { Menu, School } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm py-3 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 hidden md:block"
          title="Colapsar menú"
        >
          <Menu size={24} className="text-gray-600" />
        </button>
        <School className="text-indigo-600" size={28} />
        <span className="text-lg font-semibold text-gray-800 hidden sm:inline">
          Dashboard Directivo
        </span>
      </div>
      <div className="text-sm text-gray-500 hidden sm:block">
        {new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </header>
  );
};

export default Navbar;