// import { useAuth } from './AuthContext';

// // ------------------------------------
// // CHANGE: Rename and export the function as 'api'
// // ------------------------------------
// export async function api(endpoint, options = {}) { 
//     const { session } = useAuth();
//     const accessToken = session?.access_token;

//     const res = await fetch(endpoint, {
//         ...options,
//         headers: {
//             ...(options.headers || {}),
//             Authorization: `Bearer ${accessToken}`,
//             'Content-Type': 'application/json',
//         },
//     });
//     return res.json();
// }
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); // or however you store it
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;