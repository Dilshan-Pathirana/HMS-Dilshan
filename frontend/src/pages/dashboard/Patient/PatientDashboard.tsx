import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, PatientMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { 
    Calendar, 
    FileText, 
    Activity, 
    DollarSign,
    Clock,
    AlertCircle
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface PatientStats {
    upcomingAppointments: number;
    totalAppointments: number;
    activePrescriptions: number;
    outstandingBalance: number;
}

export const PatientDashboard: React.FC = () => {
    const [stats, setStats] = useState<PatientStats>({
        upcomingAppointments: 0,
        totalAppointments: 0,
        activePrescriptions: 0,
        outstandingBalance: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Patient');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/patient/dashboard-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
            }
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setProfileImage(userInfo.profile_picture || '');
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
        color 
    }: { 
        title: string; 
        value: number | string; 
        icon: React.ReactNode; 
        color: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{typeof value === 'number' ? value : value}</p>
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Patient"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={PatientMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Welcome back, {userName}!
                            </h1>
                            <p className="text-gray-600 mt-1">Manage your health records and appointments.</p>
                        </div>
                        {stats.upcomingAppointments > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-700">
                                    {stats.upcomingAppointments} Upcoming Appointment{stats.upcomingAppointments > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Upcoming Appointments"
                        value={stats.upcomingAppointments}
                        icon={<Calendar className="w-6 h-6 text-white" />}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Total Appointments"
                        value={stats.totalAppointments}
                        icon={<Activity className="w-6 h-6 text-white" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Active Prescriptions"
                        value={stats.activePrescriptions}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        color="from-purple-500 to-purple-600"
                    />
                    <StatCard
                        title="Outstanding Balance"
                        value={`$${stats.outstandingBalance}`}
                        icon={<DollarSign className="w-6 h-6 text-white" />}
                        color="from-orange-500 to-orange-600"
                    />
                </div>

                {/* Upcoming Appointments & Health Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            Upcoming Appointments
                        </h2>
                        {stats.upcomingAppointments > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                                    <Clock className="w-5 h-5 text-emerald-600 mt-1" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">Dr. Sarah Johnson</p>
                                        <p className="text-sm text-gray-600">General Checkup</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>📅 Dec 20, 2025</span>
                                            <span>🕐 10:30 AM</span>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700">
                                        View
                                    </button>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <Clock className="w-5 h-5 text-gray-600 mt-1" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">Dr. Michael Chen</p>
                                        <p className="text-sm text-gray-600">Follow-up Visit</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>📅 Dec 25, 2025</span>
                                            <span>🕐 2:00 PM</span>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700">
                                        View
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No upcoming appointments</p>
                                <button className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium text-sm">
                                    Book Appointment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions & Health Tips */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Book Appointment</p>
                                        <p className="text-xs text-gray-500">Schedule a new visit</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">View Records</p>
                                        <p className="text-xs text-gray-500">Access medical history</p>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Pay Bill</p>
                                        <p className="text-xs text-gray-500">View and pay invoices</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Health Tips */}
                        <div className="bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl shadow-sm p-6 text-white">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Health Tip of the Day
                            </h3>
                            <p className="text-sm opacity-90">
                                Stay hydrated! Drink at least 8 glasses of water daily to maintain optimal health and energy levels.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
