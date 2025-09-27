import { useAuth } from './AuthContext';

// Example: Authenticated fetch to FastAPI backend
export async function fetchProtectedResource(endpoint, options = {}) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}