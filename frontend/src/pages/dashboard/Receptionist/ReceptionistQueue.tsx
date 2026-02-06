import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Users, 
    Clock, 
    Plus, 
    X, 
    Check,
    Search,
    AlertCircle,
    RefreshCw,
    PlayCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import receptionistService, { QueueItem, QueueStats, Patient, Doctor } from '../../../services/receptionistService';

const ReceptionistQueue: React.FC = () => {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const [newToken, setNewToken] = useState({
        patient_id: 0,
        doctor_id: 0,
        visit_type: 'walk_in' as 'appointment' | 'walk_in',
        priority: 'normal' as 'normal' | 'priority' | 'emergency',
        department: '',
    });

    useEffect(() => {
        fetchQueue();
        fetchStats();
        fetchDoctors();
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchQueue();
                fetchStats();
            }, 30000); // Refresh every 30 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchQueue = async () => {
        try {
            const data = await receptionistService.getQueue();
            setQueue(data);
        } catch (error) {
            console.error('Error fetching queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await receptionistService.getQueueStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching queue stats:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await receptionistService.getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setPatients([]);
            return;
        }
        try {
            const results = await receptionistService.searchPatients(query);
            setPatients(results);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    const handleIssueToken = async () => {
        if (!newToken.patient_id) {
            setMessage({ type: 'error', text: 'Please select a patient' });
            return;
        }

        try {
            const token = await receptionistService.issueToken(newToken);
            setMessage({ type: 'success', text: `Token #${token.token_number} issued successfully` });
            setShowAddModal(false);
            resetForm();
            fetchQueue();
            fetchStats();
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to issue token' });
        }
    };

    const handleUpdateStatus = async (queueId: number, status: 'waiting' | 'in_progress' | 'with_doctor' | 'completed' | 'cancelled') => {
        try {
            await receptionistService.updateQueueStatus(queueId, status);
            fetchQueue();
            fetchStats();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update status' });
        }
    };

    const resetForm = () => {
        setNewToken({
            patient_id: 0,
            doctor_id: 0,
            visit_type: 'walk_in',
            priority: 'normal',
            department: '',
        });
        setSearchQuery('');
        setPatients([]);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            waiting: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
            in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <PlayCircle className="w-3 h-3" /> },
            with_doctor: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Users className="w-3 h-3" /> },
            completed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
            cancelled: { bg: 'bg-error-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> },
        };
        return styles[status] || styles.waiting;
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            normal: 'bg-neutral-100 text-neutral-700',
            priority: 'bg-orange-100 text-orange-700',
            emergency: 'bg-error-100 text-red-700',
        };
        return styles[priority] || styles.normal;
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const waitingQueue = queue.filter(q => q.status === 'waiting');
    const inProgressQueue = queue.filter(q => ['in_progress', 'with_doctor'].includes(q.status));
    const completedQueue = queue.filter(q => q.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-800">Patient Queue</h1>
                            <p className="text-sm text-neutral-500">Manage patient tokens and queue</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                        >
                            <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            Issue Token
                        </button>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-error-50 text-red-800 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Waiting</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.waiting || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <PlayCircle className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">In Progress</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.inProgress || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Completed</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.completed || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Avg. Wait Time</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats?.avgWaitTime || 0} min</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Queue Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Waiting */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="p-4 border-b bg-yellow-50">
                        <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            Waiting ({waitingQueue.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                            </div>
                        ) : waitingQueue.length === 0 ? (
                            <p className="text-center text-neutral-500 py-8">No patients waiting</p>
                        ) : (
                            waitingQueue.map((item) => (
                                <div key={item.id} className="p-3 border rounded-lg hover:bg-neutral-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl font-bold text-purple-600">#{item.token_number}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="font-medium text-neutral-800">{item.patient_name}</p>
                                    <p className="text-sm text-neutral-500">{item.patient_code}</p>
                                    {item.doctor_name && (
                                        <p className="text-xs text-neutral-500 mt-1">For: Dr. {item.doctor_name}</p>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                                            className="flex-1 px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-500"
                                        >
                                            Call Next
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                                            className="px-3 py-1.5 border border-red-300 text-error-600 rounded text-sm hover:bg-error-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* In Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="p-4 border-b bg-blue-50">
                        <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-primary-500" />
                            In Progress ({inProgressQueue.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {inProgressQueue.length === 0 ? (
                            <p className="text-center text-neutral-500 py-8">No patients in progress</p>
                        ) : (
                            inProgressQueue.map((item) => (
                                <div key={item.id} className="p-3 border rounded-lg hover:bg-neutral-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl font-bold text-primary-500">#{item.token_number}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(item.status).bg} ${getStatusBadge(item.status).text}`}>
                                            {getStatusBadge(item.status).icon}
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="font-medium text-neutral-800">{item.patient_name}</p>
                                    {item.doctor_name && (
                                        <p className="text-xs text-neutral-500 mt-1">With: Dr. {item.doctor_name}</p>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        {item.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, 'with_doctor')}
                                                className="flex-1 px-3 py-1.5 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                                            >
                                                With Doctor
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, 'completed')}
                                            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                        >
                                            Complete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="p-4 border-b bg-green-50">
                        <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Completed Today ({completedQueue.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {completedQueue.length === 0 ? (
                            <p className="text-center text-neutral-500 py-8">No completed visits yet</p>
                        ) : (
                            completedQueue.slice(0, 10).map((item) => (
                                <div key={item.id} className="p-3 border rounded-lg bg-neutral-50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-lg font-bold text-neutral-400">#{item.token_number}</span>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="font-medium text-neutral-600">{item.patient_name}</p>
                                    <p className="text-xs text-neutral-400">
                                        Completed at {new Date(item.completed_at || '').toLocaleTimeString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Issue Token Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-neutral-800">Issue Queue Token</h2>
                                <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Patient Search */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Patient <span className="text-error-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchPatients(e.target.value);
                                        }}
                                        placeholder="Search patient..."
                                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                {patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                onClick={() => {
                                                    setNewToken(prev => ({ ...prev, patient_id: patient.id }));
                                                    setSearchQuery(patient.name);
                                                    setPatients([]);
                                                }}
                                                className="p-3 hover:bg-neutral-50 cursor-pointer"
                                            >
                                                <p className="font-medium">{patient.name}</p>
                                                <p className="text-xs text-neutral-500">{patient.patient_id}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Visit Type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Visit Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewToken(prev => ({ ...prev, visit_type: 'walk_in' }))}
                                        className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                                            newToken.visit_type === 'walk_in'
                                                ? 'bg-purple-500 text-white border-purple-500'
                                                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                                        }`}
                                    >
                                        Walk-in
                                    </button>
                                    <button
                                        onClick={() => setNewToken(prev => ({ ...prev, visit_type: 'appointment' }))}
                                        className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                                            newToken.visit_type === 'appointment'
                                                ? 'bg-purple-500 text-white border-purple-500'
                                                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                                        }`}
                                    >
                                        Appointment
                                    </button>
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
                                <select
                                    value={newToken.priority}
                                    onChange={(e) => setNewToken(prev => ({ ...prev, priority: e.target.value as any }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="priority">Priority</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>

                            {/* Doctor (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Doctor (Optional)</label>
                                <select
                                    value={newToken.doctor_id}
                                    onChange={(e) => setNewToken(prev => ({ ...prev, doctor_id: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={0}>Any Available Doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowAddModal(false); resetForm(); }}
                                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssueToken}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700"
                            >
                                Issue Token
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistQueue;
