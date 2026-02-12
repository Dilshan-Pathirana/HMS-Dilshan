import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import {
    Users,
    Clock,
    Calendar,
    CheckCircle,
    PlayCircle,
    Loader2,
    RefreshCw,
    ChevronRight,
    AlertCircle,
    Phone,
    User,
    Stethoscope
} from 'lucide-react';
import { QueuePatient } from './types';
import { getTodayQueue, getAppointmentsByDate, startConsultation, getPatientOverview } from './consultationApi';
import PatientOverviewModal from './PatientOverviewModal';

interface ConsultationQueueProps {
    onStartConsultation?: (consultationId: string, patientId: string) => void;
}

const ConsultationQueue: React.FC<ConsultationQueueProps> = ({ onStartConsultation }) => {
    const navigate = useNavigate();
    const userId = useSelector((state: RootState) => state.auth.userId);
    
    const [activeTab, setActiveTab] = useState<'today' | 'future'>('today');
    const [queue, setQueue] = useState<QueuePatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState({ total: 0, waiting: 0, in_consultation: 0, completed: 0 });
    const [startingConsultation, setStartingConsultation] = useState<string | null>(null);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchQueue = useCallback(async () => {
        if (!userId) return;
        
        try {
            setError(null);
            if (activeTab === 'today') {
                const response = await getTodayQueue(userId);
                setQueue(response.queue);
                setStats({
                    total: response.total,
                    waiting: response.waiting,
                    in_consultation: response.in_consultation,
                    completed: response.completed
                });
            } else {
                const response = await getAppointmentsByDate(userId, selectedDate);
                setQueue(response.appointments);
                setStats({
                    total: response.total,
                    waiting: 0,
                    in_consultation: 0,
                    completed: 0
                });
            }
        } catch (err: any) {
            console.error('Failed to fetch queue:', err);
            setError(err.response?.data?.message || 'Failed to load patient queue');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, activeTab, selectedDate]);

    useEffect(() => {
        setLoading(true);
        fetchQueue();
    }, [fetchQueue]);

    // Auto-refresh every 30 seconds for today's queue
    useEffect(() => {
        if (activeTab === 'today') {
            const interval = setInterval(() => {
                setRefreshing(true);
                fetchQueue();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchQueue]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchQueue();
    };

    const handleViewPatient = (patientId: string) => {
        setSelectedPatientId(patientId);
        setShowPatientModal(true);
    };

    const handleStartConsultation = async (appointment: QueuePatient) => {
        if (!userId) return;
        
        try {
            setStartingConsultation(appointment.id);
            const response = await startConsultation(appointment.id, userId);
            
            if (response.status === 200 || response.status === 201) {
                // Navigate to consultation flow
                if (onStartConsultation) {
                    onStartConsultation(response.consultation.id, appointment.patient_id);
                } else {
                    navigate(`/doctor-dashboard-new/consultation/flow/${response.consultation.id}`);
                }
            }
        } catch (err: any) {
            console.error('Failed to start consultation:', err);
            alert(err.response?.data?.message || 'Failed to start consultation');
        } finally {
            setStartingConsultation(null);
        }
    };

    const handleContinueConsultation = (consultationId: string, patientId: string) => {
        if (onStartConsultation) {
            onStartConsultation(consultationId, patientId);
        } else {
            navigate(`/doctor-dashboard-new/consultation/flow/${consultationId}`);
        }
    };

    const getStatusColor = (patient: QueuePatient) => {
        // Use enriched queue_color from backend if available
        const queueColor = (patient as any).queue_color;
        const queueStatus = (patient as any).queue_status;
        
        if (queueColor === 'blue' || queueStatus === 'in_consultation') {
            return 'bg-blue-100 text-blue-700';
        }
        if (queueColor === 'green' || queueStatus === 'ready_for_doctor') {
            return 'bg-green-100 text-green-700';
        }
        if (queueColor === 'yellow' || queueStatus === 'waiting_nurse') {
            return 'bg-amber-100 text-amber-700';
        }

        // Fallback to display_status
        switch (patient.display_status) {
            case 'Waiting':
                return 'bg-amber-100 text-amber-700';
            case 'Checked In':
                return 'bg-blue-100 text-blue-700';
            case 'In Consultation':
                return 'bg-blue-100 text-blue-700';
            case 'Completed':
                return 'bg-neutral-100 text-neutral-700';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getQueueLabel = (patient: QueuePatient) => {
        const queueStatus = (patient as any).queue_status;
        switch (queueStatus) {
            case 'waiting_nurse':
                return 'Waiting Nurse';
            case 'ready_for_doctor':
                return 'Ready';
            case 'in_consultation':
                return 'In Consultation';
            default:
                return patient.display_status || patient.status;
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Get minimum date for future appointments (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minFutureDate = tomorrow.toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Consultation Queue</h1>
                    <p className="text-neutral-500">Manage patient consultations</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards (Today only) */}
            {activeTab === 'today' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 text-primary-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.total}</p>
                                <p className="text-sm text-neutral-500">Total</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.waiting}</p>
                                <p className="text-sm text-neutral-500">Waiting</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Stethoscope className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.in_consultation}</p>
                                <p className="text-sm text-neutral-500">In Session</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-neutral-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.completed}</p>
                                <p className="text-sm text-neutral-500">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-neutral-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                activeTab === 'today'
                                    ? 'text-primary-500 border-b-2 border-primary-500 bg-blue-50/50'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Clock className="w-5 h-5" />
                                Today's Queue
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('future')}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                activeTab === 'future'
                                    ? 'text-primary-500 border-b-2 border-primary-500 bg-blue-50/50'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Future Appointments
                            </div>
                        </button>
                    </div>
                </div>

                {/* Date Picker for Future */}
                {activeTab === 'future' && (
                    <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-neutral-700">Select Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={minFutureDate}
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-4 m-4 bg-error-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-error-500" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Queue List */}
                <div className="divide-y divide-gray-100">
                    {queue.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">No patients in queue</h3>
                            <p className="text-neutral-500">
                                {activeTab === 'today'
                                    ? 'Patients will appear here as they check in'
                                    : 'No appointments scheduled for this date'}
                            </p>
                        </div>
                    ) : (
                        queue.map((patient) => (
                            <div
                                key={patient.id}
                                className="p-4 hover:bg-neutral-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Token Number */}
                                        <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {patient.token_number || patient.slot_number}
                                        </div>
                                        
                                        {/* Patient Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-neutral-800">
                                                    {patient.patient_name}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(patient)}`}>
                                                    {getQueueLabel(patient)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                                {patient.age && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        {patient.age} yrs, {patient.patient_gender}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {patient.patient_phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatTime(patient.appointment_time)}
                                                </span>
                                            </div>
                                            {patient.notes && (
                                                <p className="text-sm text-neutral-500 mt-1 italic">
                                                    Note: {patient.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewPatient(patient.patient_id)}
                                            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                                        >
                                            View History
                                        </button>
                                        
                                        {patient.display_status === 'In Consultation' && patient.consultation_id ? (
                                            <button
                                                onClick={() => handleContinueConsultation(patient.consultation_id!, patient.patient_id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                Continue
                                            </button>
                                        ) : patient.display_status === 'Completed' ? (
                                            <span className="px-4 py-2 text-sm text-neutral-500">
                                                Consultation Complete
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleStartConsultation(patient)}
                                                disabled={startingConsultation === patient.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                            >
                                                {startingConsultation === patient.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Stethoscope className="w-4 h-4" />
                                                )}
                                                Start Consultation
                                            </button>
                                        )}
                                        
                                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Patient Overview Modal */}
            {showPatientModal && selectedPatientId && (
                <PatientOverviewModal
                    patientId={selectedPatientId}
                    onClose={() => {
                        setShowPatientModal(false);
                        setSelectedPatientId(null);
                    }}
                />
            )}
        </div>
    );
};

export default ConsultationQueue;
