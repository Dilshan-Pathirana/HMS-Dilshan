import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    FolderOpen,
    Search,
    Loader2,
    User,
    Calendar,
    FileText,
    Pill,
    TestTube,
    Activity,
    ChevronRight,
    AlertTriangle,
    Heart,
    Stethoscope,
    Filter
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface PatientRecord {
    id: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    blood_group: string;
    address: string;
    last_visit: string;
    allergies: string[];
    chronic_conditions: string[];
    visits: Visit[];
}

interface Visit {
    id: string;
    date: string;
    doctor_name: string;
    branch_name: string;
    diagnosis: string;
    prescriptions: any[];
    investigations: any[];
    notes: string;
}

const DoctorPatientRecords: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'prescriptions' | 'investigations'>('overview');

    const searchPatients = async () => {
        if (!searchTerm.trim()) return;

        try {
            setLoading(true);
            // API call to search patients
            // const response = await api.get(`/search-patients?q=${searchTerm}`);
            // setPatients(response.data);
            setPatients([]);
        } catch (error) {
            console.error('Failed to search patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchPatients();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-800">Patient Records</h1>
                <p className="text-neutral-500">Search and view patient medical history</p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name, phone, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchTerm.trim()}
                        className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Search
                    </button>
                </form>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient List / Search Results */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-neutral-800">
                                {patients.length > 0 ? `Search Results (${patients.length})` : 'Recent Patients'}
                            </h3>
                        </div>
                        
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {patients.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-neutral-500 text-sm">Search for patients to view their records</p>
                                </div>
                            ) : (
                                patients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => setSelectedPatient(patient)}
                                        className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${
                                            selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-primary-500 font-medium">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-800">{patient.name}</p>
                                                    <p className="text-sm text-neutral-500">{patient.phone}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-neutral-400" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Patient Details */}
                <div className="lg:col-span-2">
                    {selectedPatient ? (
                        <div className="space-y-6">
                            {/* Patient Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-primary-500 text-xl font-bold">
                                        {selectedPatient.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-neutral-800">{selectedPatient.name}</h2>
                                        <p className="text-neutral-500">{selectedPatient.phone} • {selectedPatient.email}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                                                {selectedPatient.gender}
                                            </span>
                                            <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                                                DOB: {selectedPatient.dob}
                                            </span>
                                            <span className="px-2 py-1 text-xs bg-error-100 text-error-600 rounded-full">
                                                Blood: {selectedPatient.blood_group}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerts */}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {selectedPatient.allergies.length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-error-50 border border-red-200 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-error-500" />
                                            <span className="text-sm text-red-700">
                                                Allergies: {selectedPatient.allergies.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedPatient.chronic_conditions.length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                                            <Heart className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm text-orange-700">
                                                Conditions: {selectedPatient.chronic_conditions.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="flex border-b border-gray-100">
                                    {[
                                        { key: 'overview', label: 'Overview', icon: User },
                                        { key: 'visits', label: 'Visit History', icon: Stethoscope },
                                        { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
                                        { key: 'investigations', label: 'Investigations', icon: TestTube }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key as any)}
                                            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                                                activeTab === tab.key
                                                    ? 'text-primary-500 border-b-2 border-primary-500 bg-blue-50'
                                                    : 'text-neutral-500 hover:text-neutral-700'
                                            }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6">
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-neutral-50 rounded-lg">
                                                    <p className="text-sm text-neutral-500">Total Visits</p>
                                                    <p className="text-2xl font-bold text-neutral-800">{selectedPatient.visits.length}</p>
                                                </div>
                                                <div className="p-4 bg-neutral-50 rounded-lg">
                                                    <p className="text-sm text-neutral-500">Last Visit</p>
                                                    <p className="text-lg font-semibold text-neutral-800">{selectedPatient.last_visit}</p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-neutral-800 mb-3">Recent Diagnoses</h4>
                                                {selectedPatient.visits.slice(0, 3).map((visit) => (
                                                    <div key={visit.id} className="p-3 border border-neutral-200 rounded-lg mb-2">
                                                        <div className="flex justify-between">
                                                            <p className="font-medium text-neutral-700">{visit.diagnosis}</p>
                                                            <p className="text-sm text-neutral-500">{visit.date}</p>
                                                        </div>
                                                        <p className="text-sm text-neutral-500 mt-1">Dr. {visit.doctor_name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'visits' && (
                                        <div className="space-y-4">
                                            {selectedPatient.visits.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-neutral-500">No visit history</p>
                                                </div>
                                            ) : (
                                                selectedPatient.visits.map((visit) => (
                                                    <div key={visit.id} className="p-4 border border-neutral-200 rounded-lg">
                                                        <div className="flex justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-neutral-400" />
                                                                <span className="font-medium text-neutral-800">{visit.date}</span>
                                                            </div>
                                                            <span className="text-sm text-neutral-500">{visit.branch_name}</span>
                                                        </div>
                                                        <p className="text-neutral-700 mb-2">{visit.diagnosis}</p>
                                                        <p className="text-sm text-neutral-500">Consulted with Dr. {visit.doctor_name}</p>
                                                        {visit.notes && (
                                                            <p className="text-sm text-neutral-600 mt-2 p-2 bg-neutral-50 rounded">{visit.notes}</p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'prescriptions' && (
                                        <div className="text-center py-8">
                                            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-neutral-500">Prescription history will be displayed here</p>
                                        </div>
                                    )}

                                    {activeTab === 'investigations' && (
                                        <div className="text-center py-8">
                                            <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-neutral-500">Investigation history will be displayed here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-800 mb-2">Select a Patient</h3>
                            <p className="text-neutral-500">Search for a patient to view their medical records</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorPatientRecords;
