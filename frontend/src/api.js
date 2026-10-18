const API_PREFIX = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('news-portal-token');

  headers.set('Accept', 'application/json');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверьте, запущен ли API.', 0);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).filter(Boolean).join('. ')
      : typeof detail === 'string'
        ? detail
        : `Ошибка запроса (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload;
}

export function loginRequest(username, password) {
  const body = new URLSearchParams({ username, password });
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}
