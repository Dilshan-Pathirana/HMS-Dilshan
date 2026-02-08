import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Use nullish coalescing to allow empty string as valid baseURL
// Empty string means no prefix (nginx handles /api/v1 routing)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Auth Token)
axiosInstance.interceptors.request.use(
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
// This interceptor unwraps response.data automatically
axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // List of public paths where we shouldn't redirect to login on 401
        const publicPaths = [
            '/',
            '/about-us',
            '/medical-insights',
            '/why-choose-us',
            '/doctor-schedule'
        ];

        // Remove trailing slashes for comparison
        const currentPath = window.location.pathname.replace(/\/$/, "");

        const isPublicPath = publicPaths.some(path => {
            const cleanPath = path.replace(/\/$/, "");
            return currentPath === cleanPath || currentPath.startsWith(cleanPath + "/");
        });

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Only redirect if NOT on a public page
            if (!isPublicPath) {
                alert('Your session has expired or you are not authorized. Please log in again.');
                localStorage.clear();
                window.location.href = '/login';
            } else {
                // For public pages, we might want to just clear the token but stay on the page
                localStorage.removeItem('token');
            }
        }
        return Promise.reject(error);
    }
);

// Create a typed wrapper that reflects the interceptor behavior
// The interceptor returns response.data, so we type it as returning T directly instead of AxiosResponse<T>
interface CustomAxiosInstance {
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}

// Export the typed instance
const api = axiosInstance as unknown as CustomAxiosInstance;

export default api;
