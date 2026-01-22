import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, DollarSign, FileText, BookOpen, Users,
    TrendingUp, AlertCircle, ArrowRight, Bell, Activity
} from 'lucide-react';
import axios from 'axios';

interface HRStats {
    upcomingShifts: number;
    pendingAcknowledgments: number;
    thisMonthOT: number;
    lastPayslip: string;
    pendingRequests: number;
}

const NurseHRDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<HRStats>({
        upcomingShifts: 0,
        pendingAcknowledgments: 0,
        thisMonthOT: 0,
        lastPayslip: '-',
        pendingRequests: 0
    });

    useEffect(() => {
        fetchHRStats();
    }, []);

    const fetchHRStats = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/hrm/cashier/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching HR stats:', error);
        }
    };

    const hrModules = [
        {
            id: 'schedules',
            title: 'My Shifts',
            description: 'View your assigned shifts, acknowledge schedules, and request changes',
            icon: <Calendar className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/schedules',
            color: 'from-teal-500 to-teal-600',
            stats: { 
                label: 'Upcoming Shifts', 
                value: stats.upcomingShifts,
                alert: stats.pendingAcknowledgments > 0 ? `${stats.pendingAcknowledgments} pending` : null
            }
        },
        {
            id: 'schedule-requests',
            title: 'Leave & Shift Requests',
            description: 'Apply for leave, request shift changes, or swap shifts with colleagues',
            icon: <Users className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/schedule-requests',
            color: 'from-purple-500 to-purple-600',
            stats: { 
                label: 'Pending Requests', 
                value: stats.pendingRequests 
            }
        },
        {
            id: 'overtime',
            title: 'Overtime & Earnings',
            description: 'View overtime hours, night duty allowance, and salary breakdown',
            icon: <Clock className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/overtime-salary',
            color: 'from-emerald-500 to-emerald-600',
            stats: { 
                label: 'This Month OT', 
                value: `${stats.thisMonthOT.toFixed(1)} hrs` 
            }
        },
        {
            id: 'payslips',
            title: 'My Payslips',
            description: 'Download salary slips, view EPF/ETF breakdown and payment history',
            icon: <DollarSign className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/payslips',
            color: 'from-amber-500 to-amber-600',
            stats: { 
                label: 'Latest', 
                value: stats.lastPayslip 
            }
        },
        {
            id: 'service-letters',
            title: 'Service Letters',
            description: 'Request employment certificates and service letters',
            icon: <FileText className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/service-letters',
            color: 'from-pink-500 to-pink-600',
            stats: { 
                label: 'Status', 
                value: 'Available' 
            }
        },
        {
            id: 'policies',
            title: 'HR Policies',
            description: 'View hospital policies, nursing guidelines, and employee handbook',
            icon: <BookOpen className="w-8 h-8" />,
            path: '/nurse-dashboard/hr/policies',
            color: 'from-indigo-500 to-indigo-600',
            stats: { 
                label: 'Documents', 
                value: 'View All' 
            }
        }
    ];

    const QuickStatCard = ({ title, value, icon, color, trend }: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
        trend?: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    <div className="text-white">
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{title}</p>
            </div>
        </div>
    );

    const ModuleCard = ({ module }: { module: typeof hrModules[0] }) => (
        <div
            onClick={() => navigate(module.path)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                    <div className="text-white">
                        {module.icon}
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                {module.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                {module.description}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">{module.stats.label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{module.stats.value}</span>
                    {module.stats.alert && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <Bell className="w-3 h-3" />
                            {module.stats.alert}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                                <Activity className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                                    Nurse HR Portal
                                </h1>
                                <p className="text-gray-600">
                                    Manage your shifts, overtime, payslips, and HR requests
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {stats.pendingAcknowledgments > 0 && (
                                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {stats.pendingAcknowledgments} shift{stats.pendingAcknowledgments > 1 ? 's' : ''} need acknowledgment
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <QuickStatCard
                        title="Upcoming Shifts"
                        value={stats.upcomingShifts}
                        icon={<Calendar className="w-5 h-5" />}
                        color="from-teal-500 to-teal-600"
                    />
                    <QuickStatCard
                        title="This Month OT"
                        value={`${stats.thisMonthOT.toFixed(1)} hrs`}
                        icon={<Clock className="w-5 h-5" />}
                        color="from-emerald-500 to-emerald-600"
                        trend="+2.5 hrs"
                    />
                    <QuickStatCard
                        title="Pending Requests"
                        value={stats.pendingRequests}
                        icon={<FileText className="w-5 h-5" />}
                        color="from-purple-500 to-purple-600"
                    />
                    <QuickStatCard
                        title="Latest Payslip"
                        value={stats.lastPayslip}
                        icon={<DollarSign className="w-5 h-5" />}
                        color="from-amber-500 to-amber-600"
                    />
                </div>

                {/* HR Modules Grid */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">HR Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hrModules.map((module) => (
                            <ModuleCard key={module.id} module={module} />
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Need Assistance?</h3>
                            <p className="text-teal-100 text-sm">
                                Contact HR department for any queries regarding shifts, leaves, or salary
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/nurse-dashboard/feedback')}
                            className="bg-white text-teal-600 px-6 py-2 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                        >
                            Contact HR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NurseHRDashboard;
