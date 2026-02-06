import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Eye, Bed, AlertTriangle,
    Heart, Activity, User, Calendar,
    FileText, RefreshCw, Loader2, AlertCircle
} from 'lucide-react';
import { nurseService } from '../../../services/nurseService';
import { useNavigate } from 'react-router-dom';

// Extended patient type with local display properties
interface DisplayPatient {
    id: number;
    name: string;
    age: number;
    gender: string;
    bed_number: string;
    admission_date: string;
    condition: 'stable' | 'critical' | 'observation';
    diagnosis: string;
    doctor: string;
    last_vitals: {
        temperature: string;
        bp: string;
        pulse: string;
        spo2: string;
        time: string;
    };
    alerts: number;
    phone?: string;
    address?: string;
}

export const NursePatients: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCondition, setFilterCondition] = useState('all');
    const [filterWard, setFilterWard] = useState('all');
    const [selectedPatient, setSelectedPatient] = useState<DisplayPatient | null>(null);
    const [patients, setPatients] = useState<DisplayPatient[]>([]);
    const [wards, setWards] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch patients from API
    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await nurseService.getAssignedPatients(filterWard !== 'all' ? { ward: filterWard } : undefined);
            // Transform API data to display format
            const displayPatients: DisplayPatient[] = (response || []).map((p: any) => ({
                id: p.id,
                name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                age: p.age || calculateAge(p.date_of_birth),
                gender: p.gender || 'Unknown',
                bed_number: p.bed_number || p.assignment?.bed_number || 'N/A',
                admission_date: p.admission_date || p.assignment?.assigned_date || new Date().toISOString(),
                condition: p.condition || p.status || 'stable',
                diagnosis: p.diagnosis || p.primary_diagnosis || 'Under evaluation',
                doctor: p.doctor || p.attending_doctor || 'Not assigned',
                last_vitals: p.last_vitals || {
                    temperature: '-',
                    bp: '-',
                    pulse: '-',
                    spo2: '-',
                    time: 'No readings'
                },
                alerts: p.alerts || 0,
                phone: p.phone || p.contact_number,
                address: p.address
            }));
            setPatients(displayPatients);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
            setError('Failed to load patients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch wards from API
    const fetchWards = async () => {
        try {
            const response = await nurseService.getWards();
            setWards(response || []);
        } catch (err) {
            console.error('Failed to fetch wards:', err);
        }
    };

    const calculateAge = (dateOfBirth: string | null | undefined): number => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        fetchPatients();
        fetchWards();
    }, [filterWard]);

    // Loading component
    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-neutral-600">Loading patients...</p>
        </div>
    );

    const getConditionBadge = (condition: string) => {
        const styles = {
            'critical': 'bg-error-100 text-red-800 border-red-300',
            'observation': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'stable': 'bg-green-100 text-green-800 border-green-300'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[condition as keyof typeof styles]}`}>
                {condition.toUpperCase()}
            </span>
        );
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.bed_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCondition = filterCondition === 'all' || p.condition === filterCondition;
        return matchesSearch && matchesCondition;
    });

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen sm:ml-64 mt-16">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <Users className="w-7 h-7 text-teal-600" />
                            My Patients
                        </h1>
                        <p className="text-neutral-600">Manage and monitor patients under your care</p>
                    </div>
                    <button
                        onClick={fetchPatients}
                        className="p-2 bg-teal-100 rounded-lg hover:bg-teal-200"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-error-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-error-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Total Patients</p>
                                <p className="text-2xl font-bold text-neutral-900">{patients.length}</p>
                            </div>
                            <Users className="w-10 h-10 text-teal-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Critical</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {patients.filter(p => p.condition === 'critical').length}
                                </p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Under Observation</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {patients.filter(p => p.condition === 'observation').length}
                                </p>
                            </div>
                            <Activity className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Stable</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {patients.filter(p => p.condition === 'stable').length}
                                </p>
                            </div>
                            <Heart className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name or bed number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-neutral-400" />
                            <select
                                value={filterCondition}
                                onChange={(e) => setFilterCondition(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Conditions</option>
                                <option value="critical">Critical</option>
                                <option value="observation">Observation</option>
                                <option value="stable">Stable</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bed className="w-5 h-5 text-neutral-400" />
                            <select
                                value={filterWard}
                                onChange={(e) => setFilterWard(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Wards</option>
                                {wards.map((ward) => (
                                    <option key={ward} value={ward}>{ward}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : patients.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-neutral-500 text-lg">No patients found</p>
                        <p className="text-neutral-400 text-sm mt-2">Patients assigned to you will appear here</p>
                    </div>
                ) : (
                    /* Patients Grid */
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPatients.map((patient) => (
                        <div key={patient.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                            <div className="p-4 border-b">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900">{patient.name}</h3>
                                            <p className="text-sm text-neutral-500">{patient.age}y • {patient.gender}</p>
                                        </div>
                                    </div>
                                    {patient.alerts > 0 && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-error-100 text-red-800 rounded-full text-xs">
                                            <AlertTriangle className="w-3 h-3" />
                                            {patient.alerts}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                                        <Bed className="w-4 h-4" />
                                        <span className="font-medium">{patient.bed_number}</span>
                                    </div>
                                    {getConditionBadge(patient.condition)}
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">Diagnosis</p>
                                    <p className="text-sm text-neutral-900">{patient.diagnosis}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <User className="w-4 h-4" />
                                    <span>{patient.doctor}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</span>
                                </div>

                                {/* Vital Signs Summary */}
                                <div className="pt-3 border-t">
                                    <p className="text-xs text-neutral-500 mb-2">Last Vitals ({patient.last_vitals.time})</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-neutral-400" />
                                            <span className="text-neutral-600">BP: {patient.last_vitals.bp}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-neutral-400" />
                                            <span className="text-neutral-600">HR: {patient.last_vitals.pulse}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-neutral-400" />
                                            <span className="text-neutral-600">SpO2: {patient.last_vitals.spo2}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-neutral-400" />
                                            <span className="text-neutral-600">Temp: {patient.last_vitals.temperature}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedPatient(patient)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </button>
                                <button 
                                    onClick={() => navigate('/nurse-dashboard/vital-signs')}
                                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                                    title="Record Vital Signs"
                                >
                                    <Heart className="w-5 h-5 text-neutral-600" />
                                </button>
                                <button className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50" title="Patient Notes">
                                    <FileText className="w-5 h-5 text-neutral-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                    </div>
                )}

                {/* Patient Detail Modal */}
                {selectedPatient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary-500" />
                                    Patient Details - {selectedPatient.name}
                                </h3>
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-neutral-400 hover:text-neutral-600 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Patient Name</label>
                                        <p className="text-neutral-900 font-medium">{selectedPatient.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Bed Number</label>
                                        <p className="text-neutral-900 font-medium">{selectedPatient.bed_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Age / Gender</label>
                                        <p className="text-neutral-900">{selectedPatient.age} years • {selectedPatient.gender}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Condition</label>
                                        <div className="mt-1">{getConditionBadge(selectedPatient.condition)}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-neutral-500 uppercase">Diagnosis</label>
                                        <p className="text-neutral-900">{selectedPatient.diagnosis}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Attending Doctor</label>
                                        <p className="text-neutral-900">{selectedPatient.doctor}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Admission Date</label>
                                        <p className="text-neutral-900">{new Date(selectedPatient.admission_date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-neutral-900 mb-3">Latest Vital Signs</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-neutral-600 mb-1">Blood Pressure</p>
                                            <p className="text-lg font-semibold text-neutral-900">{selectedPatient.last_vitals.bp}</p>
                                        </div>
                                        <div className="p-3 bg-error-50 rounded-lg">
                                            <p className="text-xs text-neutral-600 mb-1">Heart Rate</p>
                                            <p className="text-lg font-semibold text-neutral-900">{selectedPatient.last_vitals.pulse}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-xs text-neutral-600 mb-1">SpO2</p>
                                            <p className="text-lg font-semibold text-neutral-900">{selectedPatient.last_vitals.spo2}</p>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-xs text-neutral-600 mb-1">Temperature</p>
                                            <p className="text-lg font-semibold text-neutral-900">{selectedPatient.last_vitals.temperature}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">Recorded {selectedPatient.last_vitals.time}</p>
                                </div>
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                                    Update Vitals
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NursePatients;
