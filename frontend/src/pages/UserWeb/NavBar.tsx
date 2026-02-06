import { FaBars, FaTimes, FaShoppingCart, FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";
import CureLogo from "../../assets/cure-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearAuth } from "../../utils/slices/auth/authSlice.tsx";
import api from "../../utils/api/axios";

const NavBar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, firstName, userRole, userType } = useSelector((state: any) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get the correct dashboard path based on user role
    const getDashboardPath = () => {
        switch (userRole) {
            case 1: // Super Admin
                return '/super-admin-dashboard';
            case 2: // Branch Admin
                return '/branch-admin/dashboard';
            case 3: // Doctor
                return '/doctor-dashboard-new';
            case 4: // Nurse
                return '/nurse-dashboard';
            case 5: // Patient
                return '/patient-dashboard';
            case 6: // Cashier (includes Receptionist based on user_type)
                if (userType?.toLowerCase() === 'receptionist') {
                    return '/receptionist-dashboard';
                }
                return '/pos';
            case 7: // Pharmacist
                return '/pharmacy-dashboard';
            case 8: // IT Support
                return '/it-support-dashboard';
            case 9: // Center Aid
                return '/center-aid-dashboard';
            case 10: // Auditor
                return '/auditor-dashboard';
            default:
                return '/patient-dashboard';
        }
    };

    const dashboardPath = getDashboardPath();

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(clearAuth());
            localStorage.clear();
            navigate('/');
            setMenuOpen(false);
        }
    };

    return (
        <>
            {/* Spacer to prevent content from being hidden behind fixed navbar */}
            <div className="h-[82px]"></div>

            <nav className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md border-b-2 fixed top-0 left-0 w-full z-50">
                <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
                    <img
                        src={CureLogo}
                        className="h-[50px] w-[50px] ml-2 md:ml-10"
                        alt="Cure Logo"
                    />
                    <h1 className="text-lg font-semibold text-primary-500">
                        CURE-<span className="text-green-800">HEALTH CARE</span>
                    </h1>
                </Link>

                <button
                    className="text-neutral-700 focus:outline-none md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                {menuOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={() => setMenuOpen(false)}
                    />
                )}

                {/* Mobile Slide-out Menu */}
                <div
                    className={`fixed top-0 left-0 h-screen w-72 bg-white/95 backdrop-blur-md shadow-2xl transform ${menuOpen ? "translate-x-0" : "-translate-x-full"
                        } transition-transform duration-300 ease-in-out z-50 md:static md:h-auto md:w-auto md:flex md:space-x-6 md:shadow-none md:transform-none md:bg-transparent`}
                >
                    {/* Mobile Menu Header */}
                    <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-emerald-500">
                        <div className="flex items-center space-x-3">
                            <img src={CureLogo} className="h-10 w-10" alt="Cure Logo" />
                            <span className="text-white font-bold text-lg">CURE</span>
                        </div>
                        <button
                            className="p-2 rounded-full bg-white/95 backdrop-blur-md/20 hover:bg-white/95 backdrop-blur-md/30 transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            <FaTimes size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Mobile Menu Items */}
                    <div className="md:hidden flex flex-col p-4 space-y-2">
                        <Link
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center px-4 py-3 text-neutral-700 hover:bg-blue-50 hover:text-primary-500 rounded-lg font-medium transition-all duration-200 border-l-4 border-transparent hover:border-primary-500"
                        >
                            <span className="mr-3">🏠</span>
                            Home
                        </Link>
                        <Link
                            to="/about-us"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center px-4 py-3 text-neutral-700 hover:bg-blue-50 hover:text-primary-500 rounded-lg font-medium transition-all duration-200 border-l-4 border-transparent hover:border-primary-500"
                        >
                            <span className="mr-3">ℹ️</span>
                            About Us
                        </Link>
                        <Link
                            to="/medical-insights"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center px-4 py-3 text-neutral-700 hover:bg-blue-50 hover:text-primary-500 rounded-lg font-medium transition-all duration-200 border-l-4 border-transparent hover:border-primary-500"
                        >
                            <span className="mr-3">📰</span>
                            Medical Insights
                        </Link>

                        {/* Divider */}
                        <div className="border-t border-neutral-200 my-2"></div>

                        {/* Mobile Auth Buttons */}
                        {isAuthenticated ? (
                            <>
                                {/* Book Appointment - only for patients */}
                                {userRole === 5 && (
                                    <Link
                                        to="/patient-dashboard/appointments/book"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center px-4 py-3 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg font-medium transition-all duration-200"
                                    >
                                        <span className="mr-3">📅</span>
                                        Book Appointment
                                    </Link>
                                )}
                                <Link
                                    to={dashboardPath}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg font-medium transition-all duration-200"
                                >
                                    <span className="mr-3">📊</span>
                                    Dashboard
                                </Link>

                                {/* Divider */}
                                <div className="border-t border-neutral-200 my-2"></div>

                                {/* User info and Logout */}
                                {firstName && (
                                    <div className="px-4 py-2 text-sm text-neutral-500">
                                        Logged in as <span className="font-semibold text-neutral-700">{firstName}</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-4 py-3 text-error-600 hover:bg-error-50 rounded-lg font-medium transition-all duration-200 w-full"
                                >
                                    <span className="mr-3">🚪</span>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col space-y-3 mt-4 px-2">
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full py-3 text-center text-emerald-600 font-semibold border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full py-3 text-center text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Desktop Menu Items (unchanged) */}
                    {!isAuthenticated && (
                        <div className="hidden md:flex md:space-x-6">
                            <Link
                                to="/"
                                className="text-neutral-700 hover:text-primary-500 font-medium"
                            >
                                Home
                            </Link>
                            <Link
                                to="/about-us"
                                className="text-neutral-700 hover:text-primary-500 font-medium"
                            >
                                About Us
                            </Link>
                            <Link
                                to="/medical-insights"
                                className="text-neutral-700 hover:text-primary-500 font-medium"
                            >
                                Medical Insights
                            </Link>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex space-x-4 items-center">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            {/* Cart Icon */}
                            <Link
                                to="/shop/cart"
                                className="relative p-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                                title="Shopping Cart"
                            >
                                <FaShoppingCart size={22} />
                                {/* Cart badge - for future use */}
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    0
                                </span>
                            </Link>
                            {/* Book Appointment - only for patients */}
                            {userRole === 5 && (
                                <Link to="/patient-dashboard/appointments/book" className="navbar-button">
                                    Book Appointment
                                </Link>
                            )}
                            <Link to={dashboardPath} className="navbar-button">
                                Dashboard
                            </Link>
                            {/* User greeting */}
                            {firstName && (
                                <span className="text-neutral-600 text-sm hidden lg:inline">
                                    Hi, <span className="font-semibold">{firstName}</span>
                                </span>
                            )}
                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-error-600 font-semibold border-2 border-error-500 rounded-lg hover:bg-error-50 transition-all duration-200"
                                title="Logout"
                            >
                                <FaSignOutAlt size={16} />
                                <span className="hidden lg:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* Cart Icon */}
                            <Link
                                to="/shop/cart"
                                className="relative p-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                                title="Shopping Cart"
                            >
                                <FaShoppingCart size={22} />
                                {/* Cart badge - for future use */}
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    0
                                </span>
                            </Link>
                            <Link to="/login">
                                <button className="px-5 py-2.5 text-emerald-600 font-semibold border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-200 shadow-sm">
                                    Log in
                                </button>
                            </Link>
                            <Link to="/signup">
                                <button className="px-5 py-2.5 text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300">
                                    Sign up
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default NavBar;
