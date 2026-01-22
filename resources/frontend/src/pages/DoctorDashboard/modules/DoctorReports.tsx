import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Filter,
    Loader2,
    PieChart,
    Activity
} from 'lucide-react';
import axios from 'axios';

interface ReportStats {
    total_patients: number;
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    no_show_appointments: number;
    avg_consultation_time: number;
    total_prescriptions: number;
    total_investigations: number;
}

interface DailyStats {
    date: string;
    appointments: number;
    completed: number;
    cancelled: number;
}

const DoctorReports: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

    useEffect(() => {
        fetchReports();
    }, [userId, period]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            // Mock data
            setStats({
                total_patients: 245,
                total_appointments: 180,
                completed_appointments: 156,
                cancelled_appointments: 12,
                no_show_appointments: 12,
                avg_consultation_time: 15,
                total_prescriptions: 142,
                total_investigations: 67
            });

            setDailyStats([
                { date: 'Mon', appointments: 12, completed: 10, cancelled: 2 },
                { date: 'Tue', appointments: 15, completed: 14, cancelled: 1 },
                { date: 'Wed', appointments: 8, completed: 8, cancelled: 0 },
                { date: 'Thu', appointments: 18, completed: 16, cancelled: 2 },
                { date: 'Fri', appointments: 14, completed: 12, cancelled: 2 },
                { date: 'Sat', appointments: 10, completed: 9, cancelled: 1 },
                { date: 'Sun', appointments: 0, completed: 0, cancelled: 0 }
            ]);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const completionRate = stats ? Math.round((stats.completed_appointments / stats.total_appointments) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-500">View your practice performance and statistics</p>
                </div>
                <div className="flex gap-3">
                    {/* Period Selector */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {[
                            { key: 'week', label: 'Week' },
                            { key: 'month', label: 'Month' },
                            { key: 'year', label: 'Year' }
                        ].map((p) => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    period === p.key
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Patients</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.total_patients}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">+12%</span>
                            <span className="text-gray-400">vs last {period}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Appointments</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.total_appointments}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">+8%</span>
                            <span className="text-gray-400">vs last {period}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completion Rate</p>
                                <p className="text-3xl font-bold text-gray-800">{completionRate}%</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">+3%</span>
                            <span className="text-gray-400">improvement</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg. Consultation</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.avg_consultation_time}m</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <TrendingDown className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">-2 min</span>
                            <span className="text-gray-400">efficiency</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointments Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Weekly Appointments
                    </h3>
                    
                    <div className="space-y-4">
                        {dailyStats.map((day) => (
                            <div key={day.date} className="flex items-center gap-4">
                                <span className="w-10 text-sm text-gray-500">{day.date}</span>
                                <div className="flex-1 flex gap-1 h-8">
                                    <div
                                        className="bg-blue-500 rounded-l"
                                        style={{ width: `${(day.completed / 20) * 100}%` }}
                                        title={`Completed: ${day.completed}`}
                                    />
                                    <div
                                        className="bg-red-400 rounded-r"
                                        style={{ width: `${(day.cancelled / 20) * 100}%` }}
                                        title={`Cancelled: ${day.cancelled}`}
                                    />
                                </div>
                                <span className="w-8 text-sm text-gray-600 text-right">{day.appointments}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded" />
                            <span className="text-sm text-gray-500">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded" />
                            <span className="text-sm text-gray-500">Cancelled</span>
                        </div>
                    </div>
                </div>

                {/* Appointment Status Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-blue-500" />
                        Appointment Breakdown
                    </h3>

                    {stats && (
                        <div className="space-y-4">
                            {[
                                { 
                                    label: 'Completed', 
                                    value: stats.completed_appointments, 
                                    color: 'bg-green-500',
                                    percent: Math.round((stats.completed_appointments / stats.total_appointments) * 100)
                                },
                                { 
                                    label: 'Cancelled', 
                                    value: stats.cancelled_appointments, 
                                    color: 'bg-red-500',
                                    percent: Math.round((stats.cancelled_appointments / stats.total_appointments) * 100)
                                },
                                { 
                                    label: 'No Show', 
                                    value: stats.no_show_appointments, 
                                    color: 'bg-yellow-500',
                                    percent: Math.round((stats.no_show_appointments / stats.total_appointments) * 100)
                                }
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">{item.label}</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {item.value} ({item.percent}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div 
                                            className={`${item.color} h-2 rounded-full transition-all`}
                                            style={{ width: `${item.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Prescriptions Issued</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_prescriptions}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Investigations Ordered</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_investigations}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Returning Patients</p>
                            <p className="text-2xl font-bold text-gray-800">68%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-blue-100 text-sm">Busiest Day</p>
                        <p className="text-xl font-bold">Thursday</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">Peak Hour</p>
                        <p className="text-xl font-bold">10:00 AM</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">Patient Satisfaction</p>
                        <p className="text-xl font-bold">4.8/5</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">This Month Revenue</p>
                        <p className="text-xl font-bold">LKR 450K</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorReports;
