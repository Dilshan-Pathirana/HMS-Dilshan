import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    Phone,
    Heart,
    AlertTriangle,
    Activity,
    Pill,
    FileText,
    Loader2,
    Clock
} from 'lucide-react';
import { PatientOverview } from './types';
import { getPatientOverview } from './consultationApi';

interface PatientOverviewModalProps {
    patientId: string;
    onClose: () => void;
}

const PatientOverviewModal: React.FC<PatientOverviewModalProps> = ({ patientId, onClose }) => {
    const [data, setData] = useState<PatientOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'diagnoses' | 'medications'>('profile');

    useEffect(() => {
        fetchPatientData();
    }, [patientId]);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getPatientOverview(patientId);
            setData(response);
        } catch (err: any) {
            console.error('Failed to fetch patient data:', err);
            setError(err.response?.data?.message || 'Failed to load patient data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="text-white">
                        <h2 className="text-xl font-bold">Patient Overview</h2>
                        <p className="text-blue-100 text-sm">Read-only medical history</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <div className="text-center">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                {data && !loading && (
                    <>
                        {/* Patient Header */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                                    {data.patient.first_name?.charAt(0)}{data.patient.last_name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {data.patient.first_name} {data.patient.last_name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                                        {data.patient.age && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {data.patient.age} years, {data.patient.gender}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {data.patient.phone}
                                        </span>
                                        {data.patient.blood_type && (
                                            <span className="flex items-center gap-1 text-red-600 font-medium">
                                                <Heart className="w-4 h-4" />
                                                {data.patient.blood_type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6">
                            <div className="flex gap-6">
                                {[
                                    { id: 'profile', label: 'Profile', icon: User },
                                    { id: 'history', label: 'Consultation History', icon: FileText },
                                    { id: 'diagnoses', label: 'Diagnoses', icon: Activity },
                                    { id: 'medications', label: 'Medications', icon: Pill }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                                            activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-500" />
                                            Personal Information
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Full Name</p>
                                                <p className="font-medium">{data.patient.first_name} {data.patient.last_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Date of Birth</p>
                                                <p className="font-medium">{formatDate(data.patient.date_of_birth || '')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Gender</p>
                                                <p className="font-medium">{data.patient.gender || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Blood Type</p>
                                                <p className="font-medium text-red-600">{data.patient.blood_type || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-blue-500" />
                                            Contact Information
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Phone</p>
                                                <p className="font-medium">{data.patient.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium">{data.patient.email || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Address</p>
                                                <p className="font-medium">{data.patient.address || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Emergency Contact</p>
                                                <p className="font-medium">{data.patient.emergency_contact || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Allergies */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            Allergies & Medical Conditions
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                <p className="text-sm text-red-600 font-medium mb-2">Known Allergies</p>
                                                <p className="text-gray-800">
                                                    {data.patient.allergies || 'No known allergies'}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                                <p className="text-sm text-amber-600 font-medium mb-2">Medical Conditions</p>
                                                <p className="text-gray-800">
                                                    {data.patient.medical_conditions || 'No recorded conditions'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {data.past_consultations.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No previous consultations</p>
                                        </div>
                                    ) : (
                                        data.past_consultations.map((consultation) => (
                                            <div
                                                key={consultation.id}
                                                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            Dr. {consultation.doctor_first_name} {consultation.doctor_last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatDateTime(consultation.started_at)}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 text-xs rounded-full ${
                                                        consultation.status === 'medicines_issued' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {consultation.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>

                                                {consultation.chief_complaint && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-500">Chief Complaint</p>
                                                        <p className="text-gray-800">{consultation.chief_complaint}</p>
                                                    </div>
                                                )}

                                                {consultation.diagnoses.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-500 mb-1">Diagnoses</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {consultation.diagnoses.map((d, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                                        d.diagnosis_type === 'primary'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                    }`}
                                                                >
                                                                    {d.diagnosis_name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {consultation.prescriptions.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-500 mb-1">Prescriptions</p>
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            {consultation.prescriptions.map((p, i) => (
                                                                <p key={i} className="text-sm text-gray-700">
                                                                    • {p.medicine_name} {p.potency} - {p.dosage}, {p.frequency} for {p.duration}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {consultation.follow_up_instructions && (
                                                    <div className="bg-blue-50 rounded-lg p-3 mt-3">
                                                        <p className="text-sm text-blue-600 font-medium">Follow-up Instructions</p>
                                                        <p className="text-sm text-gray-700">{consultation.follow_up_instructions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Diagnoses Tab */}
                            {activeTab === 'diagnoses' && (
                                <div className="space-y-4">
                                    {data.all_diagnoses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No diagnoses recorded</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Diagnosis</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {data.all_diagnoses.map((d, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-800">{d.diagnosis_name}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    d.diagnosis_type === 'primary'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : d.diagnosis_type === 'secondary'
                                                                        ? 'bg-purple-100 text-purple-700'
                                                                        : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {d.diagnosis_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {formatDate(d.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Medications Tab */}
                            {activeTab === 'medications' && (
                                <div className="space-y-4">
                                    {data.medication_history.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No medication history</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Medicine</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Potency</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dosage</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frequency</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {data.medication_history.map((m, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-800">{m.medicine_name}</td>
                                                            <td className="px-4 py-3 text-gray-600">{m.potency}</td>
                                                            <td className="px-4 py-3 text-gray-600">{m.dosage}</td>
                                                            <td className="px-4 py-3 text-gray-600">{m.frequency}</td>
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {formatDate(m.started_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientOverviewModal;
