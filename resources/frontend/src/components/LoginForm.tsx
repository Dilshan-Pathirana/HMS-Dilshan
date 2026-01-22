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
        <>
            <NavBar />
            <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 mb-32 pt-20 text-center md:text-left min-h-[400px]">
                <div className="w-full md:w-1/2 p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
                    {successMessage && (
                        <p className="mb-4 text-green-700 text-center bg-green-50 p-3 rounded-lg">
                            {successMessage}
                        </p>
                    )}
                    {signInError ? (
                        <p className="mb-4 text-red-700 text-center bg-red-50 p-3 rounded-lg">
                            {signInError}
                        </p>
                    ) : (
                        ""
                    )}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="relative">
                            <div className="flex items-center border rounded-lg p-3 hover:border-blue-500 transition-colors focus-within:border-blue-500">
                                <FaUser className="text-gray-400 mr-3 text-lg" />
                                <input
                                    type="text"
                                    name="email"
                                    value={loginInfo.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex items-center border rounded-lg p-3 hover:border-blue-500 transition-colors focus-within:border-blue-500 relative">
                                <FaLock className="text-gray-400 mr-3 text-lg" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={loginInfo.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-lg font-semibold transition duration-300 text-lg shadow-lg flex items-center justify-center ${
                                isLoading
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5"
                            } text-white`}
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        <div className="text-center mt-4">
                            <Link
                                to="/forgot-password"
                                className={`text-sm transition duration-300 ${
                                    isLoading
                                        ? "text-gray-400 cursor-not-allowed pointer-events-none"
                                        : "text-blue-500 hover:underline hover:text-blue-700"
                                }`}
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <p className="text-gray-600 text-center mt-6">
                            Don't have an account?{" "}
                            <Link
                                to="/signup"
                                className={`font-medium transition duration-300 ${
                                    isLoading
                                        ? "text-gray-400 cursor-not-allowed pointer-events-none"
                                        : "text-blue-600 hover:text-blue-700 hover:underline"
                                }`}
                            >
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
                <img
                    src={HeroImage}
                    alt="Hero"
                    className="w-full md:w-[50%] min-h-[400px] object-cover"
                />
            </section>
            <Footer />
        </>
    );
};

export default LoginForm;
