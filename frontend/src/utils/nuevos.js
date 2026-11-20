// Grupo automático "NUEVO": se asigna solo a los estudiantes registrados
// en los últimos 3 meses y desaparece por sí solo al cumplirse el plazo.
// No se guarda en la base de datos: se calcula a partir de fechaCreacion.
export const MESES_NUEVO = 3;
export const GRUPO_NUEVO_ID = '__nuevo__';
export const GRUPO_NUEVO_NOMBRE = 'NUEVO';

export const finNuevo = (fechaCreacion) => {
  if (!fechaCreacion) return null;
  const d = new Date(fechaCreacion);
  if (isNaN(d)) return null;
  d.setMonth(d.getMonth() + MESES_NUEVO);
  return d;
};

export const esNuevo = (student, hoy = new Date()) => {
  const fin = finNuevo(student?.fechaCreacion);
  return Boolean(fin && hoy < fin);
};
