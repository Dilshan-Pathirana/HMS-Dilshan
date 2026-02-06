import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Users, AlertTriangle, ClipboardList,
    Bell, Clock, Heart, User, FileText,
    RefreshCw, Loader2
} from 'lucide-react';
import { nurseService, DashboardStats, NurseShift } from '../../../services/nurseService';

export const NurseDashboardMain: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userName, setUserName] = useState('Nurse');

    // Get current shift display
    const getCurrentShiftDisplay = (shift: NurseShift | null) => {
        if (!shift) return 'No shift scheduled';
        const startTime = new Date(shift.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(shift.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${startTime} - ${endTime}`;
    };

    // Get shift status badge
    const getShiftStatusBadge = (shift: NurseShift | null) => {
        if (!shift) return null;
        const statusColors: Record<string, string> = {
            scheduled: 'bg-yellow-100 text-yellow-800',
            started: 'bg-green-100 text-green-800',
            completed: 'bg-neutral-100 text-neutral-800',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[shift.status] || 'bg-neutral-100'}`}>
                {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
            </span>
        );
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await nurseService.getDashboardStats();
            setStats(data);
            
            // Get user name from localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setUserName(user.name || 'Nurse');
            }
        } catch (err: any) {
            console.error('Error fetching dashboard stats:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getConditionStyles = (isAbnormal: boolean) => {
        return isAbnormal 
            ? 'bg-error-100 text-red-800 border-red-300'
            : 'bg-green-100 text-green-800 border-green-300';
    };

    const formatRecordedTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} mins ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
                    <p className="mt-4 text-neutral-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-error-500 mx-auto" />
                    <p className="mt-4 text-neutral-600">{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen sm:ml-64 mt-16">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <Activity className="w-7 h-7 text-teal-600" />
                            Nurse Dashboard
                        </h1>
                        <p className="text-neutral-600">
                            Welcome, {userName}! You have {stats?.assignedPatients || 0} assigned patients today.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={fetchDashboardData}
                            className="p-2 rounded-lg bg-white shadow hover:bg-neutral-50"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-neutral-600" />
                        </button>
                        <button className="relative p-2 rounded-lg bg-white shadow hover:bg-neutral-50">
                            <Bell className="w-5 h-5 text-neutral-600" />
                            {(stats?.pendingHandovers || 0) > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
                            )}
                        </button>
                        <div className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg">
                            <div className="text-xs flex items-center gap-1">
                                Current Shift {getShiftStatusBadge(stats?.currentShift || null)}
                            </div>
                            <div className="font-semibold">{getCurrentShiftDisplay(stats?.currentShift || null)}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Assigned Patients</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats?.assignedPatients || 0}</p>
                                <p className="text-xs text-neutral-500 mt-1">Under your care today</p>
                            </div>
                            <Users className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Vitals Recorded</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats?.vitalSignsRecorded || 0}</p>
                                <p className="text-xs text-neutral-500 mt-1">Today</p>
                            </div>
                            <Heart className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Critical Alerts</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats?.criticalAlerts || 0}</p>
                                <p className="text-xs text-neutral-500 mt-1">Abnormal readings</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Pending Handovers</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats?.pendingHandovers || 0}</p>
                                <p className="text-xs text-neutral-500 mt-1">To acknowledge</p>
                            </div>
                            <ClipboardList className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary-500" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/vital-signs')}
                                    className="p-4 border border-neutral-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                                >
                                    <Heart className="w-6 h-6 text-primary-500 mb-2 mx-auto" />
                                    <p className="text-sm text-neutral-700 group-hover:text-blue-700 font-medium">Vital Signs</p>
                                </button>
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/patients')}
                                    className="p-4 border border-neutral-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all group"
                                >
                                    <Users className="w-6 h-6 text-purple-600 mb-2 mx-auto" />
                                    <p className="text-sm text-neutral-700 group-hover:text-purple-700 font-medium">Patients</p>
                                </button>
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/handover')}
                                    className="p-4 border border-neutral-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group"
                                >
                                    <FileText className="w-6 h-6 text-green-600 mb-2 mx-auto" />
                                    <p className="text-sm text-neutral-700 group-hover:text-green-700 font-medium">Handover</p>
                                </button>
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/tasks')}
                                    className="p-4 border border-neutral-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all group"
                                >
                                    <ClipboardList className="w-6 h-6 text-orange-600 mb-2 mx-auto" />
                                    <p className="text-sm text-neutral-700 group-hover:text-orange-700 font-medium">Tasks</p>
                                </button>
                            </div>
                        </div>

                        {/* Upcoming Shifts */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-500" />
                                Upcoming Shifts
                            </h3>
                            {stats?.upcomingShifts && stats.upcomingShifts.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.upcomingShifts.slice(0, 3).map((shift) => (
                                        <div key={shift.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-primary-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-neutral-900">
                                                        {new Date(shift.shift_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-neutral-600">
                                                        {shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1)} Shift
                                                    </p>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        Ward: {shift.ward}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 text-center py-4">No upcoming shifts</p>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2">
                        {/* Recent Vital Signs */}
                        <div className="bg-white rounded-lg shadow mb-6">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-green-600" />
                                    Recent Vital Signs
                                </h3>
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/vital-signs')}
                                    className="text-sm text-primary-500 hover:text-blue-800"
                                >
                                    View All
                                </button>
                            </div>
                            {stats?.recentVitalSigns && stats.recentVitalSigns.length > 0 ? (
                                <div className="divide-y">
                                    {stats.recentVitalSigns.map((vital) => (
                                        <div key={vital.id} className="p-4 hover:bg-neutral-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-primary-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{vital.patient?.name || 'Unknown Patient'}</p>
                                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                            {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                                                                <span>BP: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>
                                                            )}
                                                            {vital.pulse_rate && <span>• Pulse: {vital.pulse_rate}</span>}
                                                            {vital.temperature && <span>• Temp: {vital.temperature}°{vital.temperature_unit}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionStyles(vital.is_abnormal)}`}>
                                                        {vital.is_abnormal ? 'ABNORMAL' : 'NORMAL'}
                                                    </span>
                                                    <div className="text-right">
                                                        <p className="text-xs text-neutral-500">Recorded</p>
                                                        <p className="text-sm font-medium text-neutral-700">{formatRecordedTime(vital.recorded_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-neutral-500">No vital signs recorded today</p>
                                    <button 
                                        onClick={() => navigate('/nurse-dashboard/vital-signs')}
                                        className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                                    >
                                        Record Vital Signs
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Critical Alerts */}
                        {(stats?.criticalAlerts || 0) > 0 && (
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-error-600" />
                                        Critical Alerts
                                    </h3>
                                    <span className="px-2 py-1 bg-error-100 text-red-800 rounded-full text-xs font-medium">
                                        {stats?.criticalAlerts} alerts
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="p-3 bg-error-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-error-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-red-900">Abnormal Vital Signs Detected</p>
                                                <p className="text-xs text-red-700">{stats?.criticalAlerts} patient(s) have abnormal readings today</p>
                                                <button 
                                                    onClick={() => navigate('/nurse-dashboard/vital-signs?abnormal_only=true')}
                                                    className="mt-2 text-xs text-red-800 underline hover:no-underline"
                                                >
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NurseDashboardMain;
