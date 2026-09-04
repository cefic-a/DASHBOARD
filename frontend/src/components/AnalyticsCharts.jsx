import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Componente para la leyenda personalizada (se muestra debajo de cada dona)
const CustomLegend = ({ data }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center gap-1 text-xs">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
          <span className="text-gray-500">({((entry.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsCharts = ({ students }) => {
  // ============================
  // 1. Distribución por grado (barras)
  // ============================
  const gradosMap = new Map();
  students.forEach(s => {
    const grado = s.grado;
    gradosMap.set(grado, (gradosMap.get(grado) || 0) + 1);
  });
  const dataGrados = Array.from(gradosMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([grado, count]) => ({ grado: `Grado ${grado}`, cantidad: count }));

  // ============================
  // 2. Activos vs Inactivos (dona)
  // ============================
  const activos = students.filter(s => s.activo).length;
  const inactivos = students.length - activos;
  const dataActivos = [
    { name: 'Activos', value: activos, color: '#10b981' },
    { name: 'Inactivos', value: inactivos, color: '#ef4444' },
  ];

  // ============================
  // 3. Género (dona)
  // ============================
  const masculinos = students.filter(s => s.genero === 'MASCULINO').length;
  const femeninos = students.filter(s => s.genero === 'FEMENINO').length;
  const dataGenero = [
    { name: 'Masculino', value: masculinos, color: '#3b82f6' },
    { name: 'Femenino', value: femeninos, color: '#ec489a' },
  ];

  // ============================
  // 4. Discapacidad (dona)
  // ============================
  const conDiscap = students.filter(s => s.discapacidad === 'SI').length;
  const sinDiscap = students.filter(s => s.discapacidad === 'NO').length;
  const dataDiscap = [
    { name: 'Con discapacidad', value: conDiscap, color: '#f59e0b' },
    { name: 'Sin discapacidad', value: sinDiscap, color: '#9ca3af' },
  ];

  // ============================
  // 5. Idioma (dona)
  // ============================
  const hablanSI = students.filter(s => s.idioma === 'SI').length;
  const hablanNO = students.filter(s => s.idioma === 'NO').length;
  const dataIdioma = [
    { name: 'Sí (NeesWewxi)', value: hablanSI, color: '#14b8a6' },
    { name: 'No', value: hablanNO, color: '#f43f5e' },
  ];

  // ============================
  // 6. Camino del Sol (barras)
  // ============================
  const caminoSolMap = new Map();
  students.forEach(s => {
    if (s.caminoSol) {
      caminoSolMap.set(s.caminoSol, (caminoSolMap.get(s.caminoSol) || 0) + 1);
    }
  });
  const dataCaminoSol = Array.from(caminoSolMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value, color: COLORS[Math.floor(Math.random() * COLORS.length)] }));
  const totalCaminoSol = dataCaminoSol.reduce((acc, curr) => acc + curr.value, 0);

  // ============================
  // 7. Camino de la Luna (barras)
  // ============================
  const caminoLunaMap = new Map();
  students.forEach(s => {
    if (s.caminoLuna) {
      caminoLunaMap.set(s.caminoLuna, (caminoLunaMap.get(s.caminoLuna) || 0) + 1);
    }
  });
  const dataCaminoLuna = Array.from(caminoLunaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value, color: COLORS[Math.floor(Math.random() * COLORS.length)] }));
  const totalCaminoLuna = dataCaminoLuna.reduce((acc, curr) => acc + curr.value, 0);

  // ============================
  // Renderizado
  // ============================
  return (
    <div className="space-y-8">
      {/* Gráfico de barras: Distribución por grado */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">📊 Distribución por grado</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dataGrados} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grado" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
            <Bar dataKey="cantidad" fill="#6366f1" name="Estudiantes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fila de donas con leyenda personalizada debajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Activos vs Inactivos */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-center">Activos vs Inactivos</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={dataActivos}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {dataActivos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={dataActivos} />
        </div>

        {/* Género */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-center">Género</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={dataGenero}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {dataGenero.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={dataGenero} />
        </div>

        {/* Discapacidad */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-center">Discapacidad</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={dataDiscap}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {dataDiscap.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={dataDiscap} />
        </div>

        {/* Idioma */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-center">Habla NeesWewxi</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={dataIdioma}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {dataIdioma.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={dataIdioma} />
        </div>
      </div>

      {/* Fila 3: Camino del Sol y Camino de la Luna (barras) con leyendas personalizadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camino del Sol */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">☀️ Camino del Sol</h3>
          {dataCaminoSol.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataCaminoSol} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} estudiantes`, 'Cantidad']} />
                  <Bar dataKey="value" fill="#f97316" name="Estudiantes" />
                </BarChart>
              </ResponsiveContainer>
              <CustomLegend data={dataCaminoSol} total={totalCaminoSol} />
            </>
          ) : (
            <p className="text-center text-gray-500 py-6">No hay datos de Camino del Sol registrados</p>
          )}
        </div>

        {/* Camino de la Luna */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">🌙 Camino de la Luna</h3>
          {dataCaminoLuna.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataCaminoLuna} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} estudiantes`, 'Cantidad']} />
                  <Bar dataKey="value" fill="#6366f1" name="Estudiantes" />
                </BarChart>
              </ResponsiveContainer>
              <CustomLegend data={dataCaminoLuna} total={totalCaminoLuna} />
            </>
          ) : (
            <p className="text-center text-gray-500 py-6">No hay datos de Camino de la Luna registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;