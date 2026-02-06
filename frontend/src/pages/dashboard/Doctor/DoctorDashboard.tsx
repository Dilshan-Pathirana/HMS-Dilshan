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
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';

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
            const response = await api.get('/doctor/dashboard-stats');
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

    // StatCard removed (using imported component)

    return (
        <DashboardLayout
            userName={userName}
            userRole="Doctor"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={DoctorMenuItems} />}
        >
            {/* Page Header Component */}
            <PageHeader
                title={`Good day, ${userName}!`}
                description={`You have ${stats.todayAppointments} appointments scheduled today.`}
                actions={
                    <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                }
            />

            {/* Stats Grid using standardized StatCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Appointments"
                    value={stats.todayAppointments}
                    icon={Calendar}
                    trend={{ value: 12, label: "vs yesterday", isPositive: true }}
                />
                <StatCard
                    title="Pending Appointments"
                    value={stats.pendingAppointments}
                    icon={Clock}
                    description="Requires confirmation"
                />
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={Users}
                    trend={{ value: 4, label: "new this week", isPositive: true }}
                />
                <StatCard
                    title="Pending Prescriptions"
                    value={stats.pendingPrescriptions}
                    icon={FileText}
                    description="Needs review"
                />
            </div>

            {/* Today's Schedule & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Today's Schedule
                        </h2>
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-colors group">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-lg border border-neutral-200 shadow-sm group-hover:border-primary-200">
                                <span className="text-xs font-semibold text-neutral-500">FEB</span>
                                <span className="text-lg font-bold text-neutral-900">12</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">John Doe</h3>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">09:00 AM</span>
                                </div>
                                <p className="text-sm text-neutral-500 mt-0.5">General Checkup • 30 mins</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-colors group">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-lg border border-neutral-200 shadow-sm group-hover:border-primary-200">
                                <span className="text-xs font-semibold text-neutral-500">FEB</span>
                                <span className="text-lg font-bold text-neutral-900">12</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">Jane Smith</h3>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">10:30 AM</span>
                                </div>
                                <p className="text-sm text-neutral-500 mt-0.5">Follow-up • 45 mins</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-colors group">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-lg border border-neutral-200 shadow-sm group-hover:border-primary-200">
                                <span className="text-xs font-semibold text-neutral-500">FEB</span>
                                <span className="text-lg font-bold text-neutral-900">12</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">Robert Johnson</h3>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">02:00 PM</span>
                                </div>
                                <p className="text-sm text-neutral-500 mt-0.5">New Patient • 60 mins</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">Write Prescription</p>
                                <p className="text-xs text-neutral-500">Create new digital prescription</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 ml-auto group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-primary-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">View Patients</p>
                                <p className="text-xs text-neutral-500">Access full patient records</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 ml-auto group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-purple-200 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">Manage Schedule</p>
                                <p className="text-xs text-neutral-500">Update availability slots</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
