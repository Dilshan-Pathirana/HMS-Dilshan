import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Clock, 
    Search, 
    Plus, 
    X, 
    Check,
    RefreshCw,
    User,
    Phone,
    Filter,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import receptionistService, { Appointment, Patient, Doctor } from '../../../services/receptionistService';

const ReceptionistAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state for new appointment
    const [newAppointment, setNewAppointment] = useState({
        patient_id: 0,
        doctor_id: 0,
        appointment_date: selectedDate,
        appointment_time: '',
        department: '',
        reason: '',
        notes: '',
    });

    // Reschedule form state
    const [rescheduleData, setRescheduleData] = useState({
        appointment_date: '',
        appointment_time: '',
        reason: '',
    });

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, [selectedDate, statusFilter]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await receptionistService.getAppointments(selectedDate, statusFilter || undefined);
            setAppointments(response?.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await receptionistService.getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setPatients([]);
            return;
        }
        try {
            const results = await receptionistService.searchPatients(query);
            setPatients(results);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    const handleCreateAppointment = async () => {
        if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.appointment_time) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        try {
            await receptionistService.createAppointment({
                ...newAppointment,
                appointment_date: newAppointment.appointment_date || selectedDate,
            });
            setMessage({ type: 'success', text: 'Appointment created successfully' });
            setShowCreateModal(false);
            resetForm();
            fetchAppointments();
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to create appointment' });
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        const reason = prompt('Please enter cancellation reason:');
        if (!reason) return;

        try {
            await receptionistService.cancelAppointment(appointmentId, reason);
            setMessage({ type: 'success', text: 'Appointment cancelled' });
            fetchAppointments();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to cancel appointment' });
        }
    };

    const handleReschedule = async () => {
        if (!selectedAppointment || !rescheduleData.appointment_date || !rescheduleData.appointment_time) {
            setMessage({ type: 'error', text: 'Please select new date and time' });
            return;
        }

        try {
            await receptionistService.rescheduleAppointment(selectedAppointment.id, rescheduleData);
            setMessage({ type: 'success', text: 'Appointment rescheduled successfully' });
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            setRescheduleData({ appointment_date: '', appointment_time: '', reason: '' });
            fetchAppointments();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reschedule appointment' });
        }
    };

    const handleUpdateStatus = async (appointmentId: number, status: string) => {
        try {
            await receptionistService.updateAppointment(appointmentId, { status: status as any });
            fetchAppointments();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update status' });
        }
    };

    const resetForm = () => {
        setNewAppointment({
            patient_id: 0,
            doctor_id: 0,
            appointment_date: selectedDate,
            appointment_time: '',
            department: '',
            reason: '',
            notes: '',
        });
        setSearchQuery('');
        setPatients([]);
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-purple-100 text-purple-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            no_show: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Appointments</h1>
                            <p className="text-sm text-gray-500">Manage and schedule patient appointments</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4 inline mr-2" />
                        New Appointment
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Date Navigation & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => changeDate(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                            Today
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No appointments for this date</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center min-w-[80px]">
                                            <Clock className="w-4 h-4 text-gray-400 mb-1" />
                                            <span className="text-sm font-medium text-gray-800">
                                                {formatTime(apt.appointment_time)}
                                            </span>
                                        </div>
                                        <div className="border-l pl-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800">{apt.patient_name}</span>
                                                <span className="text-xs text-gray-500">({apt.patient_code})</span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Dr. {apt.doctor_name} 
                                                {apt.department && <span className="text-gray-400"> • {apt.department}</span>}
                                            </p>
                                            {apt.patient_phone && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                    <Phone className="w-3 h-3" />
                                                    {apt.patient_phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                                            {apt.status.replace('_', ' ')}
                                        </span>
                                        {apt.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Confirm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAppointment(apt);
                                                        setRescheduleData({
                                                            appointment_date: apt.appointment_date,
                                                            appointment_time: apt.appointment_time,
                                                            reason: '',
                                                        });
                                                        setShowRescheduleModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Reschedule"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelAppointment(apt.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {apt.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                                            >
                                                Check In
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Appointment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">New Appointment</h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Patient Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Patient <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchPatients(e.target.value);
                                        }}
                                        placeholder="Search patient by name or phone..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                onClick={() => {
                                                    setNewAppointment(prev => ({ ...prev, patient_id: patient.id }));
                                                    setSearchQuery(patient.name);
                                                    setPatients([]);
                                                }}
                                                className="p-3 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <p className="font-medium">{patient.name}</p>
                                                <p className="text-xs text-gray-500">{patient.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Doctor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Doctor <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newAppointment.doctor_id}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, doctor_id: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={0}>Select Doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newAppointment.appointment_date}
                                        onChange={(e) => setNewAppointment(prev => ({ ...prev, appointment_date: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newAppointment.appointment_time}
                                        onChange={(e) => setNewAppointment(prev => ({ ...prev, appointment_time: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Time</option>
                                        {timeSlots.map((slot) => (
                                            <option key={slot} value={slot}>{formatTime(slot)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Visit
                                </label>
                                <input
                                    type="text"
                                    value={newAppointment.reason}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Brief description..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Additional notes..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAppointment}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600"
                            >
                                Create Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">Reschedule Appointment</h2>
                                <button onClick={() => { setShowRescheduleModal(false); setSelectedAppointment(null); }}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Current: {selectedAppointment.appointment_date} at {formatTime(selectedAppointment.appointment_time)}</p>
                                <p className="text-sm font-medium">{selectedAppointment.patient_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                                    <input
                                        type="date"
                                        value={rescheduleData.appointment_date}
                                        onChange={(e) => setRescheduleData(prev => ({ ...prev, appointment_date: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                                    <select
                                        value={rescheduleData.appointment_time}
                                        onChange={(e) => setRescheduleData(prev => ({ ...prev, appointment_time: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Time</option>
                                        {timeSlots.map((slot) => (
                                            <option key={slot} value={slot}>{formatTime(slot)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                                <input
                                    type="text"
                                    value={rescheduleData.reason}
                                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Reason for rescheduling..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowRescheduleModal(false); setSelectedAppointment(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReschedule}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistAppointments;
