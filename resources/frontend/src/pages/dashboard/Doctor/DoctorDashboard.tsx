import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, DoctorMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { 
    Calendar, 
    Users, 
    FileText, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface DoctorStats {
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
    pendingPrescriptions: number;
}

export const DoctorDashboard: React.FC = () => {
    const [stats, setStats] = useState<DoctorStats>({
        todayAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        pendingPrescriptions: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Doctor');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/doctor/dashboard-stats');
            if (response.data.status === 200) {
                setStats(response.data.data);
            }
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`Dr. ${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
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
        value: number; 
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
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Doctor"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={DoctorMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Good day, {userName}!
                            </h1>
                            <p className="text-gray-600 mt-1">You have {stats.todayAppointments} appointments scheduled today.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        value={stats.todayAppointments}
                        icon={<Calendar className="w-6 h-6 text-white" />}
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Pending Appointments"
                        value={stats.pendingAppointments}
                        icon={<Clock className="w-6 h-6 text-white" />}
                        color="from-orange-500 to-orange-600"
                    />
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        icon={<Users className="w-6 h-6 text-white" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Pending Prescriptions"
                        value={stats.pendingPrescriptions}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        color="from-purple-500 to-purple-600"
                    />
                </div>

                {/* Today's Schedule & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            Today's Schedule
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">09:00 AM - John Doe</p>
                                    <p className="text-xs text-gray-500">General Checkup</p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">10:30 AM - Jane Smith</p>
                                    <p className="text-xs text-gray-500">Follow-up Consultation</p>
                                </div>
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <Clock className="w-5 h-5 text-gray-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">02:00 PM - Robert Johnson</p>
                                    <p className="text-xs text-gray-500">New Patient</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium">
                            View Full Schedule
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Write Prescription</p>
                                    <p className="text-xs text-gray-500">Create new prescription</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="font-medium text-gray-800">View Patients</p>
                                    <p className="text-xs text-gray-500">Access patient records</p>
                                </div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg hover:from-emerald-100 hover:to-blue-100 transition-all text-left">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium text-gray-800">Manage Availability</p>
                                    <p className="text-xs text-gray-500">Update your schedule</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
