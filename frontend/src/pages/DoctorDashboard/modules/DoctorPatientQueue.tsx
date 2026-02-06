import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    PhoneCall,
    Stethoscope,
    ChevronRight,
    Loader2,
    User,
    Calendar,
    RefreshCw,
    Volume2,
    Timer,
    Building2
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface QueuePatient {
    id: string;
    appointment_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    slot: number;
    status: 'waiting' | 'in-consultation' | 'completed' | 'no-show';
    check_in_time?: string;
    consultation_start?: string;
    consultation_end?: string;
    reason?: string;
}

interface TodaySchedule {
    id: string;
    branch_id: string;
    branch_name: string;
    start_time: string;
    end_time: string;
    max_patients: number;
    booked_slots: number;
}

const DoctorPatientQueue: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [queue, setQueue] = useState<QueuePatient[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchQueueData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchQueueData, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchQueueData = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            
            const today = new Date().toISOString().split('T')[0];
            
            // Fetch today's schedule and appointments
            const response = await api.get(`/get-doctor-all-schedule/${userId}`);
            if (response.data.status === 200) {
                const schedules = response.data.doctorSchedules || [];
                const todaySchedule = schedules.find((s: any) => s.date === today);
                setTodaySchedule(todaySchedule || null);

                // Get appointments for today's schedule
                if (todaySchedule) {
                    const appointmentsResponse = await api.get(
                        `/get-doctor-schedule-appointments/${userId}/${todaySchedule.branch_id}/${todaySchedule.id}`
                    );
                    if (appointmentsResponse.data.status === 200) {
                        const appointments = appointmentsResponse.data.appointments || [];
                        setQueue(appointments.map((apt: any) => ({
                            id: apt.id,
                            appointment_id: apt.id,
                            patient_id: apt.user_id,
                            patient_name: `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim() || `Patient #${apt.slot}`,
                            patient_phone: apt.phone || '',
                            slot: apt.slot,
                            status: apt.status || 'waiting',
                            reason: apt.reason
                        })));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch queue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updatePatientStatus = async (patientId: string, newStatus: string) => {
        try {
            await api.put(`/update-appointment-status/${patientId}`, {
                status: newStatus
            });
            fetchQueueData();
        } catch (error) {
            console.error('Failed to update patient status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    const callNextPatient = () => {
        const nextPatient = queue.find(p => p.status === 'waiting');
        if (nextPatient) {
            setCurrentPatient(nextPatient);
            updatePatientStatus(nextPatient.id, 'in-consultation');
        }
    };

    const completeConsultation = (patientId: string) => {
        updatePatientStatus(patientId, 'completed');
        setCurrentPatient(null);
    };

    const markNoShow = (patientId: string) => {
        if (confirm('Mark this patient as no-show?')) {
            updatePatientStatus(patientId, 'no-show');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-700';
            case 'in-consultation': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'no-show': return 'bg-error-100 text-red-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return <Clock className="w-4 h-4" />;
            case 'in-consultation': return <Stethoscope className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'no-show': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const stats = {
        waiting: queue.filter(p => p.status === 'waiting').length,
        inConsultation: queue.filter(p => p.status === 'in-consultation').length,
        completed: queue.filter(p => p.status === 'completed').length,
        noShow: queue.filter(p => p.status === 'no-show').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!todaySchedule) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-800 mb-2">No Schedule Today</h2>
                    <p className="text-neutral-500 mb-6">You don't have any consultation scheduled for today.</p>
                    <Link
                        to="/doctor-dashboard-new/schedule/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Create Schedule
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Patient Queue</h1>
                    <p className="text-neutral-500 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {todaySchedule.branch_name} • {todaySchedule.start_time} - {todaySchedule.end_time}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchQueueData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={callNextPatient}
                        disabled={stats.waiting === 0 || stats.inConsultation > 0}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PhoneCall className="w-5 h-5" />
                        Call Next Patient
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-yellow-700">{stats.waiting}</p>
                            <p className="text-sm text-yellow-600">Waiting</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-blue-700">{stats.inConsultation}</p>
                            <p className="text-sm text-primary-500">In Consultation</p>
                        </div>
                        <Stethoscope className="w-8 h-8 text-primary-500" />
                    </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                            <p className="text-sm text-green-600">Completed</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-error-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-red-700">{stats.noShow}</p>
                            <p className="text-sm text-error-600">No Show</p>
                        </div>
                        <XCircle className="w-8 h-8 text-error-500" />
                    </div>
                </div>
            </div>

            {/* Current Patient Card */}
            {currentPatient && (
                <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                                {currentPatient.patient_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xl font-bold">{currentPatient.patient_name}</p>
                                <p className="text-blue-200">Slot #{currentPatient.slot} • Currently in consultation</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                to={`/doctor-dashboard-new/consultation/${currentPatient.appointment_id}`}
                                className="px-4 py-2 bg-white text-primary-500 rounded-lg hover:bg-blue-50 font-medium"
                            >
                                Open Consultation
                            </Link>
                            <button
                                onClick={() => completeConsultation(currentPatient.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-neutral-800">Today's Queue</h2>
                </div>

                {queue.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-800 mb-2">No patients in queue</h3>
                        <p className="text-neutral-500">Patients will appear here when they book appointments</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {queue.map((patient, index) => (
                            <div 
                                key={patient.id} 
                                className={`p-4 hover:bg-neutral-50 transition-colors ${
                                    patient.status === 'in-consultation' ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            patient.status === 'completed' ? 'bg-green-100 text-green-600' :
                                            patient.status === 'in-consultation' ? 'bg-blue-100 text-primary-500' :
                                            patient.status === 'no-show' ? 'bg-error-100 text-error-600' :
                                            'bg-neutral-100 text-neutral-600'
                                        }`}>
                                            {patient.slot}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-800">{patient.patient_name}</p>
                                            <p className="text-sm text-neutral-500">{patient.reason || 'General Consultation'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(patient.status)}`}>
                                            {getStatusIcon(patient.status)}
                                            {patient.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                        
                                        {patient.status === 'waiting' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentPatient(patient);
                                                        updatePatientStatus(patient.id, 'in-consultation');
                                                    }}
                                                    className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                                                >
                                                    Call In
                                                </button>
                                                <button
                                                    onClick={() => markNoShow(patient.id)}
                                                    className="px-3 py-1.5 text-error-600 hover:bg-error-50 text-sm rounded-lg"
                                                >
                                                    No Show
                                                </button>
                                            </div>
                                        )}
                                        
                                        {patient.status === 'in-consultation' && (
                                            <Link
                                                to={`/doctor-dashboard-new/consultation/${patient.appointment_id}`}
                                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                            >
                                                Continue
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPatientQueue;
