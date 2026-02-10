import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../../utils/api/axios";
import alert from "../../../utils/alert";
import { RootState } from "../../../store";

interface ProfileDetail {
    id: string;
    user?: {
        first_name?: string;
        last_name?: string;
        email?: string;
    } | null;
    patient_profile?: {
        sex?: string;
        age?: number;
        height_cm?: number;
        weight_kg?: number;
    } | null;
    qa_history?: Array<{
        id: string;
        question: string;
        answer: string;
        created_by?: string | null;
        created_at: string;
        session_id?: string | null;
        appointment_id?: string | null;
    }>;
}

interface QuestionItem {
    id: string;
    question: string;
    answers: { id: string; answer: string }[];
}

const PatientProfileDetails: React.FC = () => {
    const { patientId } = useParams();
    const userRole = useSelector((state: RootState) => state.auth.userRole);
    const [profile, setProfile] = useState<ProfileDetail | null>(null);
    const [resolvedPatientId, setResolvedPatientId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [editProfile, setEditProfile] = useState({
        sex: "",
        age: "",
        height_cm: "",
        weight_kg: "",
    });
    const [qaForm, setQaForm] = useState({
        question_id: "",
        answer_text: "",
    });

    const canEditProfile = useMemo(() => userRole === 1 || userRole === 3, [userRole]);

    const loadProfile = async (targetId: string) => {
        try {
            const response: any = await api.get(`/patients/${targetId}`, { params: { include_profile: true } });
            setProfile(response as ProfileDetail);
            setEditProfile({
                sex: response?.patient_profile?.sex || "",
                age: response?.patient_profile?.age?.toString() || "",
                height_cm: response?.patient_profile?.height_cm?.toString() || "",
                weight_kg: response?.patient_profile?.weight_kg?.toString() || "",
            });
        } catch {
            alert.error("Failed to load patient profile.");
        }
    };

    const loadQuestions = async () => {
        try {
            const response: any = await api.get("/questions");
            setQuestions(Array.isArray(response) ? response : []);
        } catch {
            setQuestions([]);
        }
    };

    useEffect(() => {
        if (patientId) {
            setResolvedPatientId(patientId);
            loadProfile(patientId);
        } else if (userRole === 5) {
            api.get("/patients/me")
                .then((response: any) => {
                    if (response?.id) {
                        setResolvedPatientId(response.id);
                        loadProfile(response.id);
                    }
                })
                .catch(() => {
                    alert.error("Unable to load your profile.");
                });
        }
    }, [patientId, userRole]);

    useEffect(() => {
        loadQuestions();
    }, []);

    const handleSaveProfile = async () => {
        if (!resolvedPatientId) return;
        try {
            await api.put(`/patients/${resolvedPatientId}/profile`, {
                sex: editProfile.sex || null,
                age: editProfile.age ? Number(editProfile.age) : null,
                height_cm: editProfile.height_cm ? Number(editProfile.height_cm) : null,
                weight_kg: editProfile.weight_kg ? Number(editProfile.weight_kg) : null,
            });
            alert.success("Profile updated.");
            loadProfile(resolvedPatientId);
        } catch {
            alert.error("Failed to update profile.");
        }
    };

    const handleAddQa = async () => {
        if (!resolvedPatientId || !qaForm.question_id || !qaForm.answer_text) {
            alert.warn("Select a question and provide an answer.");
            return;
        }
        try {
            await api.post(`/patients/${resolvedPatientId}/qa`, [qaForm]);
            alert.success("Q&A added.");
            setQaForm({ question_id: "", answer_text: "" });
            loadProfile(resolvedPatientId);
        } catch {
            alert.error("Failed to add Q&A.");
        }
    };

    if (!profile) {
        return <div className="p-6 text-sm text-neutral-500">Loading profile...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Patient Profile</h2>
                <div className="text-sm text-neutral-700">
                    <div className="font-medium text-neutral-900">
                        {profile.user?.first_name} {profile.user?.last_name}
                    </div>
                    <div className="text-neutral-500">{profile.user?.email}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm text-neutral-700">
                    <div>
                        <div className="text-xs text-neutral-500">Sex</div>
                        {canEditProfile ? (
                            <input
                                value={editProfile.sex}
                                onChange={(e) => setEditProfile((prev) => ({ ...prev, sex: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
                            />
                        ) : (
                            <div className="font-medium">{profile.patient_profile?.sex || "-"}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Age</div>
                        {canEditProfile ? (
                            <input
                                value={editProfile.age}
                                onChange={(e) => setEditProfile((prev) => ({ ...prev, age: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
                            />
                        ) : (
                            <div className="font-medium">{profile.patient_profile?.age ?? "-"}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Height (cm)</div>
                        {canEditProfile ? (
                            <input
                                value={editProfile.height_cm}
                                onChange={(e) => setEditProfile((prev) => ({ ...prev, height_cm: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
                            />
                        ) : (
                            <div className="font-medium">{profile.patient_profile?.height_cm ?? "-"}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500">Weight (kg)</div>
                        {canEditProfile ? (
                            <input
                                value={editProfile.weight_kg}
                                onChange={(e) => setEditProfile((prev) => ({ ...prev, weight_kg: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full"
                            />
                        ) : (
                            <div className="font-medium">{profile.patient_profile?.weight_kg ?? "-"}</div>
                        )}
                    </div>
                </div>

                {canEditProfile && (
                    <div className="mt-4">
                        <button
                            onClick={handleSaveProfile}
                            className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm font-medium"
                        >
                            Save Profile
                        </button>
                    </div>
                )}
            </div>

            {(userRole === 1 || userRole === 3) && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-bold text-neutral-900 mb-3">Add Q&A</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            value={qaForm.question_id}
                            onChange={(e) => setQaForm((prev) => ({ ...prev, question_id: e.target.value }))}
                            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Select question</option>
                            {questions.map((q) => (
                                <option key={q.id} value={q.id}>
                                    {q.question}
                                </option>
                            ))}
                        </select>
                        <input
                            placeholder="Answer"
                            value={qaForm.answer_text}
                            onChange={(e) => setQaForm((prev) => ({ ...prev, answer_text: e.target.value }))}
                            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={handleAddQa}
                            className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Q&A History</h3>
                {profile.qa_history?.length ? (
                    <div className="space-y-3">
                        {profile.qa_history.map((qa) => (
                            <div key={qa.id} className="border border-neutral-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-neutral-900">{qa.question}</div>
                                <div className="text-sm text-neutral-700 mt-1">{qa.answer}</div>
                                <div className="text-xs text-neutral-500 mt-2">
                                    Added by {qa.created_by || "Unknown"} on {new Date(qa.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-neutral-500">No Q&A recorded yet.</div>
                )}
            </div>
        </div>
    );
};

export default PatientProfileDetails;
