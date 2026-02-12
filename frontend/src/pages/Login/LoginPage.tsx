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
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
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

        // Role 6 is Cashier
        if (isAuthenticated && userRole === 6) {
            navigate("/pos");
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
        // Clear errors when user starts typing
        setLoginError({ field_error_list: {}, sign_in_error: "" });
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const errors: { email?: string; password?: string } = {};
        const emailTrimmed = loginInfo.email.trim();
        if (!emailTrimmed) {
            errors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
            errors.email = "Please enter a valid email address.";
        }
        if (!loginInfo.password) {
            errors.password = "Password is required.";
        } else if (loginInfo.password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});

        setIsLoading(true);
        setLoginError({ field_error_list: {}, sign_in_error: "" });

        try {
            const setErrorCallback = (_error: any) => { /* handled via setSignInError */ };

            const setSignInError = (error: string) => {
                setLoginError((prev) => ({ ...prev, sign_in_error: error }));
            };

            await dispatch(
                UserSignIn({ loginInfo, setErrorCallback, setSignInError }),
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const msg = error.response?.data?.detail || error.response?.data?.message || "Login failed. Please try again.";
                setLoginError((prev) => ({ ...prev, sign_in_error: msg }));
            } else {
                setLoginError((prev) => ({ ...prev, sign_in_error: "An unexpected error occurred. Please try again." }));
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
            fieldErrors={fieldErrors}
        />
    );
};

export default LoginPage;
