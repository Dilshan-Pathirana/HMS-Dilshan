import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/common/Layout/DashboardLayout";
import { SidebarMenu, SuperAdminMenuItems } from "../../../components/common/Layout/SidebarMenu";
import { Calendar, Clock, RefreshCw, AlertCircle, Building2, Stethoscope } from "lucide-react";
import { appointmentSuperAdminApi, AppointmentBooking } from "../../../services/appointmentService";

const SuperAdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const res = await appointmentSuperAdminApi.getAllAppointments();

            setAppointments(res.appointments || []);
            setCount(res.count || 0);
        } catch (e) {
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

    return (
        <DashboardLayout>
            <SidebarMenu items={SuperAdminMenuItems} />

            <div className="p-6 mt-20 ml-[16rem] bg-gray-50 min-h-screen">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">All Appointments</h1>

                    <button
                        onClick={loadAppointments}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border text-red-700 rounded mb-4 flex gap-2">
                        <AlertCircle /> {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow border">
                    <div className="p-4 border-b flex justify-between">
                        <span className="font-semibold">Appointments</span>
                        <span className="text-sm text-gray-500">Total: {count}</span>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center">
                            <RefreshCw className="animate-spin mx-auto" />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Patient</th>
                                    <th className="p-3 text-left">Doctor</th>
                                    <th className="p-3 text-left">Branch</th>
                                    <th className="p-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span>{a.appointment_date}</span>
                                                <span className="text-xs text-gray-500">{a.appointment_time}</span>
                                            </div>
                                        </td>

                                        <td className="p-3">{a.patient_name}</td>
                                        <td className="p-3">{a.doctor_name}</td>
                                        <td className="p-3">{a.branch_name}</td>

                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded ${getStatusColor(a.status)}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminAppointments;
