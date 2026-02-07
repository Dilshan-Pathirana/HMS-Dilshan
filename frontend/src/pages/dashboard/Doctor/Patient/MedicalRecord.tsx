import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    User,
    Calendar,
    Phone,
    MapPin,
    Activity,
    FileText,
    Pill,
    Thermometer,
    Clock,
    ChevronLeft,
    AlertCircle,
    Plus,
    Stethoscope,
    Microscope,
    History
} from "lucide-react";
import api from "../../../../utils/api/axios";
import { PageHeader } from "../../../../components/ui/PageHeader";

interface PatientDetails {
    _id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    contactNumber: string;
    address: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}

const MedicalRecord = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<PatientDetails | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/patient/get-patient/${id}`);
                if (response.data) {
                    setPatient(response.data.patient);
                }
            } catch (error) {
                console.error("Error fetching patient details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPatientDetails();
        }
    }, [id]);

    const calculateAge = (dob: string) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: Activity },
        { id: "history", label: "Medical History", icon: History },
        { id: "prescriptions", label: "Prescriptions", icon: Pill },
        { id: "vitals", label: "Vitals", icon: Thermometer },
        { id: "lab_results", label: "Lab Results", icon: Microscope },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4" />
                <p className="text-neutral-500 font-medium">Loading patient record...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-bold text-neutral-900">Patient Not Found</h3>
                <p className="text-neutral-500 mb-6">The requested patient record could not be found.</p>
                <button
                    onClick={() => navigate("/doctor/patients")}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors font-medium"
                >
                    Back to Patient List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Back Button */}
            <div>
                <button
                    onClick={() => navigate("/doctor/patients")}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-4 text-sm font-medium"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Patients
                </button>
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl border-4 border-white shadow-sm">
                            {patient.firstName[0]}
                            {patient.lastName[0]}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
                                <span className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                    <User className="w-3.5 h-3.5" />
                                    {calculateAge(patient.dateOfBirth)} Years • {patient.gender}
                                </span>
                                <span className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                    <Activity className="w-3.5 h-3.5" />
                                    Blood Group: <span className="font-semibold text-neutral-900">{patient.bloodGroup || 'N/A'}</span>
                                </span>
                                <span className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                    <Phone className="w-3.5 h-3.5" />
                                    {patient.contactNumber}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium shadow-sm">
                                <FileText className="w-4 h-4" />
                                Edit Details
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm shadow-primary-200">
                                <Plus className="w-4 h-4" />
                                New Consultation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                            }
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Vital Summary */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary-500" />
                                    Recent Vitals
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="text-xs text-blue-600 font-medium mb-1">Blood Pressure</div>
                                        <div className="text-xl font-bold text-neutral-900">120/80</div>
                                        <div className="text-xs text-neutral-500 mt-1">Normal</div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                        <div className="text-xs text-red-600 font-medium mb-1">Heart Rate</div>
                                        <div className="text-xl font-bold text-neutral-900">72 <span className="text-xs font-normal text-neutral-500">bpm</span></div>
                                        <div className="text-xs text-neutral-500 mt-1">Normal</div>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <div className="text-xs text-amber-600 font-medium mb-1">Temp</div>
                                        <div className="text-xl font-bold text-neutral-900">98.6 <span className="text-xs font-normal text-neutral-500">°F</span></div>
                                        <div className="text-xs text-neutral-500 mt-1">Normal</div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="text-xs text-emerald-600 font-medium mb-1">SpO2</div>
                                        <div className="text-xl font-bold text-neutral-900">98 <span className="text-xs font-normal text-neutral-500">%</span></div>
                                        <div className="text-xs text-neutral-500 mt-1">Good</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary-500" />
                                    Recent Visits
                                </h3>
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="flex gap-4 p-4 border border-neutral-100 rounded-xl hover:border-primary-100 transition-colors">
                                            <div className="w-12 h-12 bg-neutral-50 rounded-lg flex flex-col items-center justify-center text-neutral-600 border border-neutral-200">
                                                <span className="text-xs font-bold uppercase">Oct</span>
                                                <span className="text-lg font-bold">{10 + i}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-neutral-900">General Checkup</h4>
                                                        <p className="text-sm text-neutral-500">Dr. Sarah Wilson • Cardiology</p>
                                                    </div>
                                                    <button className="text-sm font-medium text-primary-600 hover:text-primary-700">View Details</button>
                                                </div>
                                                <p className="text-sm text-neutral-600 mt-2 line-clamp-1">
                                                    Patient reported mild chest pain. ECG performed and results are normal.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Allergies</h3>
                                {patient.allergies && patient.allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {patient.allergies.map((allergy, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                                                {allergy}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 italic">No known allergies</p>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Chronic Conditions</h3>
                                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                                    <div className="space-y-2">
                                        {patient.chronicConditions.map((condition, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-neutral-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                {condition}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 italic">No chronic conditions recorded</p>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Emergency Contact</h3>
                                {patient.emergencyContact ? (
                                    <div className="space-y-2">
                                        <p className="font-bold text-neutral-900">{patient.emergencyContact.name}</p>
                                        <p className="text-sm text-neutral-600 flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" />
                                            {patient.emergencyContact.phone}
                                        </p>
                                        <p className="text-sm text-neutral-500">{patient.emergencyContact.relationship}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 italic">Not set</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholder for other tabs */}
                {activeTab !== "overview" && (
                    <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                            {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-8 h-8" })}
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{tabs.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-neutral-500">This section is currently under development.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalRecord;
