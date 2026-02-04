import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    TestTube,
    Plus,
    ChevronLeft,
    Loader2,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    FileText,
    Eye,
    Calendar,
    User,
    Filter,
    Download
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Investigation {
    id: string;
    patient_name: string;
    patient_id: string;
    test_type: string;
    test_name: string;
    priority: 'normal' | 'urgent' | 'stat';
    status: 'ordered' | 'in-progress' | 'completed' | 'reviewed';
    ordered_date: string;
    result_date?: string;
    clinical_justification: string;
    result?: string;
    interpretation?: string;
}

// Main Investigations Component
const DoctorInvestigations: React.FC = () => {
    return (
        <Routes>
            <Route index element={<InvestigationsList />} />
            <Route path="order" element={<OrderInvestigation />} />
            <Route path=":investigationId" element={<ViewInvestigation />} />
        </Routes>
    );
};

// Investigations List
const InvestigationsList: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvestigations();
    }, [userId]);

    const fetchInvestigations = async () => {
        try {
            setLoading(true);
            // This would be an actual API call
            // For now, setting empty array
            setInvestigations([]);
        } catch (error) {
            console.error('Failed to fetch investigations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'stat':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">STAT</span>;
            case 'urgent':
                return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Urgent</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Normal</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
            case 'reviewed':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> Reviewed</span>;
            case 'in-progress':
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Ordered</span>;
        }
    };

    const filteredInvestigations = investigations.filter(inv => {
        const matchesFilter = filter === 'all' || 
            (filter === 'pending' && (inv.status === 'ordered' || inv.status === 'in-progress' || inv.status === 'completed')) ||
            (filter === 'completed' && inv.status === 'reviewed');
        
        const matchesSearch = searchTerm === '' ||
            inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.test_name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Investigations</h1>
                    <p className="text-gray-500">Order and review lab tests and imaging studies</p>
                </div>
                <Link
                    to="order"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Order Investigation
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by patient or test name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'pending', label: 'Pending Review' },
                            { key: 'completed', label: 'Reviewed' },
                            { key: 'all', label: 'All' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === tab.key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pending Results Alert */}
            {investigations.filter(i => i.status === 'completed').length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                        <div>
                            <p className="font-medium text-orange-800">Results Pending Review</p>
                            <p className="text-sm text-orange-600">
                                You have {investigations.filter(i => i.status === 'completed').length} investigation results awaiting your review
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Investigations List */}
            {filteredInvestigations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No investigations found</h3>
                    <p className="text-gray-500 mb-4">
                        {filter === 'pending' ? "No pending investigations to review" : "No investigations match your criteria"}
                    </p>
                    <Link
                        to="order"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Order New Investigation
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="divide-y divide-gray-100">
                        {filteredInvestigations.map((inv) => (
                            <Link
                                key={inv.id}
                                to={inv.id}
                                className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        inv.test_type === 'lab' ? 'bg-purple-100' : 'bg-blue-100'
                                    }`}>
                                        <TestTube className={`w-6 h-6 ${
                                            inv.test_type === 'lab' ? 'text-purple-600' : 'text-blue-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{inv.test_name}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {inv.patient_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{inv.ordered_date}</p>
                                        {inv.result_date && (
                                            <p className="text-xs text-gray-400">Result: {inv.result_date}</p>
                                        )}
                                    </div>
                                    {getPriorityBadge(inv.priority)}
                                    {getStatusBadge(inv.status)}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Order Investigation Component
const OrderInvestigation: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patient');
    const appointmentId = searchParams.get('appointment');
    
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        patient_id: patientId || '',
        priority: 'normal',
        clinical_justification: ''
    });

    const testCategories = [
        {
            name: 'Laboratory Tests',
            type: 'lab',
            tests: [
                { id: 'cbc', name: 'Complete Blood Count (CBC)' },
                { id: 'bmp', name: 'Basic Metabolic Panel' },
                { id: 'lipid', name: 'Lipid Panel' },
                { id: 'lft', name: 'Liver Function Tests' },
                { id: 'rft', name: 'Renal Function Tests' },
                { id: 'tft', name: 'Thyroid Function Tests' },
                { id: 'hba1c', name: 'HbA1c' },
                { id: 'fbs', name: 'Fasting Blood Sugar' },
                { id: 'urine', name: 'Urine Analysis' },
                { id: 'esr', name: 'ESR' }
            ]
        },
        {
            name: 'Imaging Studies',
            type: 'imaging',
            tests: [
                { id: 'xray-chest', name: 'Chest X-Ray' },
                { id: 'xray-spine', name: 'Spine X-Ray' },
                { id: 'ct-head', name: 'CT Scan - Head' },
                { id: 'ct-chest', name: 'CT Scan - Chest' },
                { id: 'ct-abdomen', name: 'CT Scan - Abdomen' },
                { id: 'mri-brain', name: 'MRI - Brain' },
                { id: 'mri-spine', name: 'MRI - Spine' },
                { id: 'ultrasound-abdomen', name: 'Ultrasound - Abdomen' },
                { id: 'ecg', name: 'ECG' },
                { id: 'echo', name: 'Echocardiogram' }
            ]
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTests.length === 0) {
            alert('Please select at least one test');
            return;
        }

        setLoading(true);
        try {
            await api.post('/order-investigation', {
                ...formData,
                tests: selectedTests,
                appointment_id: appointmentId
            });
            alert('Investigation ordered successfully!');
            navigate('/doctor-dashboard-new/investigations');
        } catch (error) {
            console.error('Failed to order investigation:', error);
            alert('Failed to order investigation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleTest = (testId: string) => {
        setSelectedTests(prev => 
            prev.includes(testId) 
                ? prev.filter(t => t !== testId)
                : [...prev, testId]
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/investigations" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Investigations
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Order Investigation</h1>
                <p className="text-gray-500">Order lab tests or imaging studies for a patient</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h2>
                    {patientId ? (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                P
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Patient ID: {patientId}</p>
                                <p className="text-sm text-gray-500">From current consultation</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patient by name or phone..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Test Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Tests</h2>
                    
                    {testCategories.map((category) => (
                        <div key={category.type} className="mb-6 last:mb-0">
                            <h3 className="font-medium text-gray-700 mb-3">{category.name}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {category.tests.map((test) => (
                                    <button
                                        key={test.id}
                                        type="button"
                                        onClick={() => toggleTest(test.id)}
                                        className={`p-3 border rounded-lg text-left transition-all ${
                                            selectedTests.includes(test.id)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                selectedTests.includes(test.id)
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'border-gray-300'
                                            }`}>
                                                {selectedTests.includes(test.id) && (
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="text-sm">{test.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {selectedTests.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>{selectedTests.length}</strong> test(s) selected
                            </p>
                        </div>
                    )}
                </div>

                {/* Priority & Justification */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Clinical Details</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <div className="flex gap-3">
                                {[
                                    { value: 'normal', label: 'Normal', color: 'gray' },
                                    { value: 'urgent', label: 'Urgent', color: 'orange' },
                                    { value: 'stat', label: 'STAT', color: 'red' }
                                ].map((priority) => (
                                    <button
                                        key={priority.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: priority.value })}
                                        className={`px-4 py-2 rounded-lg border transition-all ${
                                            formData.priority === priority.value
                                                ? priority.value === 'stat' 
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : priority.value === 'urgent'
                                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                        : 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {priority.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clinical Justification <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={formData.clinical_justification}
                                onChange={(e) => setFormData({ ...formData, clinical_justification: e.target.value })}
                                placeholder="Reason for ordering these investigations..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/doctor-dashboard-new/investigations')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || selectedTests.length === 0}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Ordering...
                            </>
                        ) : (
                            <>
                                <TestTube className="w-5 h-5" />
                                Order Investigation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// View Investigation Component
const ViewInvestigation: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link to="/doctor-dashboard-new/investigations" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Investigations
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Investigation Results</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Results Not Available</h3>
                <p className="text-gray-500">Investigation results will appear here once available</p>
            </div>
        </div>
    );
};

export default DoctorInvestigations;
