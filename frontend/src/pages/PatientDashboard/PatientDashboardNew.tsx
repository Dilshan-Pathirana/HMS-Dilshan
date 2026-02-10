import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
    Calendar,
    Clock,
    FileText,
    Pill,
    Heart,
    MessageSquare,
    Bell,
    User,
    Home,
    ChevronRight,
    Menu,
    X,
    LogOut,
    HelpCircle,
    Shield
} from 'lucide-react';
import api from "../../utils/api/axios";
import useFetchPatientDetails from '../../utils/api/PatientAppointment/FetchPatientDetails';
import { UserSignOut } from '../../utils/api/user/UserSignOut';

// Import dashboard modules
import PatientDashboardHome from './modules/PatientDashboardHome';
import PatientAppointments from './modules/PatientAppointments';
import PatientQueueStatus from './modules/PatientQueueStatus';
import PatientMedicalRecords from './modules/PatientMedicalRecords';
import PatientMedications from './modules/PatientMedications';
import PatientHealthConditions from './modules/PatientHealthConditions';
import PatientComplaints from './modules/PatientComplaints';
import PatientNotifications from './modules/PatientNotifications';
import PatientProfile from './modules/PatientProfile';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const PatientDashboardNew: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const userId = useSelector((state: RootState) => state.auth.userId);
    const userToken = useSelector((state: RootState) => state.auth.userToken);
    const userRole = useSelector((state: RootState) => state.auth.userRole);
    const { userDetails, loading: _userLoading } = useFetchPatientDetails(userId);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Navigation items
    const navItems: NavItem[] = [
        { label: 'Dashboard', path: '', icon: <Home className="w-5 h-5" /> },
        { label: 'Appointments', path: 'appointments', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Live Queue', path: 'queue', icon: <Clock className="w-5 h-5" /> },
        { label: 'Medical Records', path: 'records', icon: <FileText className="w-5 h-5" /> },
        { label: 'Medications', path: 'medications', icon: <Pill className="w-5 h-5" /> },
        { label: 'Health Conditions', path: 'health', icon: <Heart className="w-5 h-5" /> },
        { label: 'Complaints & Feedback', path: 'complaints', icon: <MessageSquare className="w-5 h-5" /> },
        { label: 'Notifications', path: 'notifications', icon: <Bell className="w-5 h-5" />, badge: notificationCount },
        { label: 'My Profile', path: 'profile', icon: <User className="w-5 h-5" /> },
    ];

    useEffect(() => {
        // Fetch notification count
        const fetchNotificationCount = async () => {
            try {
                const response = await api.get(`/patient/notifications/unread-count/${userId}`);
                setNotificationCount(response.data?.count || 0);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        if (userId) {
            fetchNotificationCount();
        }
    }, [userId]);

    const handleSignOut = async () => {
        try {
            // Use the Redux thunk for proper sign out with token
            await dispatch(UserSignOut({
                accessToken: userToken || localStorage.getItem('token') || '',
                userRole: userRole
            }));
        } catch (error) {
            console.error('Sign out failed:', error);
        } finally {
            // Always clear local storage and navigate to login
            localStorage.clear();
            navigate('/login');
        }
    };

    const isActivePath = (path: string) => {
        const currentPath = location.pathname;
        const fullPath = `/patient-dashboard/${path}`;
        // For dashboard home (empty path), check exact match
        if (path === '') {
            return currentPath === '/patient-dashboard' || currentPath === '/patient-dashboard/';
        }
        // For other paths, check if current path starts with the nav item path
        return currentPath.startsWith(fullPath);
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                ${sidebarOpen ? 'w-64' : 'w-20'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                bg-gradient-to-b from-emerald-600 to-teal-700 text-white
                transition-all duration-300 ease-in-out
                flex flex-col
            `}>
                {/* Logo/Header */}
                <div className="p-4 border-b border-emerald-500/30">
                    <div className="flex items-center justify-between">
                        {sidebarOpen && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg">Cure.lk</h1>
                                    <p className="text-xs text-emerald-200">Patient Portal</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg hidden lg:block"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* User Info */}
                {sidebarOpen && (
                    <div className="p-4 border-b border-emerald-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                                {userDetails?.firstName?.charAt(0) || 'P'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {userDetails?.firstName} {userDetails?.lastName}
                                </p>
                                <p className="text-xs text-emerald-200 truncate">
                                    {userDetails?.email || 'Patient'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={`/patient-dashboard/${item.path}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg
                                transition-all duration-200
                                ${isActivePath(item.path)
                                    ? 'bg-white/20 text-white shadow-lg'
                                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            {item.icon}
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-error-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isActivePath(item.path) ? 'rotate-90' : ''}`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-emerald-500/30 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-100 hover:bg-white/10 hover:text-white transition-all">
                        <HelpCircle className="w-5 h-5" />
                        {sidebarOpen && <span>Help & Support</span>}
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-error-500/20 hover:text-red-200 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 hover:bg-neutral-100 rounded-lg lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-800">
                                Welcome back, {userDetails?.firstName || 'Patient'}!
                            </h2>
                            <p className="text-sm text-neutral-500">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <NavLink
                            to="notifications"
                            className="relative p-2 hover:bg-neutral-100 rounded-lg"
                        >
                            <Bell className="w-5 h-5 text-neutral-600" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </NavLink>
                        <NavLink
                            to="profile"
                            className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg"
                        >
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                                {userDetails?.firstName?.charAt(0) || 'P'}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-neutral-700">
                                {userDetails?.firstName}
                            </span>
                        </NavLink>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-6 overflow-auto">
                    <Routes>
                        <Route index element={<PatientDashboardHome />} />
                        <Route path="appointments/*" element={<PatientAppointments />} />
                        <Route path="queue" element={<PatientQueueStatus />} />
                        <Route path="records/*" element={<PatientMedicalRecords />} />
                        <Route path="medications" element={<PatientMedications />} />
                        <Route path="health" element={<PatientHealthConditions />} />
                        <Route path="complaints/*" element={<PatientComplaints />} />
                        <Route path="notifications" element={<PatientNotifications />} />
                        <Route path="profile" element={<PatientProfile />} />
                    </Routes>
                </div>

                {/* Footer */}
                <footer className="bg-white border-t border-neutral-200 px-4 py-3 text-center text-sm text-neutral-500">
                    © 2025 Cure.lk - Patient Portal. All rights reserved.
                </footer>
            </main>
        </div>
    );
};

export default PatientDashboardNew;
