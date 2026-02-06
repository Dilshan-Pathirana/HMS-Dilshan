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
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';


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

    // Inline StatCard removed (using imported component)

    return (
        <DashboardLayout
            userName={userName}
            userRole="Patient"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={PatientMenuItems} />}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title={`Welcome back, ${userName}!`}
                    description="Manage your health records and appointments."
                    actions={stats.upcomingAppointments > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 shadow-sm">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                                {stats.upcomingAppointments} Upcoming Appointment{stats.upcomingAppointments > 1 ? 's' : ''}
                            </span>
                        </div>
                    ) : undefined}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Upcoming Appointments"
                        value={stats.upcomingAppointments}
                        icon={Calendar}
                    />
                    <StatCard
                        title="Total Appointments"
                        value={stats.totalAppointments}
                        icon={Activity}
                    />
                    <StatCard
                        title="Active Prescriptions"
                        value={stats.activePrescriptions}
                        icon={FileText}
                    />
                    <StatCard
                        title="Outstanding Balance"
                        value={`$${stats.outstandingBalance}`}
                        icon={DollarSign}
                    />
                </div>

                {/* Upcoming Appointments & Health Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Upcoming Appointments
                        </h2>
                        {stats.upcomingAppointments > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-xl border border-primary-100 hover:border-primary-200 transition-colors group">
                                    <div className="p-2 bg-white rounded-lg border border-primary-100 shadow-sm group-hover:border-primary-200">
                                        <Clock className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-neutral-900">Dr. Sarah Johnson</p>
                                                <p className="text-sm text-neutral-600">General Checkup</p>
                                            </div>
                                            <button className="px-3 py-1.5 bg-white text-primary-700 text-xs font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors shadow-sm">
                                                View
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 text-xs font-medium text-neutral-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dec 20, 2025</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 10:30 AM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors group">
                                    <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm">
                                        <Clock className="w-5 h-5 text-neutral-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-neutral-900">Dr. Michael Chen</p>
                                                <p className="text-sm text-neutral-600">Follow-up Visit</p>
                                            </div>
                                            <button className="px-3 py-1.5 bg-white text-neutral-700 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
                                                View
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 text-xs font-medium text-neutral-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dec 25, 2025</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2:00 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-neutral-900 font-medium mb-1">No appointments scheduled</h3>
                                <p className="text-sm text-neutral-500 mb-6">Book a new appointment to get started</p>
                                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium text-sm shadow-sm hover:shadow">
                                    Book Appointment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions & Health Tips */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-600" />
                                Quick Actions
                            </h2>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group text-left">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">Book Appointment</p>
                                        <p className="text-xs text-neutral-500">Schedule a new visit</p>
                                    </div>
                                </button>

                                <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-primary-200 hover:shadow-md transition-all group text-left">
                                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">View Records</p>
                                        <p className="text-xs text-neutral-500">Access medical history</p>
                                    </div>
                                </button>

                                <button className="w-full flex items-center gap-4 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group text-left">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-900">Pay Bill</p>
                                        <p className="text-xs text-neutral-500">View and pay invoices</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Health Tips */}
                        <div className="bg-gradient-to-br from-emerald-500 to-primary-600 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-emerald-100" />
                                    Health Tip of the Day
                                </h3>
                                <p className="text-sm text-emerald-50/90 leading-relaxed font-medium">
                                    Stay hydrated! Drink at least 8 glasses of water daily to maintain optimal health and energy levels.
                                </p>
                            </div>
                            {/* Decorative background circles */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
