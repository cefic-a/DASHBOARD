import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const GroupSelector = ({ groups, selectedGroups, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (id) => {
    if (selectedGroups.includes(id)) onChange(selectedGroups.filter(g => g !== id));
    else onChange([...selectedGroups, id]);
  };

  const selectedNames = groups.filter(g => selectedGroups.includes(g.id)).map(g => g.nombre).join(', ');

  return (
    <div ref={containerRef} className="relative">
      <div className="border rounded px-3 py-2 cursor-pointer bg-white flex justify-between items-center min-h-[42px]" onClick={() => setIsOpen(!isOpen)}>
        <span className={`text-sm ${selectedGroups.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
          {selectedGroups.length === 0 ? placeholder : selectedNames}
        </span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {groups.length === 0 ? <div className="p-3 text-sm text-gray-500">No hay grupos.</div> : groups.map(g => (
            <div key={g.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => toggle(g.id)}>
              <div className="w-5 h-5 border rounded flex items-center justify-center">{selectedGroups.includes(g.id) && <Check size={14} className="text-indigo-600" />}</div>
              <span className="text-sm">{g.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupSelector;