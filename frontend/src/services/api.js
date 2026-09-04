const API_URL = 'http://localhost:5000/api';

export const fetchStudents = async () => {
  const res = await fetch(`${API_URL}/estudiantes`);
  if (!res.ok) throw new Error('Error al obtener estudiantes');
  return res.json();
};

export const createStudent = async (student) => {
  const res = await fetch(`${API_URL}/estudiantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error('Error al crear');
  return res.json();
};

export const updateStudent = async (id, student) => {
  const res = await fetch(`${API_URL}/estudiantes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error('Error al actualizar');
  return res.json();
};

export const deleteStudent = async (id, motivo) => {
  const res = await fetch(`${API_URL}/estudiantes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error('Error al eliminar');
  return res.json();
};

export const fetchGroups = async () => {
  const res = await fetch(`${API_URL}/grupos`);
  return res.json();
};

export const createGroup = async (group) => {
  const res = await fetch(`${API_URL}/grupos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
  return res.json();
};

export const updateGroup = async (id, group) => {
  const res = await fetch(`${API_URL}/grupos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
  return res.json();
};

export const deleteGroup = async (id) => {
  const res = await fetch(`${API_URL}/grupos/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const fetchEliminados = async () => {
  const res = await fetch(`${API_URL}/eliminados`);
  return res.json();
};

export const restoreStudent = async (id) => {
  const res = await fetch(`${API_URL}/eliminados/${id}/restaurar`, {
    method: 'POST',
  });
  return res.json();
};

export const permanentDelete = async (id) => {
  const res = await fetch(`${API_URL}/eliminados/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};