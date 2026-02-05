import axios from "axios";

// Use nullish coalescing to allow empty string as valid baseURL
// Empty string means no prefix (nginx handles /api/v1 routing)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Auth Token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor (Error Handling)
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert('Your session has expired or you are not authorized. Please log in again.');
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
