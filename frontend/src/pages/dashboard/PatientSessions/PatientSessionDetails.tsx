import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import {
    Calendar,
    Clock,
    Users,
    Stethoscope,
    Activity,
    CheckCircle2,
    MapPin,
    ArrowLeft,
    XCircle,
    CheckSquare
} from "lucide-react";

interface SessionDetail {
    id: string;
    schedule_id?: string | null;
    session_date: string;
    start_time: string;
    end_time: string;
    doctor_name: string;
    branch_name: string;
    appointment_count: number;
    status: string;
    queue_status?: {
        current_doctor_slot: number;
        current_nurse_slot: number;
        status: string;
    };
}

interface SessionPatient {
    appointment_id: string;
    appointment_time: string;
    status: string;
    patient_id: string;
    patient_name: string;
    slot_index?: number;
}

interface QuestionItem {
    id: string;
    question: string;
    description: string;
    category?: string | null;
    answers: { id: string; answer: string }[];
}

interface IntakeAnswer {
    question_id: string;
    answer_text: string;
}

const PatientSessionDetails: React.FC = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [patients, setPatients] = useState<SessionPatient[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [currentNurseSlot, setCurrentNurseSlot] = useState<number | null>(null);
    const [currentDoctorSlot, setCurrentDoctorSlot] = useState<number | null>(null);
    const [updatingSlot, setUpdatingSlot] = useState(false);
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<SessionPatient | null>(null);
    const [intake, setIntake] = useState({
        sex: "",
        age: "",
        height_cm: "",
        weight_kg: "",
        notes: "",
    });
    const [answerList, setAnswerList] = useState<IntakeAnswer[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState("");
    const [selectedAnswerText, setSelectedAnswerText] = useState("");
    const [customAnswerText, setCustomAnswerText] = useState("");
    const [loading, setLoading] = useState(false);
    const userRole = useSelector((state: RootState) => state.auth.userRole);

    // Profile modal state
    const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileForm, setProfileForm] = useState({ sex: "", age: "", height_cm: "", weight_kg: "" });
    const canEditProfile = useMemo(() => [1, 2, 3, 4].includes(userRole || 0), [userRole]);

    // Validation state
    const [validationErrors, setValidationErrors] = useState<{ [k: string]: string }>({});

    const selectedQuestion = useMemo(
        () => questions.find((q) => q.id === selectedQuestionId) || null,
        [questions, selectedQuestionId]
    );

    const loadDetails = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const [sessionResponse, patientsResponse, questionResponse, slotsResponse] = await Promise.all([
                api.get(`/sessions/${sessionId}`),
                api.get(`/sessions/${sessionId}/patients`),
                api.get("/questions"),
                api.get(`/sessions/${sessionId}/slots`),
            ]);
            const sess = sessionResponse as SessionDetail;
            setSession(sess);
            if (sess.queue_status) {
                setCurrentNurseSlot(sess.queue_status.current_nurse_slot);
                setCurrentDoctorSlot(sess.queue_status.current_doctor_slot);
            }

            setPatients(Array.isArray(patientsResponse) ? patientsResponse : (patientsResponse as any)?.data || []);
            setQuestions(Array.isArray(questionResponse) ? questionResponse : (questionResponse as any)?.data || []);
            const slotsData: any[] = Array.isArray(slotsResponse) ? slotsResponse : (slotsResponse as any)?.data || [];
            setSlots(slotsData);

            // Fallback if queue_status not present (or to sync with slots view logic)
            if (!sess.queue_status) {
                const currentNurse = slotsData.find((s: any) => s.is_current_with_nurse);
                const currentDoctor = slotsData.find((s: any) => s.is_current_with_doctor);
                setCurrentNurseSlot(currentNurse ? currentNurse.slot_index : 0);
                setCurrentDoctorSlot(currentDoctor ? currentDoctor.slot_index : 0);
            }
        } catch (error) {
            alert.error("Failed to load session details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
    }, [sessionId]);

    const addAnswer = () => {
        if (!selectedQuestionId) {
            alert.warn("Select a question first.");
            return;
        }
        const answerText = selectedAnswerText || customAnswerText;
        if (!answerText) {
            alert.warn("Provide an answer.");
            return;
        }
        setAnswerList((prev) => [...prev, { question_id: selectedQuestionId, answer_text: answerText }]);
        setSelectedQuestionId("");
        setSelectedAnswerText("");
        setCustomAnswerText("");
    };

    const removeAnswer = (index: number) => {
        setAnswerList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedAppointment || !sessionId) {
            alert.warn("Select a patient appointment first.");
            return;
        }

        const payload = {
            appointment_id: selectedAppointment.appointment_id,
            schedule_session_id: sessionId,
            sex: intake.sex || undefined,
            age: intake.age ? Number(intake.age) : undefined,
            height_cm: intake.height_cm ? Number(intake.height_cm) : undefined,
            weight_kg: intake.weight_kg ? Number(intake.weight_kg) : undefined,
            notes: intake.notes || undefined,
            answers: answerList,
        };

        try {
            await api.post("/patient-session/intake", payload);
            alert.success("Intake saved successfully.");
            setSelectedAppointment(null);
            setIntake({ sex: "", age: "", height_cm: "", weight_kg: "", notes: "" });
            setAnswerList([]);
        } catch (error) {
            alert.error("Failed to save intake.");
        }
    };

    const handleUpdateQueue = async () => {
        if (!sessionId) return;
        setUpdatingSlot(true);
        try {
            await api.patch(`/sessions/${sessionId}/queue`, {
                current_nurse_slot: currentNurseSlot,
                current_doctor_slot: currentDoctorSlot
            });
            alert.success("Updated queue status.");
            // reload details to refresh slots view
            const resp: any = await api.get(`/sessions/${sessionId}/slots`);
            setSlots(Array.isArray(resp) ? resp : []);
        } catch (err) {
            alert.error("Failed to update queue.");
        } finally {
            setUpdatingSlot(false);
        }
    };

    const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
        if (!sessionId) return;
        try {
            await api.patch(`/sessions/${sessionId}/appointments/${appointmentId}/status`, { status: newStatus });
            alert.success(`Patient marked as ${newStatus.replace('_', ' ')}.`);
            // Refresh patients list
            loadDetails();
        } catch (error) {
            alert.error("Failed to update status.");
        }
    };

    const handleFinalizeSession = async () => {
        if (!sessionId) return;
        if (!window.confirm("Are you sure you want to finalize this session? This will mark it as completed.")) return;

        try {
            await api.post(`/sessions/${sessionId}/finalize`, {});
            alert.success("Session finalized successfully.");
            navigate('/branch-admin/patient-sessions');
        } catch (error) {
            alert.error("Failed to finalize session.");
        }
    };

    const openEditProfile = async (patientId: string | null) => {
        if (!patientId) return;
        setEditingPatientId(patientId);
        setProfileLoading(true);
        try {
            const resp: any = await api.get(`/patients/${patientId}`, { params: { include_profile: true } });
            const data = resp as any;
            setProfileForm({
                sex: data?.patient_profile?.sex || "",
                age: data?.patient_profile?.age?.toString() || "",
                height_cm: data?.patient_profile?.height_cm?.toString() || "",
                weight_kg: data?.patient_profile?.weight_kg?.toString() || "",
            });
        } catch (err) {
            alert.error("Failed to load patient profile.");
            setEditingPatientId(null);
        } finally {
            setProfileLoading(false);
        }
    };

    const closeEditProfile = () => {
        setEditingPatientId(null);
        setProfileForm({ sex: "", age: "", height_cm: "", weight_kg: "" });
    };

    const saveProfile = async () => {
        if (!editingPatientId) return;
        // Client-side validation
        const errors: { [k: string]: string } = {};
        if (profileForm.age && Number(profileForm.age) < 0) errors.age = "Age must be >= 0";
        if (profileForm.height_cm && Number(profileForm.height_cm) <= 0) errors.height_cm = "Height must be > 0";
        if (profileForm.weight_kg && Number(profileForm.weight_kg) <= 0) errors.weight_kg = "Weight must be > 0";
        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) return;

        // Optimistic UI: update patients list locally first
        const previousPatients = patients.slice();
        try {
            // apply optimistic change to any matching patient in list
            setPatients((prev) =>
                prev.map((p) =>
                    p.patient_id === editingPatientId
                        ? { ...p, patient_name: p.patient_name } // name unchanged here; profile fields not shown in list
                        : p
                )
            );

            await api.put(`/patients/${editingPatientId}/profile`, {
                sex: profileForm.sex || null,
                age: profileForm.age ? Number(profileForm.age) : null,
                height_cm: profileForm.height_cm ? Number(profileForm.height_cm) : null,
                weight_kg: profileForm.weight_kg ? Number(profileForm.weight_kg) : null,
            });

            alert.success("Profile updated.");
            closeEditProfile();
        } catch (err) {
            // revert optimistic update
            setPatients(previousPatients);
            alert.error("Failed to update profile.");
        }
    };

    if (loading || !session) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {editingPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 transform transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-neutral-900">Edit Patient Profile</h3>
                            <button onClick={closeEditProfile} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {profileLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Sex</label>
                                    <select
                                        value={profileForm.sex}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, sex: e.target.value }))}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="">Select Sex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={profileForm.age}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={profileForm.height_cm}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, height_cm: e.target.value }))}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={profileForm.weight_kg}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, weight_kg: e.target.value }))}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-neutral-100">
                            <button
                                onClick={closeEditProfile}
                                className="px-5 py-2.5 text-neutral-600 hover:bg-neutral-50 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveProfile}
                                disabled={!canEditProfile}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title="Session Management"
                description={`Managing session for ${session.doctor_name}`}
                actions={
                    <button
                        onClick={() => navigate('/branch-admin/patient-sessions')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sessions
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Time Slot"
                    value={`${session.start_time} - ${session.end_time}`}
                    icon={Clock}
                    description={session.session_date}
                />
                <StatCard
                    title="Doctor"
                    value={session.doctor_name}
                    icon={Stethoscope}
                    description="Attending Physician"
                />
                <StatCard
                    title="Branch"
                    value={session.branch_name}
                    icon={MapPin}
                    description="Medical Center"
                />
                <StatCard
                    title="Appointments"
                    value={session.appointment_count}
                    icon={Users}
                    trend={{ value: patients.length, label: "checked in", isPositive: true }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Queue Control Card */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        Queue Control
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="text-sm text-emerald-600 font-medium mb-1">Doctor Slot</div>
                                <div className="text-3xl font-bold text-emerald-900">{currentDoctorSlot ?? '—'}</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="text-sm text-blue-600 font-medium mb-1">Nurse Slot</div>
                                <div className="text-3xl font-bold text-blue-900">{currentNurseSlot ?? '—'}</div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-100 pt-6">
                            <h3 className="text-sm font-medium text-neutral-700 mb-4">Update Current Slots</h3>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-neutral-500 mb-1.5">Doctor Slot</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={currentDoctorSlot ?? ''}
                                        onChange={(e) => setCurrentDoctorSlot(e.target.value ? Number(e.target.value) : 0)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-neutral-500 mb-1.5">Nurse Slot</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={currentNurseSlot ?? ''}
                                        onChange={(e) => setCurrentNurseSlot(e.target.value ? Number(e.target.value) : 0)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateQueue}
                                disabled={updatingSlot}
                                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {updatingSlot ? 'Updating Queue...' : 'Update Queue Status'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appointments List - Spans 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-neutral-500" />
                            Appointments List
                        </h2>
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                            {patients.length} Patients
                        </span>
                    </div>

                    {patients.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
                            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 font-medium">No appointments for this session</p>
                            <p className="text-neutral-400 text-sm mt-1">Patients will appear here once checked in</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden bg-white rounded-lg border border-neutral-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-6 py-4 font-medium w-max text-center">Slot</th>
                                        <th className="px-6 py-4 font-medium w-1/3">Patient Name</th>
                                        <th className="px-6 py-4 font-medium">Time</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {patients.map((patient) => (
                                        <tr key={patient.appointment_id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-center text-neutral-500">
                                                #{patient.slot_index}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-neutral-900">
                                                {patient.patient_name}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                                    {patient.appointment_time}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${patient.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                        patient.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                            'bg-neutral-100 text-neutral-700 border border-neutral-200'}`}>
                                                    {patient.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {(patient.status === 'pending' || patient.status === 'scheduled') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(patient.appointment_id, 'checked_in')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors border border-emerald-200"
                                                                title="Check In"
                                                            >
                                                                <CheckSquare className="w-3.5 h-3.5" />
                                                                Check In
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(patient.appointment_id, 'no_show')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors border border-rose-200"
                                                                title="No Show"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                No Show
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => openEditProfile(patient.patient_id)}
                                                        className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedAppointment(patient)}
                                                        className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors
                                                            ${selectedAppointment?.appointment_id === patient.appointment_id
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}
                                                    >
                                                        {selectedAppointment?.appointment_id === patient.appointment_id
                                                            ? 'Selected'
                                                            : 'Select'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Finalize Session</h3>
                    <p className="text-sm text-neutral-500">Close this session and move it to past sessions history.</p>
                </div>
                <button
                    onClick={handleFinalizeSession}
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    Finalize Session
                </button>
            </div>
        </div>
    );
};

export default PatientSessionDetails;
