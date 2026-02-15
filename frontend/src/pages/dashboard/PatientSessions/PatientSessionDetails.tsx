import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

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

            setPatients(Array.isArray(patientsResponse) ? patientsResponse : []);
            setQuestions(Array.isArray(questionResponse) ? questionResponse : []);
            const slotsData: any[] = Array.isArray(slotsResponse) ? slotsResponse : (slotsResponse?.data || []);
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
        return <div className="p-6 text-sm text-neutral-500">Loading session details...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {editingPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Patient Profile</h3>
                            <button onClick={closeEditProfile} className="text-neutral-500">Close</button>
                        </div>
                        {profileLoading ? (
                            <div className="p-6 text-sm text-neutral-500">Loading profile...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-neutral-500">Sex</label>
                                    <input value={profileForm.sex} onChange={(e) => setProfileForm((p) => ({ ...p, sex: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500">Age</label>
                                    <input value={profileForm.age} onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500">Height (cm)</label>
                                    <input value={profileForm.height_cm} onChange={(e) => setProfileForm((p) => ({ ...p, height_cm: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500">Weight (kg)</label>
                                    <input value={profileForm.weight_kg} onChange={(e) => setProfileForm((p) => ({ ...p, weight_kg: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={closeEditProfile} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={saveProfile} disabled={!canEditProfile} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-1">Queue Control</h2>
                    <div className="text-sm text-neutral-500 flex gap-4">
                        <span>Doctor Slot: {currentDoctorSlot ?? '—'}</span>
                        <span>Nurse Slot: {currentNurseSlot ?? '—'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-500 font-medium">Doctor Slot</label>
                        <input
                            type="number"
                            min={0}
                            value={currentDoctorSlot ?? ''}
                            onChange={(e) => setCurrentDoctorSlot(e.target.value ? Number(e.target.value) : 0)}
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm w-24"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-500 font-medium">Nurse Slot</label>
                        <input
                            type="number"
                            min={0}
                            value={currentNurseSlot ?? ''}
                            onChange={(e) => setCurrentNurseSlot(e.target.value ? Number(e.target.value) : 0)}
                            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm w-24"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleUpdateQueue}
                            disabled={updatingSlot}
                            className="h-[38px] px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {updatingSlot ? 'Saving...' : 'Update Queue'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Session Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                    <div>
                        <div className="text-xs text-neutral-500">Doctor</div>
                        <div className="font-medium">{session.doctor_name}</div>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Branch</div>
                        <div className="font-medium">{session.branch_name}</div>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Date</div>
                        <div className="font-medium">{session.session_date}</div>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Time</div>
                        <div className="font-medium">
                            {session.start_time} - {session.end_time}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Appointments</h3>
                {patients.length === 0 ? (
                    <div className="text-sm text-neutral-500">No appointments for this session.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-neutral-500 bg-neutral-50">
                            <tr>
                                <th className="text-left px-4 py-2">Patient</th>
                                <th className="text-left px-4 py-2">Time</th>
                                <th className="text-left px-4 py-2">Status</th>
                                <th className="text-right px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {patients.map((patient) => (
                                <tr key={patient.appointment_id}>
                                    <td className="px-4 py-2">{patient.patient_name}</td>
                                    <td className="px-4 py-2">{patient.appointment_time}</td>
                                    <td className="px-4 py-2 capitalize">{patient.status}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button
                                                onClick={() => setSelectedAppointment(patient)}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                                            >
                                                {selectedAppointment?.appointment_id === patient.appointment_id
                                                    ? "Selected"
                                                    : "Select"}
                                            </button>
                                            <button
                                                onClick={() => openEditProfile(patient.patient_id)}
                                                className="text-neutral-600 hover:text-neutral-800 text-sm"
                                            >
                                                Edit Profile
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Patient Intake</h3>
                {!selectedAppointment ? (
                    <div className="text-sm text-neutral-500">Select an appointment to begin intake.</div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Sex</label>
                                <select
                                    value={intake.sex}
                                    onChange={(e) => setIntake((prev) => ({ ...prev, sex: e.target.value }))}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="">Select Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={intake.age}
                                    onChange={(e) => setIntake((prev) => ({ ...prev, age: e.target.value }))}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    placeholder="Height in cm"
                                    value={intake.height_cm}
                                    onChange={(e) => setIntake((prev) => ({ ...prev, height_cm: e.target.value }))}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="Weight in kg"
                                    value={intake.weight_kg}
                                    onChange={(e) => setIntake((prev) => ({ ...prev, weight_kg: e.target.value }))}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1">Notes</label>
                            <textarea
                                placeholder="Additional notes..."
                                value={intake.notes}
                                onChange={(e) => setIntake((prev) => ({ ...prev, notes: e.target.value }))}
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                rows={3}
                            />
                        </div>

                        <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50">
                            <div className="text-sm font-semibold text-neutral-900 mb-4">Pre-Assessment Questions</div>

                            <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-neutral-700 mb-1">Question</label>
                                    <select
                                        value={selectedQuestionId}
                                        onChange={(e) => {
                                            setSelectedQuestionId(e.target.value);
                                            setSelectedAnswerText("");
                                            setCustomAnswerText("");
                                        }}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="">Select a question...</option>
                                        {questions.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                {q.question}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-neutral-700 mb-1">Answer</label>
                                    {selectedQuestion?.answers?.length ? (
                                        <select
                                            value={selectedAnswerText}
                                            onChange={(e) => {
                                                setSelectedAnswerText(e.target.value);
                                                setCustomAnswerText("");
                                            }}
                                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        >
                                            <option value="">Select an answer...</option>
                                            {selectedQuestion.answers.map((ans) => (
                                                <option key={ans.id} value={ans.answer}>
                                                    {ans.answer}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            placeholder="Type answer..."
                                            value={customAnswerText}
                                            onChange={(e) => setCustomAnswerText(e.target.value)}
                                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            disabled={!selectedQuestionId}
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={addAnswer}
                                    className="w-full md:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    disabled={!selectedQuestionId}
                                >
                                    Add
                                </button>
                            </div>

                            {answerList.length > 0 ? (
                                <div className="space-y-2">
                                    {answerList.map((ans, index) => {
                                        const question = questions.find((q) => q.id === ans.question_id);
                                        return (
                                            <div
                                                key={`${ans.question_id}-${index}`}
                                                className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-neutral-200 shadow-sm"
                                            >
                                                <div>
                                                    <div className="text-xs font-medium text-neutral-500 mb-0.5">{question?.question}</div>
                                                    <div className="text-sm text-neutral-900">{ans.answer_text}</div>
                                                </div>
                                                <button
                                                    onClick={() => removeAnswer(index)}
                                                    className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                                    title="Remove answer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-neutral-400 italic bg-white rounded-lg border border-neutral-200 border-dashed">
                                    No questions answered yet.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                            >
                                Save Patient Intake
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientSessionDetails;
