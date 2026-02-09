import axios, { AxiosError } from 'axios';

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').toString();

// Normalize to API v1 base URL.
// Supports both:
// - VITE_API_BASE_URL=http://localhost:8000
// - VITE_API_BASE_URL=http://localhost:8000/api/v1
const API_V1_BASE_URL = (() => {
  const trimmed = RAW_API_BASE_URL.replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
})();

// Create axios instances for different route prefixes
const publicApi = axios.create({
  baseURL: `${API_V1_BASE_URL}/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const patientApi = axios.create({
  baseURL: `${API_V1_BASE_URL}/patient/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const doctorApi = axios.create({
  baseURL: `${API_V1_BASE_URL}/doctor/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const receptionistApi = axios.create({
  // Backend receptionist router is mounted at /api/v1/receptionist
  baseURL: `${API_V1_BASE_URL}/receptionist`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const branchAdminApi = axios.create({
  baseURL: `${API_V1_BASE_URL}/branch-admin/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const superAdminApi = axios.create({
  baseURL: `${API_V1_BASE_URL}/super-admin/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor to all authenticated APIs
const addAuthInterceptor = (apiInstance: ReturnType<typeof axios.create>) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error('Appointment API Error:', { status, data, error });
      throw error;
    }
  );
};

// Apply to all authenticated APIs
[patientApi, doctorApi, receptionistApi, branchAdminApi, superAdminApi].forEach(addAuthInterceptor);

// Public API doesn't need auth but still format response
publicApi.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    console.error('Appointment API Error:', error);
    throw error;
  }
);

// ===========================================
// Types
// ===========================================

type BackendAppointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  branch_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  payment_status?: string | null;
  payment_amount?: number | null;
  payment_method?: string | null;
  cancellation_reason?: string | null;
  is_walk_in?: boolean | null;
  queue_number?: number | null;
  created_at?: string | null;
  patient_name?: string | null;
  doctor_name?: string | null;
  department?: string | null;
};

const getStoredUser = (): any => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const getStoredBranchId = (): string => {
  const u = getStoredUser();
  return (u?.branch_id || u?.branch?.id || '').toString();
};

const normalizeTimeHHMM = (timeValue: string | null | undefined): string => {
  const raw = (timeValue || '').toString();
  if (!raw) return '';
  // FastAPI often serializes time as HH:MM:SS
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
};

const mapBackendStatusToFrontend = (status: string | null | undefined): AppointmentBooking['status'] => {
  const s = (status || '').toString();
  switch (s) {
    case 'pending':
      return 'pending_payment';
    case 'confirmed':
      return 'confirmed';
    case 'in_progress':
      return 'in_session';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'no_show':
      return 'no_show';
    default:
      return 'confirmed';
  }
};

const mapBackendPaymentToFrontend = (
  paymentStatus: string | null | undefined
): AppointmentBooking['payment_status'] => {
  const s = (paymentStatus || 'unpaid').toString();
  switch (s) {
    case 'paid':
      return 'paid';
    case 'refunded':
      return 'refunded';
    case 'partial':
    case 'unpaid':
    default:
      return 'pending';
  }
};

const mapAppointment = (a: BackendAppointment): AppointmentBooking => {
  return {
    id: a.id,
    patient_id: a.patient_id,
    patient_name: a.patient_name || undefined,
    patient_phone: undefined,
    patient_email: undefined,
    doctor_id: a.doctor_id,
    doctor_name: a.doctor_name || undefined,
    doctor_specialization: undefined,
    branch_id: a.branch_id,
    branch_name: undefined,
    appointment_date: a.appointment_date,
    appointment_time: normalizeTimeHHMM(a.appointment_time),
    slot_number: 0,
    token_number: (a.queue_number || 0) as number,
    appointment_type: 'general',
    booking_type: (a.is_walk_in ? 'walk_in' : 'online') as AppointmentBooking['booking_type'],
    status: mapBackendStatusToFrontend(a.status),
    payment_status: mapBackendPaymentToFrontend(a.payment_status),
    payment_method: a.payment_method || undefined,
    booking_fee: undefined,
    amount_paid: a.payment_amount || undefined,
    notes: a.notes || undefined,
    cancellation_reason: a.cancellation_reason || undefined,
    cancelled_by_admin_for_doctor: false,
    created_at: a.created_at || new Date().toISOString(),
  };
};

const splitFullName = (fullName: string): { first_name: string; last_name: string } => {
  const cleaned = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { first_name: 'Patient', last_name: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts[parts.length - 1] };
};

const getAvailabilitySlots = async (
  doctorId: string,
  date: string
): Promise<Array<{ time: string }>> => {
  // Uses existing receptionist endpoint (works for any authenticated user)
  const data = await receptionistApi.get(`/doctors/${doctorId}/availability`, { params: { date } });
  const slots: any[] = (data as any)?.slots || [];
  // Backend returns list of {time: "HH:MM", available: bool}
  return slots
    .filter((s) => s && (s.available === true || s.is_available === true))
    .map((s) => ({ time: normalizeTimeHHMM(s.time) }));
};

const resolvePatientIdFromUserId = async (userId: string): Promise<string> => {
  // receptionist endpoint returns { user: {...}, patient: {id: ...} }
  const data = await receptionistApi.get(`/patients/${userId}`);
  const patientId = (data as any)?.patient?.id;
  if (!patientId) throw new Error('Patient profile not found');
  return patientId;
};

export interface Branch {
  id: string;
  name: string;
  location?: string;
  address?: string;
}

export interface Doctor {
  doctor_id: string;
  name: string;
  specialization?: string;
  branch_id?: string;
  branch_name?: string;
  profile_picture?: string;
  schedules?: DoctorSchedule[];
}

export interface DoctorSchedule {
  id: string;
  schedule_day: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  time_per_patient: number;
}

export interface TimeSlot {
  slot_number: number;
  time: string;
  end_time: string;
  available: boolean;
}

export interface SlotDay {
  date: string;
  day: string;
  schedule: DoctorSchedule;
  slots: TimeSlot[];
  available_count: number;
}

export interface AppointmentBooking {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_specialization?: string;
  branch_id: string;
  branch_name?: string;
  appointment_date: string;
  appointment_time: string;
  slot_number: number;
  token_number: number;
  appointment_type: 'general' | 'follow_up' | 'emergency' | 'consultation';
  booking_type: 'online' | 'walk_in' | 'phone';
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'in_session' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'waived';
  payment_method?: string;
  booking_fee?: number;
  amount_paid?: number;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by_admin_for_doctor?: boolean;
  created_at: string;
}

export interface AppointmentSettings {
  id?: string;
  branch_id?: string;
  max_advance_booking_days: number;
  min_advance_booking_hours: number;
  default_max_patients_per_session: number;
  default_time_per_patient: number;
  allow_walk_in: boolean;
  require_payment_for_online: boolean;
  allow_cash_payment: boolean;
  allow_reschedule: boolean;
  max_reschedule_count: number;
  reschedule_advance_hours: number;
  allow_patient_cancellation: boolean;
  cancellation_advance_hours: number;
  refund_on_cancellation: boolean;
  cancellation_fee_percentage: number;
  default_booking_fee: number;
  walk_in_fee: number;
  send_sms_confirmation: boolean;
  send_sms_reminder: boolean;
  reminder_hours_before: number;
  send_email_confirmation: boolean;
}

export interface AppointmentLog {
  id: string;
  appointment_id: string;
  appointment_date?: string;
  token_number?: string;
  branch_id?: string;
  branch_name?: string;
  action: string;
  action_label?: string;
  previous_status?: string;
  new_status?: string;
  performed_by: string;
  performed_by_name?: string;
  performed_by_email?: string;
  performed_by_role: string;
  reason?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  appointment_id: string;
  patient_name?: string;
  token_number?: number;
  action: string;
  action_label: string;
  previous_status?: string;
  new_status?: string;
  performed_by_id: string;
  performed_by: string;
  performed_by_role: string;
  reason?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  created_at_human: string;
}

export interface AppointmentStatistics {
  today: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show?: number;
    walk_in?: number;
    online?: number;
  };
  this_week?: {
    total: number;
    revenue: number;
  };
  this_month?: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  last_month?: {
    total: number;
    completed: number;
    revenue: number;
  };
  growth?: {
    appointments: number;
    revenue: number;
  };
  top_doctors?: Array<{
    doctor_id: string;
    name: string;
    appointment_count: number;
  }>;
  by_branch?: Array<{
    branch_id: string;
    branch_name: string;
    total_appointments: number;
    completed: number;
    revenue: number;
  }>;
}

// ===========================================
// Public API (No Auth Required)
// ===========================================

export const appointmentPublicApi = {
  // Get all branches
  getBranches: async (): Promise<{ status: number; branches: Branch[] }> => {
    return publicApi.get('/branches');
  },

  // Get all specializations
  getSpecializations: async (): Promise<{ status: number; specializations: string[] }> => {
    return publicApi.get('/specializations');
  },

  // Search doctors
  searchDoctors: async (params: {
    branch_id?: string;
    specialization?: string;
    doctor_name?: string;
    date?: string;
  }): Promise<{ status: number; doctors: Doctor[] }> => {
    return publicApi.get('/doctors/search', { params });
  },

  // Get available slots for a doctor
  getAvailableSlots: async (
    doctorId: string,
    params: {
      branch_id: string;
      start_date?: string;
      days?: number;
    }
  ): Promise<{ status: number; doctor: Doctor; available_days: SlotDay[] }> => {
    return publicApi.get(`/doctors/${doctorId}/slots`, { params });
  },
};

// ===========================================
// Patient API
// ===========================================

export const appointmentPatientApi = {
  // Create a new booking
  createBooking: async (data: {
    doctor_id: string;
    branch_id: string;
    appointment_date: string;
    slot_number: number;
    appointment_type?: string;
    notes?: string;
    payment_method?: string;
  }): Promise<{ status: number; message: string; booking: AppointmentBooking; requires_payment: boolean }> => {
    // Backend expects { doctor_id, branch_id, date, time, reason?, department? }
    const available = await getAvailabilitySlots(data.doctor_id, data.appointment_date);
    const slotIndex = Math.max(0, (data.slot_number || 1) - 1);
    const time = available[slotIndex]?.time;
    if (!time) {
      throw new Error('Selected slot is not available');
    }

    const appt = (await patientApi.post('/book', {
      doctor_id: data.doctor_id,
      branch_id: data.branch_id,
      date: data.appointment_date,
      time,
      reason: data.notes,
    })) as unknown as BackendAppointment;

    return {
      status: 200,
      message: 'Booking created',
      booking: mapAppointment(appt as BackendAppointment),
      requires_payment: false,
    };
  },

  // Confirm payment
  confirmPayment: async (
    bookingId: string,
    data: {
      payment_method: string;
      transaction_id?: string;
      amount_paid: number;
    }
  ): Promise<{ status: number; message: string; booking: AppointmentBooking }> => {
    const appt = (await patientApi.post(`/${bookingId}/confirm-payment`, {
      payment_method: data.payment_method,
      payment_reference: data.transaction_id,
      amount: data.amount_paid,
    })) as unknown as BackendAppointment;
    return {
      status: 200,
      message: 'Payment confirmed',
      booking: mapAppointment(appt as BackendAppointment),
    };
  },

  // Get patient's appointments
  getMyAppointments: async (params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[] }> => {
    const list = (await patientApi.get('/my-appointments', {
      params: { status: params?.status },
    })) as BackendAppointment[];

    const mapped = Array.isArray(list) ? list.map(mapAppointment) : [];
    // from_date/to_date are not supported by backend; apply client-side filtering when provided.
    const fromDate = params?.from_date;
    const toDate = params?.to_date;
    const filtered = mapped.filter((a) => {
      if (fromDate && a.appointment_date < fromDate) return false;
      if (toDate && a.appointment_date > toDate) return false;
      return true;
    });

    return { status: 200, appointments: filtered };
  },

  // Get appointment details
  getAppointmentDetails: async (bookingId: string): Promise<{ status: number; appointment: AppointmentBooking }> => {
    const appt = (await patientApi.get(`/${bookingId}`)) as BackendAppointment;
    return { status: 200, appointment: mapAppointment(appt) };
  },

  // Cancel appointment
  cancelAppointment: async (
    bookingId: string,
    reason: string,
    confirmed: boolean = false
  ): Promise<{ status: number; message: string; refund_eligible?: boolean }> => {
    // Backend currently ignores reason/confirmed.
    await patientApi.post(`/${bookingId}/cancel`);
    return { status: 200, message: 'Appointment cancelled', refund_eligible: false };
  },

  // Check reschedule eligibility
  getRescheduleEligibility: async (
    bookingId: string
  ): Promise<{
    status: number;
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
  }> => {
    const data = await patientApi.get(`/${bookingId}/reschedule-eligibility`);
    const eligible = Boolean((data as any)?.eligible);
    const reason = (data as any)?.reason ?? (data as any)?.detail ?? null;
    return {
      status: 200,
      can_reschedule: eligible,
      reason: eligible ? null : (reason || 'Not eligible'),
      remaining_attempts: 1,
      max_attempts: 1,
      is_admin_cancelled: false,
      appointment_details: {
        id: bookingId,
        date: '',
        time: '',
        doctor_id: '',
        branch_id: '',
        status: '',
      },
      settings: {
        max_advance_booking_days: 30,
        reschedule_advance_hours: 24,
      },
    };
  },

  // Reschedule appointment
  rescheduleAppointment: async (
    bookingId: string,
    data: {
      new_date: string;
      new_slot_number: number;
      reason?: string;
      confirmed: boolean;
    }
  ): Promise<{
    status: number;
    message: string;
    new_booking: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
      slot_number: number;
    };
    remaining_reschedule_attempts: number;
    is_admin_cancelled_appointment: boolean;
  }> => {
    // Backend expects new_date and new_time.
    const currentAppt = (await patientApi.get(`/${bookingId}`)) as any;
    const doctorId = (data as any).doctor_id || currentAppt?.doctor_id;
    if (!doctorId) {
      throw new Error('Unable to resolve doctor for reschedule');
    }

    const available = await getAvailabilitySlots(doctorId, data.new_date).catch(() => []);

    const slotIndex = Math.max(0, (data.new_slot_number || 1) - 1);
    const newTime = available[slotIndex]?.time;
    if (!newTime) {
      // Fall back: use midnight if slot mapping failed, backend will likely reject if conflicting.
      throw new Error('Selected slot is not available');
    }

    const appt = (await patientApi.post(`/${bookingId}/reschedule`, {
      new_date: data.new_date,
      new_time: newTime,
    })) as unknown as BackendAppointment;

    const mapped = mapAppointment(appt as BackendAppointment);
    return {
      status: 200,
      message: 'Appointment rescheduled',
      new_booking: {
        id: mapped.id,
        token_number: mapped.token_number,
        appointment_date: mapped.appointment_date,
        appointment_time: mapped.appointment_time,
        slot_number: data.new_slot_number,
      },
      remaining_reschedule_attempts: 0,
      is_admin_cancelled_appointment: false,
    };
  },
};

// ===========================================
// Doctor API
// ===========================================

export const appointmentDoctorApi = {
  // Get appointments
  getAppointments: async (params?: {
    date?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[]; pagination?: any }> => {
    const list = (await doctorApi.get('/list', {
      params: {
        appt_date: params?.date,
        status: params?.status,
        skip: 0,
        limit: 200,
      },
    })) as BackendAppointment[];

    return {
      status: 200,
      appointments: Array.isArray(list) ? list.map(mapAppointment) : [],
    };
  },

  // Get today's queue
  getTodaysQueue: async (): Promise<{
    status: number;
    queue: AppointmentBooking[];
    current_patient?: AppointmentBooking;
    summary: {
      total: number;
      waiting: number;
      completed: number;
      current_token: number;
    };
  }> => {
    const data = await doctorApi.get('/today-queue');
    const queue = Array.isArray((data as any)?.queue) ? ((data as any).queue as BackendAppointment[]).map(mapAppointment) : [];
    const summary = {
      total: queue.length,
      waiting: queue.filter((q) => q.status === 'confirmed' || q.status === 'pending_payment').length,
      completed: queue.filter((q) => q.status === 'completed').length,
      current_token: queue[0]?.token_number || 0,
    };
    return { status: 200, queue, current_patient: queue[0] || undefined, summary };
  },

  // Get statistics
  getStatistics: async (): Promise<{ status: number; statistics: AppointmentStatistics }> => {
    const raw = await doctorApi.get('/statistics');
    // Backend returns {total, completed, cancelled, no_show, pending, completion_rate}
    const todayTotal = Number((raw as any)?.total || 0);
    const completed = Number((raw as any)?.completed || 0);
    const cancelled = Number((raw as any)?.cancelled || 0);
    const noShow = Number((raw as any)?.no_show || 0);
    const pending = Number((raw as any)?.pending || 0);
    return {
      status: 200,
      statistics: {
        today: {
          total: todayTotal,
          confirmed: Math.max(0, todayTotal - pending - cancelled - noShow - completed),
          completed,
          cancelled,
          no_show: noShow,
        },
      },
    };
  },

  // Check in patient
  checkInPatient: async (bookingId: string): Promise<{ status: number; message: string }> => {
    await doctorApi.post(`/${bookingId}/check-in`);
    return { status: 200, message: 'Checked in' };
  },

  // Start session
  startSession: async (bookingId: string): Promise<{ status: number; message: string }> => {
    await doctorApi.post(`/${bookingId}/start-session`);
    return { status: 200, message: 'Session started' };
  },

  // Complete consultation
  completeConsultation: async (
    bookingId: string,
    data?: { notes?: string }
  ): Promise<{ status: number; message: string }> => {
    await doctorApi.post(`/${bookingId}/complete`, data);
    return { status: 200, message: 'Completed' };
  },

  // Mark no-show
  markNoShow: async (bookingId: string): Promise<{ status: number; message: string }> => {
    await doctorApi.post(`/${bookingId}/no-show`);
    return { status: 200, message: 'Marked no-show' };
  },
};

// ===========================================
// Receptionist API
// ===========================================

export const appointmentReceptionistApi = {
  // Create walk-in booking
  createWalkInBooking: async (data: {
    patient_id?: string;
    patient_name?: string;
    patient_phone?: string;
    doctor_id: string;
    appointment_type?: string;
    notes?: string;
    payment_method?: string;
    amount_paid?: number;
  }): Promise<{ status: number; message: string; booking: AppointmentBooking }> => {
    const branchId = getStoredBranchId();

    let patientId: string | undefined;
    if (data.patient_id) {
      // UI provides a user_id in many flows.
      patientId = await resolvePatientIdFromUserId(data.patient_id).catch(() => undefined);
    }

    if (!patientId) {
      // Register a patient if we only have name/phone.
      const nameParts = splitFullName(data.patient_name || 'Patient');
      const reg = await receptionistApi.post('/patients/register', {
        first_name: nameParts.first_name,
        last_name: nameParts.last_name,
        phone: data.patient_phone || '',
      });
      patientId = (reg as any)?.patient_id;
    }

    if (!patientId) {
      throw new Error('Unable to resolve patient profile');
    }

    const appt = (await receptionistApi.post('/appointments/walk-in', {
      patient_id: patientId,
      doctor_id: data.doctor_id,
      branch_id: branchId,
      reason: data.notes,
      department: data.appointment_type,
    })) as unknown as BackendAppointment;

    return { status: 200, message: 'Walk-in booking created', booking: mapAppointment(appt as BackendAppointment) };
  },

  // Get appointments
  getAppointments: async (params?: {
    date?: string;
    doctor_id?: string;
    status?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[] }> => {
    const list = (await receptionistApi.get('/appointments', {
      params: {
        date: params?.date,
        status: params?.status,
        skip: 0,
        limit: 200,
      },
    })) as BackendAppointment[];

    const mapped = Array.isArray(list) ? list.map(mapAppointment) : [];
    const filtered = params?.doctor_id ? mapped.filter((a) => a.doctor_id === params.doctor_id) : mapped;
    return { status: 200, appointments: filtered };
  },

  // Search patients
  searchPatients: async (search: string): Promise<{ status: number; patients: any[] }> => {
    const users = await receptionistApi.get('/patients/search', { params: { q: search } });
    const list = Array.isArray(users) ? users : [];
    // Return a compatible shape for existing UI.
    return {
      status: 200,
      patients: list.map((u: any) => ({
        id: u.id,
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        phone: u.phone,
        nic: u.nic,
        email: u.email,
      })),
    };
  },

  // Get available doctors
  getAvailableDoctors: async (): Promise<{ status: number; doctors: Doctor[] }> => {
    const branchId = getStoredBranchId();
    const docs = await receptionistApi.get('/doctors', { params: branchId ? { branch_id: branchId } : {} });
    const list = Array.isArray(docs) ? docs : [];
    return {
      status: 200,
      doctors: list.map((d: any) => ({
        doctor_id: d.id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
        specialization: d.specialization,
        branch_id: d.branch_id,
      })),
    };
  },

  // Check in patient
  checkInPatient: async (bookingId: string): Promise<{ status: number; message: string }> => {
    await receptionistApi.post(`/appointments/${bookingId}/check-in`);
    return { status: 200, message: 'Checked in' };
  },

  // Cancel appointment
  cancelAppointment: async (bookingId: string, reason: string): Promise<{ status: number; message: string }> => {
    await receptionistApi.post(`/appointments/${bookingId}/cancel`, { reason });
    return { status: 200, message: 'Appointment cancelled' };
  },

  // Record payment
  recordPayment: async (
    bookingId: string,
    data: {
      payment_method: string;
      amount_paid: number;
      receipt_number?: string;
    }
  ): Promise<{ status: number; message: string }> => {
    await receptionistApi.post(`/appointments/${bookingId}/payment`, {
      payment_status: 'paid',
      amount: data.amount_paid,
      method: data.payment_method,
      reference: data.receipt_number,
    });
    return { status: 200, message: 'Payment recorded' };
  },
};

// ===========================================
// Branch Admin API
// ===========================================

export interface DashboardSummary {
  today_total: number;
  today_confirmed: number;
  today_checked_in: number;
  today_in_session: number;
  today_completed: number;
  upcoming_count: number;
  pending_payments: number;
  alerts_count: number;
}

export interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  appointment_id?: string;
  doctor_id?: string;
  date?: string;
  count?: number;
  created_at?: string;
}

export interface SlotInfo {
  slot_number: number;
  time: string;
  is_available: boolean;
}

export interface PatientSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  nic?: string | null;
}

export const appointmentBranchAdminApi = {
  // Get dashboard with alerts and summary
  getDashboard: async (): Promise<{
    status: number;
    summary: DashboardSummary;
    today_appointments: AppointmentBooking[];
    upcoming_appointments: AppointmentBooking[];
    recent_cancelled: AppointmentBooking[];
    alerts: Alert[];
  }> => {
    return branchAdminApi.get('/dashboard');
  },

  // Get all appointments in branch with enhanced filtering
  getAppointments: async (params?: {
    view?: 'today' | 'upcoming' | 'past' | 'cancelled' | 'all';
    date?: string;
    doctor_id?: string;
    specialization?: string;
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[]; total: number; view?: string }> => {
    const branchId = getStoredBranchId();
    const today = new Date().toISOString().split('T')[0];
    const effective: any = {
      branch_id: branchId || undefined,
      appt_date: params?.date || undefined,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      skip: 0,
      limit: 500,
    };

    if (params?.view === 'today') {
      effective.appt_date = today;
    }
    if (params?.view === 'cancelled') {
      effective.status = 'cancelled';
    }

    const list = (await branchAdminApi.get('/list', { params: effective })) as BackendAppointment[];
    let mapped = Array.isArray(list) ? list.map(mapAppointment) : [];

    // view-based client-side filtering for upcoming/past (backend doesn't support range).
    if (params?.view === 'upcoming') {
      mapped = mapped.filter((a) => a.appointment_date >= today && a.status !== 'cancelled');
    } else if (params?.view === 'past') {
      mapped = mapped.filter((a) => a.appointment_date < today || a.status === 'completed' || a.status === 'cancelled');
    }

    if (params?.doctor_id) {
      mapped = mapped.filter((a) => a.doctor_id === params.doctor_id);
    }

    return { status: 200, appointments: mapped, total: mapped.length, view: params?.view };
  },

  // Get statistics
  getStatistics: async (): Promise<{ status: number; statistics: AppointmentStatistics }> => {
    const raw = await branchAdminApi.get('/statistics');
    return {
      status: 200,
      statistics: {
        today: {
          total: Number((raw as any)?.total || 0),
          confirmed: Number((raw as any)?.confirmed || 0),
          completed: Number((raw as any)?.completed || 0),
          cancelled: Number((raw as any)?.cancelled || 0),
          no_show: Number((raw as any)?.no_show || 0),
        },
      },
    };
  },

  // Get doctors in branch
  getDoctors: async (): Promise<{ status: number; doctors: Doctor[] }> => {
    const branchId = getStoredBranchId();
    const docs = await receptionistApi.get('/doctors', { params: branchId ? { branch_id: branchId } : {} });
    const list = Array.isArray(docs) ? docs : [];
    return {
      status: 200,
      doctors: list.map((d: any) => ({
        doctor_id: d.id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
        specialization: d.specialization,
        branch_id: d.branch_id,
      })),
    };
  },

  // Modify appointment
  modifyAppointment: async (
    bookingId: string,
    data: {
      doctor_id?: string;
      appointment_date?: string;
      slot_number?: number;
      status?: string;
      notes?: string;
      reason: string;
    }
  ): Promise<{ status: number; message: string; changes: Record<string, any> }> => {
    // Align with backend capabilities (reschedule + status change).
    if (data.appointment_date && data.slot_number) {
      const slots = await getAvailabilitySlots(data.doctor_id || '', data.appointment_date);
      const slotIndex = Math.max(0, (data.slot_number || 1) - 1);
      const newTime = slots[slotIndex]?.time;
      if (!newTime) throw new Error('Selected slot is not available');
      await branchAdminApi.post(`/${bookingId}/reschedule`, { new_date: data.appointment_date, new_time: newTime });
      return { status: 200, message: 'Appointment rescheduled', changes: { appointment_date: data.appointment_date, slot_number: data.slot_number } };
    }

    if (data.status) {
      await branchAdminApi.post(`/${bookingId}/status`, { status: data.status, reason: data.reason });
      return { status: 200, message: 'Status updated', changes: { status: data.status } };
    }

    return { status: 200, message: 'No changes applied', changes: {} };
  },

  // Cancel appointment
  cancelAppointment: async (
    bookingId: string,
    reason: string,
    forDoctorRequest?: boolean
  ): Promise<{ status: number; message: string; allows_patient_reschedule?: boolean }> => {
    await branchAdminApi.post(`/${bookingId}/cancel`, { reason });
    return { status: 200, message: 'Appointment cancelled' };
  },

  // Get single appointment details
  getAppointmentDetails: async (bookingId: string): Promise<{ status: number; appointment: any }> => {
    const appt = (await branchAdminApi.get(`/${bookingId}`)) as BackendAppointment;
    return { status: 200, appointment: mapAppointment(appt) };
  },

  // Get specializations available in branch
  getSpecializations: async (): Promise<{ status: number; specializations: string[] }> => {
    const docs = await appointmentBranchAdminApi.getDoctors();
    const specs = [...new Set((docs.doctors || []).map((d) => d.specialization).filter(Boolean))] as string[];
    return { status: 200, specializations: specs.sort() };
  },

  // Search patients for booking
  searchPatients: async (query: string): Promise<{ status: number; patients: PatientSearchResult[] }> => {
    const users = await receptionistApi.get('/patients/search', { params: { q: query } });
    const list = Array.isArray(users) ? users : [];

    const patients: PatientSearchResult[] = [];
    for (const u of list) {
      try {
        const details = await receptionistApi.get(`/patients/${(u as any).id}`);
        const patientId = (details as any)?.patient?.id;
        const user = (details as any)?.user;
        if (!patientId) continue;
        patients.push({
          id: patientId,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Patient',
          phone: user?.phone || user?.contact_number_mobile || null,
          email: user?.email || null,
          dob: user?.date_of_birth || null,
          nic: user?.nic || user?.nic_number || null,
        });
      } catch {
        // ignore
      }
    }

    return { status: 200, patients };
  },

  // Update payment status
  updatePaymentStatus: async (
    bookingId: string,
    data: {
      payment_status: 'pending' | 'paid' | 'waived';
      payment_method?: string;
      amount_paid?: number;
      reason: string;
    }
  ): Promise<{ status: number; message: string; new_payment_status: string }> => {
    await branchAdminApi.post(`/${bookingId}/payment`, {
      payment_status: data.payment_status === 'paid' ? 'paid' : 'unpaid',
      amount: data.amount_paid,
      method: data.payment_method,
      reference: undefined,
    });
    return { status: 200, message: 'Payment updated', new_payment_status: data.payment_status };
  },

  // Get available slots for a doctor on a date
  getAvailableSlots: async (
    doctorId: string,
    date: string
  ): Promise<{
    status: number;
    slots: SlotInfo[];
    schedule?: {
      start_time: string;
      end_time: string;
      max_patients: number;
      booked_count: number;
    };
  }> => {
    const slots = await receptionistApi.get(`/doctors/${doctorId}/availability`, { params: { date } });
    const list = Array.isArray((slots as any)?.slots) ? (slots as any).slots : [];
    const mapped: SlotInfo[] = list
      .filter((s: any) => s && (s.available === true || s.is_available === true))
      .map((s: any, idx: number) => ({ slot_number: idx + 1, time: normalizeTimeHHMM(s.time), is_available: true }));
    return { status: 200, slots: mapped };
  },

  // Create appointment on behalf of patient
  createAppointment: async (data: {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    slot_number: number;
    booking_type: 'walk_in' | 'phone' | 'online';
    payment_status: 'pending' | 'paid' | 'waived';
    payment_method?: string;
    amount_paid?: number;
    notes?: string;
  }): Promise<{
    status: number;
    message: string;
    appointment?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
  }> => {
    const branchId = getStoredBranchId();
    const available = await getAvailabilitySlots(data.doctor_id, data.appointment_date);
    const slotIndex = Math.max(0, (data.slot_number || 1) - 1);
    const time = available[slotIndex]?.time;
    if (!time) throw new Error('Selected slot is not available');

    const appt = await branchAdminApi.post('/create', {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      branch_id: branchId,
      date: data.appointment_date,
      time,
      reason: data.notes,
      department: undefined,
      is_walk_in: data.booking_type === 'walk_in',
    });

    return {
      status: 200,
      message: 'Appointment created',
      appointment: {
        id: (appt as any)?.id || (appt as any)?.appointment?.id,
        token_number: (appt as any)?.queue_number || (appt as any)?.appointment?.token_number || 0,
        appointment_date: (appt as any)?.appointment_date || data.appointment_date,
        appointment_time: normalizeTimeHHMM((appt as any)?.appointment_time) || time,
      },
    };
  },

  // Register new patient for walk-in/phone appointment (auto-generates credentials)
  registerPatient: async (data: {
    full_name: string;
    mobile_number: string;
    nic?: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth?: string;
    address?: string;
    send_sms?: boolean;
  }): Promise<{
    status: number;
    message: string;
    patient?: {
      id: string;
      patient_record_id: number;
      patient_id: string;
      name: string;
      phone: string;
      username: string;
      temp_password: string;
    };
    sms_sent?: boolean;
    credentials?: {
      username: string;
      password: string;
      login_url: string;
    };
    existing_patient?: {
      id: string;
      name: string;
      patient_id: string;
    };
  }> => {
    const branchId = getStoredBranchId();
    const nameParts = splitFullName(data.full_name);
    const reg = await receptionistApi.post('/patients/register', {
      first_name: nameParts.first_name,
      last_name: nameParts.last_name,
      phone: data.mobile_number,
      nic: data.nic,
      address: data.address,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
    });

    // receptionist returns {user_id, patient_id}
    const patientId = (reg as any)?.patient_id;
    if (!patientId) {
      return { status: 400, message: 'Failed to register patient' } as any;
    }

    return {
      status: 201,
      message: (reg as any)?.message || 'Patient registered',
      patient: {
        id: patientId,
        patient_record_id: 0,
        patient_id: patientId,
        name: data.full_name,
        phone: data.mobile_number,
        username: '',
        temp_password: '',
      },
      sms_sent: false,
      credentials: undefined,
    };
  },

  // Create appointment with new patient registration in one call
  createAppointmentWithPatient: async (data: {
    patient_id?: string;
    new_patient?: {
      full_name: string;
      mobile_number: string;
      nic?: string;
      gender: 'male' | 'female' | 'other';
      date_of_birth?: string;
      address?: string;
      send_sms?: boolean;
    };
    doctor_id: string;
    appointment_date: string;
    slot_number: number;
    booking_type: 'walk_in' | 'phone' | 'online';
    payment_status: 'pending' | 'paid' | 'waived';
    payment_method?: string;
    amount_paid?: number;
    notes?: string;
  }): Promise<{
    status: number;
    message: string;
    appointment?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
    is_new_patient?: boolean;
    patient_credentials?: {
      username: string;
      password: string;
      login_url: string;
    };
  }> => {
    // Backend supports /create-with-patient but expects a different payload.
    // For now, register patient then book appointment.
    if (!data.new_patient) {
      throw new Error('new_patient is required');
    }
    const reg = await appointmentBranchAdminApi.registerPatient({
      full_name: data.new_patient.full_name,
      mobile_number: data.new_patient.mobile_number,
      nic: data.new_patient.nic,
      gender: data.new_patient.gender,
      date_of_birth: data.new_patient.date_of_birth,
      address: data.new_patient.address,
      send_sms: data.new_patient.send_sms,
    });

    const created = await appointmentBranchAdminApi.createAppointment({
      patient_id: (reg as any)?.patient?.id,
      doctor_id: data.doctor_id,
      appointment_date: data.appointment_date,
      slot_number: data.slot_number,
      booking_type: data.booking_type,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
      amount_paid: data.amount_paid,
      notes: data.notes,
    });

    return {
      status: 200,
      message: 'Appointment created',
      appointment: created.appointment,
      is_new_patient: true,
      patient_credentials: undefined,
    };
  },

  // Admin reschedule appointment (no restrictions)
  rescheduleAppointment: async (
    bookingId: string,
    data: {
      new_date: string;
      new_slot_number: number;
      new_doctor_id?: string;
      new_branch_id?: string;
      reason: string;
    }
  ): Promise<{
    status: number;
    message: string;
    old_booking_id: string;
    new_booking?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
  }> => {
    const current = (await branchAdminApi.get(`/${bookingId}`)) as any;
    const doctorId = data.new_doctor_id || current?.doctor_id;
    const branchId = data.new_branch_id || getStoredBranchId();
    const available = await getAvailabilitySlots(doctorId, data.new_date);
    const slotIndex = Math.max(0, (data.new_slot_number || 1) - 1);
    const newTime = available[slotIndex]?.time;
    if (!newTime) throw new Error('Selected slot is not available');

    await branchAdminApi.post(`/${bookingId}/reschedule`, { new_date: data.new_date, new_time: newTime });
    return {
      status: 200,
      message: 'Appointment rescheduled',
      old_booking_id: bookingId,
      new_booking: {
        id: bookingId,
        token_number: 0,
        appointment_date: data.new_date,
        appointment_time: newTime,
      },
    };
  },

  // Update appointment status
  updateStatus: async (
    bookingId: string,
    status: string,
    reason: string
  ): Promise<{ status: number; message: string; new_status: string }> => {
    await branchAdminApi.post(`/${bookingId}/status`, { status, reason });
    return { status: 200, message: 'Status updated', new_status: status };
  },

  // Get appointment logs
  getAppointmentLogs: async (bookingId: string): Promise<{ status: number; logs: AppointmentLog[] }> => {
    const data = await branchAdminApi.get(`/${bookingId}/audit-logs`);
    const logs = Array.isArray((data as any)?.logs) ? (data as any).logs : [];
    return { status: 200, logs };
  },

  // Get branch-wide audit logs with filtering
  getBranchAuditLogs: async (params?: {
    start_date?: string;
    end_date?: string;
    action?: string;
    admin_id?: string;
    appointment_id?: string;
    per_page?: number;
    page?: number;
  }): Promise<{
    status: number;
    logs: AuditLogEntry[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    filters: {
      actions: Record<string, string>;
      admins: { id: string; name: string }[];
    };
  }> => {
    // Backend does not currently expose branch-wide audit logs under this router.
    // Return empty result to avoid runtime crashes.
    return {
      status: 200,
      logs: [],
      pagination: {
        current_page: params?.page || 1,
        last_page: 1,
        per_page: params?.per_page || 20,
        total: 0,
      },
      filters: { actions: {}, admins: [] },
    };
  },

  // Get settings
  getSettings: async (): Promise<{ status: number; settings: AppointmentSettings }> => {
    const branchId = getStoredBranchId();
    const s = await branchAdminApi.get(`/settings/${branchId}`);
    // Map backend AppointmentSettingsRead into frontend AppointmentSettings
    const out: AppointmentSettings = {
      id: (s as any)?.id,
      branch_id: (s as any)?.branch_id,
      max_advance_booking_days: Number((s as any)?.booking_advance_days ?? 30),
      min_advance_booking_hours: 0,
      default_max_patients_per_session: Number((s as any)?.max_daily_appointments ?? 50),
      default_time_per_patient: Number((s as any)?.slot_duration ?? 30),
      allow_walk_in: true,
      require_payment_for_online: Boolean((s as any)?.payment_required ?? false),
      allow_cash_payment: true,
      allow_reschedule: true,
      max_reschedule_count: 1,
      reschedule_advance_hours: 24,
      allow_patient_cancellation: true,
      cancellation_advance_hours: Number((s as any)?.cancellation_deadline_hours ?? 24),
      refund_on_cancellation: false,
      cancellation_fee_percentage: 0,
      default_booking_fee: 0,
      walk_in_fee: 0,
      send_sms_confirmation: false,
      send_sms_reminder: false,
      reminder_hours_before: 24,
      send_email_confirmation: false,
    };
    return { status: 200, settings: out };
  },

  // Update settings
  updateSettings: async (
    settings: Partial<AppointmentSettings>
  ): Promise<{ status: number; message: string; settings: AppointmentSettings }> => {
    const branchId = getStoredBranchId();
    await branchAdminApi.put(`/settings/${branchId}`, {
      branch_id: branchId,
      max_daily_appointments: settings.default_max_patients_per_session,
      slot_duration: settings.default_time_per_patient,
      booking_advance_days: settings.max_advance_booking_days,
      cancellation_deadline_hours: settings.cancellation_advance_hours,
      payment_required: settings.require_payment_for_online,
    });
    return { status: 200, message: 'Settings updated', settings: settings as AppointmentSettings };
  },
};

// ===========================================
// Super Admin API
// ===========================================

export const appointmentSuperAdminApi = {
  // Get all appointments across branches
  getAllAppointments: async (params?: {
    date?: string;
    branch_id?: string;
    doctor_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: number;
    appointments: AppointmentBooking[];
    pagination: { total: number; page: number; per_page: number; total_pages: number };
  }> => {
    return superAdminApi.get('/', { params });
  },

  // Get global statistics
  getGlobalStatistics: async (): Promise<{ status: number; statistics: AppointmentStatistics }> => {
    return superAdminApi.get('/statistics');
  },

  // Get all branches
  getBranches: async (): Promise<{ status: number; branches: Branch[] }> => {
    return superAdminApi.get('/branches');
  },

  // Get all doctors
  getAllDoctors: async (branchId?: string): Promise<{ status: number; doctors: Doctor[] }> => {
    return superAdminApi.get('/doctors', { params: branchId ? { branch_id: branchId } : {} });
  },

  // Get audit logs
  getAuditLogs: async (params?: {
    action?: string;
    branch_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    status: number;
    logs: AppointmentLog[];
    pagination: { total: number; page: number; per_page: number; total_pages: number };
  }> => {
    return superAdminApi.get('/audit-logs', { params });
  },

  // Get branch settings
  getBranchSettings: async (): Promise<{
    status: number;
    branches: Array<{
      branch_id: string;
      branch_name: string;
      location?: string;
      has_settings: boolean;
      settings: AppointmentSettings;
    }>;
  }> => {
    return superAdminApi.get('/branch-settings');
  },

  // Update branch settings
  updateBranchSettings: async (
    branchId: string,
    settings: Partial<AppointmentSettings>
  ): Promise<{ status: number; message: string; settings: AppointmentSettings }> => {
    return superAdminApi.put(`/branch-settings/${branchId}`, settings);
  },

  // Get available slots for a doctor on a date (any branch)
  getAvailableSlots: async (
    doctorId: string,
    date: string,
    branchId?: string
  ): Promise<{
    status: number;
    slots: SlotInfo[];
    schedule?: {
      start_time: string;
      end_time: string;
      max_patients: number;
      booked_count: number;
    };
  }> => {
    return superAdminApi.get('/available-slots', {
      params: { doctor_id: doctorId, date, ...(branchId && { branch_id: branchId }) }
    });
  },

  // Create appointment on behalf of any branch
  createAppointment: async (data: {
    branch_id: string;
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    slot_number: number;
    booking_type: 'walk_in' | 'phone' | 'online';
    payment_status: 'pending' | 'paid' | 'waived';
    payment_method?: string;
    amount_paid?: number;
    notes?: string;
  }): Promise<{
    status: number;
    message: string;
    appointment?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
  }> => {
    return superAdminApi.post('/create', data);
  },

  // Create appointment with new patient registration
  createAppointmentWithPatient: async (data: {
    branch_id: string;
    patient_id?: string;
    new_patient?: {
      full_name: string;
      mobile_number: string;
      nic?: string;
      gender: 'male' | 'female' | 'other';
      date_of_birth?: string;
      address?: string;
      send_sms?: boolean;
    };
    doctor_id: string;
    appointment_date: string;
    slot_number: number;
    booking_type: 'walk_in' | 'phone' | 'online';
    payment_status: 'pending' | 'paid' | 'waived';
    payment_method?: string;
    amount_paid?: number;
    notes?: string;
  }): Promise<{
    status: number;
    message: string;
    appointment?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
    is_new_patient?: boolean;
    patient_credentials?: {
      username: string;
      password: string;
      login_url: string;
    };
  }> => {
    return superAdminApi.post('/create-with-patient', data);
  },

  // Cancel appointment (Super Admin can override restrictions)
  cancelAppointment: async (
    bookingId: string,
    reason: string,
    isDoctorRequest: boolean = false
  ): Promise<{ status: number; message: string }> => {
    return superAdminApi.post(`/${bookingId}/cancel`, {
      reason,
      is_doctor_request: isDoctorRequest,
      override_restrictions: true
    });
  },

  // Reschedule appointment (Super Admin can override restrictions)
  rescheduleAppointment: async (
    bookingId: string,
    data: {
      new_date: string;
      new_slot_number: number;
      new_doctor_id?: string;
      new_branch_id?: string;
      reason: string;
    }
  ): Promise<{
    status: number;
    message: string;
    old_booking_id: string;
    new_booking?: {
      id: string;
      token_number: number;
      appointment_date: string;
      appointment_time: string;
    };
  }> => {
    return superAdminApi.post(`/${bookingId}/reschedule`, { ...data, override_restrictions: true });
  },

  // Update appointment status
  updateStatus: async (
    bookingId: string,
    status: string,
    reason: string
  ): Promise<{ status: number; message: string; new_status: string }> => {
    return superAdminApi.post(`/${bookingId}/status`, { status, reason });
  },

  // Search patients across all branches
  searchPatients: async (query: string, branchId?: string): Promise<{
    status: number;
    patients: PatientSearchResult[];
  }> => {
    return superAdminApi.get('/search-patients', {
      params: { query, ...(branchId && { branch_id: branchId }) }
    });
  },

  // Register new patient (for any branch)
  registerPatient: async (data: {
    branch_id: string;
    full_name: string;
    mobile_number: string;
    nic?: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth?: string;
    address?: string;
    send_sms?: boolean;
  }): Promise<{
    status: number;
    message: string;
    patient?: {
      id: string;
      patient_record_id: number;
      patient_id: string;
      name: string;
      phone: string;
      username: string;
      temp_password: string;
    };
    sms_sent?: boolean;
    credentials?: {
      username: string;
      password: string;
      login_url: string;
    };
    existing_patient?: {
      id: string;
      name: string;
      patient_id: string;
    };
  }> => {
    return superAdminApi.post('/register-patient', data);
  },
};

export default {
  public: appointmentPublicApi,
  patient: appointmentPatientApi,
  doctor: appointmentDoctorApi,
  receptionist: appointmentReceptionistApi,
  branchAdmin: appointmentBranchAdminApi,
  superAdmin: appointmentSuperAdminApi,
};
