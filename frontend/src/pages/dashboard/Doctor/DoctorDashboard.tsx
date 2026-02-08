import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, DoctorMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    Calendar,
    Users,
    FileText,
    Clock,
    Activity,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    Stethoscope,
    MessageSquare,
    Search,
    Plus,
    X,
    Filter
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { PageHeader } from '../../../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';

interface DoctorStats {
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
    pendingPrescriptions: number;
}

interface Appointment {
    id: number;
    patientName: string;
    time: string;
    type: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    duration: number; // in minutes
}

export const DoctorDashboard: React.FC = () => {
    const navigate = useNavigate();
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

    // Mock appointments for timeline - replace with API later
    const [appointments, setAppointments] = useState<Appointment[]>([
        { id: 1, patientName: "Sarah Johnson", time: "09:00", type: "General Checkup", status: "completed", duration: 30 },
        { id: 2, patientName: "Michael Chen", time: "09:45", type: "Follow-up", status: "confirmed", duration: 15 },
        { id: 3, patientName: "Emma Wilson", time: "10:30", type: "Consultation", status: "pending", duration: 45 },
        { id: 4, patientName: "James Rodriguez", time: "13:00", type: "Lab Review", status: "confirmed", duration: 20 },
        { id: 5, patientName: "Emily Davis", time: "14:15", type: "New Patient Info", status: "confirmed", duration: 60 },
    ]);

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
            // Fallback for demo if API fails
            setUserName('Dr. Sarah Wilson');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    return (
        <DashboardLayout
            userName={userName}
            userRole="Doctor"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={DoctorMenuItems} />}
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Page Header Component */}
                <PageHeader
                    title={`Good Morning, ${userName}`}
                    description="Here's your schedule and patient overview for today."
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm">
                                <Calendar className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium text-neutral-700">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <button className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 text-neutral-600 transition-colors shadow-sm">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    }
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp className="w-3 h-3" /> +12%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.todayAppointments}</h3>
                            <p className="text-sm text-neutral-500 font-medium">Appointments Today</p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-10 -mb-10 group-hover:from-emerald-500/20 transition-all"></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6" />
                                </div>
                                {stats.pendingAppointments > 0 && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg animate-pulse">
                                        Action Required
                                    </span>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.pendingAppointments}</h3>
                            <p className="text-sm text-neutral-500 font-medium">Pending Approvals</p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl -mr-10 -mb-10 group-hover:from-amber-500/20 transition-all"></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.totalPatients}</h3>
                            <p className="text-sm text-neutral-500 font-medium">Total Patients</p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl -mr-10 -mb-10 group-hover:from-blue-500/20 transition-all"></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-lg">
                                    To Review
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.pendingPrescriptions}</h3>
                            <p className="text-sm text-neutral-500 font-medium">Lab Reports</p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl -mr-10 -mb-10 group-hover:from-indigo-500/20 transition-all"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Schedule Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-600" />
                                        Today's Timeline
                                    </h2>
                                    <p className="text-sm text-neutral-500">You have {appointments.length} sessions scheduled today</p>
                                </div>
                                <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                    View Calendar
                                </button>
                            </div>

                            <div className="p-6 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[85px] top-6 bottom-6 w-0.5 bg-neutral-100"></div>

                                <div className="space-y-8 relative">
                                    {appointments.map((apt, index) => {
                                        // Highlight current/next appointment
                                        const now = new Date();
                                        const [hours, minutes] = apt.time.split(':');
                                        const aptTime = new Date();
                                        aptTime.setHours(parseInt(hours), parseInt(minutes), 0);
                                        const isNext = aptTime > now && (index === 0 || new Date().setHours(parseInt(appointments[index - 1].time.split(':')[0])) < now.getTime());
                                        const isPast = aptTime < now;

                                        return (
                                            <div key={apt.id} className={`group flex gap-6 relative ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                {/* Time Column */}
                                                <div className="w-[60px] text-right pt-2 shrink-0">
                                                    <span className={`text-sm font-bold block ${isNext ? 'text-emerald-600' : 'text-neutral-900'}`}>{apt.time}</span>
                                                    <span className="text-xs text-neutral-400 font-medium">{apt.duration}m</span>
                                                </div>

                                                {/* Timeline Node */}
                                                <div className="absolute left-[76px] top-3 z-10">
                                                    <div className={`w-5 h-5 rounded-full border-[3px] box-content ${isNext ? 'bg-emerald-500 border-white shadow-lg shadow-emerald-200' :
                                                            isPast ? 'bg-neutral-300 border-white' : 'bg-white border-emerald-500'
                                                        }`}></div>
                                                </div>

                                                {/* Card Content */}
                                                <div className={`flex-1 rounded-xl p-5 border transition-all duration-300 ${isNext
                                                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-md transform scale-[1.01]'
                                                        : 'bg-white border-neutral-200 hover:border-emerald-200 hover:shadow-sm'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-neutral-900 text-base mb-0.5">{apt.patientName}</h3>
                                                            <p className="text-sm text-neutral-500 flex items-center gap-2">
                                                                <Stethoscope className="w-3.5 h-3.5" />
                                                                {apt.type}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(apt.status)} capitalize`}>
                                                            {apt.status}
                                                        </span>
                                                    </div>

                                                    {isNext && (
                                                        <div className="mt-4 pt-3 border-t border-emerald-100 flex gap-3">
                                                            <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                                                                Start Session
                                                            </button>
                                                            <button className="px-4 py-2 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors">
                                                                Details
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Quick Actions & Queue */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-neutral-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                            <div className="relative z-10">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                    Quick Actions
                                </h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/doctor/prescriptions/new')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all group backdrop-blur-sm"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Write Prescription</p>
                                            <p className="text-xs text-neutral-400">Digital RX</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-neutral-500 ml-auto group-hover:text-white transition-colors" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/doctor/patients')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all group backdrop-blur-sm"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Patient Lookup</p>
                                            <p className="text-xs text-neutral-400">Search records</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-neutral-500 ml-auto group-hover:text-white transition-colors" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/doctor/appointments')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all group backdrop-blur-sm"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Manage Schedule</p>
                                            <p className="text-xs text-neutral-400">Slots & leaves</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-neutral-500 ml-auto group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                            </div>
                            {/* Decorative Background Effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -ml-20 -mb-20"></div>
                        </div>

                        {/* Messages / Notifications Preview */}
                        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                                    Recent Messages
                                </h3>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">3 New</span>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                <div className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs text-neutral-900">Dr. Emily Chen</span>
                                        <span className="text-[10px] text-neutral-400">10:30 AM</span>
                                    </div>
                                    <p className="text-xs text-neutral-600 line-clamp-2">Can you review the lab results for patient #4521? I think there might be...</p>
                                </div>
                                <div className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer bg-indigo-50/30">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs text-neutral-900">Admin Support</span>
                                        <span className="text-[10px] text-neutral-400">09:15 AM</span>
                                    </div>
                                    <p className="text-xs text-neutral-600 line-clamp-2">System maintenance scheduled for tonight at 11 PM.</p>
                                </div>
                            </div>
                            <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
                                <button className="text-xs font-bold text-neutral-500 hover:text-indigo-600 transition-colors uppercase tracking-wide">
                                    View All Messages
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
