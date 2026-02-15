import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Clock,
    Users,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    MapPin,
    Stethoscope,
    CalendarDays,
    Timer,
    Bell
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface QueueInfo {
    appointment_id: string;
    doctor_name: string;
    specialization: string;
    branch_name: string;
    date: string;
    start_time: string;
    token_number: number;
    current_token: number;
    patients_ahead: number;
    estimated_wait_time: number;
    status: string;
}

const PatientQueueStatus: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [queueInfo, setQueueInfo] = useState<QueueInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        fetchQueueStatus();

        // Auto-refresh every 30 seconds if enabled
        let interval: ReturnType<typeof setInterval>;
        if (autoRefresh) {
            interval = setInterval(fetchQueueStatus, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userId, autoRefresh]);

    const fetchQueueStatus = async () => {
        try {
            // Get today's appointments
            const response = await api.get(`/get-patient-appointments/${userId}`);
            if (response.data.status === 200) {
                const today = new Date().toISOString().split('T')[0];
                const todaysAppointments = (response.data.appointments || [])
                    .filter((apt: any) => apt.appointment_date === today && apt.status !== 'cancelled')
                    .map((apt: any) => ({
                        appointment_id: apt.id,
                        doctor_name: apt.doctor_name || `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
                        specialization: apt.areas_of_specialization || 'General',
                        branch_name: apt.branch_name || 'Main Branch',
                        date: apt.appointment_date,
                        start_time: apt.appointment_time,
                        token_number: apt.slot_number || apt.token_number || 0,
                        current_token: apt.current_queue_token || 0,
                        patients_ahead: Math.max(0, (apt.slot_number || apt.token_number || 0) - (apt.current_queue_token || 0) - 1),
                        estimated_wait_time: Math.max(0, ((apt.slot_number || apt.token_number || 0) - (apt.current_queue_token || 0)) * 10),
                        status: apt.status
                    }));
                setQueueInfo(todaysAppointments);
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch queue status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (patientsAhead: number) => {
        if (patientsAhead === 0) return 'text-green-600 bg-green-100';
        if (patientsAhead <= 3) return 'text-yellow-600 bg-yellow-100';
        return 'text-primary-500 bg-blue-100';
    };

    const getStatusMessage = (patientsAhead: number) => {
        if (patientsAhead === 0) return "It's your turn!";
        if (patientsAhead === 1) return 'You are next!';
        if (patientsAhead <= 3) return 'Almost there...';
        return 'Please wait';
    };

    const formatWaitTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Live Queue Status</h1>
                    <p className="text-neutral-500">Track your appointment queue in real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-neutral-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={fetchQueueStatus}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
                <div className="text-sm text-neutral-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            {/* No Queue Items */}
            {queueInfo.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No Active Queue</h3>
                    <p className="text-neutral-500">
                        You don't have any appointments scheduled for today
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {queueInfo.map((queue) => (
                        <div key={queue.appointment_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Queue Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{queue.doctor_name}</h3>
                                        <p className="text-emerald-100 flex items-center gap-1">
                                            <Stethoscope className="w-4 h-4" />
                                            {queue.specialization}
                                        </p>
                                        <p className="text-emerald-100 flex items-center gap-1 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            {queue.branch_name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(queue.patients_ahead)}`}>
                                            {queue.patients_ahead === 0 ? (
                                                <Bell className="w-5 h-5" />
                                            ) : (
                                                <Timer className="w-5 h-5" />
                                            )}
                                            <span className="font-medium">{getStatusMessage(queue.patients_ahead)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Queue Details */}
                            <div className="p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {/* Your Token */}
                                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                                        <p className="text-sm text-neutral-500 mb-1">Your Token</p>
                                        <p className="text-3xl font-bold text-emerald-600">#{queue.token_number}</p>
                                    </div>

                                    {/* Current Token */}
                                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                                        <p className="text-sm text-neutral-500 mb-1">Now Serving</p>
                                        <p className="text-3xl font-bold text-primary-500">#{queue.current_token}</p>
                                    </div>

                                    {/* Patients Ahead */}
                                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                                        <p className="text-sm text-neutral-500 mb-1">Patients Ahead</p>
                                        <p className="text-3xl font-bold text-purple-600">{queue.patients_ahead}</p>
                                    </div>

                                    {/* Wait Time */}
                                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                                        <p className="text-sm text-neutral-500 mb-1">Est. Wait Time</p>
                                        <p className="text-3xl font-bold text-orange-600">{formatWaitTime(queue.estimated_wait_time)}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-neutral-500 mb-2">
                                        <span>Queue Progress</span>
                                        <span>{queue.current_token} / {queue.token_number}</span>
                                    </div>
                                    <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (queue.current_token / queue.token_number) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Appointment Time */}
                                <div className="flex items-center justify-between text-sm text-neutral-500 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        <span>Scheduled: {new Date(queue.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>Time: {queue.start_time}</span>
                                    </div>
                                </div>

                                {/* Alert for near turn */}
                                {queue.patients_ahead <= 3 && queue.patients_ahead > 0 && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-800">Your turn is approaching!</p>
                                            <p className="text-sm text-yellow-700">
                                                Please make sure you are ready and near the consultation room.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Alert for current turn */}
                                {queue.patients_ahead === 0 && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-green-800">It's your turn!</p>
                                            <p className="text-sm text-green-700">
                                                Please proceed to the consultation room now.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800">Queue Information</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                            <li>• Queue status updates every 30 seconds automatically</li>
                            <li>• Estimated wait times are approximate and may vary</li>
                            <li>• You will receive a notification when your turn is near</li>
                            <li>• Please arrive at least 15 minutes before your scheduled time</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientQueueStatus;
