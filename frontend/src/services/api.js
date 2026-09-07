const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res, fallbackMsg) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Sesión expirada, vuelve a iniciar sesión');
  }
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.error || body.message || '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(detail ? `${fallbackMsg}: ${detail}` : `${fallbackMsg} (HTTP ${res.status})`);
  }
  return res.json();
}

export const login = async (usuario, contrasena) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasena }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo iniciar sesión');
  }
  return res.json();
};

export const fetchStudents = async () => {
  const res = await fetch(`${API_URL}/estudiantes`, { headers: authHeaders() });
  return handleResponse(res, 'Error al obtener estudiantes');
};

export const createStudent = async (student) => {
  const res = await fetch(`${API_URL}/estudiantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(student),
  });
  return handleResponse(res, 'Error al crear estudiante');
};

export const updateStudent = async (id, student) => {
  const res = await fetch(`${API_URL}/estudiantes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(student),
  });
  return handleResponse(res, 'Error al actualizar estudiante');
};

export const deleteStudent = async (id, motivo) => {
  const res = await fetch(`${API_URL}/estudiantes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ motivo }),
  });
  return handleResponse(res, 'Error al eliminar estudiante');
};

export const fetchGroups = async () => {
  const res = await fetch(`${API_URL}/grupos`, { headers: authHeaders() });
  return handleResponse(res, 'Error al obtener grupos');
};

export const createGroup = async (group) => {
  const res = await fetch(`${API_URL}/grupos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(group),
  });
  return handleResponse(res, 'Error al crear grupo');
};

export const updateGroup = async (id, group) => {
  const res = await fetch(`${API_URL}/grupos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(group),
  });
  return handleResponse(res, 'Error al actualizar grupo');
};

export const deleteGroup = async (id) => {
  const res = await fetch(`${API_URL}/grupos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Error al eliminar grupo');
};

export const fetchEliminados = async () => {
  const res = await fetch(`${API_URL}/eliminados`, { headers: authHeaders() });
  return handleResponse(res, 'Error al obtener eliminados');
};

export const restoreStudent = async (id) => {
  const res = await fetch(`${API_URL}/eliminados/${id}/restaurar`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Error al restaurar estudiante');
};

export const permanentDelete = async (id) => {
  const res = await fetch(`${API_URL}/eliminados/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Error al eliminar permanentemente');
};

export const fetchAcudientes = async () => {
  const res = await fetch(`${API_URL}/acudientes`, { headers: authHeaders() });
  return handleResponse(res, 'Error al obtener acudientes');
};

export const createAcudiente = async (acudiente) => {
  const res = await fetch(`${API_URL}/acudientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(acudiente),
  });
  return handleResponse(res, 'Error al crear acudiente');
};

export const updateAcudiente = async (id, acudiente) => {
  const res = await fetch(`${API_URL}/acudientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(acudiente),
  });
  return handleResponse(res, 'Error al actualizar acudiente');
};

export const deleteAcudiente = async (id) => {
  const res = await fetch(`${API_URL}/acudientes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Error al eliminar acudiente');
};
