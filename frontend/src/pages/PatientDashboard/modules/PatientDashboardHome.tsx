import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../../store';
import {
    Calendar,
    Clock,
    FileText,
    Pill,
    Heart,
    MessageSquare,
    Bell,
    ChevronRight,
    Activity,
    Users,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    XCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface DashboardStats {
    upcomingAppointments: number;
    pendingReports: number;
    activeMedications: number;
    unreadNotifications: number;
}

interface Appointment {
    id: string;
    doctor_name: string;
    specialization: string;
    date: string;
    time: string;
    status: string;
    branch_name: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
}

const PatientDashboardHome: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [stats, setStats] = useState<DashboardStats>({
        upcomingAppointments: 0,
        pendingReports: 0,
        activeMedications: 0,
        unreadNotifications: 0
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch appointments
                const appointmentsRes = await api.get(`/get-patient-appointments/${userId}`);
                if (appointmentsRes.data.status === 200) {
                    const appointments = appointmentsRes.data.appointments || [];
                    const upcoming = appointments.filter((apt: any) =>
                        new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
                    ).slice(0, 3);
                    setUpcomingAppointments(upcoming.map((apt: any) => ({
                        id: apt.id,
                        doctor_name: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
                        specialization: apt.areas_of_specialization,
                        date: apt.date,
                        time: apt.start_time,
                        status: apt.status,
                        branch_name: apt.branch_name || 'Main Branch'
                    })));
                    setStats(prev => ({
                        ...prev,
                        upcomingAppointments: upcoming.length
                    }));
                }

                // Fetch notifications
                try {
                    const notificationsRes = await api.get(`/patient/notifications/${userId}`);
                    const notifications = notificationsRes.data?.notifications || [];
                    setRecentNotifications(notifications.slice(0, 5));
                    setStats(prev => ({
                        ...prev,
                        unreadNotifications: notifications.filter((n: any) => !n.is_read).length
                    }));
                } catch (e) {
                    // Notifications API might not exist yet
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchDashboardData();
        }
    }, [userId]);

    const quickActions = [
        { label: 'Book Appointment', path: 'appointments/book', icon: <Calendar className="w-6 h-6" />, color: 'bg-primary-500' },
        { label: 'View Queue Status', path: 'queue', icon: <Clock className="w-6 h-6" />, color: 'bg-purple-500' },
        { label: 'Medical Records', path: 'records', icon: <FileText className="w-6 h-6" />, color: 'bg-emerald-500' },
        { label: 'My Medications', path: 'medications', icon: <Pill className="w-6 h-6" />, color: 'bg-orange-500' },
    ];

    const statCards = [
        { label: 'Upcoming Appointments', value: stats.upcomingAppointments, icon: <Calendar className="w-8 h-8" />, color: 'text-primary-500', bgColor: 'bg-blue-50' },
        { label: 'Pending Reports', value: stats.pendingReports, icon: <FileText className="w-8 h-8" />, color: 'text-amber-600', bgColor: 'bg-amber-50' },
        { label: 'Active Medications', value: stats.activeMedications, icon: <Pill className="w-8 h-8" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { label: 'Unread Notifications', value: stats.unreadNotifications, icon: <Bell className="w-8 h-8" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    ];

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-error-100 text-red-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Your Health Dashboard</h1>
                        <p className="text-emerald-100">
                            Stay on top of your health journey. Manage appointments, view records, and more.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <Activity className="w-24 h-24 text-emerald-200 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-xl ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.path}
                            className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                        >
                            <div className={`${action.color} text-white p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                                {action.icon}
                            </div>
                            <span className="text-sm font-medium text-neutral-700 text-center">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800">Upcoming Appointments</h2>
                        <Link to="appointments" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-neutral-500">No upcoming appointments</p>
                            <Link to="appointments/book" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">
                                Book an appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
                                        {apt.doctor_name.charAt(4) || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-neutral-800 truncate">{apt.doctor_name}</p>
                                        <p className="text-sm text-neutral-500">{apt.specialization}</p>
                                        <p className="text-xs text-neutral-400">{apt.branch_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-neutral-700">
                                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-neutral-500">{apt.time}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(apt.status)}`}>
                                            {getStatusIcon(apt.status)}
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800">Recent Notifications</h2>
                        <Link to="notifications" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentNotifications.length === 0 ? (
                        <div className="text-center py-8">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-neutral-500">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg border-l-4 ${
                                        notification.is_read
                                            ? 'bg-neutral-50 border-neutral-300'
                                            : 'bg-blue-50 border-primary-500'
                                    }`}
                                >
                                    <p className="font-medium text-neutral-800 text-sm">{notification.title}</p>
                                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{notification.message}</p>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Health Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                        <Heart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-neutral-800 mb-1">Daily Health Tip</h3>
                        <p className="text-neutral-600 text-sm">
                            Remember to stay hydrated! Drinking at least 8 glasses of water a day helps maintain
                            your body's fluid balance, supports digestion, and keeps your skin healthy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboardHome;
