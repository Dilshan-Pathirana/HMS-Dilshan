import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { UserSignOut } from "./utils/api/user/UserSignOut.ts";
import {
    useAccessToken,
    useUserRole,
} from "./utils/state/checkAuthenticatedUserStates.ts";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store.tsx";

// Axios global config and interceptors are handled in ./utils/api/axios.ts
const App = () => {
    const accessToken = useAccessToken();
    const userRole = useUserRole();
    const navigate = useNavigate();
    const useAppDispatch = () => useDispatch<AppDispatch>();
    const dispatch = useAppDispatch();

    const authorizationToken = localStorage.getItem("token");

    // OPTIMIZATION: Removed validateSession API call from app load
    // This was causing unnecessary delay. Session validation now happens
    // through axios interceptors when actual API calls are made.

    useEffect(() => {
        // Only clear auth if token is explicitly empty string (not null/undefined)
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
