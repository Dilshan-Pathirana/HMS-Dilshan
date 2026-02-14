import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/common/Layout/DashboardLayout";
import { SidebarMenu, SuperAdminMenuItems } from "../../../components/common/Layout/SidebarMenu";
import { RefreshCw, AlertCircle, Calendar, Search, Filter } from "lucide-react";
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

const SuperAdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentData[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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

    useEffect(() => {
        loadAppointments();
    }, []);

    useEffect(() => {
        let filtered = [...appointments];

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (apt) =>
                    apt.patient_name?.toLowerCase().includes(term) ||
                    apt.doctor_name?.toLowerCase().includes(term) ||
                    apt.branch_name?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((apt) => apt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
    }, [appointments, searchTerm, statusFilter]);

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
        <DashboardLayout>
            <SidebarMenu items={SuperAdminMenuItems} />

            <div className="p-4 sm:p-6 sm:ml-64">
                <div className="mt-14">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-neutral-900">Appointments Management</h1>
                        <p className="text-sm text-neutral-600 mt-1">View and manage all appointments across branches</p>
                    </div>

                    {/* Filters and Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by patient, doctor, or branch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-3">
                                <Filter className="w-5 h-5 text-neutral-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_show">No Show</option>
                                </select>

                                {/* Refresh Button */}
                                <button
                                    onClick={loadAppointments}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
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
                                    {searchTerm || statusFilter !== "all"
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
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminAppointments;
