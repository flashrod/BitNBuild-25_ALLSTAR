import { useAuth } from './AuthContext';

// ------------------------------------
// CHANGE: Rename and export the function as 'api'
// ------------------------------------
export async function api(endpoint, options = {}) { 
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