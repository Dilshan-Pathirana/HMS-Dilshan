import AppRoutes from "./routes/AppRoutes";
import axios from "axios";
import { useEffect } from "react";
import { UserSignOut } from "./utils/api/user/UserSignOut.ts";
import {
    useAccessToken,
    useUserRole,
    CheckAuthenticated,
} from "./utils/state/checkAuthenticatedUserStates.ts";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store.tsx";
import { clearAuth } from "./utils/slices/auth/authSlice.tsx";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["Accept"] = "application/json";

// Request interceptor - add authorization token
axios.interceptors.request.use(function (config) {
    const authorizationToken = localStorage.getItem("token");
    console.log('[Axios Interceptor] Token:', authorizationToken ? `${authorizationToken.substring(0, 20)}...` : 'NO TOKEN');
    console.log('[Axios Interceptor] Request URL:', config.url);
    if (authorizationToken) {
        config.headers.Authorization = `Bearer ${authorizationToken}`;
    }
    return config;
});

// Response interceptor - handle 401 errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if we're not already on the login page
            const currentPath = window.location.pathname;
            if (currentPath !== '/' && currentPath !== '/sign-in') {
                console.warn('Session expired, redirecting to login');
                localStorage.clear();
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
const App = () => {
    const accessToken = useAccessToken();
    const userRole = useUserRole();
    const isAuthenticated = CheckAuthenticated();
    const navigate = useNavigate();
    const useAppDispatch = () => useDispatch<AppDispatch>();
    const dispatch = useAppDispatch();

    const authorizationToken = localStorage.getItem("token");

    // Validate session on app load
    useEffect(() => {
        const validateSession = async () => {
            // Only validate if redux says we're authenticated
            if (isAuthenticated && authorizationToken) {
                try {
                    // Try to access a protected endpoint to validate the session
                    await axios.get('/api/validate-session');
                    // Session is valid, do nothing
                } catch (error: any) {
                    // If we get 401, the session is invalid
                    if (error.response?.status === 401) {
                        console.log('Session expired, clearing auth state');
                        dispatch(clearAuth());
                    }
                }
            } else if (isAuthenticated && !authorizationToken) {
                // Redux says authenticated but no token - clear auth
                console.log('No token found, clearing auth state');
                dispatch(clearAuth());
            }
        };

        validateSession();
    }, []);

    useEffect(() => {
        if (authorizationToken === "") {
            dispatch(UserSignOut({ accessToken, userRole }));
            navigate("/");
            localStorage.clear();
            window.location.reload();
        }
    }, [authorizationToken]);

    return (
        <div>
            <AppRoutes />
        </div>
    );
};

export default App;
