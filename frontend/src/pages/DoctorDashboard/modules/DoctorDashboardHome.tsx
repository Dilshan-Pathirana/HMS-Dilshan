import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    FileText,
    Pill,
    Activity,
    ChevronRight,
    Stethoscope,
    ClipboardList,
    TestTube,
    ArrowUpRight,
    UserCheck,
    UserX,
    Timer
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface TodayAppointment {
    id: string;
    patient_name: string;
    time: string;
    slot: number;
    status: 'waiting' | 'in-consultation' | 'completed' | 'no-show';
    reason?: string;
}

interface DashboardStats {
    todayAppointments: number;
    completedToday: number;
    pendingToday: number;
    noShowToday: number;
    totalPatientsThisWeek: number;
    pendingReports: number;
    pendingPrescriptions: number;
}

const DoctorDashboardHome: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [doctorName, setDoctorName] = useState<string>('Doctor');
    
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        completedToday: 0,
        pendingToday: 0,
        noShowToday: 0,
        totalPatientsThisWeek: 0,
        pendingReports: 0,
        pendingPrescriptions: 0
    });
    const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [userId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch dashboard stats
            const statsResponse = await api.get('/doctor/dashboard-stats');
            if (statsResponse.data.status === 200) {
                setStats(statsResponse.data.data);
            }

            // Fetch today's appointments
            const today = new Date().toISOString().split('T')[0];
            const appointmentsResponse = await api.get(`/get-doctor-all-schedule/${userId}`);
            if (appointmentsResponse.data.status === 200) {
                // Filter for today's appointments
                const todayAppts = (appointmentsResponse.data.appointments || [])
                    .filter((apt: any) => apt.date === today)
                    .slice(0, 5); // Get first 5
                setTodayAppointments(todayAppts);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const statCards = [
        {
            title: "Today's Appointments",
            value: stats.todayAppointments,
            icon: <Calendar className="w-6 h-6" />,
            color: 'blue',
            link: '/doctor-dashboard-new/queue'
        },
        {
            title: 'Completed Today',
            value: stats.completedToday,
            icon: <CheckCircle className="w-6 h-6" />,
            color: 'green',
            link: '/doctor-dashboard-new/queue'
        },
        {
            title: 'Pending',
            value: stats.pendingToday,
            icon: <Clock className="w-6 h-6" />,
            color: 'yellow',
            link: '/doctor-dashboard-new/queue'
        },
        {
            title: 'No Shows',
            value: stats.noShowToday,
            icon: <UserX className="w-6 h-6" />,
            color: 'red',
            link: '/doctor-dashboard-new/queue'
        }
    ];

    const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-primary-500', icon: 'bg-blue-100' },
        green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'bg-yellow-100' },
        red: { bg: 'bg-error-50', text: 'text-error-600', icon: 'bg-error-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'waiting':
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Waiting</span>;
            case 'in-consultation':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">In Consultation</span>;
            case 'completed':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completed</span>;
            case 'no-show':
                return <span className="px-2 py-1 text-xs font-medium bg-error-100 text-red-700 rounded-full">No Show</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">Pending</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{getGreeting()}, Dr. {doctorName}!</h1>
                        <p className="text-blue-100">
                            You have <span className="font-semibold">{stats.pendingToday} patients</span> waiting for consultation today.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-blue-200 text-sm">{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className={`${colorClasses[stat.color].bg} rounded-xl p-5 hover:shadow-md transition-shadow`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${colorClasses[stat.color].icon} p-3 rounded-lg`}>
                                <span className={colorClasses[stat.color].text}>{stat.icon}</span>
                            </div>
                            <ArrowUpRight className={`w-5 h-5 ${colorClasses[stat.color].text}`} />
                        </div>
                        <p className="text-3xl font-bold text-neutral-800 mb-1">{stat.value}</p>
                        <p className="text-sm text-neutral-600">{stat.title}</p>
                    </Link>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Queue */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-800">Today's Patient Queue</h2>
                            <p className="text-sm text-neutral-500">Manage your appointments</p>
                        </div>
                        <Link 
                            to="/doctor-dashboard-new/queue"
                            className="text-primary-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    
                    {todayAppointments.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-neutral-500">No appointments scheduled for today</p>
                            <Link 
                                to="/doctor-dashboard-new/schedule"
                                className="text-primary-500 hover:underline text-sm mt-2 inline-block"
                            >
                                Manage your schedule
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {todayAppointments.map((apt, index) => (
                                <div key={apt.id} className="p-4 hover:bg-neutral-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-primary-500 font-bold">
                                                {apt.patient_name?.charAt(0) || (index + 1)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-800">{apt.patient_name || `Patient #${apt.slot}`}</p>
                                                <p className="text-sm text-neutral-500">
                                                    Slot #{apt.slot} • {apt.reason || 'General Consultation'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(apt.status)}
                                            {apt.status === 'waiting' && (
                                                <Link 
                                                    to={`/doctor-dashboard-new/consultation/${apt.id}`}
                                                    className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                                                >
                                                    Start
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions & Pending Items */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link 
                                to="/doctor-dashboard-new/queue"
                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-5 h-5 text-primary-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-800">Call Next Patient</p>
                                    <p className="text-xs text-neutral-500">{stats.pendingToday} waiting</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            </Link>
                            
                            <Link 
                                to="/doctor-dashboard-new/prescriptions"
                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Pill className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-800">New Prescription</p>
                                    <p className="text-xs text-neutral-500">Write prescription</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            </Link>
                            
                            <Link 
                                to="/doctor-dashboard-new/investigations"
                                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TestTube className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-800">Order Investigation</p>
                                    <p className="text-xs text-neutral-500">Lab & imaging</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            </Link>
                            
                            <Link 
                                to="/doctor-dashboard-new/schedule"
                                className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                            >
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-800">Manage Schedule</p>
                                    <p className="text-xs text-neutral-500">Set availability</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            </Link>
                        </div>
                    </div>

                    {/* Pending Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Pending Items</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    <span className="text-neutral-700">Pending Reports</span>
                                </div>
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-sm font-medium">
                                    {stats.pendingReports}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Pill className="w-5 h-5 text-error-600" />
                                    <span className="text-neutral-700">Pending Prescriptions</span>
                                </div>
                                <span className="bg-error-100 text-red-700 px-2 py-0.5 rounded-full text-sm font-medium">
                                    {stats.pendingPrescriptions}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Summary */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
                        <h3 className="font-semibold mb-3">This Week</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold">{stats.totalPatientsThisWeek}</p>
                                <p className="text-indigo-200 text-sm">Patients Seen</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboardHome;
