import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    Calendar,
    Search,
    Filter,
    RefreshCw,
    Eye,
    Building2,
    User,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    Settings,
    FileText,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Stethoscope,
    Edit,
    Trash2,
    Plus,
    Phone,
    UserPlus,
    AlertTriangle,
    X,
    Save
} from 'lucide-react';
import { appointmentSuperAdminApi, AppointmentBooking, Branch, AppointmentSettings, AppointmentLog, Doctor, SlotInfo, PatientSearchResult } from '../../../services/appointmentService';
import { patientSessionApi, SessionListItem, SessionDetail, NurseItem } from '../../../services/patientSessionService';
import SessionDetailsPanel from '../../../components/dashboard/Sessions/SessionDetailsPanel';

// Extended types for branch settings display
interface BranchSettingsDisplay {
    branch_id: string;
    branch_name: string;
    location?: string;
    has_settings: boolean;
    settings: AppointmentSettings;
}

// Extended statistics type for this component
interface LocalStatistics {
    total: number;
    today: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show: number;
    by_branch: { branch_id: string; branch_name: string; count: number }[];
    by_status: { status: string; count: number }[];
}

type AppointmentViewType = 'today' | 'upcoming' | 'past';
type CancellationType = 'normal' | 'doctor_request';
type BookingType = 'walk_in' | 'phone' | 'online';
type PaymentStatusType = 'pending' | 'paid' | 'waived';

interface EditFormData {
    branchId: string;
    doctorId: string;
    date: string;
    slotNumber: number;
}

interface BookingFormData {
    branchId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    date: string;
    slotNumber: number;
    bookingType: BookingType;
    paymentStatus: PaymentStatusType;
    notes: string;
}

interface NewPatientData {
    full_name: string;
    mobile_number: string;
    nic: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth: string;
    address: string;
    send_sms: boolean;
}

