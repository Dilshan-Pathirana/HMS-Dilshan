import { AxiosError } from 'axios';
import api from '../utils/api/axios';

// Create a wrapper around the centralized API client to prepend '/receptionist'
const receptionistApi = {
  get: (url: string, config?: any) => api.get(`/receptionist${url}`, config),
  post: (url: string, data?: any, config?: any) => api.post(`/receptionist${url}`, data, config),
  put: (url: string, data?: any, config?: any) => api.put(`/receptionist${url}`, data, config),
  delete: (url: string, config?: any) => api.delete(`/receptionist${url}`, config),
  // Mocks for interceptors since they are already handled in the base api
  interceptors: {
    request: { use: () => { } },
    response: { use: () => { } }
  }
};

// Types
export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  unique_registration_number?: string;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address?: string;
  nic?: string;
  email?: string;
  blood_type?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  branch_id: number;
  created_at: string;
  updated_at?: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  branch_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_number?: string;
  department?: string;
  reason?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  patient_name?: string;
  patient_phone?: string;
  patient_code?: string;
  doctor_name?: string;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization?: string;
  department?: string;
}

export interface QueueItem {
  id: number;
  patient_id: number;
  doctor_id?: number;
  branch_id: number;
  token_number: number;
  visit_type: 'appointment' | 'walk_in';
  priority: 'normal' | 'priority' | 'emergency';
  department?: string;
  status: 'waiting' | 'in_progress' | 'with_doctor' | 'completed' | 'cancelled';
  patient_name?: string;
  patient_phone?: string;
  patient_code?: string;
  doctor_name?: string;
  created_at: string;
  called_at?: string;
  completed_at?: string;
}

export interface Visit {
  id: number;
  visit_number: string;
  patient_id: number;
  doctor_id?: number;
  branch_id: number;
  visit_type: 'opd' | 'follow_up' | 'walk_in' | 'emergency';
  department?: string;
  reason?: string;
  notes?: string;
  status: 'registered' | 'with_doctor' | 'lab' | 'pharmacy' | 'completed';
  patient_name?: string;
  patient_phone?: string;
  patient_code?: string;
  doctor_name?: string;
  created_at: string;
}

export interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  registeredToday: number;
  completedToday: number;
  currentQueue: number;
  walkInsToday: number;
  upcomingAppointments: Appointment[];
}

export interface QueueStats {
  waiting: number;
  inProgress: number;
  completed: number;
  avgWaitTime: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  employee_id: string;
  branch: string;
  branch_id: number;
  joined_date: string;
  profile_picture?: string;
}

