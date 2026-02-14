import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertCircle, Calendar, Search, Filter, X } from "lucide-react";
import { appointmentSuperAdminApi } from "../../../services/appointmentService";

interface AppointmentData {
    id: string;
    patient_name: string;
    patient_id: string;
    doctor_name: string;
    doctor_id: string;
    branch_name: string;
    branch_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    payment_status: string;
    queue_number?: number;
    created_at?: string;
}

interface Filters {
    search: string;
    doctorId: string;
    branchId: string;
    status: string;
    paymentStatus: string;
    startDate: string;
    endDate: string;
    day: string;
}

interface Branch {
    id: string;
    name: string;
}

interface Doctor {
    doctor_id?: string;
    name: string;
}

const SuperAdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentData[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<Filters>({
        search: '',
        doctorId: '',
        branchId: '',
        status: '',
        paymentStatus: '',
        startDate: '',
        endDate: '',
        day: '',
    });
    const [filtersApplied, setFiltersApplied] = useState(false);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await appointmentSuperAdminApi.getAllAppointments();
            setAppointments(res.appointments || []);
            setCount(res.count || 0);
        } catch (e) {
            console.error("Failed to fetch appointments:", e);
            setError("Failed to fetch appointments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setLoadingBranches(true);
            const response = await appointmentSuperAdminApi.getBranches();
            if (response.status === 200) {
                setBranches(response.branches);
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
        } finally {
            if (showLoading) setLoadingBranches(false);
        }
    }, []);

    const loadDoctors = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setLoadingDoctors(true);
            const response = await appointmentSuperAdminApi.getAllDoctors();
            if (response.status === 200) {
                setDoctors(response.doctors);
            }
        } catch (err) {
            console.error('Failed to load doctors:', err);
        } finally {
            if (showLoading) setLoadingDoctors(false);
        }
    }, []);

    const refreshBranches = useCallback(() => {
        loadBranches(true);
    }, [loadBranches]);

    const refreshDoctors = useCallback(() => {
        loadDoctors(true);
    }, [loadDoctors]);

    const refreshAllData = useCallback(() => {
        loadAppointments();
        loadBranches(true);
        loadDoctors(true);
    }, [loadBranches, loadDoctors]);

    useEffect(() => {
        loadAppointments();
        loadBranches();
        loadDoctors();
    }, [loadBranches, loadDoctors]);

    // Check if any filters are applied
    useEffect(() => {
        const hasFilters =
            filters.search !== '' ||
            filters.doctorId !== '' ||
            filters.branchId !== '' ||
            filters.status !== '' ||
            filters.paymentStatus !== '' ||
            filters.startDate !== '' ||
            filters.endDate !== '' ||
            filters.day !== '';
        setFiltersApplied(hasFilters);
    }, [filters]);

    useEffect(() => {
        let filtered = [...appointments];

        // Apply search filter
        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(
                (apt) =>
                    apt.patient_name?.toLowerCase().includes(term) ||
                    apt.doctor_name?.toLowerCase().includes(term) ||
                    apt.branch_name?.toLowerCase().includes(term)
            );
        }

        // Apply doctor filter
        if (filters.doctorId) {
            filtered = filtered.filter((apt) => apt.doctor_id === filters.doctorId);
        }

        // Apply branch filter
        if (filters.branchId) {
            filtered = filtered.filter((apt) => apt.branch_id === filters.branchId);
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter((apt) => apt.status === filters.status);
        }

        // Apply payment status filter
        if (filters.paymentStatus) {
            filtered = filtered.filter((apt) => apt.payment_status === filters.paymentStatus);
        }

        // Apply day filter
        if (filters.day) {
            filtered = filtered.filter((apt) => apt.appointment_date === filters.day);
        }

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            filtered = filtered.filter((apt) => {
                const aptDate = new Date(apt.appointment_date);
                const startDate = filters.startDate ? new Date(filters.startDate) : null;
                const endDate = filters.endDate ? new Date(filters.endDate) : null;

                if (startDate && aptDate < startDate) return false;
                if (endDate && aptDate > endDate) return false;
                return true;
            });
        }

        setFilteredAppointments(filtered);
    }, [appointments, filters]);

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            doctorId: '',
            branchId: '',
            status: '',
            paymentStatus: '',
            startDate: '',
            endDate: '',
            day: '',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "no_show":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
            case "unpaid":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
            case "refunded":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="p-4">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900">Appointments Management</h1>
                <p className="text-sm text-neutral-600 mt-1">View and manage all appointments across branches</p>
            </div>

            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by patient, doctor, or branch..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Clear All Filters and Refresh */}
                    <div className="flex items-center gap-3">
                        {filtersApplied && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear All
                            </button>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={refreshAllData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-4">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Filter Appointments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Branch Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-neutral-700">Branch</label>
                        <button
                          onClick={refreshBranches}
                          disabled={loadingBranches}
                          className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                          title="Refresh branches"
                        >
                          {loadingBranches ? '⟳' : '↻'}
                        </button>
                      </div>
                      <select
                        value={filters.branchId}
                        onChange={(e) => handleFilterChange('branchId', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                          disabled={loadingDoctors}
                          className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                          title="Refresh doctors"
                        >
                          {loadingDoctors ? '⟳' : '↻'}
                        </button>
                      </div>
                        <select
                            value={filters.doctorId}
                            onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map(doctor => (
                                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                                    Dr. {doctor.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Status</label>
                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">All Payment Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                        </select>
                    </div>

                    {/* Day Filter */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Day</label>
                        <input
                            type="date"
                            value={filters.day}
                            onChange={(e) => handleFilterChange('day', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                placeholder="From"
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                placeholder="To"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-neutral-900">All Appointments</h2>
                        <p className="text-sm text-neutral-600 mt-1">
                            Showing {filteredAppointments.length} of {count} total appointments
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        <span>Total: {count}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-500" />
                        <p className="text-neutral-600">Loading appointments...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                        <p className="text-neutral-600">
                            {filtersApplied
                                ? "No appointments found matching your filters"
                                : "No appointments found"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Branch
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Queue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {filteredAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-neutral-900">
                                                {appt.patient_name || "N/A"}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                ID: {appt.patient_id?.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-neutral-900">
                                                {appt.doctor_name || "N/A"}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                ID: {appt.doctor_id?.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-neutral-900">
                                                {appt.branch_name || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-neutral-900">
                                                {appt.appointment_date || "N/A"}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                {appt.appointment_time || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    appt.status
                                                )}`}
                                            >
                                                {appt.status || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                                                    appt.payment_status
                                                )}`}
                                            >
                                                {appt.payment_status || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            {appt.queue_number || "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminAppointments;
