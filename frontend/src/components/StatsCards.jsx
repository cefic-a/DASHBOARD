import { Users, UserCheck, UserX, Activity, MessageCircle } from 'lucide-react';

const StatsCards = ({ students, groups }) => {
  const total = students.length;
  const activos = students.filter(s => s.activo).length;
  const inactivos = total - activos;
  const conDiscapacidad = students.filter(s => s.discapacidad === 'SI').length;
  const porcentajeDiscapacidad = total ? ((conDiscapacidad / total) * 100).toFixed(1) : 0;

  // Datos de idioma
  const hablanNeesWewxi = students.filter(s => s.idioma === 'SI').length;
  const noHablan = total - hablanNeesWewxi;
  const porcentajeIdioma = total ? ((hablanNeesWewxi / total) * 100).toFixed(1) : 0;

  // Datos por grado
  const gradosMap = new Map();
  students.forEach(s => {
    const grado = s.grado;
    if (!gradosMap.has(grado)) gradosMap.set(grado, { total: 0, activos: 0, inactivos: 0 });
    const stats = gradosMap.get(grado);
    stats.total++;
    if (s.activo) stats.activos++;
    else stats.inactivos++;
  });
  const gradosStats = Array.from(gradosMap.entries()).sort((a,b)=>a[0]-b[0]).map(([grado, stats]) => ({ grado, ...stats, porcentajeActivos: stats.total ? Math.round((stats.activos / stats.total) * 100) : 0 }));

  const getColor = (g) => {
    const colores = ['from-blue-500', 'from-green-500', 'from-yellow-500', 'from-red-500', 'from-purple-500', 'from-pink-500', 'from-indigo-500', 'from-teal-500', 'from-orange-500', 'from-cyan-500', 'from-lime-500', 'from-emerald-500'];
    return colores[g % colores.length] || 'from-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full"><Users size={28} className="text-blue-600" /></div>
          <div><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold">{total}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full"><UserCheck size={28} className="text-green-600" /></div>
          <div><p className="text-gray-500 text-sm">Activos</p><p className="text-2xl font-bold">{activos}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full"><UserX size={28} className="text-red-600" /></div>
          <div><p className="text-gray-500 text-sm">Inactivos</p><p className="text-2xl font-bold">{inactivos}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full"><Activity size={28} className="text-purple-600" /></div>
          <div><p className="text-gray-500 text-sm">Discapacidad</p><p className="text-2xl font-bold">{porcentajeDiscapacidad}%</p></div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-teal-100 rounded-full"><MessageCircle size={28} className="text-teal-600" /></div>
          <div>
            <p className="text-gray-500 text-sm">Hablan NeesWewxi</p>
            <p className="text-2xl font-bold">{porcentajeIdioma}%</p>
            <p className="text-xs text-gray-400">{hablanNeesWewxi} de {total}</p>
          </div>
        </div>
      </div>

      {/* Estudiantes por grado - tarjetas */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">📊 Estudiantes por grado</h3>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {gradosStats.map(({ grado, total, activos, inactivos, porcentajeActivos }) => (
            <div key={grado} className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Cabecera con degradado (ahora más compacto) */}
              <div className={`bg-gradient-to-r ${getColor(grado)} to-${getColor(grado).replace('from', 'to')} px-3 py-2 text-white`}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Grado {grado}</span>
                  <span className="text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded-full">{total} estudiantes</span>
                </div>
              </div>
              {/* Cuerpo (se reduce el padding y el tamaño de fuente) */}
              <div className="p-3 bg-white">
                <div className="flex justify-between mb-1">
                  <div className="text-center flex-1">
                    <p className="text-xl font-bold text-green-600">{activos}</p>
                    <p className="text-[10px] text-gray-500">Activos</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xl font-bold text-red-500">{inactivos}</p>
                    <p className="text-[10px] text-gray-500">Inactivos</p>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>Tasa actividad</span>
                    <span>{porcentajeActivos}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${porcentajeActivos}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grupos personalizados */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">🏷️ Estudiantes por grupo personalizado</h3>
        <div className="flex flex-wrap gap-3">
          {groups.map(group => {
            const count = students.filter(s => s.gruposIds?.includes(group.id)).length;
            return <div key={group.id} className="bg-gray-100 rounded-full px-3 py-1 text-sm">{group.nombre}: {count}</div>;
          })}
          {groups.length === 0 && <p className="text-gray-500 text-sm">No hay grupos creados.</p>}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;