import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import {
    Calendar, Clock, User, Users, Search, Filter,
    ChevronDown, Stethoscope, Building2, RefreshCw, Loader2, ChevronLeft,
    CalendarDays, UserPlus
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';

interface AssignedNurse {
    id: string;
    name: string;
}

interface DoctorSession {
    id: string;
    doctor_id: string;
    doctor_name: string;
    doctor_email: string;
    doctor_specialization: string | null;
    branch_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    assigned_nurses: AssignedNurse[];
}

export const BranchAdminDoctorSchedules: React.FC = () => {
    const [sessions, setSessions] = useState<DoctorSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'day'>('day');
    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');
        setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
        setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
        setUserGender(userInfo.gender || '');

        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError('');
            // Use the new endpoint
            const response = await api.get('/branch-admin/requests/doctor-schedules');

            if (response.data.status === 200) {
                setSessions(response.data.schedules || []);
            } else {
                setError('Failed to load sessions');
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Failed to load doctor sessions');
        } finally {
            setLoading(false);
        }
    };

    // Filter sessions based on search
    const filteredSessions = sessions.filter(session => {
        const matchesSearch =
            session.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.doctor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (session.doctor_specialization?.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
    });

    // Group sessions by date
    const sessionsByDate = filteredSessions.reduce((acc, session) => {
        const dateKey = session.session_date;
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(session);
        return acc;
    }, {} as { [key: string]: DoctorSession[] });

    // Sort dates
    const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Newest first

    // Get stats
    const totalSessions = sessions.length;
    const uniqueDoctors = new Set(sessions.map(s => s.doctor_id)).size;

    // Count upcoming sessions
    const today = new Date().toISOString().split('T')[0];
    const upcomingSessions = sessions.filter(s => s.session_date >= today).length;

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="min-h-screen bg-neutral-50 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate('/branch-admin')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Building2 className="w-4 h-4" />
                            <span>{branchName}</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-800">Doctor Sessions</h1>
                    <p className="text-neutral-500">View all scheduled sessions and assigned nurses</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{totalSessions}</p>
                                <p className="text-sm text-neutral-500">Total Sessions</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Stethoscope className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{uniqueDoctors}</p>
                                <p className="text-sm text-neutral-500">Doctors Scheduled</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{upcomingSessions}</p>
                                <p className="text-sm text-neutral-500">Upcoming Sessions</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by doctor name, email, or specialization..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-neutral-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'day'
                                        ? 'bg-white text-primary-500 shadow-sm'
                                        : 'text-neutral-600 hover:text-neutral-800'
                                    }`}
                            >
                                By Date
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
                                        ? 'bg-white text-primary-500 shadow-sm'
                                        : 'text-neutral-600 hover:text-neutral-800'
                                    }`}
                            >
                                List
                            </button>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchSessions}
                            disabled={loading}
                            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-error-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-error-600">{error}</p>
                        <button
                            onClick={fetchSessions}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredSessions.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Sessions Found</h3>
                        <p className="text-neutral-500">
                            {searchTerm
                                ? 'No sessions match your search.'
                                : 'There are no doctor sessions scheduled for your branch yet.'}
                        </p>
                    </div>
                )}

                {/* Day View */}
                {!loading && !error && viewMode === 'day' && filteredSessions.length > 0 && (
                    <div className="space-y-6">
                        {sortedDates.map(date => {
                            const dateSessions = sessionsByDate[date] || [];

                            return (
                                <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-3 border-b bg-neutral-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-5 h-5 text-neutral-500" />
                                            <h3 className="font-semibold text-neutral-800">{formatDate(date)}</h3>
                                        </div>
                                        <span className="text-sm text-neutral-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                            {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {dateSessions.map(session => (
                                            <div key={session.id} className="p-4 hover:bg-neutral-50 transition-colors">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <User className="w-5 h-5 text-primary-500" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-medium text-neutral-800">
                                                                    {session.doctor_name}
                                                                </h4>
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {session.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-neutral-500">{session.doctor_email}</p>
                                                            {session.doctor_specialization && (
                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                                    {session.doctor_specialization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:items-end gap-2">
                                                        <div className="flex items-center gap-2 text-neutral-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                            <Clock className="w-4 h-4 text-neutral-400" />
                                                            <span className="font-medium">
                                                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                            </span>
                                                        </div>

                                                        {/* Assigned Nurses */}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex -space-x-2">
                                                                {session.assigned_nurses.length > 0 ? (
                                                                    session.assigned_nurses.map(nurse => (
                                                                        <div key={nurse.id} className="w-6 h-6 rounded-full bg-pink-100 border border-white flex items-center justify-center text-[10px] text-pink-700 font-bold" title={nurse.name}>
                                                                            {nurse.name.charAt(0)}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-400">
                                                                        -
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-neutral-500">
                                                                {session.assigned_nurses.length > 0
                                                                    ? `${session.assigned_nurses.length} Nurse${session.assigned_nurses.length > 1 ? 's' : ''}`
                                                                    : 'No nurses assigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* List View */}
                {!loading && !error && viewMode === 'list' && filteredSessions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Assigned Nurses
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4 text-neutral-400" />
                                                <span className="font-medium text-neutral-700">
                                                    {formatDate(session.session_date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-800">{session.doctor_name}</p>
                                                <p className="text-sm text-neutral-500">{session.doctor_email}</p>
                                                {session.doctor_specialization && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                        {session.doctor_specialization}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-neutral-700 bg-gray-50 px-2 py-1 rounded text-sm border border-gray-200">
                                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {session.assigned_nurses.length > 0 ? (
                                                    session.assigned_nurses.map(nurse => (
                                                        <div key={nurse.id} className="flex items-center gap-1.5 text-sm text-neutral-700">
                                                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                                                            {nurse.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-neutral-400 text-sm italic">None assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BranchAdminDoctorSchedules;
