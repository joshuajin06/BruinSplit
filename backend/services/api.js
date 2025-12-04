const API_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('token');

async function fetchWithAuth(url, options = {}) {
  const token  = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // ← Automatically adds token
      ...options.headers
    }
  });

  const data = await response.json();

  if(!response.ok) {
    // Handle 401 (unauthorized) errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth'; // Redirect to login
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
}