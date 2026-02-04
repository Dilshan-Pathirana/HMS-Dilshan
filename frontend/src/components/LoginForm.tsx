import React from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import HeroImage from "../assets/heroImage.png";
import NavBar from "../pages/UserWeb/NavBar.tsx";
import Footer from "../pages/UserWeb/Footer.tsx";
import { ILoginFormProps } from "../utils/types/users/ISignUp.ts";

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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar />
            <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-12 z-10">
                    {/* Login Form Card */}
                    <div className="w-full md:w-1/2 max-w-md">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                                <p className="text-slate-500">Sign in to your account to continue</p>
                            </div>

                            {successMessage && (
                                <div className="mb-6 bg-green-50/50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {successMessage}
                                </div>
                            )}

                            {signInError && (
                                <div className="mb-6 bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {signInError}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="email"
                                            value={loginInfo.email}
                                            onChange={handleChange}
                                            placeholder="name@company.com"
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaLock className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={loginInfo.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                                            required
                                            disabled={isLoading}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-slate-400 hover:text-primary-500 focus:outline-none transition-colors"
                                                disabled={isLoading}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition-all duration-200 ${isLoading
                                            ? "bg-primary-400 cursor-wait"
                                            : "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/30 hover:shadow-primary-600/40 transform hover:-translate-y-0.5"
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </div>
                                    ) : (
                                        "Sign in"
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500">
                                    Don't have an account?{" "}
                                    <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Hero Image */}
                    <div className="hidden md:block w-1/2 relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/40 to-transparent z-10"></div>
                            <img
                                src={HeroImage}
                                alt="Medical professionals"
                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white text-2xl font-bold mb-2">Advanced Care</h3>
                                <p className="text-slate-200">Streamlining hospital operations for better patient outcomes.</p>
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
