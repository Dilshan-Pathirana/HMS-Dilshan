import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
    Calendar,
    FileText,
    Pill,
    Users,
    Bell,
    User,
    Home,
    ChevronRight,
    Menu,
    X,
    LogOut,
    HelpCircle,
    Stethoscope,
    ClipboardList,
    TestTube,
    Activity,
    BarChart3
} from 'lucide-react';
import api from "../../utils/api/axios";
import { UserSignOut } from '../../utils/api/user/UserSignOut';

// Import dashboard modules
import DoctorDashboardHome from './modules/DoctorDashboardHome';
import DoctorScheduleManagement from './modules/DoctorScheduleManagement';
import DoctorPatientQueue from './modules/DoctorPatientQueue';
import DoctorConsultation from './modules/DoctorConsultation';
import DoctorInvestigations from './modules/DoctorInvestigations';
import DoctorPrescriptions from './modules/DoctorPrescriptions';
import DoctorPatientRecords from './modules/DoctorPatientRecords';
import DoctorNotifications from './modules/DoctorNotifications';
import DoctorProfile from './modules/DoctorProfile';
import DoctorReports from './modules/DoctorReports';
import DoctorAppointments from './DoctorAppointments/DoctorAppointments';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
}

const DoctorDashboardNew: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const userId = useSelector((state: RootState) => state.auth.userId);
    const userToken = useSelector((state: RootState) => state.auth.userToken);
    const userRole = useSelector((state: RootState) => state.auth.userRole);
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [queueCount, _setQueueCount] = useState(0);
    const [doctorName, _setDoctorName] = useState<string>('Doctor');

    // Navigation items
    const navItems: NavItem[] = [
        { label: 'Dashboard', path: '', icon: <Home className="w-5 h-5" /> },
        { label: 'Schedule Management', path: 'schedule', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Patient Queue', path: 'queue', icon: <Users className="w-5 h-5" />, badge: queueCount },
        { label: 'Appointments', path: 'appointments', icon: <ClipboardList className="w-5 h-5" /> },
        { label: 'Consultations', path: 'consultation', icon: <Stethoscope className="w-5 h-5" /> },
        { label: 'Investigations', path: 'investigations', icon: <TestTube className="w-5 h-5" /> },
        { label: 'Prescriptions', path: 'prescriptions', icon: <Pill className="w-5 h-5" /> },
        { label: 'Patient Records', path: 'records', icon: <FileText className="w-5 h-5" /> },
        { label: 'Reports', path: 'reports', icon: <BarChart3 className="w-5 h-5" /> },
        { label: 'Notifications', path: 'notifications', icon: <Bell className="w-5 h-5" />, badge: notificationCount },
        { label: 'My Profile', path: 'profile', icon: <User className="w-5 h-5" /> },
    ];

    useEffect(() => {
        // Fetch notification and queue counts
        const fetchCounts = async () => {
            try {
                // Fetch notification count
                const notifResponse = await api.get(`/doctor/notifications/unread-count/${userId}`);
                if (notifResponse.data.status === 200) {
                    setNotificationCount(notifResponse.data.count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch counts:', error);
            }
        };
        
        if (userId) {
            fetchCounts();
        }
    }, [userId]);

    const handleSignOut = async () => {
        try {
            await dispatch(UserSignOut({ 
                accessToken: userToken || localStorage.getItem('token') || '', 
                userRole: userRole 
            }));
        } catch (error) {
            console.error('Sign out failed:', error);
        } finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    const isActivePath = (path: string) => {
        const currentPath = location.pathname;
        const fullPath = `/doctor-dashboard-new/${path}`;
        if (path === '') {
            return currentPath === '/doctor-dashboard-new' || currentPath === '/doctor-dashboard-new/';
        }
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
                bg-gradient-to-b from-primary-500 to-indigo-700 text-white
                transition-all duration-300 ease-in-out
                flex flex-col
            `}>
                {/* Logo/Header */}
                <div className="p-4 border-b border-primary-500/30">
                    <div className="flex items-center justify-between">
                        {sidebarOpen && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg">Cure.lk</h1>
                                    <p className="text-xs text-blue-200">Doctor Portal</p>
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
                    <div className="p-4 border-b border-primary-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                                {doctorName?.charAt(0) || 'D'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    Dr. {doctorName || 'Doctor'}
                                </p>
                                <p className="text-xs text-blue-200 truncate">
                                    Medical Practitioner
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
                            to={`/doctor-dashboard-new/${item.path}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg
                                transition-all duration-200
                                ${isActivePath(item.path)
                                    ? 'bg-white/20 text-white shadow-lg'
                                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
                <div className="p-4 border-t border-primary-500/30 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white transition-all">
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
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-neutral-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setMobileMenuOpen(true)}
                                className="p-2 hover:bg-neutral-100 rounded-lg lg:hidden"
                            >
                                <Menu className="w-6 h-6 text-neutral-600" />
                            </button>
                            <div>
                                <h2 className="text-xl font-semibold text-neutral-800">
                                    {navItems.find(item => isActivePath(item.path))?.label || 'Dashboard'}
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Quick Actions */}
                            <NavLink 
                                to="/doctor-dashboard-new/queue"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary-500 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Activity className="w-5 h-5" />
                                <span className="hidden md:inline">Live Queue</span>
                            </NavLink>
                            
                            {/* Notifications */}
                            <NavLink 
                                to="/doctor-dashboard-new/notifications"
                                className="relative p-2 hover:bg-neutral-100 rounded-lg"
                            >
                                <Bell className="w-6 h-6 text-neutral-600" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                        {notificationCount}
                                    </span>
                                )}
                            </NavLink>
                            
                            {/* Profile */}
                            <NavLink 
                                to="/doctor-dashboard-new/profile"
                                className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded-lg"
                            >
                                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {doctorName?.charAt(0) || 'D'}
                                </div>
                            </NavLink>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Routes>
                        <Route index element={<DoctorDashboardHome />} />
                        <Route path="schedule/*" element={<DoctorScheduleManagement />} />
                        <Route path="queue/*" element={<DoctorPatientQueue />} />
                        <Route path="appointments/*" element={<DoctorAppointments />} />
                        <Route path="consultation/*" element={<DoctorConsultation />} />
                        <Route path="investigations/*" element={<DoctorInvestigations />} />
                        <Route path="prescriptions/*" element={<DoctorPrescriptions />} />
                        <Route path="records/*" element={<DoctorPatientRecords />} />
                        <Route path="reports" element={<DoctorReports />} />
                        <Route path="notifications" element={<DoctorNotifications />} />
                        <Route path="profile" element={<DoctorProfile />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default DoctorDashboardNew;
