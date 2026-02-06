import React from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import HeroImage from "../assets/heroImage.png";
import NavBar from "../pages/UserWeb/NavBar.tsx";
import Footer from "../pages/UserWeb/Footer.tsx";
import { ILoginFormProps } from "../utils/types/users/ISignUp.ts";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

const LoginForm: React.FC<ILoginFormProps> = ({
    signInError,
    loginInfo,
    handleChange,
    handleSubmit,
    isLoading = false,
}) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const location = useLocation();
    const successMessage = location.state?.message;

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <NavBar />
            <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="flex flex-col items-center justify-center w-full max-w-2xl z-10 px-4">
                    {/* Login Form Card */}
                    <div className="w-full">
                        <div className="glass rounded-2xl shadow-xl border-neutral-200/60 p-8 md:p-12 w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-bold text-neutral-900 mb-2 tracking-tight">Welcome Back</h2>
                                <p className="text-neutral-600 text-base">Sign in to your account to continue</p>
                            </div>

                            {successMessage && (
                                <div className="mb-6 bg-success-50 border-l-4 border-success-500 text-success-700 px-4 py-3 rounded-lg text-sm flex items-center shadow-sm">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {successMessage}
                                </div>
                            )}

                            {signInError && (
                                <div className="mb-6 bg-error-50 border-l-4 border-error-500 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center shadow-sm">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {signInError}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="text"
                                    value={loginInfo.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    leftIcon={<FaUser className="h-4 w-4" />}
                                    required
                                    disabled={isLoading}
                                />

                                <div className="space-y-1">
                                    <Input
                                        label="Password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={loginInfo.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        leftIcon={<FaLock className="h-4 w-4" />}
                                        rightIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="focus:outline-none text-neutral-400 hover:text-primary-500 transition-colors"
                                            >
                                                {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                                            </button>
                                        }
                                        required
                                        disabled={isLoading}
                                    />
                                    <div className="flex justify-end">
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    className="w-full shadow-primary hover:shadow-primary-hover"
                                    size="lg"
                                >
                                    Sign in
                                </Button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                                <p className="text-sm text-neutral-600">
                                    Don't have an account?{" "}
                                    <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LoginForm;
