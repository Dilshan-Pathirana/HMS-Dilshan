import React, { useEffect, useState } from "react";
import api from "../../utils/api/axios";
import axios from "axios";
import LoginForm from "../../components/LoginForm";
import { UserSignIn } from "../../utils/api/user/UserSignIn.ts";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../store.tsx";
import { ILoginProps, LoginError } from "../../utils/types/login";

const LoginPage: React.FC = () => {
    const [loginInfo, setLoginInfo] = useState<ILoginProps>({
        email: "",
        password: "",
    });
    const [loginError, setLoginError] = useState<LoginError>({
        field_error_list: {},
        sign_in_error: "",
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const dispatch = useDispatch<AppDispatch>();
    const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
    const navigate = useNavigate();
    const isAuthenticated = useTypedSelector(
        (state) => state.auth.isAuthenticated,
    );
    const userRole = useTypedSelector((state) => state.auth.userRole);
    const userType = useTypedSelector((state) => state.auth.userType);

    useEffect(() => {
        if (isAuthenticated && userRole === 1) {
            navigate("/dashboard");
        }

        if (isAuthenticated && userRole === 2) {
            navigate("/branch-admin/dashboard");
        }

        if (isAuthenticated && userRole === 3) {
            navigate("/doctor-dashboard-new");
        }

        if (isAuthenticated && userRole === 4) {
            navigate("/nurse-dashboard");
        }

        // Role 5 is Patient
        if (isAuthenticated && userRole === 5) {
            navigate("/patient-dashboard");
        }

        // Role 6 is Cashier (includes Receptionist)
        if (isAuthenticated && userRole === 6) {
            if (userType?.toLowerCase() === 'receptionist') {
                navigate("/receptionist-dashboard");
            } else {
                navigate("/pos");
            }
        }

        if (isAuthenticated && userRole === 7) {
            navigate("/pharmacy-dashboard");
        }

        if (isAuthenticated && userRole === 8) {
            navigate("/it-support-dashboard");
        }

        if (isAuthenticated && userRole === 9) {
            navigate("/center-aid-dashboard");
        }

        if (isAuthenticated && userRole === 10) {
            navigate("/auditor-dashboard");
        }
    }, [navigate, isAuthenticated, userRole, userType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginInfo((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const setErrorCallback = (error: any) => {
                setLoginError({
                    ...loginError,
                    field_error_list: error.errors,
                });
            };

            const setSignInError = (error: string) => {
                setLoginError({ ...loginError, sign_in_error: error });
            };

            await dispatch(
                UserSignIn({ loginInfo, setErrorCallback, setSignInError }),
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error response:", error.response?.data);
            } else {
                console.error("Unexpected error:", error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LoginForm
            signInError={loginError.sign_in_error}
            loginInfo={loginInfo}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
        />
    );
};

export default LoginPage;
