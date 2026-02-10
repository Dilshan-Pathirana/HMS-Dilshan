import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert";

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

    const selectedQuestion = useMemo(
        () => questions.find((q) => q.id === selectedQuestionId) || null,
        [questions, selectedQuestionId]
    );

    const loadDetails = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const [sessionResponse, patientsResponse, questionResponse] = await Promise.all([
                api.get(`/sessions/${sessionId}`),
                api.get(`/sessions/${sessionId}/patients`),
                api.get("/questions"),
            ]);
            setSession(sessionResponse as SessionDetail);
            setPatients(Array.isArray(patientsResponse) ? patientsResponse : []);
            setQuestions(Array.isArray(questionResponse) ? questionResponse : []);
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

    if (loading || !session) {
        return <div className="p-6 text-sm text-neutral-500">Loading session details...</div>;
    }

    return (
        <div className="p-6 space-y-6">
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
                                        <button
                                            onClick={() => setSelectedAppointment(patient)}
                                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                                        >
                                            {selectedAppointment?.appointment_id === patient.appointment_id
                                                ? "Selected"
                                                : "Select"}
                                        </button>
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
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                placeholder="Sex"
                                value={intake.sex}
                                onChange={(e) => setIntake((prev) => ({ ...prev, sex: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                placeholder="Age"
                                value={intake.age}
                                onChange={(e) => setIntake((prev) => ({ ...prev, age: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                placeholder="Height (cm)"
                                value={intake.height_cm}
                                onChange={(e) => setIntake((prev) => ({ ...prev, height_cm: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                placeholder="Weight (kg)"
                                value={intake.weight_kg}
                                onChange={(e) => setIntake((prev) => ({ ...prev, weight_kg: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <textarea
                            placeholder="Notes"
                            value={intake.notes}
                            onChange={(e) => setIntake((prev) => ({ ...prev, notes: e.target.value }))}
                            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
                            rows={3}
                        />

                        <div className="border border-neutral-200 rounded-xl p-4">
                            <div className="text-sm font-medium text-neutral-800 mb-2">Question & Answers</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <select
                                    value={selectedQuestionId}
                                    onChange={(e) => {
                                        setSelectedQuestionId(e.target.value);
                                        setSelectedAnswerText("");
                                        setCustomAnswerText("");
                                    }}
                                    className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Select question</option>
                                    {questions.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.question}
                                        </option>
                                    ))}
                                </select>

                                {selectedQuestion?.answers?.length ? (
                                    <select
                                        value={selectedAnswerText}
                                        onChange={(e) => {
                                            setSelectedAnswerText(e.target.value);
                                            setCustomAnswerText("");
                                        }}
                                        className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">Select answer</option>
                                        {selectedQuestion.answers.map((ans) => (
                                            <option key={ans.id} value={ans.answer}>
                                                {ans.answer}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        placeholder="Answer"
                                        value={customAnswerText}
                                        onChange={(e) => setCustomAnswerText(e.target.value)}
                                        className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                )}

                                <button
                                    onClick={addAnswer}
                                    className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm"
                                >
                                    Add Q&A
                                </button>
                            </div>

                            {answerList.length > 0 && (
                                <div className="mt-4 space-y-2 text-sm">
                                    {answerList.map((ans, index) => {
                                        const question = questions.find((q) => q.id === ans.question_id);
                                        return (
                                            <div
                                                key={`${ans.question_id}-${index}`}
                                                className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium text-neutral-800">{question?.question}</div>
                                                    <div className="text-neutral-600">{ans.answer_text}</div>
                                                </div>
                                                <button
                                                    onClick={() => removeAnswer(index)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm font-medium"
                        >
                            Save Intake
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientSessionDetails;
