const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(endpoint, options = {}) {
  const url = API_BASE_URL + endpoint;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Get token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export { API_BASE_URL };