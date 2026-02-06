import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Pill,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Info,
    User,
    Search,
    Filter
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    start_date: string;
    end_date?: string;
    prescribed_by: string;
    status: 'active' | 'completed' | 'discontinued';
    instructions?: string;
    refills_remaining?: number;
}

const PatientMedications: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMedications = async () => {
            try {
                const response = await api.get(`/patient/medications/${userId}`);
                if (response.data.status === 200) {
                    setMedications(response.data.medications || []);
                }
            } catch (error) {
                // Mock data for demo
                setMedications([
                    {
                        id: '1',
                        name: 'Metformin',
                        dosage: '500mg',
                        frequency: 'Twice daily',
                        duration: 'Ongoing',
                        start_date: '2025-01-15',
                        prescribed_by: 'Dr. Sarah Johnson',
                        status: 'active',
                        instructions: 'Take with meals',
                        refills_remaining: 3
                    },
                    {
                        id: '2',
                        name: 'Lisinopril',
                        dosage: '10mg',
                        frequency: 'Once daily',
                        duration: 'Ongoing',
                        start_date: '2025-02-01',
                        prescribed_by: 'Dr. Michael Chen',
                        status: 'active',
                        instructions: 'Take in the morning',
                        refills_remaining: 5
                    },
                    {
                        id: '3',
                        name: 'Amoxicillin',
                        dosage: '500mg',
                        frequency: 'Three times daily',
                        duration: '7 days',
                        start_date: '2025-12-10',
                        end_date: '2025-12-17',
                        prescribed_by: 'Dr. Emily Davis',
                        status: 'completed',
                        instructions: 'Complete the full course'
                    },
                    {
                        id: '4',
                        name: 'Ibuprofen',
                        dosage: '400mg',
                        frequency: 'As needed',
                        duration: '14 days',
                        start_date: '2025-11-01',
                        end_date: '2025-11-15',
                        prescribed_by: 'Dr. Sarah Johnson',
                        status: 'completed',
                        instructions: 'Take with food, maximum 3 times per day'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchMedications();
        }
    }, [userId]);

    const filteredMedications = medications.filter(med => {
        const matchesFilter = filter === 'all' || med.status === filter || (filter === 'completed' && med.status === 'discontinued');
        const matchesSearch = searchTerm === '' || 
            med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            med.prescribed_by.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const activeMeds = medications.filter(m => m.status === 'active');
    const completedMeds = medications.filter(m => m.status === 'completed' || m.status === 'discontinued');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'discontinued': return 'bg-error-100 text-red-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Pill className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

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
                <h1 className="text-2xl font-bold text-neutral-800">My Medications</h1>
                <p className="text-neutral-500">Track your prescribed medications and dosages</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Active Medications</p>
                            <p className="text-3xl font-bold text-green-600">{activeMeds.length}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Pill className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Completed Courses</p>
                            <p className="text-3xl font-bold text-primary-500">{completedMeds.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-primary-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Total Prescriptions</p>
                            <p className="text-3xl font-bold text-purple-600">{medications.length}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Calendar className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search medications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {[
                            { key: 'active', label: 'Active' },
                            { key: 'completed', label: 'Completed' },
                            { key: 'all', label: 'All' }
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
                </div>
            </div>

            {/* Medications List */}
            {filteredMedications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No medications found</h3>
                    <p className="text-neutral-500">Your prescribed medications will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMedications.map((med) => (
                        <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Medication Icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                    med.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                    <Pill className="w-7 h-7" />
                                </div>

                                {/* Medication Details */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-neutral-800 text-lg">{med.name}</h3>
                                            <p className="text-emerald-600 font-medium">{med.dosage}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(med.status)}`}>
                                            {getStatusIcon(med.status)}
                                            {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        <div>
                                            <p className="text-xs text-neutral-400 uppercase tracking-wide">Frequency</p>
                                            <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                                                <Clock className="w-4 h-4 text-neutral-400" />
                                                {med.frequency}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-400 uppercase tracking-wide">Duration</p>
                                            <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-neutral-400" />
                                                {med.duration}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-400 uppercase tracking-wide">Start Date</p>
                                            <p className="text-sm font-medium text-neutral-700">
                                                {new Date(med.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-400 uppercase tracking-wide">Prescribed By</p>
                                            <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                                                <User className="w-4 h-4 text-neutral-400" />
                                                {med.prescribed_by}
                                            </p>
                                        </div>
                                    </div>

                                    {med.instructions && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                                            <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Instructions</p>
                                                <p className="text-sm text-blue-700">{med.instructions}</p>
                                            </div>
                                        </div>
                                    )}

                                    {med.status === 'active' && med.refills_remaining !== undefined && (
                                        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                                            <span className="px-2 py-1 bg-neutral-100 rounded-full">
                                                {med.refills_remaining} refills remaining
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Important Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-800">Important Medication Reminder</h4>
                        <ul className="mt-2 space-y-1 text-sm text-amber-700">
                            <li>• Always take medications as prescribed by your doctor</li>
                            <li>• Do not stop or change dosages without consulting your healthcare provider</li>
                            <li>• Report any side effects to your doctor immediately</li>
                            <li>• Keep track of refills and request them before running out</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientMedications;
