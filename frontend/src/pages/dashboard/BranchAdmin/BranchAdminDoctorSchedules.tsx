import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    Calendar, Clock, User, Users, Search, Filter,
    ChevronDown, Stethoscope, Building2, RefreshCw, Loader2, ChevronLeft
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';

interface DoctorSchedule {
    id: string;
    doctor_id: string;
    doctor_name: string;
    doctor_email: string;
    doctor_specialization: string | null;
    branch_id: string;
    branch_name: string;
    schedule_day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
    time_per_patient: number;
    created_at: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayColors: { [key: string]: string } = {
    'Sunday': 'bg-error-100 text-red-800 border-red-200',
    'Monday': 'bg-blue-100 text-blue-800 border-blue-200',
    'Tuesday': 'bg-green-100 text-green-800 border-green-200',
    'Wednesday': 'bg-purple-100 text-purple-800 border-purple-200',
    'Thursday': 'bg-orange-100 text-orange-800 border-orange-200',
    'Friday': 'bg-teal-100 text-teal-800 border-teal-200',
    'Saturday': 'bg-pink-100 text-pink-800 border-pink-200',
};

export const BranchAdminDoctorSchedules: React.FC = () => {
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDay, setSelectedDay] = useState<string>('all');
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
        
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/branch-admin/requests/doctor-schedules');
            
            if (response.data.status === 200) {
                setSchedules(response.data.schedules || []);
            } else {
                setError('Failed to load schedules');
            }
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError('Failed to load doctor schedules');
        } finally {
            setLoading(false);
        }
    };

    // Filter schedules based on search and day filter
    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch = 
            schedule.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.doctor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (schedule.doctor_specialization?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesDay = selectedDay === 'all' || schedule.schedule_day === selectedDay;
        
        return matchesSearch && matchesDay;
    });

    // Group schedules by day
    const schedulesByDay = daysOfWeek.reduce((acc, day) => {
        acc[day] = filteredSchedules.filter(s => s.schedule_day === day);
        return acc;
    }, {} as { [key: string]: DoctorSchedule[] });

    // Get stats
    const totalSchedules = schedules.length;
    const uniqueDoctors = new Set(schedules.map(s => s.doctor_id)).size;
    const activeDays = new Set(schedules.map(s => s.schedule_day)).size;

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
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
                            onClick={() => navigate('/branch-admin/dashboard')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Building2 className="w-4 h-4" />
                            <span>{branchName}</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-800">Doctor Schedules</h1>
                    <p className="text-neutral-500">View all approved doctor schedules for your branch</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{totalSchedules}</p>
                                <p className="text-sm text-neutral-500">Total Schedules</p>
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
                                <p className="text-2xl font-bold text-neutral-800">{activeDays}</p>
                                <p className="text-sm text-neutral-500">Active Days</p>
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

                        {/* Day Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
                            >
                                <option value="all">All Days</option>
                                {daysOfWeek.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-neutral-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'day' 
                                        ? 'bg-white text-primary-500 shadow-sm' 
                                        : 'text-neutral-600 hover:text-neutral-800'
                                }`}
                            >
                                By Day
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'list' 
                                        ? 'bg-white text-primary-500 shadow-sm' 
                                        : 'text-neutral-600 hover:text-neutral-800'
                                }`}
                            >
                                List
                            </button>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchSchedules}
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
                            onClick={fetchSchedules}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredSchedules.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Schedules Found</h3>
                        <p className="text-neutral-500">
                            {searchTerm || selectedDay !== 'all' 
                                ? 'No schedules match your current filters.'
                                : 'There are no approved doctor schedules for your branch yet.'}
                        </p>
                    </div>
                )}

                {/* Day View */}
                {!loading && !error && viewMode === 'day' && filteredSchedules.length > 0 && (
                    <div className="space-y-6">
                        {daysOfWeek.map(day => {
                            const daySchedules = schedulesByDay[day] || [];
                            if (daySchedules.length === 0 && selectedDay !== 'all') return null;
                            if (daySchedules.length === 0) return null;

                            return (
                                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className={`px-6 py-3 border-b ${dayColors[day] || 'bg-neutral-100'}`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{day}</h3>
                                            <span className="text-sm">
                                                {daySchedules.length} schedule{daySchedules.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {daySchedules.map(schedule => (
                                            <div key={schedule.id} className="p-4 hover:bg-neutral-50">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <User className="w-5 h-5 text-primary-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-neutral-800">
                                                                {schedule.doctor_name}
                                                            </h4>
                                                            <p className="text-sm text-neutral-500">{schedule.doctor_email}</p>
                                                            {schedule.doctor_specialization && (
                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                                    {schedule.doctor_specialization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2 text-neutral-700">
                                                            <Clock className="w-4 h-4 text-neutral-400" />
                                                            <span className="font-medium">
                                                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                                                            <Users className="w-4 h-4" />
                                                            <span>Max {schedule.max_patients} patients</span>
                                                        </div>
                                                        <p className="text-xs text-neutral-400 mt-1">
                                                            {schedule.time_per_patient} min per patient
                                                        </p>
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
                {!loading && !error && viewMode === 'list' && filteredSchedules.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Day
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Patients
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSchedules.map(schedule => (
                                    <tr key={schedule.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-800">{schedule.doctor_name}</p>
                                                <p className="text-sm text-neutral-500">{schedule.doctor_email}</p>
                                                {schedule.doctor_specialization && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                        {schedule.doctor_specialization}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${dayColors[schedule.schedule_day] || 'bg-neutral-100 text-neutral-800'}`}>
                                                {schedule.schedule_day}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-neutral-700">
                                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-neutral-700">{schedule.max_patients}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-neutral-500">{schedule.time_per_patient} min/patient</span>
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
