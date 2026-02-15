// Fixed TypeScript errors for optional slot_number fields
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarDay,
  FaCalendarAlt,
  FaHistory,
  FaSync,
  FaUserMd,
  FaUser,
  FaClock,
  FaHashtag,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaSave,
  FaPlus,
  FaUserPlus,
  FaPhone,
  FaWalking,
  FaGlobe,
  FaKey,
  FaInfoCircle,
  FaUserShield,
  FaPrint,
  FaTrash,
} from 'react-icons/fa';
import {
  appointmentSuperAdminApi,
  appointmentPublicApi,
  appointmentReceptionistApi,
  appointmentBranchAdminApi,
  AppointmentBooking,
  Doctor,
  SlotInfo,
  PatientSearchResult,
  AppointmentSettings,
  AuditLogEntry,
} from '../../../services/appointmentService';
import { patientSessionApi, SessionListItem } from '../../../services/patientSessionService';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminMenuItems } from '../../../config/branchAdminNavigation';
import { FaClipboardList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import SessionDetailsPanel from '../../../components/dashboard/Sessions/SessionDetailsPanel';

// ============================================
// Types
// ============================================
type ViewType = 'today' | 'upcoming' | 'past' | 'audit';

interface AppointmentCounts {
  today: number;
  upcoming: number;
  past: number;
}

interface AuditLogFilters {
  search: string;
  action: string;
  adminId: string;
  startDate: string;
  endDate: string;
}

interface Filters {
  search: string;
  doctorId: string;
  specialization: string;
  status: string;
  startDate: string;
  endDate: string;
  branchId: string;
  day: string;
  paymentStatus: string;
}

interface EditAppointmentData {
  appointmentId: string;
  doctorId: string;
  date: string;
  slotNumber: number;
  patientName: string;
  currentDoctorName: string;
}

interface CancelAppointmentData {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  date: string;
  slotNumber: number;
}

type CancellationType = 'normal' | 'doctor_request';

type BookingType = 'walk_in' | 'phone' | 'online';
type PaymentStatusType = 'pending' | 'paid' | 'waived';

interface BookingFormData {
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string;
  slotNumber: number;
  bookingType: BookingType;
  paymentStatus: PaymentStatusType;
  paymentMethod: string;
  amountPaid: number;
  notes: string;
}

const initialBookingForm: BookingFormData = {
  patientId: '',
  patientName: '',
  doctorId: '',
  date: new Date().toISOString().split('T')[0],
  slotNumber: 0,
  bookingType: 'walk_in',
  paymentStatus: 'pending',
  paymentMethod: '',
  amountPaid: 0,
  notes: '',
};

const initialFilters: Filters = {
  search: '',
  doctorId: '',
  specialization: '',
  status: '',
  startDate: '',
  endDate: '',
  branchId: '',
  day: '',
  paymentStatus: '',
};

// ============================================
// Main Component
// ============================================
const BranchAdminAppointmentsNew: React.FC = () => {
  const navigate = useNavigate();

  // ============================================
  // State
  // ============================================
  const [activeView, setActiveView] = useState<ViewType>('upcoming');
  const [viewMode, setViewMode] = useState<'sessions' | 'list'>('sessions');
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [sessionPanelAction, setSessionPanelAction] = useState<'assign-staff' | undefined>(undefined);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<AppointmentCounts>({ today: 0, upcoming: 0, past: 0 });

  // Filter state
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<EditAppointmentData | null>(null);
  const [editForm, setEditForm] = useState({ doctorId: '', date: '', slotNumber: 0 });
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<CancelAppointmentData | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [savingDelete, setSavingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<CancelAppointmentData | null>(null);
  const [cancellationType, setCancellationType] = useState<CancellationType>('normal');
  const [cancelReason, setCancelReason] = useState('');
  const [savingCancel, setSavingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Create booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>(initialBookingForm);
  const [bookingSlots, setBookingSlots] = useState<SlotInfo[]>([]);
  const [bookingSchedule, setBookingSchedule] = useState<{ start_time: string; end_time: string; max_patients: number; booked_count: number } | null>(null);
  const [loadingBookingSlots, setLoadingBookingSlots] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // New Patient Registration state
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    mobile_number: '',
    nic: '',
    gender: 'male' as 'male' | 'female' | 'other',
    date_of_birth: '',
    address: '',
    send_sms: true,
  });
  const [registeringPatient, setRegisteringPatient] = useState(false);
  const [patientCredentials, setPatientCredentials] = useState<{
    username: string;
    password: string;
    login_url: string;
  } | null>(null);

  // Booking rules state
  const [bookingSettings, setBookingSettings] = useState<AppointmentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [userRole, setUserRole] = useState<number>(0);
  const [overrideRules, setOverrideRules] = useState(false);

  // User info state
  const [userName, setUserName] = useState('Branch Admin');
  const [profileImage, setProfileImage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLogo, setBranchLogo] = useState('');
  const [userGender, setUserGender] = useState('');
  const [currentBranchId, setCurrentBranchId] = useState<string>('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  const [auditLogFilters, setAuditLogFilters] = useState<AuditLogFilters>({
    search: '',
    action: '',
    adminId: '',
    startDate: '',
    endDate: '',
  });
  const [showAuditFilters, setShowAuditFilters] = useState(false);
  const [auditLogPagination, setAuditLogPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [branchAdmins, setBranchAdmins] = useState<Array<{ id: string; name: string }>>([]);

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);
  const [printAppointments, setPrintAppointments] = useState<AppointmentBooking[]>([]);
  const [loadingPrintData, setLoadingPrintData] = useState(false);

  // ============================================
  // Load User Info
  // ============================================
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
    setProfileImage(userInfo.profile_picture || '');
    setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
    setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
    setUserGender(userInfo.gender || '');
    setUserRole(userInfo.role_as || 0);
    setCurrentBranchId(userInfo.branch_id || userInfo.branch?.id || '');
  }, []);

  // ============================================
  // Check if user can override booking rules (Super Admin only)
  // ============================================
  const canOverrideRules = useMemo(() => userRole === 1, [userRole]);

  // ============================================
  // Calculate max booking date based on settings
  // ============================================
  const maxBookingDate = useMemo(() => {
    if (overrideRules && canOverrideRules) {
      // If override is enabled by super admin, allow up to 1 year ahead
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return maxDate.toISOString().split('T')[0];
    }
    if (bookingSettings?.max_advance_booking_days) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + bookingSettings.max_advance_booking_days);
      return maxDate.toISOString().split('T')[0];
    }
    // Default to 30 days if no settings
    const defaultMax = new Date();
    defaultMax.setDate(defaultMax.getDate() + 30);
    return defaultMax.toISOString().split('T')[0];
  }, [bookingSettings, overrideRules, canOverrideRules]);

  // ============================================
  // Sidebar Menu Component
  // ============================================
  const SidebarMenu = () => (
    <nav className="py-4">
      <div className="px-4 mb-4">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
      </div>
      <ul className="space-y-1 px-2">
        {BranchAdminMenuItems.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.path === '/branch-admin/appointments'
                ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700'
                : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 font-medium text-left">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  // ============================================
  // Load Appointments with Filters
  // ============================================
  // Extract doctors from appointments data
  const extractDoctorsFromAppointments = useCallback((appointmentsData: AppointmentBooking[]) => {
    const doctorMap = new Map<string, Doctor>();
    appointmentsData.forEach(appointment => {
      if (appointment.doctor_id && appointment.doctor_name) {
        const doctorKey = appointment.doctor_id;
        if (!doctorMap.has(doctorKey)) {
          doctorMap.set(doctorKey, {
            id: appointment.doctor_id,
            doctor_id: appointment.doctor_id,
            name: appointment.doctor_name,
            specialization: appointment.doctor_specialization || undefined,
            branch_id: appointment.branch_id,
            branch_name: appointment.branch_name,
          });
        }
      }
    });
    const uniqueDoctors = Array.from(doctorMap.values());
    setDoctors(uniqueDoctors);
  }, []);

  // Extract branches from appointments data
  const extractBranchesFromAppointments = useCallback((appointmentsData: AppointmentBooking[]) => {
    const branchMap = new Map<string, { id: string; name: string }>();
    appointmentsData.forEach(appointment => {
      if (appointment.branch_name) {
        const branchKey = appointment.branch_id || appointment.branch_name;
        if (!branchMap.has(branchKey)) {
          branchMap.set(branchKey, {
            id: appointment.branch_id || branchKey,
            name: appointment.branch_name,
          });
        }
      }
    });
    const uniqueBranches = Array.from(branchMap.values());
    setBranches(uniqueBranches);
  }, []);

  const loadAppointments = useCallback(async (view: ViewType, currentFilters: Filters = initialFilters) => {
    try {
      setLoading(true);
      setError(null);

      // Use super admin API to get all appointments, then filter by branch
      const response = await appointmentSuperAdminApi.getAllAppointments() as { appointments: AppointmentBooking[] };

      if (response.appointments) {
        // Filter appointments by current branch
        let filteredAppointments = response.appointments;
        if (currentBranchId) {
          filteredAppointments = response.appointments.filter((apt: AppointmentBooking) => apt.branch_id === currentBranchId);
        }

        // Apply additional filters
        if (currentFilters.doctorId) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.doctor_id === currentFilters.doctorId);
        }
        if (currentFilters.specialization) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.doctor_specialization === currentFilters.specialization);
        }
        if (currentFilters.status) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.status === currentFilters.status);
        }
        if (currentFilters.search) {
          const searchLower = currentFilters.search.toLowerCase();
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) =>
            apt.patient_name?.toLowerCase().includes(searchLower) ||
            apt.patient_id?.toLowerCase().includes(searchLower) ||
            apt.appointment_id?.toString().includes(searchLower)
          );
        }
        if (currentFilters.startDate && currentFilters.endDate) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) =>
            apt.appointment_date >= currentFilters.startDate && apt.appointment_date <= currentFilters.endDate
          );
        }
        if (currentFilters.day) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.appointment_date === currentFilters.day);
        }
        if (currentFilters.paymentStatus) {
          filteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.payment_status === currentFilters.paymentStatus);
        }

        // Filter by view type
        let viewFilteredAppointments = filteredAppointments;
        if (view === 'today') {
          const today = new Date().toISOString().split('T')[0];
          viewFilteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.appointment_date === today);
        } else if (view === 'upcoming') {
          const today = new Date().toISOString().split('T')[0];
          viewFilteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.appointment_date >= today);
        } else if (view === 'past') {
          const today = new Date().toISOString().split('T')[0];
          viewFilteredAppointments = filteredAppointments.filter((apt: AppointmentBooking) => apt.appointment_date < today || apt.status === 'cancelled');
        }

        setAppointments(viewFilteredAppointments);
        // Extract doctors and branches from the loaded appointments
        extractDoctorsFromAppointments(viewFilteredAppointments);
        extractBranchesFromAppointments(viewFilteredAppointments);
      }
    } catch (err: unknown) {
      console.error('Failed to load appointments:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, extractDoctorsFromAppointments, extractBranchesFromAppointments]);

  const loadSessions = useCallback(async (view: ViewType, currentFilters: Filters = initialFilters) => {
    if (view === 'audit') {
      setSessions([]);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const params: Record<string, string | number | boolean> = {};

      if (currentFilters.startDate) {
        params.session_date = currentFilters.startDate;
      } else if (currentFilters.day) {
        params.session_date = currentFilters.day;
      } else if (view === 'today') {
        params.session_date = today;
      }

      if (currentFilters.doctorId) {
        params.doctor_id = currentFilters.doctorId;
      }

      if (currentFilters.branchId) {
        params.branch_id = currentFilters.branchId;
      }

      const response = await patientSessionApi.getSessions(params);
      if (response?.sessions && Array.isArray(response.sessions)) {
        setSessions(response.sessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
    }
  }, []);

  // Load counts for all tabs
  const loadCounts = useCallback(async () => {
    try {
      // Get all appointments and filter by branch
      const response = await appointmentSuperAdminApi.getAllAppointments() as { appointments: AppointmentBooking[] };
      if (response.appointments) {
        let branchAppointments = response.appointments;
        if (currentBranchId) {
          branchAppointments = response.appointments.filter((apt: AppointmentBooking) => apt.branch_id === currentBranchId);
        }

        const today = new Date().toISOString().split('T')[0];

        const todayCount = branchAppointments.filter((apt: AppointmentBooking) => apt.appointment_date === today).length;
        const upcomingCount = branchAppointments.filter((apt: AppointmentBooking) => apt.appointment_date >= today).length;
        const pastCount = branchAppointments.filter((apt: AppointmentBooking) => apt.appointment_date < today || apt.status === 'cancelled').length;

        setCounts({
          today: todayCount,
          upcoming: upcomingCount,
          past: pastCount,
        });
      }
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  }, [currentBranchId]);

  // Load specializations
  const loadSpecializations = useCallback(async () => {
    try {
      const response = await appointmentPublicApi.getSpecializations();
      if (response.specializations) {
        setSpecializations(response.specializations);
      }
    } catch (err) {
      console.error('Failed to load specializations:', err);
    }
  }, []);

  // Refresh functions
  const refreshDoctors = useCallback(() => {
    extractDoctorsFromAppointments(appointments);
  }, [appointments, extractDoctorsFromAppointments]);

  const refreshBranches = useCallback(() => {
    extractBranchesFromAppointments(appointments);
  }, [appointments, extractBranchesFromAppointments]);
  const loadAuditLogs = useCallback(async (page: number = 1, currentFilters: AuditLogFilters = auditLogFilters) => {
    try {
      setAuditLogsLoading(true);
      setAuditLogsError(null);

      const params: Record<string, string | number> = {
        page,
        per_page: 20,
      };

      if (currentFilters.startDate) params.start_date = currentFilters.startDate;
      if (currentFilters.endDate) params.end_date = currentFilters.endDate;
      if (currentFilters.action) params.action = currentFilters.action;
      if (currentFilters.adminId) params.admin_id = currentFilters.adminId;

      // Audit logs are currently unavailable
      setAuditLogs([]);
      setAuditLogPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 20,
      });
    } catch (err: unknown) {
      console.error('Failed to load audit logs:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setAuditLogsError(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setAuditLogsLoading(false);
    }
  }, [auditLogFilters]);

  // Load appointments for print (confirmed only for selected date)
  const loadPrintAppointments = useCallback(async (date: string) => {
    try {
      setLoadingPrintData(true);
      // Get all appointments and filter by branch and date
      const response = await appointmentSuperAdminApi.getAllAppointments() as { appointments: AppointmentBooking[] };
      if (response.appointments) {
        let filteredAppointments = response.appointments.filter(apt =>
          apt.appointment_date === date &&
          apt.status === 'confirmed'
        );
        if (currentBranchId) {
          filteredAppointments = filteredAppointments.filter(apt => apt.branch_id === currentBranchId);
        }
        // Sort by token number
        const sorted = [...filteredAppointments].sort((a, b) => (a.token_number || 0) - (b.token_number || 0));
        setPrintAppointments(sorted);
      }
    } catch (err: unknown) {
      console.error('Failed to load print appointments:', err);
    } finally {
      setLoadingPrintData(false);
    }
  }, [currentBranchId]);

  // Handle print
  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Confirmed Appointments - ${printDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
            .header h1 { color: #065f46; font-size: 24px; margin-bottom: 5px; }
            .header p { color: #6b7280; font-size: 14px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; }
            .stat-item { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { font-size: 12px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #10b981; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
            tr:nth-child(even) { background: #f9fafb; }
            .token { font-weight: bold; color: #059669; font-size: 14px; }
            .booking-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; }
            .badge-online { background: #dbeafe; color: #1d4ed8; }
            .badge-walkin { background: #fef3c7; color: #d97706; }
            .badge-phone { background: #e0e7ff; color: #4338ca; }
            .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; padding-top: 15px; border-top: 1px solid #e5e7eb; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    loadSpecializations();
    loadCounts();
  }, [loadSpecializations, loadCounts]);

  useEffect(() => {
    if (activeView === 'audit') {
      // Audit logs are currently unavailable
      setAuditLogs([]);
      setAuditLogPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 20,
      });
    } else {
      loadAppointments(activeView, filters);
      loadSessions(activeView, filters);
    }
  }, [activeView, filters, auditLogFilters, loadAppointments, loadAuditLogs, loadSessions]);

  // Check if any filters are applied
  useEffect(() => {
    const hasFilters =
      filters.search !== '' ||
      filters.doctorId !== '' ||
      filters.specialization !== '' ||
      filters.status !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== '' ||
      filters.branchId !== '' ||
      filters.day !== '' ||
      filters.paymentStatus !== '';
    setFiltersApplied(hasFilters);
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== '') {
        loadAppointments(activeView, filters);
        loadSessions(activeView, filters);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search, activeView, filters, loadAppointments, loadSessions]);

  // ============================================
  // Filter Handlers
  // ============================================
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Instant apply - reload appointments with new filters
    loadAppointments(activeView, newFilters);
    loadSessions(activeView, newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAppointments(activeView, filters);
    loadSessions(activeView, filters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    loadAppointments(activeView, initialFilters);
    loadSessions(activeView, initialFilters);
  };

  const clearSingleFilter = (key: keyof Filters) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);
    loadAppointments(activeView, newFilters);
    loadSessions(activeView, newFilters);
  };

  const openSessionDetails = (sessionId: string, initialAction?: 'assign-staff') => {
    setSelectedSessionId(sessionId);
    setSessionPanelAction(initialAction);
    setShowSessionDetails(true);
  };

  const handleManageSession = (sessionItem: SessionListItem) => {
    const today = new Date().toISOString().split('T')[0];
    let targetView: ViewType = 'today';
    if (sessionItem.session_date > today) {
      targetView = 'upcoming';
    } else if (sessionItem.session_date < today) {
      targetView = 'past';
    }

    const nextFilters: Filters = {
      ...filters,
      doctorId: sessionItem.doctor_id,
      startDate: sessionItem.session_date,
      endDate: sessionItem.session_date,
    };

    setViewMode('list');
    setActiveView(targetView);
    setFilters(nextFilters);
    setShowSessionDetails(false);
    setSelectedSessionId(null);
    setSessionPanelAction(undefined);
    loadAppointments(targetView, nextFilters);
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
      await loadSessions(activeView, filters);
      await loadAppointments(activeView, filters);
      await loadCounts();
    } catch (err: unknown) {
      console.error('Failed to delete session:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error?.response?.data?.detail || 'Failed to delete session');
    }
  };

  // ============================================
  // Helper Functions
  // ============================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_in': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_session': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-error-100 text-red-800 border-red-200';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no_show': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending_payment': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-amber-600';
      case 'waived': return 'text-primary-500';
      case 'refunded': return 'text-purple-600';
      default: return 'text-neutral-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <FaTimesCircle className="w-3 h-3" />;
      case 'no_show':
      case 'pending_payment':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Row background color for upcoming view (Part 3 requirement)
  const getRowBackgroundColor = (status: string, view: ViewType): string => {
    if (view !== 'upcoming') return '';
    switch (status) {
      case 'confirmed': return 'bg-green-50 hover:bg-green-100';
      case 'rescheduled': return 'bg-yellow-50 hover:bg-yellow-100';
      case 'cancelled': return 'bg-error-50 hover:bg-error-100';
      default: return 'hover:bg-neutral-50';
    }
  };

  // ============================================
  // Edit Appointment Handlers
  // ============================================
  const openEditModal = (apt: AppointmentBooking) => {
    setEditingAppointment({
      appointmentId: apt.id,
      doctorId: apt.doctor_id,
      date: apt.appointment_date,
      slotNumber: apt.slot_number || 0,
      patientName: apt.patient_name || 'Unknown Patient',
      currentDoctorName: apt.doctor_name || 'Unknown',
    });
    setEditForm({
      doctorId: apt.doctor_id,
      date: apt.appointment_date,
      slotNumber: apt.slot_number || 0,
    });
    setEditError(null);
    setEditSuccess(null);
    setShowEditModal(true);
    // Load available slots for current doctor and date
    loadAvailableSlots(apt.doctor_id, apt.appointment_date);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    setEditForm({ doctorId: '', date: '', slotNumber: 0 });
    setAvailableSlots([]);
    setEditError(null);
    setEditSuccess(null);
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }
    try {
      setLoadingSlots(true);
      const response = await appointmentPublicApi.getAvailableSlots(doctorId, date);
      if (response.slots) {
        setAvailableSlots(response.slots || []);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    const newForm = { ...editForm, [field]: value };
    setEditForm(newForm);

    // If doctor or date changes, reload available slots
    if (field === 'doctorId' || field === 'date') {
      const doctorId = field === 'doctorId' ? value as string : newForm.doctorId;
      const date = field === 'date' ? value as string : newForm.date;
      if (doctorId && date) {
        loadAvailableSlots(doctorId, date);
        // Reset slot selection when doctor/date changes
        setEditForm(prev => ({ ...prev, [field]: value, slotNumber: 0 }));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment) return;

    // Validation
    if (!editForm.doctorId) {
      setEditError('Please select a doctor');
      return;
    }
    if (!editForm.date) {
      setEditError('Please select a date');
      return;
    }
    if (!editForm.slotNumber) {
      setEditError('Please select a slot');
      return;
    }

    try {
      setSavingEdit(true);
      setEditError(null);

      const response = await appointmentBranchAdminApi.rescheduleAppointment(
        editingAppointment.appointmentId,
        {
          new_doctor_id: editForm.doctorId,
          new_date: editForm.date,
          new_slot_number: editForm.slotNumber,
          reason: 'Appointment modified by branch admin',
        }
      );

      if (response) {
        setEditSuccess('Appointment updated successfully! Patient will receive confirmation.');
        // Reload appointments after a short delay
        setTimeout(() => {
          closeEditModal();
          loadAppointments(activeView, filters);
          loadSessions(activeView, filters);
          loadCounts();
        }, 1500);
      }
    } catch (err: unknown) {
      console.error('Failed to update appointment:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(error.response?.data?.message || 'Failed to update appointment');
    } finally {
      setSavingEdit(false);
    }
  };

  // ============================================
  // Cancel Appointment Handlers
  // ============================================
  const openCancelModal = (apt: AppointmentBooking) => {
    setCancellingAppointment({
      appointmentId: apt.id,
      patientName: apt.patient_name || 'Unknown Patient',
      doctorName: apt.doctor_name || 'Unknown',
      date: apt.appointment_date,
      slotNumber: apt.slot_number || 0,
    });
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

    // Validation
    if (!cancelReason.trim()) {
      setCancelError('Please provide a cancellation reason');
      return;
    }

    try {
      setSavingCancel(true);
      setCancelError(null);

      const response = await appointmentBranchAdminApi.cancelAppointment(
        cancellingAppointment.appointmentId,
        cancelReason,
        { doctor_request: cancellationType === 'doctor_request' }
      );

      if (response) {
        closeCancelModal();
        loadAppointments(activeView, filters);
        loadSessions(activeView, filters);
        loadCounts();
        // Show success message in main error area (styled as success)
        setError(null);
      }
    } catch (err: unknown) {
      console.error('Failed to cancel appointment:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setCancelError(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setSavingCancel(false);
    }
  };

  // ============================================
  // Delete Appointment Handlers
  // ============================================
  const openDeleteModal = (apt: AppointmentBooking) => {
    setDeletingAppointment({
      appointmentId: apt.id,
      patientName: apt.patient_name || 'Unknown Patient',
      doctorName: apt.doctor_name || 'Unknown',
      date: apt.appointment_date,
      slotNumber: apt.slot_number || 0,
    });
    setDeleteReason('');
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingAppointment(null);
    setDeleteReason('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAppointment) return;

    // Validation
    if (!deleteReason.trim()) {
      setDeleteError('Please provide a deletion reason');
      return;
    }

    try {
      setSavingDelete(true);
      setDeleteError(null);

      const response = await appointmentBranchAdminApi.deleteAppointment(
        deletingAppointment.appointmentId,
        deleteReason
      );

      if (response) {
        closeDeleteModal();
        loadAppointments(activeView, filters);
        loadSessions(activeView, filters);
        loadCounts();
        // Show success message in main error area (styled as success)
        setError(null);
      }
    } catch (err: unknown) {
      console.error('Failed to delete appointment:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setDeleteError(error.response?.data?.message || 'Failed to delete appointment');
    } finally {
      setSavingDelete(false);
    }
  };

  // ============================================
  // Load Booking Settings
  // ============================================
  const loadBookingSettings = async () => {
    try {
      setLoadingSettings(true);
      if (currentBranchId) {
        const response = await appointmentSuperAdminApi.getBranchSettings({ branch_id: currentBranchId });
        if (response.branches && response.branches.length > 0) {
          setBookingSettings(response.branches[0].settings || null);
          return;
        }
      }
      // Fallback to default settings
      setBookingSettings({
        max_advance_booking_days: 30,
        min_advance_booking_hours: 2,
        default_max_patients_per_session: 20,
        default_time_per_patient: 15,
        allow_walk_in: true,
        require_payment_for_online: false,
        allow_cash_payment: true,
        allow_reschedule: true,
        max_reschedule_count: 2,
        reschedule_advance_hours: 24,
        allow_patient_cancellation: true,
        cancellation_advance_hours: 24,
        refund_on_cancellation: false,
        cancellation_fee_percentage: 0,
        default_booking_fee: 500,
        walk_in_fee: 500,
        send_sms_confirmation: true,
        send_sms_reminder: true,
        reminder_hours_before: 24,
        send_email_confirmation: true,
      });
    } catch (err) {
      console.error('Failed to load booking settings:', err);
      // Use default settings if API fails
      setBookingSettings({
        max_advance_booking_days: 30,
        min_advance_booking_hours: 2,
        default_max_patients_per_session: 20,
        default_time_per_patient: 15,
        allow_walk_in: true,
        require_payment_for_online: false,
        allow_cash_payment: true,
        allow_reschedule: true,
        max_reschedule_count: 2,
        reschedule_advance_hours: 24,
        allow_patient_cancellation: true,
        cancellation_advance_hours: 24,
        refund_on_cancellation: false,
        cancellation_fee_percentage: 0,
        default_booking_fee: 500,
        walk_in_fee: 500,
        send_sms_confirmation: true,
        send_sms_reminder: true,
        reminder_hours_before: 24,
        send_email_confirmation: true,
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // ============================================
  // Create Booking Handlers
  // ============================================
  const openBookingModal = async () => {
    setBookingForm(initialBookingForm);
    setBookingSlots([]);
    setBookingSchedule(null);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setBookingError(null);
    setBookingSuccess(null);
    setOverrideRules(false);
    setShowNewPatientForm(false);
    setNewPatientForm({
      full_name: '',
      mobile_number: '',
      nic: '',
      gender: 'male',
      date_of_birth: '',
      address: '',
      send_sms: true,
    });
    setPatientCredentials(null);
    setShowBookingModal(true);

    // Load settings if not already loaded
    if (!bookingSettings) {
      await loadBookingSettings();
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingForm(initialBookingForm);
    setBookingSlots([]);
    setBookingSchedule(null);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setBookingError(null);
    setBookingSuccess(null);
    setOverrideRules(false);
    setShowNewPatientForm(false);
    setNewPatientForm({
      full_name: '',
      mobile_number: '',
      nic: '',
      gender: 'male',
      date_of_birth: '',
      address: '',
      send_sms: true,
    });
    setPatientCredentials(null);
  };

  // Handle new patient registration
  const handleRegisterNewPatient = async () => {
    // Validation
    if (!newPatientForm.full_name.trim()) {
      setBookingError('Please enter patient full name');
      return;
    }
    if (!newPatientForm.mobile_number.trim()) {
      setBookingError('Please enter mobile number');
      return;
    }
    if (!newPatientForm.gender) {
      setBookingError('Please select gender');
      return;
    }

    try {
      setRegisteringPatient(true);
      setBookingError(null);

      // Patient registration is currently unavailable
      setBookingError('Patient registration is currently unavailable. Please search for existing patients or contact support.');
      return;

      // Dead code commented out to fix build error
      /*
      if (response.status === 201 && response.patient) {
        // Patient registered successfully
        setBookingForm(prev => ({
          ...prev,
          patientId: response.patient!.id,
          patientName: response.patient!.name,
        }));
        setPatientCredentials(response.credentials || null);
        setShowNewPatientForm(false);
        setBookingSuccess(
          response.sms_sent
            ? `Patient registered! Login credentials sent via SMS.`
            : `Patient registered! Username: ${response.credentials?.username}`
        );
      } else if (response.status === 409 && response.existing_patient) {
        // Patient already exists - use existing
        setBookingError(`Patient already exists. Using existing record: ${response.existing_patient.name}`);
        setBookingForm(prev => ({
          ...prev,
          patientId: response.existing_patient!.id,
          patientName: response.existing_patient!.name,
        }));
        setShowNewPatientForm(false);
      }
      */
    } catch (err: unknown) {
      console.error('Failed to register patient:', err);

      // If patient already exists (409), use the existing patient if available
      const error = err as { response?: { status?: number; data?: { existing_patient?: { id: string; name: string; patient_id?: string } } } };
      if (error.response?.status === 409) {
        const existing = error.response?.data?.existing_patient;
        if (existing) {
          setBookingForm(prev => ({
            ...prev,
            patientId: existing.id,
            patientName: existing.name,
          }));
          setShowNewPatientForm(false);
          setBookingError(null);
          setBookingSuccess(`Patient already registered. Using existing record: ${existing.name} (${existing.patient_id || 'ID pending'})`);
        } else {
          // Phone exists but not as patient - show error with suggestion
          const error = err as { response?: { data?: { message?: string } } };
          setBookingError(error.response?.data?.message || 'This mobile number is already registered. Try searching for the patient instead.');
        }
      } else {
        const error = err as { response?: { data?: { message?: string } } };
        const errorMessage = error.response?.data?.message || 'Failed to register patient';
        setBookingError(errorMessage);
      }
    } finally {
      setRegisteringPatient(false);
    }
  };

  // Search patients with debounce
  useEffect(() => {
    if (patientSearchQuery.length < 2) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingPatients(true);
        const response = await appointmentReceptionistApi.searchPatients(patientSearchQuery);
        if (response.patients) {
          setPatientSearchResults(response.patients);
          setShowPatientDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search patients:', err);
        setPatientSearchResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [patientSearchQuery]);

  const selectPatient = (patient: PatientSearchResult) => {
    setBookingForm(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
    }));
    setPatientSearchQuery(patient.name);
    setShowPatientDropdown(false);
  };

  const loadBookingSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) {
      setBookingSlots([]);
      setBookingSchedule(null);
      return;
    }
    try {
      setLoadingBookingSlots(true);
      const response = await appointmentPublicApi.getAvailableSlots(doctorId, date);
      if (response.slots) {
        setBookingSlots(response.slots || []);
        setBookingSchedule(response.schedule || null);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setBookingSlots([]);
      setBookingSchedule(null);
    } finally {
      setLoadingBookingSlots(false);
    }
  };

  const handleBookingFormChange = (field: keyof BookingFormData, value: string | number | boolean | null | undefined) => {
    const newForm = { ...bookingForm, [field]: value };
    setBookingForm(newForm);

    // If doctor or date changes, reload slots
    if (field === 'doctorId' || field === 'date') {
      const doctorId = field === 'doctorId' ? String(value) : String(newForm.doctorId);
      const date = field === 'date' ? String(value) : String(newForm.date);
      if (doctorId && date) {
        loadBookingSlots(doctorId, date);
        // Reset slot selection
        setBookingForm(prev => ({ ...prev, [field]: value, slotNumber: 0 }));
      }
    }
  };

  const handleCreateBooking = async () => {
    // Validation
    if (!bookingForm.patientId) {
      setBookingError('Please select a patient');
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
      setBookingError('Please select an available slot');
      return;
    }

    // Booking rules validation (unless override is enabled)
    if (!overrideRules && bookingSettings) {
      // Check max advance booking days
      const selectedDate = new Date(bookingForm.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + bookingSettings.max_advance_booking_days);

      if (selectedDate > maxDate) {
        setBookingError(`Cannot book more than ${bookingSettings.max_advance_booking_days} days in advance`);
        return;
      }

      // Check if session is full
      if (bookingSchedule && bookingSchedule.booked_count >= bookingSchedule.max_patients) {
        setBookingError(`This session is full (max ${bookingSchedule.max_patients} patients). Enable override to proceed.`);
        return;
      }
    }

    try {
      setSavingBooking(true);
      setBookingError(null);

      const response = await appointmentReceptionistApi.createWalkInBooking({
        patient_id: bookingForm.patientId,
        doctor_id: bookingForm.doctorId,
        appointment_date: bookingForm.date,
        slot_number: bookingForm.slotNumber,
        booking_type: bookingForm.bookingType,
        payment_status: bookingForm.paymentStatus,
        payment_method: bookingForm.paymentMethod || 'cash',
        amount_paid: bookingForm.amountPaid || undefined,
        notes: bookingForm.notes || undefined,
      });

      if (response) {
        const tokenInfo = response.appointment
          ? `Token #${response.appointment.token_number} at ${response.appointment.appointment_time}`
          : '';
        setBookingSuccess(`Appointment created successfully! ${tokenInfo}`);

        // Reload after delay
        setTimeout(() => {
          closeBookingModal();
          loadAppointments(activeView, filters);
          loadSessions(activeView, filters);
          loadCounts();
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Failed to create appointment:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setBookingError(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSavingBooking(false);
    }
  };

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'in_session', label: 'In Session' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'no_show', label: 'No Show' },
    { value: 'pending_payment', label: 'Pending Payment' },
  ];

  // Active filter badges
  const activeFilterBadges = useMemo(() => {
    const badges: { key: keyof Filters; label: string; value: string }[] = [];

    if (filters.doctorId) {
      const doctor = doctors.find(d => d.doctor_id === filters.doctorId);
      badges.push({ key: 'doctorId', label: 'Doctor', value: doctor?.name || filters.doctorId });
    }
    if (filters.specialization) {
      badges.push({ key: 'specialization', label: 'Specialization', value: filters.specialization });
    }
    if (filters.status) {
      badges.push({ key: 'status', label: 'Status', value: getStatusLabel(filters.status) });
    }
    if (filters.startDate || filters.endDate) {
      const dateRange = `${filters.startDate || '...'} to ${filters.endDate || '...'}`;
      badges.push({ key: 'startDate', label: 'Date Range', value: dateRange });
    }
    if (filters.search) {
      badges.push({ key: 'search', label: 'Search', value: filters.search });
    }
    if (filters.branchId) {
      const branch = branches.find(b => b.id === filters.branchId);
      badges.push({ key: 'branchId', label: 'Branch', value: branch?.name || filters.branchId });
    }
    if (filters.day) {
      badges.push({ key: 'day', label: 'Day', value: filters.day });
    }
    if (filters.paymentStatus) {
      badges.push({ key: 'paymentStatus', label: 'Payment Status', value: filters.paymentStatus });
    }

    return badges;
  }, [filters, doctors, branches]);

  // ============================================
  // Tab Configuration
  // ============================================
  const tabs = [
    {
      id: 'today' as ViewType,
      label: "Today's Appointments",
      icon: <FaCalendarDay />,
      count: counts.today,
      color: 'emerald',
    },
    {
      id: 'upcoming' as ViewType,
      label: 'Upcoming Appointments',
      icon: <FaCalendarAlt />,
      count: counts.upcoming,
      color: 'blue',
    },
    {
      id: 'past' as ViewType,
      label: 'Past / Cancelled',
      icon: <FaHistory />,
      count: counts.past,
      color: 'gray',
    },
    {
      id: 'audit' as ViewType,
      label: 'Audit Logs',
      icon: <FaClipboardList />,
      count: auditLogPagination.total,
      color: 'purple',
    },
  ];

  // Audit log action options
  const auditActionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'completed', label: 'Completed' },
    { value: 'no_show', label: 'Marked No Show' },
  ];

  // Handle audit log filter change
  const handleAuditFilterChange = (key: keyof AuditLogFilters, value: string) => {
    const newFilters = { ...auditLogFilters, [key]: value };
    setAuditLogFilters(newFilters);
    loadAuditLogs(1, newFilters);
  };

  // Clear audit filters
  const clearAuditFilters = () => {
    const clearedFilters: AuditLogFilters = {
      search: '',
      action: '',
      adminId: '',
      startDate: '',
      endDate: '',
    };
    setAuditLogFilters(clearedFilters);
    loadAuditLogs(1, clearedFilters);
  };

  // Get action color for audit logs
  const getAuditActionColor = (action: string): string => {
    const actionColors: Record<string, string> = {
      created: 'bg-green-100 text-green-700',
      updated: 'bg-blue-100 text-blue-700',
      rescheduled: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-error-100 text-red-700',
      status_changed: 'bg-purple-100 text-purple-700',
      checked_in: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-emerald-100 text-emerald-700',
      no_show: 'bg-neutral-100 text-neutral-700',
    };
    return actionColors[action] || 'bg-neutral-100 text-neutral-700';
  };

  // ============================================
  // Render
  // ============================================
  return (
    <DashboardLayout
      userName={userName}
      userRole="Branch Admin"
      profileImage={profileImage}
      sidebarContent={<SidebarMenu />}
      branchName={branchName}
      branchLogo={branchLogo}
      userGender={userGender}
    >
      <div className="p-6 bg-neutral-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Appointments Management</h1>
              <p className="text-neutral-600 mt-1">
                Manage all appointments for <span className="font-semibold text-emerald-600">{branchName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openBookingModal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                <FaPlus />
                <span>New Appointment</span>
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(true);
                  loadPrintAppointments(printDate);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-primary-500 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-200"
              >
                <FaPrint />
                <span>Print Report</span>
              </button>
              <button
                onClick={() => {
                  loadAppointments(activeView, filters);
                  loadSessions(activeView, filters);
                  loadCounts();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-error-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${activeView === tab.id
                  ? tab.color === 'emerald'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : tab.color === 'blue'
                      ? 'bg-primary-500 text-white shadow-lg shadow-blue-200'
                      : tab.color === 'purple'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-600 text-white shadow-lg shadow-gray-200'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeView === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 text-neutral-600'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Appointments View - Show when not on audit tab */}
        {activeView !== 'audit' && (
          <>
            {/* Sessions/List Toggle */}
            <div className="mb-4 bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex bg-neutral-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setViewMode('sessions')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'sessions' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="mb-4 bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search by patient name, phone, or appointment ID..."
                      value={filters.search}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    {filters.search && (
                      <button
                        type="button"
                        onClick={() => clearSingleFilter('search')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Clear All Filters */}
                {filtersApplied && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-error-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Filter Appointments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Branch Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-neutral-700">Branch</label>
                      <button
                        onClick={refreshBranches}
                        className="text-xs text-emerald-600 hover:text-emerald-700"
                        title="Refresh branches"
                      >
                        ↻
                      </button>
                    </div>
                    <select
                      value={filters.branchId}
                      onChange={(e) => handleFilterChange('branchId', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-neutral-700">Doctor</label>
                      <button
                        onClick={refreshDoctors}
                        className="text-xs text-emerald-600 hover:text-emerald-700"
                        title="Refresh doctors"
                      >
                        ↻
                      </button>
                    </div>
                    <select
                      value={filters.doctorId}
                      onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">All Doctors</option>
                      {doctors.map(doctor => (
                        <option key={doctor.doctor_id} value={doctor.doctor_id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specialization Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Specialization</label>
                    <select
                      value={filters.specialization}
                      onChange={(e) => handleFilterChange('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">All Specializations</option>
                      {specializations.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Day Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Day</label>
                    <input
                      type="date"
                      value={filters.day}
                      onChange={(e) => handleFilterChange('day', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Payment Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Status</label>
                    <select
                      value={filters.paymentStatus}
                      onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">All Payment Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="waived">Waived</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="xl:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Badges */}
              {activeFilterBadges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterBadges.map((badge) => (
                    <span
                      key={badge.key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                    >
                      <span className="font-medium">{badge.label}:</span>
                      <span>{badge.value}</span>
                      <button
                        onClick={() => {
                          if (badge.key === 'startDate') {
                            const newFilters = { ...filters, startDate: '', endDate: '' };
                            setFilters(newFilters);
                            loadAppointments(activeView, newFilters);
                            loadSessions(activeView, newFilters);
                          } else {
                            clearSingleFilter(badge.key);
                          }
                        }}
                        className="ml-1 hover:text-emerald-900"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {showSessionDetails && selectedSessionId ? (
              <SessionDetailsPanel
                sessionId={selectedSessionId}
                initialAction={sessionPanelAction}
                onBack={() => {
                  setShowSessionDetails(false);
                  setSelectedSessionId(null);
                  setSessionPanelAction(undefined);
                  loadSessions(activeView, filters);
                }}
              />
            ) : viewMode === 'sessions' ? (
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
                          <FaCalendarAlt className="w-4 h-4 text-neutral-400" />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <FaClock className="w-4 h-4 text-neutral-400" />
                          <span>{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <FaUser className="w-4 h-4 text-neutral-400" />
                          <span>{session.appointment_count} / {session.total_slots || 0} Slots Filled</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <FaUserPlus className="w-4 h-4 text-neutral-400" />
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
            ) : (
              /* Appointments Table */
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Table Header Info */}
                <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-800">
                      {activeView === 'today' && "Today's Schedule"}
                      {activeView === 'upcoming' && 'Upcoming Schedule'}
                      {activeView === 'past' && 'Past & Cancelled Appointments'}
                    </h3>
                    <span className="text-sm text-neutral-500">
                      Showing {appointments.length} appointments
                      {filtersApplied && ' (filtered)'}
                    </span>
                  </div>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="p-12 text-center">
                    <FaSpinner className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-neutral-500">Loading appointments...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaCalendarAlt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">No appointments found</p>
                    <p className="text-neutral-400 text-sm mt-1">
                      {filtersApplied
                        ? 'Try adjusting your filters'
                        : activeView === 'today'
                          ? 'No appointments scheduled for today'
                          : activeView === 'upcoming'
                            ? 'No upcoming appointments'
                            : 'No past or cancelled appointments'}
                    </p>
                    {filtersApplied && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <FaHashtag className="w-3 h-3" />
                              ID / Token
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <FaUser className="w-3 h-3" />
                              Patient
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <FaUserMd className="w-3 h-3" />
                              Doctor & Specialization
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="w-3 h-3" />
                              Date
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              Slot / Time
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appointments.map((apt) => (
                          <tr
                            key={apt.id}
                            className={`transition-colors cursor-pointer ${getRowBackgroundColor(apt.status, activeView)}`}
                          >
                            {/* ID / Token */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-emerald-600 text-lg">
                                  #{apt.token_number}
                                </span>
                                <span className="text-xs text-neutral-400 font-mono truncate max-w-[100px]" title={apt.id}>
                                  {apt.id.substring(0, 8)}...
                                </span>
                              </div>
                            </td>

                            {/* Patient */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-800">
                                  {apt.patient_name || 'Unknown Patient'}
                                </span>
                                {apt.patient_phone && (
                                  <span className="text-xs text-neutral-500">{apt.patient_phone}</span>
                                )}
                              </div>
                            </td>

                            {/* Doctor & Specialization */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-800">
                                  Dr. {apt.doctor_name || 'Unknown'}
                                </span>
                                {apt.doctor_specialization && (
                                  <span className="text-xs text-primary-500 bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                    {apt.doctor_specialization}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-800">
                                  {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </td>

                            {/* Slot / Time */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-neutral-800">
                                  Slot #{apt.slot_number}
                                </span>
                                <span className="text-sm text-emerald-600 font-medium">
                                  {apt.appointment_time}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(apt.status)}`}>
                                {getStatusIcon(apt.status)}
                                {getStatusLabel(apt.status)}
                              </span>
                              {apt.cancelled_by_admin_for_doctor && (
                                <div className="mt-1">
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    Doctor Request
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Payment */}
                            <td className="px-4 py-4">
                              <span className={`font-medium capitalize ${getPaymentStatusColor(apt.payment_status)}`}>
                                {apt.payment_status}
                              </span>
                              {apt.amount_paid && apt.payment_status === 'paid' && (
                                <div className="text-xs text-neutral-500">
                                  Rs. {Number(apt.amount_paid).toFixed(2)}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {/* Edit button - only for non-completed/cancelled appointments */}
                                {!['completed', 'cancelled', 'no_show'].includes(apt.status) && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(apt);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-primary-500 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                                      title="Edit Appointment"
                                    >
                                      <FaEdit className="w-3 h-3" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCancelModal(apt);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-error-50 text-error-600 hover:bg-error-100 rounded-lg text-sm font-medium transition-colors"
                                      title="Cancel Appointment"
                                    >
                                      <FaTimesCircle className="w-3 h-3" />
                                      Cancel
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(apt);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                      title="Delete Appointment"
                                    >
                                      <FaTrash className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </>
                                )}
                                {['completed', 'cancelled', 'no_show'].includes(apt.status) && (
                                  <span className="text-xs text-neutral-400 italic">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Summary Cards */}
            {!loading && appointments.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                  <div className="text-2xl font-bold text-neutral-800">{appointments.length}</div>
                  <div className="text-sm text-neutral-500">Total Appointments</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                  <div className="text-2xl font-bold text-green-600">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-neutral-500">Confirmed</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                  <div className="text-2xl font-bold text-emerald-600">
                    {appointments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-neutral-500">Completed</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {appointments.filter(a => a.payment_status === 'pending').length}
                  </div>
                  <div className="text-sm text-neutral-500">Pending Payment</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Audit Logs View */}
        {activeView === 'audit' && (
          <>
            {/* Audit Logs Filters */}
            <div className="mb-4 bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowAuditFilters(!showAuditFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${auditLogFilters.action || auditLogFilters.adminId || auditLogFilters.startDate || auditLogFilters.endDate
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  <FaFilter />
                  <span>Filters</span>
                  {showAuditFilters ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                </button>

                {/* Clear Filters */}
                {(auditLogFilters.action || auditLogFilters.adminId || auditLogFilters.startDate || auditLogFilters.endDate) && (
                  <button
                    onClick={clearAuditFilters}
                    className="text-sm text-error-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}

                {/* Refresh */}
                <button
                  onClick={() => loadAuditLogs(auditLogPagination.currentPage, auditLogFilters)}
                  className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <FaSync className={auditLogsLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Expanded Filters */}
              {showAuditFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Action Filter */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Action Type</label>
                      <select
                        value={auditLogFilters.action}
                        onChange={(e) => handleAuditFilterChange('action', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        {auditActionOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Admin Filter */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Performed By</label>
                      <select
                        value={auditLogFilters.adminId}
                        onChange={(e) => handleAuditFilterChange('adminId', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        <option value="">All Admins</option>
                        {branchAdmins.map(admin => (
                          <option key={admin.id} value={admin.id}>{admin.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={auditLogFilters.startDate}
                          onChange={(e) => handleAuditFilterChange('startDate', e.target.value)}
                          className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                          placeholder="From"
                        />
                        <input
                          type="date"
                          value={auditLogFilters.endDate}
                          onChange={(e) => handleAuditFilterChange('endDate', e.target.value)}
                          className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audit Logs Error */}
            {auditLogsError && (
              <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <FaExclamationTriangle />
                <span>{auditLogsError}</span>
                <button
                  onClick={() => setAuditLogsError(null)}
                  className="ml-auto text-error-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-purple-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                    <FaClipboardList className="text-purple-600" />
                    Appointment Audit Logs
                  </h3>
                  <span className="text-sm text-neutral-500">
                    Showing {auditLogs.length} of {auditLogPagination.total} logs
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {auditLogsLoading ? (
                <div className="p-12 text-center">
                  <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                  <p className="text-neutral-500">Loading audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <FaClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">No audit logs found</p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Appointment activities will appear here
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Appointment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Status Change
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Performed By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm text-neutral-800 font-medium">
                                {log.created_at_human || (log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown')}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {log.ip_address && `IP: ${log.ip_address}`}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-neutral-800">
                                {log.patient_name || 'N/A'}
                              </div>
                              {log.token_number && (
                                <div className="text-xs text-neutral-500">
                                  Token #{log.token_number}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getAuditActionColor(log.action)}`}>
                                {log.action_label || log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {log.previous_status || log.new_status ? (
                                <div className="flex items-center gap-1 text-sm">
                                  {log.previous_status && (
                                    <span className="text-neutral-500">{getStatusLabel(log.previous_status)}</span>
                                  )}
                                  {log.previous_status && log.new_status && (
                                    <span className="text-neutral-400">→</span>
                                  )}
                                  {log.new_status && (
                                    <span className="text-neutral-800 font-medium">{getStatusLabel(log.new_status)}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-neutral-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-neutral-800">{log.performed_by}</div>
                              <div className="text-xs text-neutral-500 capitalize">{log.performed_by_role}</div>
                            </td>
                            <td className="px-4 py-3">
                              {log.reason ? (
                                <div className="text-sm text-neutral-600 max-w-[200px] truncate" title={log.reason}>
                                  {log.reason}
                                </div>
                              ) : (
                                <span className="text-neutral-400 text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {auditLogPagination.lastPage > 1 && (
                    <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          Page {auditLogPagination.currentPage} of {auditLogPagination.lastPage}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadAuditLogs(auditLogPagination.currentPage - 1, auditLogFilters)}
                            disabled={auditLogPagination.currentPage === 1 || auditLogsLoading}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${auditLogPagination.currentPage === 1 || auditLogsLoading
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`}
                          >
                            <FaChevronLeft className="w-3 h-3" />
                            Previous
                          </button>
                          <button
                            onClick={() => loadAuditLogs(auditLogPagination.currentPage + 1, auditLogFilters)}
                            disabled={auditLogPagination.currentPage === auditLogPagination.lastPage || auditLogsLoading}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${auditLogPagination.currentPage === auditLogPagination.lastPage || auditLogsLoading
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`}
                          >
                            Next
                            <FaChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Edit Appointment Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={closeEditModal}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-lg mx-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-800">Edit Appointment</h3>
                      <p className="text-sm text-neutral-600 mt-0.5">
                        Patient: <span className="font-medium">{editingAppointment.patientName}</span>
                      </p>
                    </div>
                    <button
                      onClick={closeEditModal}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  {/* Current Info */}
                  <div className="mb-5 p-3 bg-neutral-50 rounded-lg text-sm">
                    <p className="text-neutral-600">
                      <span className="font-medium">Current:</span> Dr. {editingAppointment.currentDoctorName} on {new Date(editingAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - Slot #{editingAppointment.slotNumber}
                    </p>
                  </div>

                  {/* Error Message */}
                  {editError && (
                    <div className="mb-4 p-3 bg-error-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <FaExclamationTriangle className="flex-shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {editSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <FaCheckCircle className="flex-shrink-0" />
                      <span>{editSuccess}</span>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Doctor Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <FaUserMd className="inline w-4 h-4 mr-1" />
                        Doctor
                      </label>
                      <select
                        value={editForm.doctorId}
                        onChange={(e) => handleEditFormChange('doctorId', e.target.value)}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor.doctor_id} value={doctor.doctor_id}>
                            Dr. {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <FaCalendarAlt className="inline w-4 h-4 mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => handleEditFormChange('date', e.target.value)}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Note: As Branch Admin, you can select any date (no 24-hour restriction)
                      </p>
                    </div>

                    {/* Slot Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <FaClock className="inline w-4 h-4 mr-1" />
                        Available Slots
                      </label>
                      {loadingSlots ? (
                        <div className="flex items-center gap-2 text-neutral-500 py-2">
                          <FaSpinner className="animate-spin" />
                          <span>Loading available slots...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                          {editForm.doctorId && editForm.date
                            ? 'No available slots for this doctor on selected date'
                            : 'Select doctor and date to view available slots'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.slot_number}
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, slotNumber: slot.slot_number || 0 }))}
                              disabled={!slot.is_available}
                              className={`p-2 rounded-lg text-sm font-medium transition-all ${editForm.slotNumber === slot.slot_number
                                ? 'bg-primary-500 text-white ring-2 ring-blue-300'
                                : slot.is_available
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                }`}
                            >
                              <div className="font-bold">#{slot.slot_number}</div>
                              <div className="text-xs">{slot.time}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl flex justify-end gap-3">
                  <button
                    onClick={closeEditModal}
                    disabled={savingEdit}
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editForm.slotNumber}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${savingEdit || !editForm.slotNumber
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-blue-200'
                      }`}
                  >
                    {savingEdit ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Appointment Modal */}
        {showCancelModal && cancellingAppointment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={closeCancelModal}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-md mx-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-red-200 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center">
                        <FaExclamationTriangle className="w-5 h-5 text-error-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-800">Cancel Appointment</h3>
                        <p className="text-sm text-error-600 font-medium">This action cannot be undone</p>
                      </div>
                    </div>
                    <button
                      onClick={closeCancelModal}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  {/* Warning Banner */}
                  <div className="mb-5 p-4 bg-error-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-semibold">This cancellation is irreversible.</p>
                        <p className="text-red-700 text-sm mt-1">
                          The patient will be notified via SMS and email.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info */}
                  <div className="mb-5 p-3 bg-neutral-50 rounded-lg text-sm">
                    <p className="text-neutral-700">
                      <span className="font-semibold">Patient:</span> {cancellingAppointment.patientName}
                    </p>
                    <p className="text-neutral-700 mt-1">
                      <span className="font-semibold">Doctor:</span> Dr. {cancellingAppointment.doctorName}
                    </p>
                    <p className="text-neutral-700 mt-1">
                      <span className="font-semibold">Date:</span> {new Date(cancellingAppointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-neutral-700 mt-1">
                      <span className="font-semibold">Slot:</span> #{cancellingAppointment.slotNumber}
                    </p>
                  </div>

                  {/* Error Message */}
                  {cancelError && (
                    <div className="mb-4 p-3 bg-error-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <FaExclamationTriangle className="flex-shrink-0" />
                      <span>{cancelError}</span>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Cancellation Type */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Cancellation Type <span className="text-error-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="cancellationType"
                            value="normal"
                            checked={cancellationType === 'normal'}
                            onChange={() => setCancellationType('normal')}
                            className="mt-1 text-primary-500 focus:ring-primary-500"
                          />
                          <div>
                            <span className="font-medium text-neutral-800">Normal Admin Cancellation</span>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Standard cancellation by branch admin
                            </p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 border border-orange-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors bg-orange-50/50">
                          <input
                            type="radio"
                            name="cancellationType"
                            value="doctor_request"
                            checked={cancellationType === 'doctor_request'}
                            onChange={() => setCancellationType('doctor_request')}
                            className="mt-1 text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="font-medium text-neutral-800">Doctor-Requested Cancellation</span>
                            <p className="text-xs text-orange-700 mt-0.5">
                              <strong>Patient benefits:</strong> 2 reschedule attempts, no time restriction, any doctor/branch/date
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Cancellation Reason <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please provide a reason for cancellation..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-error-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl flex justify-end gap-3">
                  <button
                    onClick={closeCancelModal}
                    disabled={savingCancel}
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={savingCancel || !cancelReason.trim()}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${savingCancel || !cancelReason.trim()
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                      }`}
                  >
                    {savingCancel ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <FaTimesCircle />
                        Confirm Cancellation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Appointment Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={closeBookingModal}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-2xl flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FaUserPlus className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-800">Create New Appointment</h3>
                        <p className="text-sm text-neutral-600">Book an appointment for walk-in or phone patient</p>
                      </div>
                    </div>
                    <button
                      onClick={closeBookingModal}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body - Scrollable */}
                <div className="px-6 py-5 overflow-y-auto flex-grow">
                  {/* Loading Settings */}
                  {loadingSettings && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                      <FaSpinner className="flex-shrink-0 animate-spin" />
                      <span>Loading booking rules...</span>
                    </div>
                  )}

                  {/* Booking Rules Summary Panel */}
                  {bookingSettings && !loadingSettings && (
                    <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                          <FaInfoCircle className="text-primary-500" />
                          Booking Rules
                        </span>
                        {/* Super Admin Override Toggle */}
                        {canOverrideRules && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-amber-700">
                              <FaUserShield className="inline mr-1" />
                              Override Rules
                            </span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={overrideRules}
                                onChange={(e) => setOverrideRules(e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${overrideRules ? 'bg-amber-500' : 'bg-neutral-300'
                                }`}></div>
                              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${overrideRules ? 'translate-x-4' : ''
                                }`}></div>
                            </div>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="text-emerald-500" />
                          <span>Max {bookingSettings.max_advance_booking_days} days ahead</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaUser className="text-primary-500" />
                          <span>Max {bookingSettings.default_max_patients_per_session} patients/session</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="text-purple-500" />
                          <span>{bookingSettings.default_time_per_patient} min/patient</span>
                        </div>
                      </div>
                      {overrideRules && canOverrideRules && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                          <FaKey className="inline mr-1" />
                          <strong>Super Admin Override:</strong> Booking limits are disabled. Use responsibly.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {bookingError && (
                    <div className="mb-4 p-3 bg-error-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <FaExclamationTriangle className="flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {bookingSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <FaCheckCircle className="flex-shrink-0" />
                      <span>{bookingSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Step 1: Patient Selection */}
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full text-sm flex items-center justify-center">1</span>
                        Select Patient
                      </h4>

                      {/* Patient Credentials Display (after registration) */}
                      {patientCredentials && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FaKey className="text-primary-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-semibold text-blue-800">Patient Login Credentials:</p>
                              <p className="text-blue-700 mt-1">
                                <span className="font-medium">Username:</span> {patientCredentials.username}
                              </p>
                              <p className="text-blue-700">
                                <span className="font-medium">Password:</span> {patientCredentials.password}
                              </p>
                              <p className="text-xs text-primary-500 mt-1">
                                Login URL: {patientCredentials.login_url}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Toggle: Existing vs New Patient */}
                      {!bookingForm.patientId && (
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => setShowNewPatientForm(false)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!showNewPatientForm
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <FaSearch className="w-3.5 h-3.5" />
                            Existing Patient
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewPatientForm(true)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showNewPatientForm
                              ? 'bg-primary-500 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                          >
                            <FaUserPlus className="w-3.5 h-3.5" />
                            Register New Patient
                          </button>
                        </div>
                      )}

                      {/* Existing Patient Search */}
                      {!showNewPatientForm && !bookingForm.patientId && (
                        <div className="relative">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                              type="text"
                              placeholder="Search by name, phone, or NIC..."
                              value={patientSearchQuery}
                              onChange={(e) => {
                                setPatientSearchQuery(e.target.value);
                                setBookingForm(prev => ({ ...prev, patientId: '', patientName: '' }));
                              }}
                              className="w-full pl-10 pr-10 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                            {searchingPatients && (
                              <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 animate-spin" />
                            )}
                          </div>

                          {/* Patient Search Dropdown */}
                          {showPatientDropdown && patientSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {patientSearchResults.map((patient) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => selectPatient(patient)}
                                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                                >
                                  <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                                    <FaUser className="w-4 h-4 text-neutral-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-neutral-800">{patient.name}</div>
                                    <div className="text-xs text-neutral-500">
                                      {patient.phone && <span>{patient.phone}</span>}
                                      {patient.email && <span className="ml-2">{patient.email}</span>}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {showPatientDropdown && patientSearchResults.length === 0 && !searchingPatients && patientSearchQuery.length >= 2 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center">
                              <p className="text-neutral-500 mb-2">No patients found</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewPatientForm(true);
                                  // Pre-fill name or phone from search query if possible
                                  if (/^[0-9+\s-]+$/.test(patientSearchQuery)) {
                                    setNewPatientForm(prev => ({ ...prev, mobile_number: patientSearchQuery.replace(/\s/g, '') }));
                                  } else {
                                    setNewPatientForm(prev => ({ ...prev, full_name: patientSearchQuery }));
                                  }
                                }}
                                className="text-primary-500 hover:text-blue-800 font-medium text-sm"
                              >
                                Register as new patient →
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* New Patient Registration Form */}
                      {showNewPatientForm && !bookingForm.patientId && (
                        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-medium text-blue-800 flex items-center gap-2">
                            <FaUserPlus className="w-4 h-4" />
                            New Patient Registration
                          </h5>

                          {/* Full Name - Required */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Full Name <span className="text-error-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newPatientForm.full_name}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, full_name: e.target.value }))}
                              placeholder="Enter patient's full name"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                          </div>

                          {/* Mobile Number - Required */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Mobile Number <span className="text-error-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={newPatientForm.mobile_number}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                              placeholder="e.g., 0771234567"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Username will be auto-generated from phone number</p>
                          </div>

                          {/* Gender - Required */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Gender <span className="text-error-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              {['male', 'female', 'other'].map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => setNewPatientForm(prev => ({ ...prev, gender: g as 'male' | 'female' | 'other' }))}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${newPatientForm.gender === g
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                >
                                  {g.charAt(0).toUpperCase() + g.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* NIC - Optional */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              NIC / ID Number <span className="text-neutral-400">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={newPatientForm.nic}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, nic: e.target.value }))}
                              placeholder="e.g., 199012345678"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                          </div>

                          {/* Date of Birth - Optional */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Date of Birth <span className="text-neutral-400">(Optional)</span>
                            </label>
                            <input
                              type="date"
                              value={newPatientForm.date_of_birth}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                          </div>

                          {/* Address - Optional */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Address <span className="text-neutral-400">(Optional)</span>
                            </label>
                            <textarea
                              value={newPatientForm.address}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Enter address"
                              rows={2}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                            />
                          </div>

                          {/* Send SMS Checkbox */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="send_sms"
                              checked={newPatientForm.send_sms}
                              onChange={(e) => setNewPatientForm(prev => ({ ...prev, send_sms: e.target.checked }))}
                              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="send_sms" className="text-sm text-neutral-700">
                              Send login credentials via SMS
                            </label>
                          </div>

                          {/* Register Button */}
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowNewPatientForm(false)}
                              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleRegisterNewPatient}
                              disabled={registeringPatient || !newPatientForm.full_name || !newPatientForm.mobile_number}
                              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${registeringPatient || !newPatientForm.full_name || !newPatientForm.mobile_number
                                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                                }`}
                            >
                              {registeringPatient ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  Registering...
                                </>
                              ) : (
                                <>
                                  <FaUserPlus />
                                  Register Patient
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Selected Patient Display */}
                      {bookingForm.patientId && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-600" />
                            <span className="font-medium text-emerald-800">{bookingForm.patientName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingForm(prev => ({ ...prev, patientId: '', patientName: '' }));
                              setPatientSearchQuery('');
                              setPatientCredentials(null);
                            }}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Doctor Selection */}
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full text-sm flex items-center justify-center">2</span>
                        Select Doctor
                      </h4>
                      <select
                        value={bookingForm.doctorId}
                        onChange={(e) => handleBookingFormChange('doctorId', e.target.value)}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      >
                        <option value="">Choose a doctor...</option>
                        {doctors.map(doctor => (
                          <option key={doctor.doctor_id} value={doctor.doctor_id}>
                            Dr. {doctor.name} {doctor.specialization && `- ${doctor.specialization}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Date Selection */}
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full text-sm flex items-center justify-center">3</span>
                        Select Date
                      </h4>
                      <input
                        type="date"
                        value={bookingForm.date}
                        min={new Date().toISOString().split('T')[0]}
                        max={maxBookingDate}
                        onChange={(e) => handleBookingFormChange('date', e.target.value)}
                        className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                      {/* Booking Rules Info */}
                      {bookingSettings && !overrideRules && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                          <FaInfoCircle className="inline mr-1" />
                          Bookings allowed up to <strong>{bookingSettings.max_advance_booking_days} days</strong> in advance
                        </div>
                      )}
                      {overrideRules && canOverrideRules && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                          <FaKey className="inline mr-1" />
                          <strong>Override Active:</strong> Extended booking window (up to 1 year)
                        </div>
                      )}
                    </div>

                    {/* Step 4: Slot Selection */}
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full text-sm flex items-center justify-center">4</span>
                        Select Time Slot
                      </h4>

                      {/* Schedule Info with Booking Rules */}
                      {bookingSchedule && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                          <div className="flex items-center justify-between">
                            <span>
                              <FaClock className="inline mr-1" />
                              {bookingSchedule.start_time} - {bookingSchedule.end_time}
                            </span>
                            <span className={`font-medium ${bookingSchedule.booked_count >= bookingSchedule.max_patients
                              ? 'text-error-600'
                              : bookingSchedule.booked_count >= bookingSchedule.max_patients * 0.8
                                ? 'text-amber-600'
                                : 'text-blue-700'
                              }`}>
                              {bookingSchedule.booked_count}/{bookingSchedule.max_patients} booked
                              {bookingSchedule.booked_count >= bookingSchedule.max_patients && !overrideRules && (
                                <span className="ml-1 text-error-600">(Full)</span>
                              )}
                            </span>
                          </div>
                          {/* Slot Duration Info */}
                          {bookingSettings && (
                            <div className="mt-1 text-xs text-primary-500">
                              <FaClock className="inline mr-1" />
                              {bookingSettings.default_time_per_patient} min per patient
                            </div>
                          )}
                        </div>
                      )}

                      {/* Session Full Warning */}
                      {bookingSchedule && bookingSchedule.booked_count >= bookingSchedule.max_patients && !overrideRules && (
                        <div className="mb-3 p-3 bg-error-50 border border-red-200 rounded-lg text-sm text-red-700">
                          <FaExclamationTriangle className="inline mr-1" />
                          <strong>Session Full:</strong> Maximum patient limit ({bookingSchedule.max_patients}) reached.
                          {canOverrideRules && (
                            <span className="block mt-1 text-xs">
                              You can enable "Override Booking Rules" below to bypass this limit.
                            </span>
                          )}
                        </div>
                      )}

                      {loadingBookingSlots ? (
                        <div className="flex items-center justify-center py-6 text-neutral-500">
                          <FaSpinner className="animate-spin mr-2" />
                          Loading available slots...
                        </div>
                      ) : !bookingForm.doctorId || !bookingForm.date ? (
                        <div className="text-center py-6 text-neutral-500">
                          Please select a doctor and date first
                        </div>
                      ) : bookingSlots.length === 0 ? (
                        <div className="text-center py-6 text-amber-600 bg-amber-50 rounded-lg">
                          <FaExclamationTriangle className="mx-auto mb-2" />
                          No schedule available for this doctor on selected date
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {bookingSlots.map((slot) => {
                            // Check if session is full and override is not enabled
                            const sessionFull = bookingSchedule &&
                              bookingSchedule.booked_count >= bookingSchedule.max_patients &&
                              !overrideRules;
                            const isDisabled = (slot.is_available === false || slot.is_available === null) || sessionFull;

                            return (
                              <button
                                key={slot.slot_number}
                                type="button"
                                onClick={() => !isDisabled && setBookingForm(prev => ({ ...prev, slotNumber: slot.slot_number || 0 }))}
                                disabled={isDisabled ? true : undefined}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${bookingForm.slotNumber === slot.slot_number
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                  : !isDisabled
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed line-through'
                                  }`}
                                title={
                                  sessionFull
                                    ? 'Session is full - max patients reached'
                                    : slot.is_available
                                      ? `Available at ${slot.time}`
                                      : 'Already booked'
                                }
                              >
                                <div className="font-bold">#{slot.slot_number}</div>
                                <div className="text-xs">{slot.time}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step 5: Booking Type & Payment */}
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white rounded-full text-sm flex items-center justify-center">5</span>
                        Booking Details
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Booking Type */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Booking Type</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setBookingForm(prev => ({ ...prev, bookingType: 'walk_in' }))}
                              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${bookingForm.bookingType === 'walk_in'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                }`}
                            >
                              <FaWalking className="w-3 h-3" />
                              Walk-in
                            </button>
                            <button
                              type="button"
                              onClick={() => setBookingForm(prev => ({ ...prev, bookingType: 'phone' }))}
                              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${bookingForm.bookingType === 'phone'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                }`}
                            >
                              <FaPhone className="w-3 h-3" />
                              Phone
                            </button>
                            <button
                              type="button"
                              onClick={() => setBookingForm(prev => ({ ...prev, bookingType: 'online' }))}
                              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${bookingForm.bookingType === 'online'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                }`}
                            >
                              <FaGlobe className="w-3 h-3" />
                              Online
                            </button>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Status</label>
                          <select
                            value={bookingForm.paymentStatus}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, paymentStatus: e.target.value as PaymentStatusType }))}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Details - only show if paid */}
                      {bookingForm.paymentStatus === 'paid' && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Method</label>
                            <select
                              value={bookingForm.paymentMethod}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            >
                              <option value="">Select method...</option>
                              <option value="cash">Cash</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (Rs.)</label>
                            <input
                              type="number"
                              value={bookingForm.amountPaid || ''}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (Optional)</label>
                        <textarea
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes..."
                          rows={2}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
                  <div className="text-sm text-neutral-500">
                    {bookingForm.slotNumber > 0 && bookingSlots.find(s => s.slot_number === bookingForm.slotNumber) && (
                      <span className="font-medium text-emerald-600">
                        Selected: Slot #{bookingForm.slotNumber} at {bookingSlots.find(s => s.slot_number === bookingForm.slotNumber)?.time}
                      </span>
                    )}
                    {overrideRules && canOverrideRules && (
                      <span className="ml-2 text-amber-600 text-xs">
                        <FaKey className="inline mr-1" />
                        Override Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={closeBookingModal}
                      disabled={savingBooking}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBooking}
                      disabled={savingBooking || !bookingForm.patientId || !bookingForm.doctorId || !bookingForm.slotNumber}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${savingBooking || !bookingForm.patientId || !bookingForm.doctorId || !bookingForm.slotNumber
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : overrideRules
                          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                        }`}
                    >
                      {savingBooking ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Creating...
                        </>
                      ) : overrideRules ? (
                        <>
                          <FaKey />
                          Confirm (Override)
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Report Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaPrint className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Print Appointments Report</h2>
                  </div>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="px-6 py-4 border-b border-gray-100 bg-neutral-50">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-neutral-700">Select Date:</label>
                    <input
                      type="date"
                      value={printDate}
                      onChange={(e) => {
                        setPrintDate(e.target.value);
                        loadPrintAppointments(e.target.value);
                      }}
                      className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handlePrint}
                    disabled={loadingPrintData || printAppointments.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                  >
                    <FaPrint />
                    Print
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-6">
                {loadingPrintData ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                ) : (
                  <div id="print-content">
                    {/* Print Header */}
                    <div className="header">
                      <h1>{branchName}</h1>
                      <p>Confirmed Appointments Report - {new Date(printDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}</p>
                    </div>

                    {/* Stats Summary */}
                    <div className="stats" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
                      <div className="stat-item" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                          {printAppointments.length}
                        </div>
                        <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Total Confirmed</div>
                      </div>
                      <div className="stat-item" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
                          {printAppointments.filter(a => a.booking_type === 'online').length}
                        </div>
                        <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Online Bookings</div>
                      </div>
                      <div className="stat-item" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                          {printAppointments.filter(a => a.booking_type === 'walk_in').length}
                        </div>
                        <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Walk-in</div>
                      </div>
                      <div className="stat-item" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#4338ca' }}>
                          {printAppointments.filter(a => a.booking_type === 'phone').length}
                        </div>
                        <div className="stat-label" style={{ fontSize: '12px', color: '#6b7280' }}>Phone Bookings</div>
                      </div>
                    </div>

                    {/* Appointments Table */}
                    {printAppointments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <FaCalendarAlt style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.5 }} />
                        <p>No confirmed appointments for this date</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Token</th>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Patient Name</th>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Contact Number</th>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Doctor</th>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Time</th>
                            <th style={{ background: '#10b981', color: 'white', padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>Booking Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printAppointments.map((apt, index) => (
                            <tr key={apt.id} style={{ background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: '#059669', fontSize: '14px' }}>
                                #{apt.token_number}
                              </td>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '12px' }}>
                                {apt.patient_name || 'N/A'}
                              </td>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '12px' }}>
                                {apt.patient_phone || 'N/A'}
                              </td>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '12px' }}>
                                Dr. {apt.doctor_name || 'N/A'}
                                <br />
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>{apt.doctor_specialization || ''}</span>
                              </td>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '12px' }}>
                                {apt.appointment_time || `Slot ${apt.slot_number}`}
                              </td>
                              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: 500,
                                  background: apt.booking_type === 'online' ? '#dbeafe' : apt.booking_type === 'walk_in' ? '#fef3c7' : '#e0e7ff',
                                  color: apt.booking_type === 'online' ? '#1d4ed8' : apt.booking_type === 'walk_in' ? '#d97706' : '#4338ca'
                                }}>
                                  {apt.booking_type === 'online' ? '🌐 Online' : apt.booking_type === 'walk_in' ? '🚶 Walk-in' : '📞 Phone'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Footer */}
                    <div className="footer" style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                      <p>Generated on {new Date().toLocaleString()} | {branchName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Appointment Modal */}
        {showDeleteModal && deletingAppointment ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <FaTrash className="text-red-500" />
                Delete Appointment
              </h3>
              <div className="mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <FaExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        Warning: This action cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Deleting this appointment will permanently remove it from the system.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mb-2">
                  Are you sure you want to delete the appointment for <strong>{deletingAppointment.patientName}</strong> with <strong>{deletingAppointment.doctorName}</strong>?
                </p>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason for deletion *
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for deletion..."
                  required
                />
                {deleteError && (
                  <p className="text-sm text-red-600 mt-2">{deleteError}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                  disabled={savingDelete}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={savingDelete || !deleteReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingDelete ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-4 h-4" />
                      Delete Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default BranchAdminAppointmentsNew;
