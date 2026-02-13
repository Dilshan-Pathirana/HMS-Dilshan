import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Eye, Bed, AlertTriangle,
    Heart, Activity, User, Calendar, RefreshCw, Loader2,
    AlertCircle, Stethoscope, Thermometer, Droplets, FileText, X
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

    const getConditionBadge = (condition: string) => {
        const styles = {
            'critical': 'bg-red-100 text-red-700 border-red-200',
            'observation': 'bg-amber-100 text-amber-700 border-amber-200',
            'stable': 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        const icons = {
            'critical': <AlertTriangle className="w-3 h-3" />,
            'observation': <Eye className="w-3 h-3" />,
            'stable': <Heart className="w-3 h-3" />
        };
        const key = condition as keyof typeof styles;

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${styles[key] || styles['stable']}`}>
                {icons[key]}
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
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm">
                            <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        My Patients
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-12">Manage and monitor patients under your care</p>
                </div>
                <button
                    onClick={fetchPatients}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-emerald-600 transition-colors shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="font-medium">Refresh Data</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Patients', value: patients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Critical Condition', value: patients.filter(p => p.condition === 'critical').length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                    { label: 'Under Observation', value: patients.filter(p => p.condition === 'observation').length, icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'Stable', value: patients.filter(p => p.condition === 'stable').length, icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-600 ml-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by name or bed number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 min-w-[140px]">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <select
                            value={filterCondition}
                            onChange={(e) => setFilterCondition(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-neutral-700 focus:ring-0 w-full cursor-pointer"
                        >
                            <option value="all">All Conditions</option>
                            <option value="critical">Critical</option>
                            <option value="observation">Observation</option>
                            <option value="stable">Stable</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 min-w-[140px]">
                        <Bed className="w-4 h-4 text-neutral-500" />
                        <select
                            value={filterWard}
                            onChange={(e) => setFilterWard(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-neutral-700 focus:ring-0 w-full cursor-pointer"
                        >
                            <option value="all">All Wards</option>
                            {wards.map((ward) => (
                                <option key={ward} value={ward}>{ward}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-neutral-500 font-medium">Loading patient records...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-neutral-300" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">No patients found</h3>
                    <p className="text-neutral-500">
                        {searchQuery || filterCondition !== 'all' ? 'Try adjusting your search or filters' : 'You have no assigned patients currently'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                        <div key={patient.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group flex flex-col">
                            <div className="p-5 border-b border-neutral-100">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center border border-indigo-100 text-indigo-600 font-bold text-lg shadow-sm">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{patient.name}</h3>
                                            <p className="text-xs font-medium text-neutral-500">{patient.age} years • {patient.gender}</p>
                                        </div>
                                    </div>
                                    {patient.alerts > 0 && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                                            <AlertTriangle className="w-3 h-3" />
                                            {patient.alerts}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                        <Bed className="w-4 h-4 text-neutral-400" />
                                        <span className="text-sm font-semibold text-neutral-700">{patient.bed_number}</span>
                                    </div>
                                    {getConditionBadge(patient.condition)}
                                </div>
                            </div>

                            <div className="p-5 space-y-4 flex-1">
                                <div>
                                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Primary Diagnosis</p>
                                    <p className="text-sm font-medium text-neutral-800 line-clamp-2">{patient.diagnosis}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-400 mb-1">Doctor</p>
                                        <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                                            <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="truncate">{patient.doctor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 mb-1">Admitted</p>
                                        <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>{new Date(patient.admission_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Vitals */}
                                <div className="pt-3 border-t border-neutral-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-semibold text-neutral-400 uppercase">Latest Vitals</p>
                                        <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{patient.last_vitals.time}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-rose-50 rounded-lg p-1.5">
                                            <Heart className="w-3 h-3 text-rose-500 mx-auto mb-1" />
                                            <span className="text-xs font-bold text-rose-700">{patient.last_vitals.pulse}</span>
                                        </div>
                                        <div className="bg-sky-50 rounded-lg p-1.5">
                                            <Activity className="w-3 h-3 text-sky-500 mx-auto mb-1" />
                                            <span className="text-xs font-bold text-sky-700">{patient.last_vitals.bp}</span>
                                        </div>
                                        <div className="bg-teal-50 rounded-lg p-1.5">
                                            <Droplets className="w-3 h-3 text-teal-500 mx-auto mb-1" />
                                            <span className="text-xs font-bold text-teal-700">{patient.last_vitals.spo2}</span>
                                        </div>
                                        <div className="bg-amber-50 rounded-lg p-1.5">
                                            <Thermometer className="w-3 h-3 text-amber-500 mx-auto mb-1" />
                                            <span className="text-xs font-bold text-amber-700">{patient.last_vitals.temperature}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl flex gap-2">
                                <button
                                    onClick={() => setSelectedPatient(patient)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
                                >
                                    <Eye className="w-4 h-4" />
                                    Details
                                </button>
                                <button
                                    onClick={() => navigate('/nurse-dashboard/vital-signs')}
                                    className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all text-neutral-600 shadow-sm"
                                    title="Record Vitals"
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-neutral-600 shadow-sm" title="Notes">
                                    <FileText className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Patient Detail Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900">{selectedPatient.name}</h2>
                                    <p className="text-sm text-neutral-500">Patient ID: #{selectedPatient.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Location</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Bed className="w-5 h-5 text-indigo-500" />
                                        <span className="text-lg font-bold text-neutral-900">{selectedPatient.bed_number}</span>
                                    </div>
                                    <p className="text-sm text-neutral-500">Ward A-2</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Status</p>
                                    <div className="mb-1">
                                        {getConditionBadge(selectedPatient.condition)}
                                    </div>
                                    <p className="text-sm text-neutral-500 mt-2">
                                        {(selectedPatient.alerts || 0) > 0 ? `${selectedPatient.alerts} Active Alerts` : 'No Active Alerts'}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Demographics</p>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-lg font-bold text-neutral-900">{selectedPatient.age} Years</span>
                                        <span className="text-sm text-neutral-500">{selectedPatient.gender}</span>
                                    </div>
                                    <p className="text-sm text-neutral-500 truncate">{selectedPatient.phone || 'No phone'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <section>
                                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-emerald-600" />
                                            Clinical Information
                                        </h3>
                                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Primary Diagnosis</p>
                                                <p className="text-neutral-900 font-medium leading-relaxed">{selectedPatient.diagnosis}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-50">
                                                <div>
                                                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Attending Doctor</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">DR</div>
                                                        <p className="font-medium text-neutral-900">{selectedPatient.doctor}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-neutral-400 uppercase mb-1">Admission Date</p>
                                                    <p className="font-medium text-neutral-900">{new Date(selectedPatient.admission_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-rose-500" />
                                            Latest Vitals
                                            <span className="text-xs font-normal text-neutral-400 ml-auto">Recorded: {selectedPatient.last_vitals.time}</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm text-center">
                                                <p className="text-xs text-neutral-500 mb-1">Blood Pressure</p>
                                                <p className="text-xl font-bold text-neutral-900">{selectedPatient.last_vitals.bp}</p>
                                                <p className="text-[10px] text-neutral-400">mmHg</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm text-center">
                                                <p className="text-xs text-neutral-500 mb-1">Heart Rate</p>
                                                <p className="text-xl font-bold text-neutral-900">{selectedPatient.last_vitals.pulse}</p>
                                                <p className="text-[10px] text-neutral-400">bpm</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm text-center">
                                                <p className="text-xs text-neutral-500 mb-1">SpO2</p>
                                                <p className="text-xl font-bold text-neutral-900">{selectedPatient.last_vitals.spo2}</p>
                                                <p className="text-[10px] text-neutral-400">%</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm text-center">
                                                <p className="text-xs text-neutral-500 mb-1">Temperature</p>
                                                <p className="text-xl font-bold text-neutral-900">{selectedPatient.last_vitals.temperature}</p>
                                                <p className="text-[10px] text-neutral-400">°C</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section>
                                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-amber-500" />
                                            Notes & alerts
                                        </h3>
                                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                                            <p className="text-sm text-amber-900 leading-relaxed">
                                                Patient requires hourly monitoring of blood pressure. Please report any spikes immediately to Dr. {selectedPatient.doctor.split(' ').pop()}.
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <span className="px-2 py-1 bg-white/50 rounded text-xs font-bold text-amber-800">Fall Risk</span>
                                                <span className="px-2 py-1 bg-white/50 rounded text-xs font-bold text-amber-800">Allergy: Latex</span>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="bg-neutral-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-lg mb-2">Quick Actions</h4>
                                            <div className="space-y-2">
                                                <button onClick={() => navigate('/nurse-dashboard/vital-signs')} className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4 flex items-center gap-2">
                                                    <Activity className="w-4 h-4" /> Record Vitals
                                                </button>
                                                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> Add Nurse Note
                                                </button>
                                                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left px-4 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" /> Report Incident
                                                </button>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-neutral-100 bg-neutral-50 shrink-0 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="px-6 py-2.5 text-neutral-600 font-medium hover:bg-neutral-200 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                            <button className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:scale-105">
                                View Full Records
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NursePatients;
