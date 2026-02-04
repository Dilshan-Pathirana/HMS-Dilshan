import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import {
    Plus, Search, Filter, Calendar,
    Clock, CheckCircle, XCircle, AlertCircle, Eye,
    Edit2, Trash2, UserPlus, Stethoscope, MapPin,
    Phone, Mail, CalendarDays, RefreshCw
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';

interface Appointment {
    id: number;
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    doctor_name: string;
    doctor_specialization: string;
    appointment_date: string;
    appointment_time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    branch_name: string;
    notes?: string;
}

interface Doctor {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    specialization?: string;
}

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
}

interface DoctorSchedule {
    id: number;
    doctor_id: number;
    schedule_day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
}

export const BranchAdminAppointments: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Appointment Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // New Appointment Form
    const [newAppointment, setNewAppointment] = useState({
        patient_id: '',
        doctor_id: '',
        schedule_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_center_name || userInfo.branch_name || 'Branch');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');

        fetchAppointments();
        fetchDoctors();
        fetchPatients();
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [appointments, statusFilter, searchQuery, dateFilter]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/get-all-patient-appointment');
            if (response.data.status === 200) {
                setAppointments(response.data.appointments || []);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/v1/users');
            if (response.data.status === 200) {
                const doctorUsers = response.data.users.filter((user: any) => user.role_id === 2);
                setDoctors(doctorUsers);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/api/v1/users');
            if (response.data.status === 200) {
                const patientUsers = response.data.users.filter((user: any) => user.role_id === 3);
                setPatients(patientUsers);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchDoctorSchedules = async (doctorId: string, date: string) => {
        try {
            const response = await api.get('/get-filter-doctor-schedules', {
                params: {
                    doctor_id: doctorId,
                    date: date
                }
            });
            if (response.data.status === 200) {
                setDoctorSchedules(response.data.doctorSchedules || []);
            }
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
        }
    };

    const filterAppointments = () => {
        let filtered = [...appointments];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.patient_name.toLowerCase().includes(query) ||
                apt.doctor_name.toLowerCase().includes(query) ||
                apt.patient_email.toLowerCase().includes(query)
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter(apt => apt.appointment_date === dateFilter);
        }

        setFilteredAppointments(filtered);
    };

    const handleCreateAppointment = async () => {
        try {
            const response = await api.post('/appointments', newAppointment);
            if (response.data.status === 200 || response.data.status === 201) {
                alert('Appointment created successfully!');
                setShowCreateModal(false);
                setNewAppointment({
                    patient_id: '',
                    doctor_id: '',
                    schedule_id: '',
                    appointment_date: '',
                    appointment_time: '',
                    notes: ''
                });
                fetchAppointments();
            }
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            alert(error.response?.data?.message || 'Failed to create appointment');
        }
    };

    const handleDeleteAppointment = async (id: number) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        try {
            const response = await api.delete(`/delete-appointment/${id}`);
            if (response.data.status === 200) {
                alert('Appointment deleted successfully!');
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Failed to delete appointment');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };

        const icons = {
            pending: <Clock className="w-3 h-3" />,
            confirmed: <CheckCircle className="w-3 h-3" />,
            completed: <CheckCircle className="w-3 h-3" />,
            cancelled: <XCircle className="w-3 h-3" />
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
                {icons[status as keyof typeof icons]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            branchName={branchName}
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Appointment Management</h1>
                            <p className="text-emerald-100 mt-1">Manage and schedule patient appointments</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Appointment
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total</p>
                                <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {appointments.filter(a => a.status === 'pending').length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Confirmed</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {appointments.filter(a => a.status === 'confirmed').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Completed</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {appointments.filter(a => a.status === 'completed').length}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search patient or doctor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setSearchQuery('');
                                setDateFilter('');
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No appointments found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredAppointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <UserPlus className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{appointment.patient_name}</p>
                                                        <p className="text-sm text-gray-500">{appointment.patient_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-800">{appointment.doctor_name}</p>
                                                        <p className="text-sm text-gray-500">{appointment.doctor_specialization}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <CalendarDays className="w-4 h-4 text-gray-400" />
                                                        {new Date(appointment.appointment_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        {appointment.appointment_time}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(appointment.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Appointment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Create New Appointment</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                                <select
                                    value={newAppointment.patient_id}
                                    onChange={(e) => setNewAppointment({...newAppointment, patient_id: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.first_name} {patient.last_name} - {patient.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                                <select
                                    value={newAppointment.doctor_id}
                                    onChange={(e) => {
                                        setNewAppointment({...newAppointment, doctor_id: e.target.value});
                                        if (e.target.value && newAppointment.appointment_date) {
                                            fetchDoctorSchedules(e.target.value, newAppointment.appointment_date);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.first_name} {doctor.last_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                                <input
                                    type="date"
                                    value={newAppointment.appointment_date}
                                    onChange={(e) => {
                                        setNewAppointment({...newAppointment, appointment_date: e.target.value});
                                        if (newAppointment.doctor_id && e.target.value) {
                                            fetchDoctorSchedules(newAppointment.doctor_id, e.target.value);
                                        }
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {doctorSchedules.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                                    <select
                                        value={newAppointment.schedule_id}
                                        onChange={(e) => {
                                            const schedule = doctorSchedules.find(s => s.id === parseInt(e.target.value));
                                            setNewAppointment({
                                                ...newAppointment,
                                                schedule_id: e.target.value,
                                                appointment_time: schedule?.start_time || ''
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Time Slot</option>
                                        {doctorSchedules.map(schedule => (
                                            <option key={schedule.id} value={schedule.id}>
                                                {schedule.start_time} - {schedule.end_time} ({schedule.max_patients} patients max)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Additional notes or special requirements..."
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleCreateAppointment}
                                    disabled={!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.appointment_date || !newAppointment.schedule_id}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Create Appointment
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
