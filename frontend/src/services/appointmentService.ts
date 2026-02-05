import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instances for different route prefixes
const publicApi = axios.create({
  baseURL: `${API_BASE_URL}/api/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const patientApi = axios.create({
  baseURL: `${API_BASE_URL}/api/patient/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const doctorApi = axios.create({
  baseURL: `${API_BASE_URL}/api/doctor/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const receptionistApi = axios.create({
  baseURL: `${API_BASE_URL}/api/receptionist/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const branchAdminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/branch-admin/appointments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const superAdminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/super-admin/appointments`,
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
      console.error('Appointment API Error:', error);
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
    return patientApi.post('/book', data);
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
    return patientApi.post(`/${bookingId}/confirm-payment`, data);
  },

  // Get patient's appointments
  getMyAppointments: async (params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[] }> => {
    return patientApi.get('/my-appointments', { params });
  },

  // Get appointment details
  getAppointmentDetails: async (bookingId: string): Promise<{ status: number; appointment: AppointmentBooking }> => {
    return patientApi.get(`/${bookingId}`);
  },

  // Cancel appointment
  cancelAppointment: async (
    bookingId: string,
    reason: string,
    confirmed: boolean = false
  ): Promise<{ status: number; message: string; refund_eligible?: boolean }> => {
    return patientApi.post(`/${bookingId}/cancel`, { reason, confirmed });
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
    return patientApi.get(`/${bookingId}/reschedule-eligibility`);
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
    return patientApi.post(`/${bookingId}/reschedule`, data);
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
    return doctorApi.get('/', { params });
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
    return doctorApi.get('/today-queue');
  },

  // Get statistics
  getStatistics: async (): Promise<{ status: number; statistics: AppointmentStatistics }> => {
    return doctorApi.get('/statistics');
  },

  // Check in patient
  checkInPatient: async (bookingId: string): Promise<{ status: number; message: string }> => {
    return doctorApi.post(`/${bookingId}/check-in`);
  },

  // Start session
  startSession: async (bookingId: string): Promise<{ status: number; message: string }> => {
    return doctorApi.post(`/${bookingId}/start-session`);
  },

  // Complete consultation
  completeConsultation: async (
    bookingId: string,
    data?: { notes?: string }
  ): Promise<{ status: number; message: string }> => {
    return doctorApi.post(`/${bookingId}/complete`, data);
  },

  // Mark no-show
  markNoShow: async (bookingId: string): Promise<{ status: number; message: string }> => {
    return doctorApi.post(`/${bookingId}/no-show`);
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
    return receptionistApi.post('/walk-in', data);
  },

  // Get appointments
  getAppointments: async (params?: {
    date?: string;
    doctor_id?: string;
    status?: string;
  }): Promise<{ status: number; appointments: AppointmentBooking[] }> => {
    return receptionistApi.get('/', { params });
  },

  // Search patients
  searchPatients: async (search: string): Promise<{ status: number; patients: any[] }> => {
    return receptionistApi.get('/patients/search', { params: { search } });
  },

  // Get available doctors
  getAvailableDoctors: async (): Promise<{ status: number; doctors: Doctor[] }> => {
    return receptionistApi.get('/doctors/available');
  },

  // Check in patient
  checkInPatient: async (bookingId: string): Promise<{ status: number; message: string }> => {
    return receptionistApi.post(`/${bookingId}/check-in`);
  },

  // Cancel appointment
  cancelAppointment: async (bookingId: string, reason: string): Promise<{ status: number; message: string }> => {
    return receptionistApi.post(`/${bookingId}/cancel`, { reason });
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
    return receptionistApi.post(`/${bookingId}/payment`, data);
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
    return branchAdminApi.get('/', { params });
  },

  // Get statistics
  getStatistics: async (): Promise<{ status: number; statistics: AppointmentStatistics }> => {
    return branchAdminApi.get('/statistics');
  },

  // Get doctors in branch
  getDoctors: async (): Promise<{ status: number; doctors: Doctor[] }> => {
    return branchAdminApi.get('/doctors');
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
    return branchAdminApi.put(`/${bookingId}`, data);
  },

  // Cancel appointment
  cancelAppointment: async (
    bookingId: string, 
    reason: string, 
    forDoctorRequest?: boolean
  ): Promise<{ status: number; message: string; allows_patient_reschedule?: boolean }> => {
    return branchAdminApi.post(`/${bookingId}/cancel`, { reason, for_doctor_request: forDoctorRequest });
  },

  // Get single appointment details
  getAppointmentDetails: async (bookingId: string): Promise<{ status: number; appointment: any }> => {
    return branchAdminApi.get(`/${bookingId}/details`);
  },

  // Get specializations available in branch
  getSpecializations: async (): Promise<{ status: number; specializations: string[] }> => {
    return branchAdminApi.get('/specializations');
  },

  // Search patients for booking
  searchPatients: async (query: string): Promise<{ status: number; patients: PatientSearchResult[] }> => {
    return branchAdminApi.get('/patients/search', { params: { q: query } });
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
    return branchAdminApi.post(`/${bookingId}/payment`, data);
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
    return branchAdminApi.get('/available-slots', { params: { doctor_id: doctorId, date } });
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
    return branchAdminApi.post('/create', data);
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
    return branchAdminApi.post('/register-patient', data);
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
    return branchAdminApi.post('/create-with-patient', data);
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
    return branchAdminApi.post(`/${bookingId}/reschedule`, data);
  },

  // Update appointment status
  updateStatus: async (
    bookingId: string,
    status: string,
    reason: string
  ): Promise<{ status: number; message: string; new_status: string }> => {
    return branchAdminApi.post(`/${bookingId}/status`, { status, reason });
  },

  // Get appointment logs
  getAppointmentLogs: async (bookingId: string): Promise<{ status: number; logs: AppointmentLog[] }> => {
    return branchAdminApi.get(`/${bookingId}/logs`);
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
    return branchAdminApi.get('/audit-logs', { params });
  },

  // Get settings
  getSettings: async (): Promise<{ status: number; settings: AppointmentSettings }> => {
    return branchAdminApi.get('/settings');
  },

  // Update settings
  updateSettings: async (
    settings: Partial<AppointmentSettings>
  ): Promise<{ status: number; message: string; settings: AppointmentSettings }> => {
    return branchAdminApi.put('/settings', settings);
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