const SuperAdminAppointments: React.FC = () => {
    const [appointmentView, setAppointmentView] = useState<AppointmentViewType>('today');
    const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [statistics, setStatistics] = useState<LocalStatistics | null>(null);
    const [branchSettings, setBranchSettings] = useState<BranchSettingsDisplay[]>([]);
    const [auditLogs, setAuditLogs] = useState<AppointmentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Super Admin');
    const [profileImage, setProfileImage] = useState('');

    // Filters
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [doctorFilter, setDoctorFilter] = useState<string>('');
    const [specializationFilter, setSpecializationFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(20);

    // Modal states
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentBooking | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingBranchSettings, setEditingBranchSettings] = useState<BranchSettingsDisplay | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Edit/Reschedule modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<AppointmentBooking | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ branchId: '', doctorId: '', date: '', slotNumber: 0 });
    const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Cancel modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentBooking | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellationType, setCancellationType] = useState<CancellationType>('normal');
    const [savingCancel, setSavingCancel] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    // Create booking modal states
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState<BookingFormData>({
        branchId: '', patientId: '', patientName: '', doctorId: '', date: '', slotNumber: 0,
        bookingType: 'walk_in', paymentStatus: 'pending', notes: ''
    });
    const [bookingSlots, setBookingSlots] = useState<SlotInfo[]>([]);
    const [bookingDoctors, setBookingDoctors] = useState<Doctor[]>([]); // Separate state for booking modal doctors
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([]);
    const [searchingPatients, setSearchingPatients] = useState(false);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [newPatientData, setNewPatientData] = useState<NewPatientData>({
        full_name: '', mobile_number: '', nic: '', gender: 'male', date_of_birth: '', address: '', send_sms: true
    });
    const [savingBooking, setSavingBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Session View State
    const [viewMode] = useState<'sessions' | 'list'>('sessions');
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [sessionPanelAction, setSessionPanelAction] = useState<'assign-staff' | undefined>(undefined);
    const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);

    // Nurse Assignment
    const [showAssignNurseModal, setShowAssignNurseModal] = useState(false);
    const [availableNurses, setAvailableNurses] = useState<NurseItem[]>([]);
    const [selectedNurses, setSelectedNurses] = useState<string[]>([]);
    const [assigningNurse, setAssigningNurse] = useState(false);


    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'Super Admin');
        setProfileImage(userInfo.profile_picture || '');

        loadBranches();
        loadDoctors();
    }, []);

    useEffect(() => {
        loadAppointments();
        loadSessions();
    }, [appointmentView, selectedBranch, statusFilter, dateFilter, startDate, endDate, doctorFilter, specializationFilter, currentPage]);

    // Reload doctors when branch changes
    useEffect(() => {
        loadDoctors(selectedBranch);
    }, [selectedBranch]);

    const loadBranches = async () => {
        try {
            const response = await appointmentSuperAdminApi.getBranches();
            if (response.status === 200 && response.branches) {
                setBranches(response.branches);
            }
        } catch (error) {
            console.error('Failed to load branches:', error);
        }
    };

    const loadDoctors = async (branchId?: string) => {
        try {
            const response = await appointmentSuperAdminApi.getAllDoctors(branchId);
            if (response.status === 200 && response.doctors) {
                setDoctors(response.doctors);
                // Extract unique specializations
                const specs = [...new Set(response.doctors
                    .map(d => d.specialization)
                    .filter(Boolean)
                )] as string[];
                setSpecializations(specs.sort());
            }
        } catch (error) {
            console.error('Failed to load doctors:', error);
        }
    };

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const params: any = { page: currentPage, per_page: perPage };

            // Apply time-based view filters
            if (appointmentView === 'today') {
                params.date = today;
            } else if (appointmentView === 'upcoming') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                params.start_date = tomorrow.toISOString().split('T')[0];
            } else if (appointmentView === 'past') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                params.end_date = yesterday.toISOString().split('T')[0];
            }

            // Apply additional filters
            if (selectedBranch) params.branch_id = selectedBranch;
            if (statusFilter) params.status = statusFilter;
            if (dateFilter && appointmentView !== 'today') params.date = dateFilter;
            if (startDate && appointmentView !== 'today' && appointmentView !== 'upcoming') params.start_date = startDate;
            if (endDate && appointmentView !== 'today' && appointmentView !== 'past') params.end_date = endDate;
            if (doctorFilter) params.doctor_id = doctorFilter;

            const response = await appointmentSuperAdminApi.getAllAppointments(params);
            if (response.status === 200) {
                let filteredData = response.appointments || [];

                // For past view, also include cancelled appointments
                if (appointmentView === 'past') {
                    // Already filtered by backend, but we can show all past statuses
                }

                // Client-side filter for specialization (since backend may not support it directly)
                if (specializationFilter) {
                    filteredData = filteredData.filter((apt: any) =>
                        apt.specialization?.toLowerCase().includes(specializationFilter.toLowerCase())
                    );
                }

                // Client-side search filter
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filteredData = filteredData.filter((apt: any) =>
                        apt.patient_name?.toLowerCase().includes(query) ||
                        apt.id?.toString().includes(query) ||
                        apt.token_number?.toString().includes(query)
                    );
                }

                setAppointments(filteredData);
                if (response.pagination) {
                    setTotalPages(response.pagination.total_pages);
                }
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSessions = async () => {
        setLoading(true);
        try {
            const params: any = {};

            if (dateFilter) params.session_date = dateFilter;

            if (selectedBranch) params.branch_id = selectedBranch;
            if (doctorFilter) params.doctor_id = doctorFilter;

            // TODO: Add date range support to list_sessions endpoint if needed.
            // Currently list_sessions supports single date or no date (all).

            const response = await patientSessionApi.getSessions(params);
            // response is array (from my service definition step 682, it returns response.data directly? No wait, inside service I did return response.data)
            // But getSessions implementation: return { sessions: response.data, status: ... } OR return response.data?
            // In step 682 I wrote: return { sessions: response.data, status: response.status }; ?
            // Let's check step 682 write_to_file content.
            // "return { sessions: response.data, status: response.status }; // consistent with other services..."
            // "Actually, existing services return { status, data... }. Let's check..."
            // "return response.data" for getSessionDetail.
            // "return { sessions: response.data..." for getSessions.

            if (response && response.sessions) {
                setSessions(response.sessions);
            } else if (Array.isArray(response)) {
                setSessions(response);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const openSessionDetails = (sessionId: string, initialAction?: 'assign-staff') => {
        setSelectedSessionId(sessionId);
        setSessionPanelAction(initialAction);
        setShowSessionDetails(true);
    };

    const handleManageSession = (sessionItem: SessionListItem) => {
        openSessionDetails(sessionItem.id);
    };

    const handleDeleteSession = async (sessionItem: SessionListItem) => {
        const confirmed = window.confirm('Delete this session and all linked session records permanently?');
        if (!confirmed) {
            return;
        }

        try {
            await patientSessionApi.deleteSession(sessionItem.id);
            if (selectedSessionId === sessionItem.id) {
                setShowSessionDetails(false);
                setSelectedSessionId(null);
                setSessionPanelAction(undefined);
            }
            await loadSessions();
            await loadAppointments();
            setMessage({ type: 'success', text: 'Session deleted successfully' });
        } catch (err: any) {
            console.error('Failed to delete session:', err);
            setMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to delete session' });
        }
    };

    const loadStatistics = async () => {
        setLoading(true);
        try {
            const response = await appointmentSuperAdminApi.getGlobalStatistics();
            if (response.status === 200 && response.statistics) {
                // Transform the statistics to our local format
                const stats = response.statistics;
                setStatistics({
                    total: (stats.today?.total || 0) + (stats.this_month?.total || 0),
                    today: stats.today?.total || 0,
                    pending: 0,
                    confirmed: stats.today?.confirmed || 0,
                    completed: stats.today?.completed || 0,
                    cancelled: stats.today?.cancelled || 0,
                    no_show: stats.today?.no_show || 0,
                    by_branch: stats.by_branch?.map(b => ({
                        branch_id: b.branch_id,
                        branch_name: b.branch_name,
                        count: b.total_appointments
                    })) || [],
                    by_status: []
                });
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBranchSettings = async () => {
        setLoading(true);
        try {
            const response = await appointmentSuperAdminApi.getBranchSettings();
            if (response.status === 200 && response.branches) {
                setBranchSettings(response.branches);
            }
        } catch (error) {
            console.error('Failed to load branch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const params: any = { page: currentPage, per_page: perPage };
            if (selectedBranch) params.branch_id = selectedBranch;

            const response = await appointmentSuperAdminApi.getAuditLogs(params);
            if (response.status === 200) {
                setAuditLogs(response.logs || []);
                if (response.pagination) {
                    setTotalPages(response.pagination.total_pages);
                }
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranchSettings = async () => {
        if (!editingBranchSettings) return;

        try {
            const response = await appointmentSuperAdminApi.updateBranchSettings(
                editingBranchSettings.branch_id,
                editingBranchSettings.settings
            );
            if (response.status === 200) {
                setMessage({ type: 'success', text: 'Branch settings updated successfully' });
                setShowSettingsModal(false);
                loadBranchSettings();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update branch settings' });
        }
    };

    // ============================================
    // Edit/Reschedule Handlers
    // ============================================
    // Helper to format date to yyyy-MM-dd
    const formatDateOnly = (dateStr: string): string => {
        if (!dateStr) return '';
        // Handle "2025-12-22 00:00:00" or "2025-12-22T00:00:00" formats
        return dateStr.split(/[\sT]/)[0];
    };

    const openEditModal = (apt: AppointmentBooking) => {
        const cleanDate = formatDateOnly(apt.appointment_date);
        setEditingAppointment(apt);
        setEditForm({
            branchId: apt.branch_id,
            doctorId: apt.doctor_id,
            date: cleanDate,
            slotNumber: apt.slot_number,
        });
        setEditError(null);
        setShowEditModal(true);
        loadAvailableSlots(apt.doctor_id, cleanDate);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingAppointment(null);
        setEditForm({ branchId: '', doctorId: '', date: '', slotNumber: 0 });
        setAvailableSlots([]);
        setEditError(null);
    };

    const loadAvailableSlots = async (doctorId: string, date: string) => {
        if (!doctorId || !date) {
            setAvailableSlots([]);
            return;
        }
        try {
            setLoadingSlots(true);
            const response = await appointmentSuperAdminApi.getAvailableSlots(doctorId, date);
            if (response.status === 200) {
                setAvailableSlots(response.slots || []);
            }
        } catch (err) {
            console.error('Failed to load slots:', err);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleEditFormChange = (field: keyof EditFormData, value: string | number) => {
        const newForm = { ...editForm, [field]: value };
        setEditForm(newForm);

        // If doctor or date changes, reload available slots
        if (field === 'doctorId' || field === 'date') {
            const doctorId = field === 'doctorId' ? value as string : newForm.doctorId;
            const date = field === 'date' ? value as string : newForm.date;
            if (doctorId && date) {
                loadAvailableSlots(doctorId, date);
                setEditForm(prev => ({ ...prev, [field]: value, slotNumber: 0 }));
            }
        }
    };

    const handleSaveEdit = async () => {
        if (!editingAppointment) return;

        if (!editForm.doctorId || !editForm.date || !editForm.slotNumber) {
            setEditError('Please fill all required fields');
            return;
        }

        try {
            setSavingEdit(true);
            setEditError(null);

            const response = await appointmentSuperAdminApi.rescheduleAppointment(
                editingAppointment.id,
                {
                    new_doctor_id: editForm.doctorId,
                    new_date: editForm.date,
                    new_slot_number: editForm.slotNumber,
                    new_branch_id: editForm.branchId,
                    reason: 'Modified by Super Admin',
                }
            );

            if (response.status === 200) {
                setMessage({ type: 'success', text: 'Appointment updated successfully' });
                closeEditModal();
                loadAppointments();
                loadSessions();
            }
        } catch (err: any) {
            console.error('Failed to update appointment:', err);
            setEditError(err.response?.data?.message || 'Failed to update appointment');
        } finally {
            setSavingEdit(false);
        }
    };

    // ============================================
    // Cancel Handlers
    // ============================================
    const openCancelModal = (apt: AppointmentBooking) => {
        setCancellingAppointment(apt);
        setCancelReason('');
        setCancellationType('normal');
        setCancelError(null);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setCancellingAppointment(null);
        setCancelReason('');
        setCancellationType('normal');
        setCancelError(null);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingAppointment) return;

        if (!cancelReason.trim()) {
            setCancelError('Please provide a cancellation reason');
            return;
        }

        try {
            setSavingCancel(true);
            setCancelError(null);

            const response = await appointmentSuperAdminApi.cancelAppointment(
                cancellingAppointment.id,
                cancelReason,
                cancellationType === 'doctor_request'
            );

            if (response.status === 200) {
                setMessage({ type: 'success', text: 'Appointment cancelled successfully' });
                closeCancelModal();
                loadAppointments();
                loadSessions();
            }
        } catch (err: any) {
            console.error('Failed to cancel appointment:', err);
            setCancelError(err.response?.data?.message || 'Failed to cancel appointment');
        } finally {
            setSavingCancel(false);
        }
    };

    // ============================================
    // Create Booking Handlers
    // ============================================
    const openBookingModal = () => {
        setBookingForm({
            branchId: selectedBranch || '',
            patientId: '',
            patientName: '',
            doctorId: '',
            date: new Date().toISOString().split('T')[0],
            slotNumber: 0,
            bookingType: 'walk_in',
            paymentStatus: 'pending',
            notes: ''
        });
        setBookingSlots([]);
        setPatientSearchQuery('');
        setPatientSearchResults([]);
        setShowNewPatientForm(false);
        setNewPatientData({
            full_name: '', mobile_number: '', nic: '', gender: 'male', date_of_birth: '', address: '', send_sms: true
        });
        setBookingError(null);
        setBookingSuccess(null);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setBookingError(null);
        setBookingSuccess(null);
    };

    const handlePatientSearch = async (query: string) => {
        setPatientSearchQuery(query);
        if (query.length < 2) {
            setPatientSearchResults([]);
            return;
        }

        try {
            setSearchingPatients(true);
            const response = await appointmentSuperAdminApi.searchPatients(query, bookingForm.branchId);
            if (response.status === 200) {
                setPatientSearchResults(response.patients || []);
            }
        } catch (err) {
            console.error('Patient search failed:', err);
        } finally {
            setSearchingPatients(false);
        }
    };

    const selectPatient = (patient: PatientSearchResult) => {
        setBookingForm(prev => ({
            ...prev,
            patientId: patient.id,
            patientName: patient.name
        }));
        setPatientSearchQuery(patient.name);
        setPatientSearchResults([]);
    };

    const handleBookingFormChange = async (field: keyof BookingFormData, value: string | number) => {
        const newForm = { ...bookingForm, [field]: value };
        setBookingForm(newForm);

        // Reload slots when doctor or date changes
        if (field === 'doctorId' || field === 'date') {
            const doctorId = field === 'doctorId' ? value as string : newForm.doctorId;
            const date = field === 'date' ? value as string : newForm.date;
            if (doctorId && date) {
                loadBookingSlots(doctorId, date);
                setBookingForm(prev => ({ ...prev, [field]: value, slotNumber: 0 }));
            }
        }
        // Reload doctors when branch changes
        if (field === 'branchId') {
            setBookingForm(prev => ({ ...prev, branchId: value as string, doctorId: '', slotNumber: 0 }));
            setBookingSlots([]);
            setBookingDoctors([]);
            // Load doctors for the selected branch
            if (value) {
                try {
                    const response = await appointmentSuperAdminApi.getAllDoctors(value as string);
                    if (response.status === 200 && response.doctors) {
                        setBookingDoctors(response.doctors);
                    }
                } catch (error) {
                    console.error('Failed to load doctors for booking:', error);
                }
            }
        }
    };

    const loadBookingSlots = async (doctorId: string, date: string) => {
        if (!doctorId || !date) {
            setBookingSlots([]);
            return;
        }
        try {
            setLoadingSlots(true);
            const response = await appointmentSuperAdminApi.getAvailableSlots(doctorId, date, bookingForm.branchId);
            if (response.status === 200) {
                setBookingSlots(response.slots || []);
            }
        } catch (err) {
            console.error('Failed to load slots:', err);
            setBookingSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleCreateBooking = async () => {
        // Validation
        if (!bookingForm.branchId) {
            setBookingError('Please select a branch');
            return;
        }
        if (!bookingForm.patientId && !showNewPatientForm) {
            setBookingError('Please select or register a patient');
            return;
        }
        if (showNewPatientForm && (!newPatientData.full_name || !newPatientData.mobile_number)) {
            setBookingError('Patient name and phone are required');
            return;
        }
        if (!bookingForm.doctorId) {
            setBookingError('Please select a doctor');
            return;
        }
        if (!bookingForm.date) {
            setBookingError('Please select a date');
            return;
        }
        if (!bookingForm.slotNumber) {
            setBookingError('Please select a slot');
            return;
        }

        try {
            setSavingBooking(true);
            setBookingError(null);

            let response;
            if (showNewPatientForm) {
                response = await appointmentSuperAdminApi.createAppointmentWithPatient({
                    branch_id: bookingForm.branchId,
                    new_patient: newPatientData,
                    doctor_id: bookingForm.doctorId,
                    appointment_date: bookingForm.date,
                    slot_number: bookingForm.slotNumber,
                    booking_type: bookingForm.bookingType,
                    payment_status: bookingForm.paymentStatus,
                    notes: bookingForm.notes,
                });
            } else {
                response = await appointmentSuperAdminApi.createAppointment({
                    branch_id: bookingForm.branchId,
                    patient_id: bookingForm.patientId,
                    doctor_id: bookingForm.doctorId,
                    appointment_date: bookingForm.date,
                    slot_number: bookingForm.slotNumber,
                    booking_type: bookingForm.bookingType,
                    payment_status: bookingForm.paymentStatus,
                    notes: bookingForm.notes,
                });
            }

            if (response.status === 200) {
                let successMsg = `Appointment created! Token #${response.appointment?.token_number}`;
                if ((response as any).patient_credentials) {
                    const creds = (response as any).patient_credentials;
                    successMsg += ` | Patient Login: ${creds.username} / ${creds.password}`;
                }
                setBookingSuccess(successMsg);
                setMessage({ type: 'success', text: successMsg });
                setTimeout(() => {
                    closeBookingModal();
                    loadAppointments();
                }, 2000);
            }
        } catch (err: any) {
            console.error('Failed to create booking:', err);
            setBookingError(err.response?.data?.message || 'Failed to create appointment');
        } finally {
            setSavingBooking(false);
        }
    };

    // ============================================
    // Utility Functions
    // ============================================

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            pending_payment: 'bg-orange-100 text-orange-800',
            confirmed: 'bg-blue-100 text-blue-800',
            checked_in: 'bg-purple-100 text-purple-800',
            in_progress: 'bg-indigo-100 text-indigo-800',
            in_session: 'bg-indigo-100 text-indigo-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-error-100 text-red-800',
            rescheduled: 'bg-amber-100 text-amber-800',
            no_show: 'bg-neutral-100 text-neutral-800'
        };
        return colors[status] || 'bg-neutral-100 text-neutral-800';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            waived: 'bg-blue-100 text-blue-800',
            refunded: 'bg-purple-100 text-purple-800',
            failed: 'bg-error-100 text-red-800'
        };
        return colors[status] || 'bg-neutral-100 text-neutral-800';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Filter appointments based on search
    const filteredAppointments = appointments.filter(apt => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            apt.patient_name?.toLowerCase().includes(query) ||
            apt.doctor_name?.toLowerCase().includes(query) ||
            apt.id?.toString().includes(query)
        );
    });

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">Appointment Management</h1>
                        <p className="text-neutral-600 mt-1">Monitor and manage appointments across all branches</p>
                    </div>
                    <button
                        onClick={() => {
                            loadAppointments();
                            loadSessions();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-error-100 text-red-800'}`}>
                        {message.text}
                        <button onClick={() => setMessage(null)} className="float-right">&times;</button>
                    </div>
                )}

                {/* Time-based Sub-tabs + Create Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setAppointmentView('today'); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appointmentView === 'today'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Today
                                </span>
                            </button>
                            <button
                                onClick={() => { setAppointmentView('upcoming'); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appointmentView === 'upcoming'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Upcoming
                                </span>
                            </button>
                            <button
                                onClick={() => { setAppointmentView('past'); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appointmentView === 'past'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Past / Cancelled
                                </span>
                            </button>
                        </div>
                        <button
                            onClick={openBookingModal}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Appointment
                        </button>
                    </div>


                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-4">
                        {/* Row 1: Branch, Doctor, Specialization, Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Branch Filter */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Branch</label>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => {
                                            setSelectedBranch(e.target.value);
                                            setDoctorFilter(''); // Reset doctor when branch changes
                                            setCurrentPage(1);
                                        }}
                                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Doctor Filter */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Doctor</label>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-neutral-400" />
                                    <select
                                        value={doctorFilter}
                                        onChange={(e) => {
                                            setDoctorFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Doctors</option>
                                        {doctors.map((doc, idx) => (
                                            <option key={`${doc.doctor_id}-${doc.branch_id ?? idx}`} value={doc.doctor_id}>
                                                {doc.name} {!selectedBranch && doc.branch_name ? `(${doc.branch_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Specialization Filter */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Specialization</label>
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-neutral-400" />
                                    <select
                                        value={specializationFilter}
                                        onChange={(e) => {
                                            setSpecializationFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Specializations</option>
                                        {specializations.map((spec) => (
                                            <option key={spec} value={spec}>
                                                {spec}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-neutral-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="pending_payment">Pending Payment</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="checked_in">Checked In</option>
                                        <option value="in_session">In Session</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rescheduled">Rescheduled</option>
                                        <option value="no_show">No Show</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Date Range and Search */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Single Date */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Specific Date</label>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        // Clear date range if single date is selected
                                        if (e.target.value) {
                                            setStartDate('');
                                            setEndDate('');
                                        }
                                        setCurrentPage(1);
                                    }}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Date Range Start */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        // Clear single date if range is selected
                                        if (e.target.value) {
                                            setDateFilter('');
                                        }
                                        setCurrentPage(1);
                                    }}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Date Range End */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        // Clear single date if range is selected
                                        if (e.target.value) {
                                            setDateFilter('');
                                        }
                                        setCurrentPage(1);
                                    }}
                                    min={startDate}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Patient name or Appointment ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setSelectedBranch('');
                                    setDoctorFilter('');
                                    setSpecializationFilter('');
                                    setStatusFilter('');
                                    setDateFilter('');
                                    setStartDate('');
                                    setEndDate('');
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="text-sm text-neutral-500 hover:text-emerald-600 flex items-center gap-1"
                            >
                                <XCircle className="w-4 h-4" />
                                Clear All Filters
                            </button>
                        </div>
                    </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <>
                            <>
                                {showSessionDetails && selectedSessionId ? (
                                    <SessionDetailsPanel
                                        sessionId={selectedSessionId}
                                        initialAction={sessionPanelAction}
                                        onBack={() => {
                                            setShowSessionDetails(false);
                                            setSelectedSessionId(null);
                                            setSessionPanelAction(undefined);
                                            loadSessions();
                                        }}
                                    />
                                ) : (
                                    <>
                                        {viewMode === 'sessions' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                                {sessions.length === 0 ? (
                                                    <div className="col-span-full py-12 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200">
                                                        No sessions found for the selected filters
                                                    </div>
                                                ) : (
                                                    sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow relative"
                                                        >
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <h3 className="font-semibold text-neutral-900">{session.doctor_name}</h3>
                                                                    <p className="text-sm text-neutral-500">{session.branch_name}</p>
                                                                </div>
                                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {session.status.replace('_', ' ')}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-3 mb-4">
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                                                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                                    <Clock className="w-4 h-4 text-neutral-400" />
                                                                    <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                                    <User className="w-4 h-4 text-neutral-400" />
                                                                    <span>{session.appointment_count} / {session.total_slots || 0} Slots Filled</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                                    <UserPlus className="w-4 h-4 text-neutral-400" />
                                                                    <span>{session.assigned_staff_count || 0} Staff Assigned</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-2">
                                                                <button
                                                                    onClick={() => openSessionDetails(session.id)}
                                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => handleManageSession(session)}
                                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                >
                                                                    Manage
                                                                </button>
                                                                <button
                                                                    onClick={() => openSessionDetails(session.id, 'assign-staff')}
                                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                                >
                                                                    Assign Staff
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSession(session)}
                                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {viewMode === 'list' && (
                                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-neutral-50">
                                                            <tr>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Branch</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Appt ID</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Patient</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Doctor</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Specialization</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Slot #</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Est. Time</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Payment</th>
                                                                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {filteredAppointments.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={11} className="px-4 py-8 text-center text-neutral-500">
                                                                        No appointments found
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                filteredAppointments.map((apt) => (
                                                                    <tr key={apt.id} className="hover:bg-neutral-50">
                                                                        {/* Branch Name */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                                                <span className="text-sm font-medium truncate max-w-[120px]" title={apt.branch_name}>
                                                                                    {apt.branch_name}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Appointment ID */}
                                                                        <td className="px-3 py-3">
                                                                            <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                                                #{apt.token_number || apt.id?.toString().slice(-6)}
                                                                            </span>
                                                                        </td>
                                                                        {/* Patient Name */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                                                <span className="font-medium text-sm truncate max-w-[120px]" title={apt.patient_name || 'Unknown'}>
                                                                                    {apt.patient_name || 'Unknown'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Doctor Name */}
                                                                        <td className="px-3 py-3">
                                                                            <span className="text-sm font-medium truncate max-w-[120px] block" title={apt.doctor_name}>
                                                                                {apt.doctor_name}
                                                                            </span>
                                                                        </td>
                                                                        {/* Specialization */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <Stethoscope className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                                                                <span className="text-xs text-neutral-600 truncate max-w-[100px]" title={(apt as any).specialization || 'General'}>
                                                                                    {(apt as any).specialization || 'General'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Date */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                                                <span className="text-sm">{formatDate(apt.appointment_date)}</span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Slot Number */}
                                                                        <td className="px-3 py-3 text-center">
                                                                            <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold bg-neutral-100 text-neutral-700 rounded-full">
                                                                                {(apt as any).slot_number || '-'}
                                                                            </span>
                                                                        </td>
                                                                        {/* Estimated Time */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                                                <span className="text-sm">{apt.appointment_time}</span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Status */}
                                                                        <td className="px-3 py-3">
                                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(apt.status)}`}>
                                                                                {apt.status.replace(/_/g, ' ')}
                                                                            </span>
                                                                        </td>
                                                                        {/* Payment Status */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <DollarSign className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(apt.payment_status)}`}>
                                                                                    {apt.payment_status}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        {/* Actions */}
                                                                        <td className="px-3 py-3">
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedAppointment(apt);
                                                                                        setShowDetailsModal(true);
                                                                                    }}
                                                                                    className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                                    title="View Details"
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                </button>
                                                                                {!['completed', 'cancelled', 'no_show'].includes(apt.status) && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => openEditModal(apt)}
                                                                                            className="p-1.5 text-neutral-500 hover:text-primary-500 hover:bg-blue-50 rounded-lg"
                                                                                            title="Edit/Reschedule"
                                                                                        >
                                                                                            <Edit className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => openCancelModal(apt)}
                                                                                            className="p-1.5 text-neutral-500 hover:text-error-600 hover:bg-error-50 rounded-lg"
                                                                                            title="Cancel Appointment"
                                                                                        >
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination */}
                                                {totalPages > 1 && (
                                                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                                                        <p className="text-sm text-neutral-500">
                                                            Page {currentPage} of {totalPages}
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                disabled={currentPage === 1}
                                                                className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50"
                                                            >
                                                                <ChevronLeft className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                disabled={currentPage === totalPages}
                                                                className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50"
                                                            >
                                                                <ChevronRight className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>

                        {/* Statistics Tab */}
                        {false && statistics && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-neutral-500">Total Appointments</p>
                                                <p className="text-3xl font-bold text-neutral-800">{statistics!.total}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-emerald-100">
                                                <Calendar className="w-6 h-6 text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-neutral-500">Today's Appointments</p>
                                                <p className="text-3xl font-bold text-primary-500">{statistics!.today}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-blue-100">
                                                <Clock className="w-6 h-6 text-primary-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-neutral-500">Completed</p>
                                                <p className="text-3xl font-bold text-green-600">{statistics!.completed}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-green-100">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-neutral-500">Cancelled / No Show</p>
                                                <p className="text-3xl font-bold text-error-600">
                                                    {statistics!.cancelled + statistics!.no_show}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-error-100">
                                                <XCircle className="w-6 h-6 text-error-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* By Branch */}
                                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Appointments by Branch</h3>
                                    <div className="space-y-3">
                                        {statistics!.by_branch?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-neutral-400" />
                                                    <span className="font-medium">{item.branch_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${(item.count / statistics!.total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-neutral-600 w-12 text-right">{item.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* By Status */}
                                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Appointments by Status</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {statistics!.by_status?.map((item, idx) => (
                                            <div key={idx} className="text-center p-4 bg-neutral-50 rounded-lg">
                                                <p className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${getStatusColor(item.status)}`}>
                                                    {item.status.replace('_', ' ')}
                                                </p>
                                                <p className="text-2xl font-bold text-neutral-800">{item.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Branch Settings Tab */}
                        {false && (
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Branch</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Advance Days</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Min Lead Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Slot Duration</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Booking Fee</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {branchSettings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                                    No branch settings configured
                                                </td>
                                            </tr>
                                        ) : (
                                            branchSettings.map((setting) => (
                                                <tr key={setting.branch_id} className="hover:bg-neutral-50">
                                                    <td className="px-4 py-3 font-medium">{setting.branch_name}</td>
                                                    <td className="px-4 py-3">{setting.settings.max_advance_booking_days} days</td>
                                                    <td className="px-4 py-3">{setting.settings.min_advance_booking_hours} hours</td>
                                                    <td className="px-4 py-3">{setting.settings.default_time_per_patient} min</td>
                                                    <td className="px-4 py-3">Rs. {setting.settings.default_booking_fee}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${setting.has_settings ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {setting.has_settings ? 'Configured' : 'Default'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => {
                                                                setEditingBranchSettings(setting);
                                                                setShowSettingsModal(true);
                                                            }}
                                                            className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Audit Logs Tab - STEP 12 */}
                        {false && (
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Timestamp</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Super Admin</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Branch</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Appointment ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status Change</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                                    No audit logs found
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-neutral-50">
                                                    {/* Timestamp */}
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                        <div>
                                                            <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                                            <p className="text-xs text-neutral-500">{new Date(log.created_at).toLocaleTimeString()}</p>
                                                        </div>
                                                    </td>
                                                    {/* Super Admin ID/Name */}
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <span className="font-medium text-sm">{log.performed_by_name || log.performed_by}</span>
                                                            <p className="text-xs text-emerald-600">{log.performed_by_role}</p>
                                                        </div>
                                                    </td>
                                                    {/* Branch */}
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm">{log.branch_name || '-'}</span>
                                                    </td>
                                                    {/* Appointment ID */}
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded">
                                                            #{log.appointment_id?.toString().slice(-8) || '-'}
                                                        </span>
                                                    </td>
                                                    {/* Action */}
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded ${log.action === 'created' ? 'bg-green-100 text-green-800' :
                                                            log.action === 'cancelled' ? 'bg-error-100 text-red-800' :
                                                                log.action === 'rescheduled' ? 'bg-blue-100 text-blue-800' :
                                                                    log.action === 'status_changed' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-neutral-100 text-neutral-800'
                                                            }`}>
                                                            {log.action_label || log.action?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    {/* Status Change */}
                                                    <td className="px-4 py-3 text-sm">
                                                        {log.previous_status && log.new_status ? (
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-neutral-500">{log.previous_status}</span>
                                                                <span className="text-neutral-400">→</span>
                                                                <span className="font-medium">{log.new_status}</span>
                                                            </span>
                                                        ) : log.new_status ? (
                                                            <span className="font-medium">{log.new_status}</span>
                                                        ) : (
                                                            <span className="text-neutral-400">-</span>
                                                        )}
                                                    </td>
                                                    {/* Details/Reason */}
                                                    <td className="px-4 py-3 text-sm text-neutral-500 max-w-xs">
                                                        <div className="truncate" title={log.reason || ''}>
                                                            {log.reason || '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                                        <p className="text-sm text-neutral-500">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Appointment Details Modal */}
            {showDetailsModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-800">Appointment Details</h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-neutral-500">Reference</p>
                                    <p className="font-mono font-medium">#{selectedAppointment.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Status</p>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                                        {selectedAppointment.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Patient</p>
                                    <p className="font-medium">{selectedAppointment.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Doctor</p>
                                    <p className="font-medium">{selectedAppointment.doctor_name}</p>
                                    <p className="text-xs text-neutral-500">{selectedAppointment.appointment_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Branch</p>
                                    <p className="font-medium">{selectedAppointment.branch_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Date & Time</p>
                                    <p className="font-medium">
                                        {formatDate(selectedAppointment.appointment_date)} at{' '}
                                        {formatTime(selectedAppointment.appointment_time)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Booking Type</p>
                                    <p className="font-medium capitalize">{selectedAppointment.booking_type || 'online'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Payment Status</p>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedAppointment.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedAppointment.payment_status || 'pending'}
                                    </span>
                                </div>
                            </div>
                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-sm text-neutral-500">Notes</p>
                                    <p className="text-neutral-700">{selectedAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end p-4 border-t border-neutral-200">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Settings Modal */}
            {showSettingsModal && editingBranchSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-800">
                                Edit Settings - {editingBranchSettings.branch_name}
                            </h3>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Advance Booking Days
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.max_advance_booking_days}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                max_advance_booking_days: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Min Lead Time (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.min_advance_booking_hours}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                min_advance_booking_hours: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Time Per Patient (min)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.default_time_per_patient}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                default_time_per_patient: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Booking Fee (Rs.)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.default_booking_fee}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                default_booking_fee: parseFloat(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Max Patients Per Session
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.default_max_patients_per_session}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                default_max_patients_per_session: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Cancellation Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={editingBranchSettings.settings.cancellation_advance_hours}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                cancellation_advance_hours: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingBranchSettings.settings.allow_walk_in}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                allow_walk_in: e.target.checked
                                            }
                                        })}
                                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-neutral-700">Allow Walk-in</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingBranchSettings.settings.allow_patient_cancellation}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                allow_patient_cancellation: e.target.checked
                                            }
                                        })}
                                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-neutral-700">Allow Cancellation</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingBranchSettings.settings.allow_reschedule}
                                        onChange={(e) => setEditingBranchSettings({
                                            ...editingBranchSettings,
                                            settings: {
                                                ...editingBranchSettings.settings,
                                                allow_reschedule: e.target.checked
                                            }
                                        })}
                                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-neutral-700">Allow Rescheduling</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateBranchSettings}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Reschedule Modal */}
            {showEditModal && editingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-800">
                                Edit Appointment - #{editingAppointment.token_number || editingAppointment.id}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Current info display */}
                            <div className="bg-neutral-50 rounded-lg p-3">
                                <p className="text-sm text-neutral-600">
                                    <strong>Patient:</strong> {editingAppointment.patient_name}<br />
                                    <strong>Current:</strong> {editingAppointment.doctor_name} on {formatDate(editingAppointment.appointment_date)}
                                </p>
                            </div>

                            {editError && (
                                <div className="bg-error-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {editError}
                                </div>
                            )}

                            {/* Branch */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Branch</label>
                                <select
                                    value={editForm.branchId}
                                    onChange={(e) => handleEditFormChange('branchId', e.target.value)}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Doctor */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Doctor</label>
                                <select
                                    value={editForm.doctorId}
                                    onChange={(e) => handleEditFormChange('doctorId', e.target.value)}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map((doc, idx) => (
                                        <option key={`edit-${doc.doctor_id}-${doc.branch_id ?? idx}`} value={doc.doctor_id}>
                                            {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">New Date</label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleEditFormChange('date', e.target.value)}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Slot Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Available Slots</label>
                                {loadingSlots ? (
                                    <div className="flex items-center justify-center py-4">
                                        <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-sm text-neutral-500 py-2">No slots available for selected doctor/date</p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.slot_number}
                                                onClick={() => setEditForm(prev => ({ ...prev, slotNumber: slot.slot_number }))}
                                                disabled={!slot.is_available}
                                                className={`p-2 text-xs rounded-lg border transition-colors ${editForm.slotNumber === slot.slot_number
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : slot.is_available
                                                        ? 'bg-white text-neutral-700 border-neutral-300 hover:border-emerald-500'
                                                        : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                                    }`}
                                            >
                                                #{slot.slot_number}
                                                <span className="block text-[10px]">{slot.time}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editForm.slotNumber}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingEdit ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Appointment Modal */}
            {showCancelModal && cancellingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-error-600 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Cancel Appointment
                            </h3>
                            <button
                                onClick={closeCancelModal}
                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Appointment info display */}
                            <div className="bg-neutral-50 rounded-lg p-3">
                                <p className="text-sm text-neutral-600">
                                    <strong>Token:</strong> #{cancellingAppointment.token_number || cancellingAppointment.id}<br />
                                    <strong>Patient:</strong> {cancellingAppointment.patient_name}<br />
                                    <strong>Doctor:</strong> {cancellingAppointment.doctor_name}<br />
                                    <strong>Date:</strong> {formatDate(cancellingAppointment.appointment_date)}
                                </p>
                            </div>

                            {cancelError && (
                                <div className="bg-error-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {cancelError}
                                </div>
                            )}

                            {/* Cancellation Type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Cancellation Type</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="normal"
                                            checked={cancellationType === 'normal'}
                                            onChange={(e) => setCancellationType(e.target.value as CancellationType)}
                                            className="text-error-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-neutral-700">Normal Cancellation</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="doctor_request"
                                            checked={cancellationType === 'doctor_request'}
                                            onChange={(e) => setCancellationType(e.target.value as CancellationType)}
                                            className="text-error-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-neutral-700">Doctor Requested (will notify patient)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Cancellation Reason <span className="text-error-500">*</span>
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter the reason for cancellation..."
                                    rows={3}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200">
                            <button
                                onClick={closeCancelModal}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={savingCancel || !cancelReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingCancel ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-600" />
                                Create New Appointment
                            </h3>
                            <button
                                onClick={closeBookingModal}
                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {bookingSuccess && (
                                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{bookingSuccess}</span>
                                </div>
                            )}

                            {bookingError && (
                                <div className="bg-error-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {bookingError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Branch Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Branch <span className="text-error-500">*</span>
                                    </label>
                                    <select
                                        value={bookingForm.branchId}
                                        onChange={(e) => handleBookingFormChange('branchId', e.target.value)}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Booking Type */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Booking Type</label>
                                    <select
                                        value={bookingForm.bookingType}
                                        onChange={(e) => handleBookingFormChange('bookingType', e.target.value)}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="walk_in">Walk-in</option>
                                        <option value="phone">Phone</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>

                            {/* Patient Selection */}
                            <div className="border border-neutral-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-neutral-700">Patient</label>
                                    <button
                                        onClick={() => {
                                            setShowNewPatientForm(!showNewPatientForm);
                                            if (!showNewPatientForm) {
                                                setBookingForm(prev => ({ ...prev, patientId: '', patientName: '' }));
                                                setPatientSearchQuery('');
                                            }
                                        }}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        {showNewPatientForm ? 'Search Existing' : 'Register New'}
                                    </button>
                                </div>

                                {!showNewPatientForm ? (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input
                                                type="text"
                                                value={patientSearchQuery}
                                                onChange={(e) => handlePatientSearch(e.target.value)}
                                                placeholder="Search by name, phone, or NIC..."
                                                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                            {searchingPatients && (
                                                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                                            )}
                                        </div>
                                        {patientSearchResults.length > 0 && (
                                            <div className="border border-neutral-200 rounded-lg max-h-40 overflow-y-auto">
                                                {patientSearchResults.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        onClick={() => selectPatient(patient)}
                                                        className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-sm">{patient.name}</p>
                                                            <p className="text-xs text-neutral-500">
                                                                <Phone className="w-3 h-3 inline mr-1" />
                                                                {patient.phone}
                                                                {patient.nic && ` • ${patient.nic}`}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {bookingForm.patientId && (
                                            <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                                                <span>Selected: <strong>{bookingForm.patientName}</strong></span>
                                                <button
                                                    onClick={() => {
                                                        setBookingForm(prev => ({ ...prev, patientId: '', patientName: '' }));
                                                        setPatientSearchQuery('');
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={newPatientData.full_name}
                                                    onChange={(e) => setNewPatientData(prev => ({ ...prev, full_name: e.target.value }))}
                                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">Mobile *</label>
                                                <input
                                                    type="text"
                                                    value={newPatientData.mobile_number}
                                                    onChange={(e) => setNewPatientData(prev => ({ ...prev, mobile_number: e.target.value }))}
                                                    placeholder="07XXXXXXXX"
                                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">NIC</label>
                                                <input
                                                    type="text"
                                                    value={newPatientData.nic}
                                                    onChange={(e) => setNewPatientData(prev => ({ ...prev, nic: e.target.value }))}
                                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">Gender</label>
                                                <select
                                                    value={newPatientData.gender}
                                                    onChange={(e) => setNewPatientData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-neutral-500 mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={newPatientData.date_of_birth}
                                                onChange={(e) => setNewPatientData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newPatientData.send_sms}
                                                onChange={(e) => setNewPatientData(prev => ({ ...prev, send_sms: e.target.checked }))}
                                                className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-neutral-700">Send confirmation SMS</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Doctor */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Doctor <span className="text-error-500">*</span>
                                    </label>
                                    <select
                                        value={bookingForm.doctorId}
                                        onChange={(e) => handleBookingFormChange('doctorId', e.target.value)}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                        disabled={!bookingForm.branchId}
                                    >
                                        <option value="">{bookingForm.branchId ? 'Select Doctor' : 'Select Branch First'}</option>
                                        {bookingDoctors.map((doc, idx) => (
                                            <option key={`book-${doc.doctor_id}-${doc.branch_id ?? idx}`} value={doc.doctor_id}>
                                                {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Date <span className="text-error-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={bookingForm.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => handleBookingFormChange('date', e.target.value)}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Slot Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Available Slots <span className="text-error-500">*</span>
                                </label>
                                {loadingSlots ? (
                                    <div className="flex items-center justify-center py-4">
                                        <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                                    </div>
                                ) : bookingSlots.length === 0 ? (
                                    <p className="text-sm text-neutral-500 py-2">
                                        {bookingForm.doctorId && bookingForm.date
                                            ? 'No slots available for selected doctor/date'
                                            : 'Select doctor and date to see available slots'}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-neutral-200 rounded-lg p-3">
                                        {bookingSlots.map((slot) => (
                                            <button
                                                key={slot.slot_number}
                                                onClick={() => setBookingForm(prev => ({ ...prev, slotNumber: slot.slot_number }))}
                                                disabled={!slot.is_available}
                                                className={`p-2 text-xs rounded-lg border transition-colors ${bookingForm.slotNumber === slot.slot_number
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : slot.is_available
                                                        ? 'bg-white text-neutral-700 border-neutral-300 hover:border-emerald-500'
                                                        : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                                    }`}
                                            >
                                                #{slot.slot_number}
                                                <span className="block text-[10px]">{slot.time}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Payment Status */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Status</label>
                                    <select
                                        value={bookingForm.paymentStatus}
                                        onChange={(e) => handleBookingFormChange('paymentStatus', e.target.value)}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        value={bookingForm.notes}
                                        onChange={(e) => handleBookingFormChange('notes', e.target.value)}
                                        placeholder="Optional notes..."
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 sticky bottom-0 bg-white">
                            <button
                                onClick={closeBookingModal}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBooking}
                                disabled={savingBooking || !!bookingSuccess}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingBooking ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Create Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default SuperAdminAppointments;
