import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Calendar,
    Clock,
    User,
    Plus,
    ChevronRight,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    Stethoscope,
    CalendarDays,
    RefreshCw,
    CreditCard,
    Phone,
    Mail,
    Loader2,
    ExternalLink,
    Info
} from 'lucide-react';
import api from "../../../utils/api/axios";
import useFetchPatientDetails from '../../../utils/api/PatientAppointment/FetchPatientDetails';
import AppointmentWizard from '../AppointmentBooking/AppointmentWizard';

// Lazy wrapper for new booking module
const PatientBookAppointmentWizard: React.FC = () => <AppointmentWizard />;

interface Appointment {
    id: string;
    doctor_id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    areas_of_specialization: string;
    branch_id: string;
    center_name: string;
    date: string;
    slot: number;
    status?: string;
    reschedule_count?: number;
}

interface Branch {
    id: string;
    name: string;
}

interface DoctorSchedule {
    id: string;
    doctor_id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    areas_of_specialization: string;
    branch_id: string;
    branch_name: string;
    date: string;
    day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
    booked_slots: number;
    available_slots: number;
}

// Main Appointments Component
const PatientAppointments: React.FC = () => {
    return (
        <Routes>
            <Route index element={<AppointmentsList />} />
            <Route path="book" element={<PatientBookAppointmentWizard />} />
            <Route path="book-new/*" element={<PatientBookAppointmentWizard />} />
            <Route path="reschedule/:id" element={<RescheduleAppointment />} />
        </Routes>
    );
};

