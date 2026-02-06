import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    FileText,
    Download,
    Eye,
    Calendar,
    User,
    Stethoscope,
    FlaskConical,
    ChevronRight,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    Printer
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface VisitRecord {
    id: string;
    date: string;
    doctor_name: string;
    specialization: string;
    branch_name: string;
    diagnosis: string;
    notes: string;
    prescriptions: string[];
}

interface LabReport {
    id: string;
    test_name: string;
    date: string;
    status: 'pending' | 'completed';
    doctor_name: string;
    result_summary?: string;
    file_url?: string;
}

const PatientMedicalRecords: React.FC = () => {
    return (
        <Routes>
            <Route index element={<RecordsOverview />} />
            <Route path="visits" element={<VisitHistory />} />
            <Route path="labs" element={<LabReports />} />
        </Routes>
    );
};

// Records Overview
const RecordsOverview: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [recentVisits, setRecentVisits] = useState<VisitRecord[]>([]);
    const [recentLabs, setRecentLabs] = useState<LabReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                // Fetch visit history
                const visitsRes = await api.get(`/patient/visits/${userId}`);
                if (visitsRes.data.status === 200) {
                    setRecentVisits((visitsRes.data.visits || []).slice(0, 3));
                }
            } catch (error) {
                console.error('Failed to fetch records:', error);
            }

            try {
                // Fetch lab reports
                const labsRes = await api.get(`/patient/lab-reports/${userId}`);
                if (labsRes.data.status === 200) {
                    setRecentLabs((labsRes.data.reports || []).slice(0, 3));
                }
            } catch (error) {
                console.error('Failed to fetch lab reports:', error);
            }

            setLoading(false);
        };

        if (userId) {
            fetchRecords();
        }
    }, [userId]);

    const recordCategories = [
        { 
            title: 'Visit History', 
            description: 'View past consultations and diagnoses', 
            icon: <Stethoscope className="w-8 h-8" />,
            path: 'visits',
            count: recentVisits.length,
            color: 'bg-primary-500'
        },
        { 
            title: 'Lab Reports', 
            description: 'Access your laboratory results', 
            icon: <FlaskConical className="w-8 h-8" />,
            path: 'labs',
            count: recentLabs.length,
            color: 'bg-purple-500'
        },
    ];

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
            <div>
                <h1 className="text-2xl font-bold text-neutral-800">Medical Records</h1>
                <p className="text-neutral-500">Access your complete medical history</p>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordCategories.map((category) => (
                    <Link
                        key={category.path}
                        to={category.path}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`${category.color} text-white p-3 rounded-xl`}>
                                {category.icon}
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="font-semibold text-neutral-800 mt-4">{category.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{category.description}</p>
                        <p className="text-sm text-emerald-600 mt-2 font-medium">{category.count} records</p>
                    </Link>
                ))}
            </div>

            {/* Recent Visits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-800">Recent Visits</h2>
                    <Link to="visits" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {recentVisits.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No visit records found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentVisits.map((visit) => (
                            <div key={visit.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary-500">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-neutral-800">{visit.doctor_name}</p>
                                    <p className="text-sm text-neutral-500">{visit.specialization}</p>
                                    <p className="text-xs text-neutral-400 mt-1">{visit.diagnosis}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-neutral-700">
                                        {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <button className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mt-1">
                                        <Eye className="w-4 h-4" /> View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Lab Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-800">Recent Lab Reports</h2>
                    <Link to="labs" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {recentLabs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No lab reports found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentLabs.map((lab) => (
                            <div key={lab.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    lab.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                    <FlaskConical className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-neutral-800">{lab.test_name}</p>
                                    <p className="text-sm text-neutral-500">Ordered by: {lab.doctor_name}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        lab.status === 'completed' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {lab.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {lab.status}
                                    </span>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {new Date(lab.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800">Privacy & Security</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Your medical records are encrypted and stored securely. Only authorized healthcare providers 
                            can access your records with your consent. You can manage your data sharing preferences 
                            in your profile settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Visit History Component
const VisitHistory: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const response = await api.get(`/patient/visits/${userId}`);
                if (response.data.status === 200) {
                    setVisits(response.data.visits || []);
                }
            } catch (error) {
                // Mock data for demo
                setVisits([
                    {
                        id: '1',
                        date: '2025-12-15',
                        doctor_name: 'Dr. Sarah Johnson',
                        specialization: 'General Medicine',
                        branch_name: 'Main Branch',
                        diagnosis: 'Upper Respiratory Infection',
                        notes: 'Patient presented with cold symptoms. Prescribed antibiotics and rest.',
                        prescriptions: ['Amoxicillin 500mg', 'Paracetamol 500mg']
                    },
                    {
                        id: '2',
                        date: '2025-11-20',
                        doctor_name: 'Dr. Michael Chen',
                        specialization: 'Cardiology',
                        branch_name: 'City Center',
                        diagnosis: 'Routine Checkup',
                        notes: 'Blood pressure normal. Recommended regular exercise.',
                        prescriptions: []
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchVisits();
        }
    }, [userId]);

    const filteredVisits = visits.filter(visit =>
        visit.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div>
                <Link to="/patient-dashboard/records" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Records
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">Visit History</h1>
                <p className="text-neutral-500">View all your past consultations</p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by doctor, diagnosis, or specialization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>

            {/* Visits List */}
            {filteredVisits.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No visits found</h3>
                    <p className="text-neutral-500">Your visit history will appear here after consultations</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredVisits.map((visit) => (
                        <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-primary-500">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-800">{visit.doctor_name}</h3>
                                            <p className="text-sm text-neutral-500">{visit.specialization}</p>
                                            <p className="text-xs text-neutral-400">{visit.branch_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(visit.date).toLocaleDateString('en-US', { 
                                                weekday: 'short',
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-700">Diagnosis</p>
                                        <p className="text-neutral-600">{visit.diagnosis}</p>
                                    </div>
                                    
                                    {visit.notes && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral-700">Notes</p>
                                            <p className="text-neutral-600 text-sm">{visit.notes}</p>
                                        </div>
                                    )}

                                    {visit.prescriptions.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral-700 mb-1">Prescriptions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {visit.prescriptions.map((med, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full">
                                                        {med}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-neutral-50 border-t flex justify-end gap-2">
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors">
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                                    <Download className="w-4 h-4" /> Download PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Lab Reports Component
const LabReports: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [reports, setReports] = useState<LabReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get(`/patient/lab-reports/${userId}`);
                if (response.data.status === 200) {
                    setReports(response.data.reports || []);
                }
            } catch (error) {
                // Mock data for demo
                setReports([
                    {
                        id: '1',
                        test_name: 'Complete Blood Count (CBC)',
                        date: '2025-12-18',
                        status: 'completed',
                        doctor_name: 'Dr. Sarah Johnson',
                        result_summary: 'All values within normal range'
                    },
                    {
                        id: '2',
                        test_name: 'Lipid Panel',
                        date: '2025-12-19',
                        status: 'pending',
                        doctor_name: 'Dr. Michael Chen'
                    },
                    {
                        id: '3',
                        test_name: 'Thyroid Function Test',
                        date: '2025-12-10',
                        status: 'completed',
                        doctor_name: 'Dr. Emily Davis',
                        result_summary: 'TSH slightly elevated, follow-up recommended'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchReports();
        }
    }, [userId]);

    const filteredReports = reports.filter(report => 
        filter === 'all' || report.status === filter
    );

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
            <div>
                <Link to="/patient-dashboard/records" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Records
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">Lab Reports</h1>
                <p className="text-neutral-500">View and download your laboratory results</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'All Reports' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'completed', label: 'Completed' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === tab.key
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No reports found</h3>
                    <p className="text-neutral-500">Lab reports will appear here after tests are ordered</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        report.status === 'completed' 
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        <FlaskConical className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-neutral-800">{report.test_name}</h3>
                                        <p className="text-sm text-neutral-500">Ordered by: {report.doctor_name}</p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            {new Date(report.date).toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                                        report.status === 'completed' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {report.status === 'completed' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <Clock className="w-4 h-4" />
                                        )}
                                        {report.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>

                                    {report.status === 'completed' && (
                                        <div className="flex gap-2">
                                            <button className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {report.status === 'completed' && report.result_summary && (
                                <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                                    <p className="text-sm font-medium text-neutral-700">Result Summary</p>
                                    <p className="text-sm text-neutral-600 mt-1">{report.result_summary}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientMedicalRecords;
