import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/common/Layout/DashboardLayout";
import { SidebarMenu, SuperAdminMenuItems } from "../../../components/common/Layout/SidebarMenu";
import { RefreshCw, AlertCircle } from "lucide-react";
import api from "../../../utils/api/axios";

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

const SuperAdminAppointmentList: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get("/super-admin/appointment-list");
            setAppointments(res.data.appointments || []);
            setCount(res.data.count || 0);
        } catch {
            setError("Failed to fetch appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-800";
            case "cancelled": return "bg-red-100 text-red-800";
            case "pending_payment": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "bg-green-100 text-green-800";
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "failed": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <DashboardLayout>
            <SidebarMenu items={SuperAdminMenuItems} />

            <div className="p-6 mt-20 ml-[16rem] bg-gray-50 min-h-screen">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">Appointment List</h1>

                    <button
                        onClick={loadAppointments}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b">
                        <p className="text-sm text-gray-600">
                            Total Appointments: {count}
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p>Loading appointments...</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No appointments found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Patient
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Doctor
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Branch
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Queue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {appointments.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appt.patient_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {appt.patient_id}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appt.doctor_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {appt.doctor_id}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {appt.branch_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {appt.appointment_date}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {appt.appointment_time}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(appt.payment_status)}`}>
                                                    {appt.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
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
        </DashboardLayout>
    );
};

export default SuperAdminAppointmentList;