// Appointments List View
const AppointmentsList: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [confirmCancellation, setConfirmCancellation] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, [userId]);

    const fetchAppointments = async () => {
        try {
            const response = await api.get(`/get-patient-appointments/${userId}`);
            if (response.data.status === 200) {
                setAppointments(response.data.appointments || []);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelAppointment = async (appointmentId: string) => {
        if (!cancelReason.trim() || !confirmCancellation) return;

        try {
            setCancelLoading(true);
            await api.post(`/patient/appointments/${appointmentId}/cancel`, {
                reason: cancelReason,
                confirmed: true
            });
            setShowCancelModal(false);
            setCancellingAppointment(null);
            setCancelReason('');
            setConfirmCancellation(false);
            fetchAppointments();
        } catch (error: any) {
            console.error('Failed to cancel appointment:', error);
            const errorMessage = error.response?.data?.message || 'Failed to cancel appointment. Please try again.';
            alert(errorMessage);
            // Close modal and refresh appointments if the status changed
            if (error.response?.data?.current_status) {
                setShowCancelModal(false);
                setCancellingAppointment(null);
                setCancelReason('');
                setConfirmCancellation(false);
                fetchAppointments();
            }
        } finally {
            setCancelLoading(false);
        }
    };

    const openCancelModal = (apt: Appointment) => {
        setCancellingAppointment(apt);
        setCancelReason('');
        setConfirmCancellation(false);
        setShowCancelModal(true);
    };

    const filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const status = apt.status || 'confirmed';

        let matchesFilter = true;
        switch (filter) {
            case 'upcoming':
                matchesFilter = aptDate >= today && status !== 'cancelled';
                break;
            case 'past':
                matchesFilter = aptDate < today;
                break;
            case 'cancelled':
                matchesFilter = status === 'cancelled';
                break;
        }

        const matchesSearch = searchTerm === '' ||
            `${apt.doctor_first_name} ${apt.doctor_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.areas_of_specialization?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status: string, date: string) => {
        const aptDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (status === 'cancelled') {
            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-red-700"><XCircle className="w-3 h-3" /> Cancelled</span>;
        }
        if (aptDate < today) {
            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"><CheckCircle className="w-3 h-3" /> Completed</span>;
        }
        if (status === 'confirmed') {
            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
        }
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Pending</span>;
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">My Appointments</h1>
                    <p className="text-sm sm:text-base text-neutral-500">Manage your medical appointments</p>
                </div>
                <Link
                    to="book"
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Book New Appointment
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search doctor or specialization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Filter Tabs - Scrollable on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                        {[
                            { key: 'upcoming', label: 'Upcoming' },
                            { key: 'past', label: 'Past' },
                            { key: 'cancelled', label: 'Cancelled' },
                            { key: 'all', label: 'All' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-neutral-800 mb-2">No appointments found</h3>
                    <p className="text-sm sm:text-base text-neutral-500 mb-4">
                        {filter === 'upcoming' ? "You don't have any upcoming appointments" : "No appointments match your criteria"}
                    </p>
                    <Link
                        to="book"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Book an Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {filteredAppointments.map((apt) => (
                        <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-3 sm:gap-4">
                                {/* Doctor Info Row */}
                                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-base sm:text-xl flex-shrink-0">
                                        {apt.doctor_first_name?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-neutral-800 text-sm sm:text-base truncate">
                                            Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1 truncate">
                                            <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="truncate">{apt.areas_of_specialization}</span>
                                        </p>
                                        <p className="text-xs sm:text-sm text-neutral-400 flex items-center gap-1 truncate">
                                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="truncate">{apt.center_name || 'Main Branch'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Date, Slot, Status & Actions Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 sm:border-0 sm:pt-0">
                                    {/* Date & Slot */}
                                    <div className="flex items-center gap-3 sm:gap-6 text-neutral-600">
                                        <div className="flex items-center gap-1 sm:flex-col sm:text-center">
                                            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 sm:mx-auto sm:mb-1" />
                                            <p className="font-medium text-xs sm:text-sm">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="flex items-center gap-1 sm:flex-col sm:text-center">
                                            <span className="text-xs text-neutral-400 sm:block">Slot</span>
                                            <p className="font-bold text-emerald-600 text-sm">#{apt.slot}</p>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {getStatusBadge(apt.status || 'confirmed', apt.date)}

                                        {(apt.status || 'confirmed') !== 'cancelled' && new Date(apt.date) >= new Date() && (
                                            <div className="flex gap-1 sm:gap-2">
                                                <Link
                                                    to={`reschedule/${apt.id}`}
                                                    className="p-1.5 sm:p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Reschedule"
                                                >
                                                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => openCancelModal(apt)}
                                                    className="p-1.5 sm:p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                    title="Cancel"
                                                >
                                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel Appointment Modal - Red Warning Theme */}
            {showCancelModal && cancellingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border-t-4 border-error-600">
                        {/* Warning Header */}
                        <div className="flex items-center justify-center mb-3 sm:mb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="text-error-600 w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-red-700 text-center mb-2">Cancel Appointment</h3>

                        {/* Strong Warning Message */}
                        <div className="bg-error-50 border-2 border-red-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                            <p className="text-red-800 text-center font-medium text-sm sm:text-base">
                                ⚠️ This action is <strong>non-reversible</strong>.
                            </p>
                            <p className="text-red-700 text-center mt-1 sm:mt-2 text-xs sm:text-sm">
                                Your appointment will be permanently cancelled, and <strong>booking fees will NOT be refunded</strong>.
                            </p>
                        </div>

                        {/* Appointment Details */}
                        <div className="bg-neutral-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 mb-1">
                                <span className="text-neutral-500">Doctor:</span>
                                <span className="font-medium">Dr. {cancellingAppointment.doctor_first_name} {cancellingAppointment.doctor_last_name}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 mb-1">
                                <span className="text-neutral-500">Date:</span>
                                <span className="font-medium">
                                    {new Date(cancellingAppointment.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-neutral-500">Slot #:</span>
                                <span className="font-bold text-emerald-600">#{cancellingAppointment.slot}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                                <span className="text-neutral-500">Branch:</span>
                                <span className="font-medium">{cancellingAppointment.center_name}</span>
                            </div>
                        </div>

                        {/* Reason Input */}
                        <div className="mb-3 sm:mb-4">
                            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1">
                                Reason for cancellation <span className="text-error-500">*</span>
                            </label>
                            <textarea
                                className="w-full p-2 sm:p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-error-500 text-sm"
                                rows={2}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Please provide a reason for cancellation..."
                            />
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="mb-4 sm:mb-6">
                            <label className="flex items-start cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmCancellation}
                                    onChange={(e) => setConfirmCancellation(e.target.checked)}
                                    className="mt-0.5 sm:mt-1 h-4 w-4 text-error-600 focus:ring-red-500 border-neutral-300 rounded flex-shrink-0"
                                />
                                <span className="ml-2 text-xs sm:text-sm text-neutral-700">
                                    I understand that this action is permanent and my <strong>booking fee will NOT be refunded</strong>.
                                </span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                            <button
                                className="flex-1 py-2.5 sm:py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium text-sm sm:text-base"
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancellingAppointment(null);
                                    setCancelReason('');
                                    setConfirmCancellation(false);
                                }}
                                disabled={cancelLoading}
                            >
                                Go Back
                            </button>
                            <button
                                className="flex-1 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-300 disabled:cursor-not-allowed text-sm sm:text-base"
                                onClick={() => cancelAppointment(cancellingAppointment.id)}
                                disabled={!cancelReason.trim() || !confirmCancellation || cancelLoading}
                            >
                                {cancelLoading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                        Cancelling...
                                    </span>
                                ) : (
                                    'Confirm Cancellation'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Book Appointment Component (Legacy - use AppointmentWizard instead)
export const BookAppointment: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const { userDetails: patientDetails } = useFetchPatientDetails(userId);

    const [step, setStep] = useState(1);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
    const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);

    // Payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed' | null>(null);
    const [paymentError, setPaymentError] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchDoctorSchedules(selectedBranch);
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/get-branches');
            if (response.data.status === 200) {
                setBranches(response.data.branches.map((b: any) => ({
                    id: b.id,
                    name: b.center_name
                })));
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const fetchDoctorSchedules = async (branchId: string) => {
        setLoading(true);
        try {
            const response = await api.get('/get-doctor-schedules', {
                params: { branch_id: branchId }
            });
            if (response.data.status === 200) {
                // Filter schedules for future dates only
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const futureSchedules = (response.data.doctorSchedules || []).filter((s: DoctorSchedule) => {
                    const scheduleDate = new Date(s.date);
                    return scheduleDate >= today && s.available_slots > 0;
                });
                setDoctorSchedules(futureSchedules);
            }
        } catch (error) {
            console.error('Failed to fetch doctor schedules:', error);
            setDoctorSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedSchedule || selectedSlotNumber === null) return;

        setLoading(true);
        setPaymentError('');

        try {
            const payload = {
                first_name: patientDetails.firstName,
                last_name: patientDetails.lastName,
                phone: patientDetails.phone,
                NIC: patientDetails.nic,
                email: patientDetails.email || '',
                address: patientDetails.address || '',
                doctor_id: selectedSchedule.doctor_id,
                schedule_id: selectedSchedule.id,
                branch_id: selectedSchedule.branch_id,
                date: selectedSchedule.date,
                slot: selectedSlotNumber
            };

            const response = await api.post('/appointments', payload);

            if (response.data.status === 200 && response.data.data) {
                setPaymentData(response.data.data);
                setShowPaymentModal(true);
                setStep(5); // Payment step
            } else {
                setPaymentError(response.data.message || 'Failed to prepare appointment. Please try again.');
            }
        } catch (error: any) {
            console.error('Failed to prepare appointment:', error);
            setPaymentError(error.response?.data?.message || 'Failed to prepare appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = () => {
        if (!paymentData) return;

        setPaymentStatus('processing');

        // Create a form element and submit it programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.payment_url;
        // Open in same window - after payment, user will be redirected back

        // Add all payment data as hidden fields
        Object.entries(paymentData.payment_data).forEach(([key, value]) => {
            if (key !== 'payment_url') {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
            }
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const getAvailableSlots = () => {
        if (!selectedSchedule) return [];
        const slots = [];
        for (let i = 1; i <= selectedSchedule.available_slots; i++) {
            slots.push(selectedSchedule.booked_slots + i);
        }
        return slots;
    };

    const calculateSlotTime = (slotNumber: number) => {
        if (!selectedSchedule) return '';
        const slotDuration = 12; // 12 minutes per slot
        const startTime = new Date(`2000-01-01T${selectedSchedule.start_time}`);
        const slotTime = new Date(startTime.getTime() + (slotNumber - 1) * slotDuration * 60000);
        return slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link to="/patient-dashboard/appointments" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Appointments
                </Link>
                <h1 className="text-2xl font-bold text-neutral-800">Book New Appointment</h1>
                <p className="text-neutral-500">Select a branch, doctor schedule, and time slot</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`flex items-center gap-2 ${step >= s ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                                step >= s ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                            }`}>
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            <span className="hidden md:block text-sm font-medium">
                                {s === 1 ? 'Branch' : s === 2 ? 'Schedule' : s === 3 ? 'Slot' : 'Payment'}
                            </span>
                        </div>
                        {s < 4 && <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-emerald-500' : 'bg-neutral-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Step 1: Select Branch */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Select Branch</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        setSelectedBranch(branch.id);
                                        setStep(2);
                                    }}
                                    className={`p-4 border rounded-xl text-left transition-all hover:border-emerald-500 hover:bg-emerald-50 ${
                                        selectedBranch === branch.id ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-8 h-8 text-emerald-600" />
                                        <div>
                                            <p className="font-medium text-neutral-800">{branch.name}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Doctor Schedule */}
                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Select Doctor Schedule</h2>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : doctorSchedules.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No available schedules at this branch</p>
                                <p className="text-sm text-neutral-400 mt-1">Please check back later or try a different branch</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {doctorSchedules.map((schedule) => (
                                    <button
                                        key={schedule.id}
                                        onClick={() => {
                                            setSelectedSchedule(schedule);
                                            setStep(3);
                                        }}
                                        className={`w-full p-4 border rounded-xl text-left transition-all hover:border-emerald-500 hover:bg-emerald-50 ${
                                            selectedSchedule?.id === schedule.id ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                                                    {schedule.doctor_first_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-800">Dr. {schedule.doctor_first_name} {schedule.doctor_last_name}</p>
                                                    <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                        <Stethoscope className="w-4 h-4" />
                                                        {schedule.areas_of_specialization}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-neutral-800">
                                                    {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-sm text-neutral-500">{schedule.start_time} - {schedule.end_time}</p>
                                                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                    {schedule.available_slots} slots available
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => setStep(1)}
                            className="mt-4 text-neutral-500 hover:text-neutral-700"
                        >
                            ← Back to Branch Selection
                        </button>
                    </div>
                )}

                {/* Step 3: Select Time Slot */}
                {step === 3 && selectedSchedule && (
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Select Your Time Slot</h2>

                        {/* Selected Schedule Summary */}
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                                    {selectedSchedule.doctor_first_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-800">Dr. {selectedSchedule.doctor_first_name} {selectedSchedule.doctor_last_name}</p>
                                    <p className="text-sm text-neutral-500">
                                        {new Date(selectedSchedule.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        {' • '}{selectedSchedule.start_time} - {selectedSchedule.end_time}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-neutral-700 mb-3">Available Time Slots</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {getAvailableSlots().map((slotNum) => (
                                <button
                                    key={slotNum}
                                    onClick={() => setSelectedSlotNumber(slotNum)}
                                    className={`p-3 border rounded-lg text-center transition-all ${
                                        selectedSlotNumber === slotNum
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50'
                                    }`}
                                >
                                    <p className="font-medium">Slot #{slotNum}</p>
                                    <p className="text-xs text-neutral-500">{calculateSlotTime(slotNum)}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setStep(2)}
                                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={selectedSlotNumber === null}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue to Confirmation
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmation & Payment */}
                {step === 4 && selectedSchedule && selectedSlotNumber !== null && (
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Confirm & Pay</h2>

                        {/* Appointment Summary */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 mb-6">
                            <h3 className="font-medium text-neutral-800 mb-4">Appointment Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Doctor</p>
                                        <p className="font-medium">Dr. {selectedSchedule.doctor_first_name} {selectedSchedule.doctor_last_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Specialization</p>
                                        <p className="font-medium">{selectedSchedule.areas_of_specialization}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Branch</p>
                                        <p className="font-medium">{selectedSchedule.branch_name || branches.find(b => b.id === selectedBranch)?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Date</p>
                                        <p className="font-medium">{new Date(selectedSchedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Time Slot</p>
                                        <p className="font-medium">Slot #{selectedSlotNumber} - Approx. {calculateSlotTime(selectedSlotNumber)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
                            <h3 className="font-medium text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Your Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                    <span className="truncate">{patientDetails.firstName} {patientDetails.lastName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                    <span className="truncate">{patientDetails.phone}</span>
                                </div>
                                {patientDetails.email && (
                                    <div className="flex items-center gap-2 text-sm sm:col-span-2">
                                        <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                        <span className="truncate">{patientDetails.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-200">
                            <div className="flex items-start gap-3">
                                <CreditCard className="w-6 h-6 text-primary-500 mt-1" />
                                <div>
                                    <h3 className="font-medium text-neutral-800">Payment Required</h3>
                                    <p className="text-sm text-neutral-600 mt-1">
                                        Appointment booking fee: <span className="font-bold text-lg text-primary-500">Rs. 350.00</span>
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        You will be redirected to PayHere secure payment gateway to complete your payment.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SMS Notification Info */}
                        <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-green-600" />
                                <p className="text-sm text-green-700">
                                    An SMS confirmation will be sent to <strong>{patientDetails.phone}</strong> after successful payment.
                                </p>
                            </div>
                        </div>

                        {paymentError && (
                            <div className="bg-error-50 text-red-700 p-4 rounded-lg mb-4 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                {paymentError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(3)}
                                className="px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleProceedToPayment}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Proceed to Payment - Rs. 350
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Payment Modal */}
                {step === 5 && showPaymentModal && paymentData && (
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 text-center">Complete Your Payment</h2>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 text-center">
                            <CreditCard className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                            <p className="text-neutral-700 mb-2">Amount to Pay</p>
                            <p className="text-4xl font-bold text-primary-500">Rs. {paymentData.payment_amount}</p>
                            <p className="text-sm text-neutral-500 mt-2">Order ID: {paymentData.order_id}</p>
                        </div>

                        {paymentStatus === 'processing' ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                                <p className="text-neutral-700 font-medium">Redirecting to PayHere...</p>
                                <p className="text-sm text-neutral-500 mt-2">Please complete your payment in the payment window.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-medium mb-1">Important:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>You will be redirected to PayHere secure payment page</li>
                                                <li>After payment, you'll receive an SMS confirmation</li>
                                                <li>Do not close your browser during payment</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setPaymentData(null);
                                            setStep(4);
                                        }}
                                        className="px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                                    >
                                        ← Cancel
                                    </button>
                                    <button
                                        onClick={handlePayNow}
                                        className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 font-medium"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Pay Now with PayHere
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Slot and availability types (same as AppointmentWizard)
interface SlotInfo {
    slot_number: number;
    estimated_time: string;
    estimated_end_time: string;
    is_available: boolean;
    is_booked: boolean;
}

interface AvailabilityData {
    date: string;
    day: string;
    session: {
        start_time: string;
        end_time: string;
        time_per_patient: number;
    };
    slots: SlotInfo[];
    summary: {
        total_slots: number;
        available: number;
        booked: number;
    };
    disclaimer: string;
}

// Doctor schedule interface for branch selection
interface DoctorSchedule {
    schedule_id: string;
    branch_id: string;
    branch_name: string;
    schedule_day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
}

// Reschedule Appointment Component
const RescheduleAppointment: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [eligibility, setEligibility] = useState<{
        can_reschedule: boolean;
        reason: string | null;
        remaining_attempts: number;
        max_attempts: number;
        is_admin_cancelled: boolean;
        appointment_details: {
            id: string;
            date: string;
            time: string;
            doctor_id: string;
            branch_id: string;
            status: string;
        };
        settings: {
            max_advance_booking_days: number;
            reschedule_advance_hours: number;
        };
    } | null>(null);

    // Doctor schedules for branch selection
    const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);

    // Form state
    const [newDate, setNewDate] = useState('');
    const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [reason, setReason] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<{
        token_number: number;
        appointment_date: string;
        appointment_time: string;
        branch_name?: string;
    } | null>(null);

    // Appointment details state
    const [appointmentDetails, setAppointmentDetails] = useState<{
        doctor_name: string;
        doctor_id: string;
        branch_name: string;
        current_date: string;
        current_time: string;
    } | null>(null);

    const formatDateLocal = (dateValue: Date) => {
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch eligibility and doctor schedules on mount
    useEffect(() => {
        const fetchEligibility = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                const response = await api.get(`/patient/appointments/${id}/reschedule-eligibility`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.status === 200) {
                    setEligibility(response.data);
                    const doctorId = response.data.appointment_details.doctor_id;
                    const branchId = response.data.appointment_details.branch_id;

                    // Set initial branch
                    setSelectedBranchId(branchId);

                    // Also fetch appointment details
                    const detailsResponse = await api.get(`/patient/appointments/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (detailsResponse.data.status === 200 && detailsResponse.data.appointment) {
                        const apt = detailsResponse.data.appointment;
                        setAppointmentDetails({
                            doctor_name: apt.doctor_name || 'Doctor',
                            doctor_id: doctorId,
                            branch_name: apt.branch_name || 'Branch',
                            current_date: apt.appointment_date,
                            current_time: apt.appointment_time,
                        });
                    }

                    // Fetch doctor's schedules for branch selection
                    try {
                        const schedulesResponse = await api.get(`/appointments/doctors/${doctorId}/schedules`);
                        if (schedulesResponse.data.status === 200) {
                            setDoctorSchedules(schedulesResponse.data.schedules || []);
                            // Set initial selected schedule
                            const initialSchedule = schedulesResponse.data.schedules?.find(
                                (s: DoctorSchedule) => s.branch_id === branchId
                            );
                            if (initialSchedule) {
                                setSelectedSchedule(initialSchedule);
                            }
                        }
                    } catch (scheduleErr) {
                        console.error('Failed to fetch doctor schedules:', scheduleErr);
                        // Continue without branch selection if schedules fail to load
                    }
                }
            } catch (err: any) {
                console.error('Failed to fetch eligibility:', err);
                setError(err.response?.data?.message || 'Failed to check reschedule eligibility');
            } finally {
                setLoading(false);
            }
        };

        fetchEligibility();
    }, [id]);

    // Handle branch selection
    const handleBranchSelect = (branchId: string) => {
        setSelectedBranchId(branchId);
        const schedule = doctorSchedules.find(s => s.branch_id === branchId);
        setSelectedSchedule(schedule || null);
        // Reset date and slots when branch changes
        setNewDate('');
        setAvailabilityData(null);
        setSelectedSlot(null);
    };

    // Get available dates for selected schedule
    const getAvailableDates = (): { date: string; day: string; label: string }[] => {
        if (!selectedSchedule) return [];

        const dates: { date: string; day: string; label: string }[] = [];
        const maxDays = eligibility?.settings?.max_advance_booking_days || 30;
        const scheduleDay = selectedSchedule.schedule_day.toLowerCase();

        for (let i = 1; i <= maxDays; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

            if (dayName === scheduleDay) {
                dates.push({
                    date: formatDateLocal(date),
                    day: dayName,
                    label: date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    }),
                });
            }
        }

        return dates;
    };

    // Fetch available slots when date changes (using new API)
    const loadSlots = async (date: string) => {
        if (!eligibility || !date || !selectedBranchId) return;

        try {
            setLoadingSlots(true);
            setAvailabilityData(null);
            setSelectedSlot(null);

            const response = await api.post('/appointments/doctors/slots-with-times', {
                doctor_id: eligibility.appointment_details.doctor_id,
                branch_id: selectedBranchId,
                date: date,
            });

            if (response.data.status === 200) {
                setAvailabilityData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to load slots');
            }
        } catch (err: any) {
            console.error('Failed to fetch slots:', err);
            setError(err.response?.data?.message || 'Failed to load available time slots');
        } finally {
            setLoadingSlots(false);
        }
    };

    // Handle date selection
    const handleDateSelect = (date: string) => {
        setNewDate(date);
        loadSlots(date);
    };

    // Handle slot selection
    const handleSlotSelect = (slot: SlotInfo) => {
        if (!slot.is_available) return;
        setSelectedSlot(slot);
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!id || !newDate || !selectedSlot || !selectedBranchId) {
            return;
        }

        // Check if user has confirmed the reschedule
        if (!confirmed) {
            alert('Please confirm that you want to reschedule this appointment by checking the confirmation checkbox.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await api.post(`/patient/appointments/${id}/reschedule`, {
                new_date: newDate,
                new_slot_number: selectedSlot.slot_number,
                new_branch_id: selectedBranchId,
                reason: reason || 'Rescheduled by patient',
                confirmed: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                const branchName = selectedSchedule?.branch_name || appointmentDetails?.branch_name || 'Branch';
                setSuccess({
                    token_number: response.data.new_booking.token_number,
                    appointment_date: response.data.new_booking.appointment_date,
                    appointment_time: response.data.new_booking.appointment_time,
                    branch_name: branchName,
                });
            }
        } catch (err: any) {
            console.error('Reschedule failed:', err);
            setError(err.response?.data?.message || 'Failed to reschedule appointment');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-3 sm:px-0">
                <div className="mb-4 sm:mb-6">
                    <Link to="/patient-dashboard/appointments" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Appointments
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Reschedule Appointment</h1>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-neutral-600 text-sm sm:text-base">Checking reschedule eligibility...</p>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="max-w-3xl mx-auto px-3 sm:px-0">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Appointment Rescheduled!</h1>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
                    <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <CheckCircle className="w-7 h-7 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-green-700">Successfully Rescheduled</h2>
                        <p className="text-neutral-600 mt-2 text-sm sm:text-base">Your appointment has been moved to the new date and time.</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <h3 className="font-semibold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">New Appointment Details</h3>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                            {success.branch_name && (
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                                    <span className="text-neutral-600">Branch:</span>
                                    <span className="font-medium">{success.branch_name}</span>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                                <span className="text-neutral-600">Date:</span>
                                <span className="font-medium">{new Date(success.appointment_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                                <span className="text-neutral-600">Time:</span>
                                <span className="font-medium">{success.appointment_time}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                                <span className="text-neutral-600">Token #:</span>
                                <span className="font-bold text-emerald-600">#{success.token_number}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-500 text-center mb-4 sm:mb-6">
                        You will receive an SMS confirmation shortly.
                    </p>

                    <button
                        onClick={() => navigate('/patient-dashboard/appointments')}
                        className="w-full py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm sm:text-base"
                    >
                        View My Appointments
                    </button>
                </div>
            </div>
        );
    }

    // Ineligible state
    if (eligibility && !eligibility.can_reschedule) {
        return (
            <div className="max-w-3xl mx-auto px-3 sm:px-0">
                <div className="mb-4 sm:mb-6">
                    <Link to="/patient-dashboard/appointments" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Appointments
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Cannot Reschedule</h1>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="bg-error-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-error-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-red-700 text-sm sm:text-base">Reschedule Not Available</p>
                                <p className="text-error-600 mt-1 text-xs sm:text-sm">{eligibility.reason}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <h4 className="font-semibold text-neutral-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                            Reschedule Rules
                        </h4>
                        <ul className="text-xs sm:text-sm text-neutral-600 space-y-1">
                            <li>• Rescheduling requires 24-hour advance notice</li>
                            <li>• You can reschedule once per appointment</li>
                            <li>• Admin-cancelled appointments allow 2 reschedules</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => navigate('/patient-dashboard/appointments')}
                        className="w-full py-2.5 sm:py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium text-sm sm:text-base"
                    >
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-0">
            <div className="mb-4 sm:mb-6">
                <Link to="/patient-dashboard/appointments" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Appointments
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Reschedule Appointment</h1>
                <p className="text-sm sm:text-base text-neutral-500">Select a new date and time for your appointment</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700 flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <p>{error}</p>
                            <button onClick={() => setError(null)} className="text-error-600 underline text-sm mt-1">Dismiss</button>
                        </div>
                    </div>
                )}

                {/* Admin-Cancelled Banner */}
                {eligibility?.is_admin_cancelled && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 mb-6">
                        <p className="text-amber-800 text-sm">
                            <strong>ℹ️ Doctor-Cancelled Appointment:</strong> This appointment was cancelled by the branch on doctor's request.
                            You have <strong>{eligibility.remaining_attempts}</strong> reschedule attempts available.
                        </p>
                    </div>
                )}

                {/* Remaining Attempts */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-700">Remaining Reschedules:</span>
                        <span className="font-bold text-blue-800">
                            {eligibility?.remaining_attempts} of {eligibility?.max_attempts}
                        </span>
                    </div>
                </div>

                {/* Current Appointment */}
                {appointmentDetails && (
                    <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <h4 className="font-semibold text-neutral-700 mb-2 sm:mb-3 text-sm sm:text-base">Current Appointment</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                                <span className="text-neutral-500">Doctor:</span>
                                <p className="font-medium">{appointmentDetails.doctor_name}</p>
                            </div>
                            <div>
                                <span className="text-neutral-500">Branch:</span>
                                <p className="font-medium">{appointmentDetails.branch_name}</p>
                            </div>
                            <div>
                                <span className="text-neutral-500">Current Date:</span>
                                <p className="font-medium">{new Date(appointmentDetails.current_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <span className="text-neutral-500">Current Time:</span>
                                <p className="font-medium">{appointmentDetails.current_time}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Branch Selection */}
                {doctorSchedules.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            Select Branch <span className="text-error-500">*</span>
                        </label>
                        <div className="grid gap-3">
                            {doctorSchedules
                                .filter((schedule, index, self) =>
                                    index === self.findIndex(s => s.branch_id === schedule.branch_id)
                                )
                                .map((schedule) => (
                                    <div
                                        key={schedule.branch_id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                            selectedBranchId === schedule.branch_id
                                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                                : 'border-neutral-200 hover:border-emerald-300'
                                        }`}
                                        onClick={() => handleBranchSelect(schedule.branch_id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Building2 className="w-5 h-5 text-neutral-400 mr-3" />
                                                <div>
                                                    <p className="font-medium text-neutral-800">{schedule.branch_name}</p>
                                                    <p className="text-sm text-neutral-500">
                                                        Available on {schedule.schedule_day}s • {schedule.start_time} - {schedule.end_time}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedBranchId === schedule.branch_id && (
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Date Selection - Based on Doctor's Schedule */}
                {selectedSchedule && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Select New Date <span className="text-error-500">*</span>
                        </label>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-700">
                                <Info className="w-4 h-4 inline mr-1" />
                                Dr. {appointmentDetails?.doctor_name} is available at {selectedSchedule.branch_name} on <strong>{selectedSchedule.schedule_day}s</strong> ({selectedSchedule.start_time} - {selectedSchedule.end_time})
                            </p>
                        </div>

                        {getAvailableDates().length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {getAvailableDates().map((dateOption) => (
                                    <button
                                        key={dateOption.date}
                                        onClick={() => handleDateSelect(dateOption.date)}
                                        className={`p-2 sm:p-3 rounded-lg text-center transition-all ${
                                            newDate === dateOption.date
                                                ? 'bg-emerald-600 text-white border-2 border-emerald-700'
                                                : 'bg-white border-2 border-neutral-200 hover:border-emerald-400 text-neutral-700'
                                        }`}
                                    >
                                        <p className="font-medium text-xs sm:text-sm">{dateOption.label}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                No available dates in the next {eligibility?.settings?.max_advance_booking_days || 30} days for this schedule.
                            </div>
                        )}
                    </div>
                )}

                {/* Slot Selection - Modern UI matching AppointmentWizard */}
                {newDate && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Select Time Slot <span className="text-error-500">*</span>
                        </label>

                        {loadingSlots ? (
                            <div className="text-center py-8 bg-neutral-50 rounded-lg">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                                <p className="text-sm text-neutral-500 mt-3">Loading available slots...</p>
                            </div>
                        ) : !availabilityData ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                No schedule found for this date. Please select another date.
                            </div>
                        ) : availabilityData.summary.available === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                All slots are booked for this date. Please select another date.
                            </div>
                        ) : (
                            <div className="bg-neutral-50 rounded-lg p-4">
                                {/* Session Info */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-neutral-500">Session Time</p>
                                        <p className="font-medium text-neutral-800">
                                            {availabilityData.session.start_time} - {availabilityData.session.end_time}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        availabilityData.summary.available <= 3
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {availabilityData.summary.available <= 3 ? 'Nearly Full' : 'Available'}
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center space-x-4 text-sm mb-4">
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                                        Available ({availabilityData.summary.available})
                                    </span>
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 rounded-full bg-emerald-600 mr-1"></span>
                                        Selected
                                    </span>
                                    <span className="flex items-center">
                                        <span className="w-3 h-3 rounded-full bg-neutral-300 mr-1"></span>
                                        Booked ({availabilityData.summary.booked})
                                    </span>
                                </div>

                                {/* Slot Grid */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                    {availabilityData.slots.map((slot) => {
                                        const isSelected = selectedSlot?.slot_number === slot.slot_number;

                                        return (
                                            <button
                                                key={slot.slot_number}
                                                disabled={!slot.is_available}
                                                onClick={() => handleSlotSelect(slot)}
                                                className={`p-2 sm:p-3 rounded-lg text-center transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white border-2 border-emerald-700 ring-2 ring-emerald-300'
                                                        : slot.is_available
                                                        ? 'bg-white border-2 border-green-200 hover:border-green-500 hover:shadow cursor-pointer'
                                                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <p className="font-bold text-sm sm:text-lg">#{slot.slot_number}</p>
                                                <p className="text-xs">{slot.estimated_time}</p>
                                                {isSelected && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mt-1" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Disclaimer */}
                                <p className="mt-4 text-xs text-neutral-500 flex items-center">
                                    <Info className="w-4 h-4 mr-1" />
                                    {availabilityData.disclaimer || 'Times are estimates and may vary based on consultation duration.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Selected Slot Summary */}
                {selectedSlot && (
                    <div className="mb-6 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-emerald-800">Selected Slot</h4>
                                <p className="text-sm text-emerald-600">
                                    Token #{selectedSlot.slot_number} • {selectedSlot.estimated_time} - {selectedSlot.estimated_end_time}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="text-emerald-500 hover:text-emerald-700 text-sm underline"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}

                {/* Reason (Optional) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Reason for Rescheduling (Optional)
                    </label>
                    <textarea
                        className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why are you rescheduling?"
                    />
                </div>

                {/* Confirmation Checkbox */}
                <div className="mb-6">
                    <label className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                        />
                        <span className="ml-2 text-sm text-neutral-700">
                            I confirm that I want to reschedule this appointment to the new date and time selected above.
                        </span>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => navigate('/patient-dashboard/appointments')}
                        className="flex-1 py-2.5 sm:py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium text-sm sm:text-base"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newDate || !selectedSlot || !confirmed || submitting}
                        className="flex-1 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Rescheduling...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Confirm Reschedule
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientAppointments;
