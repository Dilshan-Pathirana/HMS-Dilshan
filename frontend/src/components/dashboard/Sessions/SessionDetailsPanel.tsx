import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ChevronLeft, Building2, Users, Plus, X, Monitor, PlayCircle, Stethoscope } from 'lucide-react';
import { patientSessionApi, SessionDetail, NurseItem, SessionPatientItem, SessionSlotItem } from '../../../services/patientSessionService';

interface SessionDetailsPanelProps {
    sessionId: string;
    onBack: () => void;
    viewType?: 'admin' | 'nurse';
    initialAction?: 'assign-staff';
}

const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({ sessionId, onBack, viewType = 'admin', initialAction }) => {
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<SessionPatientItem[]>([]);
    const [slots, setSlots] = useState<SessionSlotItem[]>([]);

    // Queue Management
    const [queueStatus, setQueueStatus] = useState<{ current_doctor_slot: number; current_nurse_slot: number; status: string } | null>(null);
    const [updatingQueue, setUpdatingQueue] = useState(false);

    // Nurse Assignment
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableNurses, setAvailableNurses] = useState<NurseItem[]>([]);
    const [selectedNurses, setSelectedNurses] = useState<string[]>([]);
    const [loadingNurses, setLoadingNurses] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [didApplyInitialAction, setDidApplyInitialAction] = useState(false);

    useEffect(() => {
        loadSessionDetails();
        loadSlots();
        setDidApplyInitialAction(false);
    }, [sessionId]);

    useEffect(() => {
        if (initialAction === 'assign-staff' && viewType === 'admin' && session && !didApplyInitialAction) {
            setDidApplyInitialAction(true);
            openAssignModal();
        }
    }, [initialAction, viewType, session, didApplyInitialAction]);

    const loadSessionDetails = async () => {
        setLoading(true);
        try {
            const data = await patientSessionApi.getSessionDetail(sessionId);
            setSession(data);
            if (data.queue_status) {
                setQueueStatus(data.queue_status);
            } else {
                setQueueStatus({ current_doctor_slot: 0, current_nurse_slot: 0, status: 'scheduled' });
            }
        } catch (error) {
            console.error("Failed to load session details", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPatients = async () => {
        try {
            const data = await patientSessionApi.getSessionPatients(sessionId);
            setPatients(data);
        } catch (error) {
            console.error("Failed to load patients", error);
        }
    };

    const loadSlots = async () => {
        try {
            const data = await patientSessionApi.getSessionSlots(sessionId);
            setSlots(data);
            const booked = data
                .filter((s) => !!s.appointment_id)
                .map((s) => ({
                    appointment_id: s.appointment_id as string,
                    appointment_time: s.slot_time,
                    status: (s.status || 'pending') as string,
                    patient_id: (s.patient_id || '') as string,
                    patient_name: (s.patient_name || 'Unknown') as string,
                }));
            setPatients(booked);
        } catch (error) {
            console.error("Failed to load session slots", error);
            await loadPatients();
        }
    };

    const handleUpdateQueue = async () => {
        if (!queueStatus) return;
        setUpdatingQueue(true);
        try {
            await patientSessionApi.updateQueue(sessionId, {
                status: queueStatus.status,
                current_doctor_slot: queueStatus.current_doctor_slot,
                current_nurse_slot: queueStatus.current_nurse_slot
            });
            await loadSessionDetails();
            await loadSlots();
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingQueue(false);
        }
    };

    const openAssignModal = async () => {
        setShowAssignModal(true);
        setLoadingNurses(true);
        try {
            const nurses = await patientSessionApi.getAvailableNurses(sessionId);
            setAvailableNurses(nurses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingNurses(false);
        }
    };

    const handleAssignNurses = async () => {
        setAssigning(true);
        try {
            await patientSessionApi.assignNurses(sessionId, selectedNurses);
            setShowAssignModal(false);
            loadSessionDetails();
        } catch (err) {
            console.error(err);
        } finally {
            setAssigning(false);
        }
    };

    const toggleNurseSelection = (id: string) => {
        setSelectedNurses(prev =>
            prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
        );
    };

    const handleIntake = (appointmentId: string) => {
        // Navigate to intake page.
        // Route is likely /nurse-dashboard/patient-sessions/:sessionId/intake/:appointmentId ??
        // Or just /nurse-dashboard/intake/:appointmentId?
        // Current route structure:
        // /nurse-dashboard/sessions/:sessionId -> NurseSessionDetail -> SessionDetailsPanel
        // We probably want to go to distinct intake page.
        // Assuming /nurse-dashboard/intake/:appointmentId is not yet defined, but PatientSessions path exists.
        // Let's use /nurse-dashboard/patient-sessions/:appointmentId (PatientSessionDetails handles appointmentId or session_id?)
        // PatientSessionDetails likely expects 'id' which is appointment_id or patient_session_id.
        // Let's assume it expects appointment_id for now as it loads patient details.
        // I'll check `PatientSessionDetails.tsx` later to confirm route param name.
        // For now:
        navigate(`/nurse-dashboard/patient-sessions/${appointmentId}`);
    };

    if (loading) return <div className="p-12 text-center text-neutral-500">Loading session details...</div>;
    if (!session) return <div className="p-12 text-center text-red-500">Session not found</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between bg-neutral-50">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-neutral-800">Session Details</h2>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-neutral-600 ml-8">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-neutral-900">{session.doctor_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>{session.branch_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full shadow-sm ${session.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            session.status === 'active' || session.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                        {session.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-xs font-mono text-neutral-400">ID: {session.id.slice(0, 8)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-neutral-200">
                {/* Left Column: Nurses & Queue */}
                <div className="p-6 space-y-8 bg-white min-h-[500px]">
                    {/* Queue Management */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-100">
                            <Monitor className="w-4 h-4 text-primary-500" />
                            Queue Status
                        </h3>
                        {queueStatus && (
                            <div className="space-y-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Session Status</label>
                                    <select
                                        value={queueStatus.status}
                                        onChange={(e) => setQueueStatus({ ...queueStatus, status: e.target.value })}
                                        className="w-full text-sm border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Dr. Token</label>
                                        <select
                                            value={queueStatus.current_doctor_slot}
                                            onChange={(e) => setQueueStatus({ ...queueStatus, current_doctor_slot: parseInt(e.target.value) || 0 })}
                                            className="w-full text-sm border-neutral-300 rounded-lg font-mono font-medium text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value={0}>0</option>
                                            {slots.map((slot) => (
                                                <option key={`doc-${slot.slot_index}`} value={slot.slot_index}>{slot.slot_index}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Nurse Token</label>
                                        <select
                                            value={queueStatus.current_nurse_slot}
                                            onChange={(e) => setQueueStatus({ ...queueStatus, current_nurse_slot: parseInt(e.target.value) || 0 })}
                                            className="w-full text-sm border-neutral-300 rounded-lg font-mono font-medium text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value={0}>0</option>
                                            {slots.map((slot) => (
                                                <option key={`nurse-${slot.slot_index}`} value={slot.slot_index}>{slot.slot_index}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateQueue}
                                    disabled={updatingQueue}
                                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {updatingQueue ? 'Updating Queue...' : 'Update Queue Status'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Assigned Nurses */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary-500" />
                                Assigned Nurses
                            </h3>
                            {viewType === 'admin' && (
                                <button
                                    onClick={openAssignModal}
                                    className="text-xs bg-white border border-neutral-300 px-2.5 py-1.5 rounded-lg hover:bg-neutral-50 flex items-center gap-1.5 font-medium text-neutral-700 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Assign
                                </button>
                            )}
                        </div>

                        {session.assigned_nurses && session.assigned_nurses.length > 0 ? (
                            <div className="grid gap-2">
                                {session.assigned_nurses.map(nurse => (
                                    <div key={nurse.id} className="flex items-center gap-3 text-sm bg-white p-2.5 rounded-lg border border-neutral-200 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                            {nurse.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-neutral-700">{nurse.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                                <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                <p className="text-sm text-neutral-500">No nurses assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Appointments List */}
                <div className="lg:col-span-2 bg-neutral-50/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-primary-500" />
                            Slot List <span className="text-neutral-400 font-normal">({slots.length})</span>
                        </h3>
                    </div>

                    {slots.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
                            <p className="text-neutral-500">No slots found for this session</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {slots.map((slot) => (
                                <div key={`${slot.slot_index}-${slot.slot_time}`} className="bg-white p-4 rounded-xl border border-neutral-200 hover:shadow-md transition-shadow flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                            {slot.slot_index}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-neutral-900">{slot.patient_name || 'Empty Slot'}</h4>
                                            <div className="flex items-center gap-3 text-sm text-neutral-500 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {slot.slot_time}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${slot.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        slot.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {(slot.status || '—').replace('_', ' ')}
                                                </span>
                                                {slot.is_current_with_doctor && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">With Doctor</span>
                                                )}
                                                {slot.is_current_with_nurse && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">With Nurse</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {viewType === 'nurse' && slot.appointment_id && (
                                        <button
                                            onClick={() => handleIntake(slot.appointment_id as string)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-emerald-200"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            Start Intake
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Nurse Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50">
                            <h3 className="font-semibold text-lg text-neutral-800">Assign Nurses</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-full hover:bg-neutral-200 transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            {loadingNurses ? (
                                <div className="text-center py-8 text-neutral-500">Loading nurses...</div>
                            ) : (
                                <div className="space-y-2">
                                    {availableNurses.length === 0 ? <p className="text-center text-neutral-500 py-4">No available nurses found.</p> : (
                                        availableNurses.map(nurse => (
                                            <label key={nurse.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selectedNurses.includes(nurse.id) ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-neutral-50 border-neutral-200'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNurses.includes(nurse.id)}
                                                    onChange={() => toggleNurseSelection(nurse.id)}
                                                    className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                                                        {nurse.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-neutral-700">{nurse.name}</span>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50">
                            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                            <button
                                onClick={handleAssignNurses}
                                disabled={assigning || selectedNurses.length === 0}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-all"
                            >
                                {assigning ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionDetailsPanel;