// Service methods
const receptionistService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    try {
      const response: any = await receptionistApi.get('/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
  },

  // Branches
  getBranches: async (): Promise<Array<{ id: string; name: string }>> => {
    try {
      const response: any = await receptionistApi.get('/branches');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
  },

  // Patients
  getPatients: async (page = 1, perPage = 20) => {
    const response: any = await receptionistApi.get('/patients', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  searchPatients: async (search: string, branchId?: string, city?: string): Promise<Patient[]> => {
    const response: any = await receptionistApi.get('/patients/search', {
      params: {
        search,
        branch_id: branchId || undefined,
        city: city || undefined,
      },
    });
    return response.data || [];
  },

  registerPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
    const response: any = await receptionistApi.post('/patients', patientData);
    return response.data;
  },

  getPatientDetails: async (patientId: number) => {
    const response: any = await receptionistApi.get(`/patients/${patientId}`);
    return response.data;
  },

  updatePatient: async (patientId: number, data: Partial<Patient>): Promise<Patient> => {
    const response: any = await receptionistApi.put(`/patients/${patientId}`, data);
    return response.data;
  },

  // Appointments
  getAppointments: async (date?: string, status?: string, page = 1, perPage = 20) => {
    const response: any = await receptionistApi.get('/appointments', {
      params: { date, status, page, per_page: perPage },
    });
    return response.data;
  },

  createAppointment: async (appointmentData: {
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    department?: string;
    reason?: string;
    notes?: string;
  }): Promise<Appointment> => {
    const response: any = await receptionistApi.post('/appointments', appointmentData);
    return response.data;
  },

  getAppointmentDetails: async (appointmentId: number): Promise<Appointment> => {
    const response: any = await receptionistApi.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  updateAppointment: async (appointmentId: number, data: Partial<Appointment>): Promise<void> => {
    await receptionistApi.put(`/appointments/${appointmentId}`, data);
  },

  cancelAppointment: async (appointmentId: number, reason: string): Promise<void> => {
    await receptionistApi.post(`/appointments/${appointmentId}/cancel`, { reason });
  },

  rescheduleAppointment: async (
    appointmentId: number,
    data: { appointment_date: string; appointment_time: string; reason?: string }
  ): Promise<void> => {
    await receptionistApi.post(`/appointments/${appointmentId}/reschedule`, data);
  },

  // Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    const response: any = await receptionistApi.get('/doctors');
    return response.data || [];
  },

  getDoctorAvailability: async (doctorId: number, date: string) => {
    const response: any = await receptionistApi.get(`/doctors/${doctorId}/availability`, {
      params: { date },
    });
    return response.data;
  },

  getDepartments: async (): Promise<Department[]> => {
    const response: any = await receptionistApi.get('/departments');
    return response.data || [];
  },

  // Queue
  getQueue: async (): Promise<QueueItem[]> => {
    const response: any = await receptionistApi.get('/queue');
    return response.data || [];
  },

  issueToken: async (data: {
    patient_id: number;
    doctor_id?: number;
    visit_type: 'appointment' | 'walk_in';
    priority?: 'normal' | 'priority' | 'emergency';
    department?: string;
  }): Promise<QueueItem> => {
    const response: any = await receptionistApi.post('/queue/issue-token', data);
    return response.data;
  },

  updateQueueStatus: async (
    queueId: number,
    status: 'waiting' | 'in_progress' | 'with_doctor' | 'completed' | 'cancelled'
  ): Promise<void> => {
    await receptionistApi.put(`/queue/${queueId}/status`, { status });
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const response: any = await receptionistApi.get('/queue/stats');
    return response.data;
  },

  // Visits
  getVisits: async (date?: string, page = 1, perPage = 20) => {
    const response: any = await receptionistApi.get('/visits', {
      params: { date, page, per_page: perPage },
    });
    return response.data;
  },

  createVisit: async (visitData: {
    patient_id: number;
    doctor_id?: number;
    visit_type: 'opd' | 'follow_up' | 'walk_in' | 'emergency';
    department?: string;
    reason?: string;
    notes?: string;
  }): Promise<Visit> => {
    const response: any = await receptionistApi.post('/visits', visitData);
    return response.data;
  },

  getVisitDetails: async (visitId: number): Promise<Visit> => {
    const response: any = await receptionistApi.get(`/visits/${visitId}`);
    return response.data;
  },

  updateVisit: async (visitId: number, data: Partial<Visit>): Promise<void> => {
    await receptionistApi.put(`/visits/${visitId}`, data);
  },

  printVisitSlip: async (visitId: number) => {
    const response: any = await receptionistApi.get(`/visits/${visitId}/print-slip`);
    return response.data;
  },

  // Reports
  getDailyRegistrationsReport: async (date?: string) => {
    const response: any = await receptionistApi.get('/reports/daily-registrations', {
      params: { date },
    });
    return response.data;
  },

  getAppointmentsReport: async (date?: string) => {
    const response: any = await receptionistApi.get('/reports/appointments', {
      params: { date },
    });
    return response.data;
  },

  getNoShowsReport: async (startDate?: string, endDate?: string) => {
    const response: any = await receptionistApi.get('/reports/no-shows', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getWalkInsReport: async (date?: string) => {
    const response: any = await receptionistApi.get('/reports/walk-ins', {
      params: { date },
    });
    return response.data;
  },

  // Profile
  getProfile: async (): Promise<Profile> => {
    const response: any = await receptionistApi.get('/profile');
    return response.data;
  },

  updateProfile: async (data: { phone?: string; address?: string }): Promise<Profile> => {
    const response: any = await receptionistApi.put('/profile', data);
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<void> => {
    await receptionistApi.put('/profile/password', data);
  },
};

export default receptionistService;
