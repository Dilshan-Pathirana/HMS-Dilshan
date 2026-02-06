import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Calendar, 
    Clock, 
    UserPlus, 
    Users, 
    Phone, 
    Ticket,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import receptionistService, { DashboardStats, Appointment } from '../../../services/receptionistService';

const ReceptionistDashboardMain: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await receptionistService.getDashboardStats();
            setStats(data);
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'Receptionist');
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ 
        title, 
        value, 
        icon, 
        color,
        subText
    }: { 
        title: string; 
        value: number; 
        icon: React.ReactNode; 
        color: string;
        subText?: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
                {subText && (
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                        {subText}
                    </span>
                )}
            </div>
            <h3 className="text-neutral-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-neutral-800">{value}</p>
        </div>
    );

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
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
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            Good day, {userName}!
                        </h1>
                        <p className="text-neutral-600 mt-1">
                            Manage appointments and patient registrations efficiently.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Calendar className="w-5 h-5" />
                        {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Appointments"
                    value={stats?.todayAppointments || 0}
                    icon={<Calendar className="w-6 h-6 text-white" />}
                    color="from-emerald-500 to-emerald-600"
                    subText="Today"
                />
                <StatCard
                    title="Pending Appointments"
                    value={stats?.pendingAppointments || 0}
                    icon={<Clock className="w-6 h-6 text-white" />}
                    color="from-orange-500 to-orange-600"
                />
                <StatCard
                    title="Registered Today"
                    value={stats?.registeredToday || 0}
                    icon={<UserPlus className="w-6 h-6 text-white" />}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Current Queue"
                    value={stats?.currentQueue || 0}
                    icon={<Ticket className="w-6 h-6 text-white" />}
                    color="from-purple-500 to-purple-600"
                />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Completed Today</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.completedToday || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-600">Walk-ins Today</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.walkInsToday || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Upcoming Appointments
                    </h2>
                    <div className="space-y-3">
                        {(stats?.upcomingAppointments || []).length > 0 ? (
                            (stats?.upcomingAppointments || []).map((apt: Appointment, index: number) => (
                                <div 
                                    key={apt.id || index}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                        index === 0 
                                            ? 'bg-emerald-50 border-emerald-200' 
                                            : 'bg-neutral-50 border-neutral-200'
                                    }`}
                                >
                                    <Clock className={`w-5 h-5 ${index === 0 ? 'text-emerald-600' : 'text-neutral-600'}`} />
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-800">
                                            {formatTime(apt.appointment_time)} - {apt.doctor_name || 'Doctor'}
                                        </p>
                                        <p className="text-xs text-neutral-500">Patient: {apt.patient_name || 'Unknown'}</p>
                                    </div>
                                    {apt.patient_phone && (
                                        <a href={`tel:${apt.patient_phone}`}>
                                            <Phone className={`w-5 h-5 ${index === 0 ? 'text-emerald-600' : 'text-neutral-600'} cursor-pointer hover:opacity-70`} />
                                        </a>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-neutral-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No upcoming appointments</p>
                            </div>
                        )}
                    </div>
                    <Link 
                        to="/receptionist-dashboard/appointments"
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium flex items-center justify-center"
                    >
                        View All Appointments
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link 
                            to="/receptionist-dashboard/register-patient"
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left"
                        >
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="font-medium text-neutral-800">Register New Patient</p>
                                <p className="text-xs text-neutral-500">Add new patient to system</p>
                            </div>
                        </Link>
                        <Link 
                            to="/receptionist-dashboard/appointments"
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left"
                        >
                            <Calendar className="w-5 h-5 text-primary-500" />
                            <div>
                                <p className="font-medium text-neutral-800">Schedule Appointment</p>
                                <p className="text-xs text-neutral-500">Book doctor appointment</p>
                            </div>
                        </Link>
                        <Link 
                            to="/receptionist-dashboard/queue"
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left"
                        >
                            <Ticket className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="font-medium text-neutral-800">Issue Queue Token</p>
                                <p className="text-xs text-neutral-500">Add patient to queue</p>
                            </div>
                        </Link>
                        <Link 
                            to="/receptionist-dashboard/visits"
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left"
                        >
                            <Users className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-neutral-800">Record Visit</p>
                                <p className="text-xs text-neutral-500">Log OPD or walk-in visit</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboardMain;
