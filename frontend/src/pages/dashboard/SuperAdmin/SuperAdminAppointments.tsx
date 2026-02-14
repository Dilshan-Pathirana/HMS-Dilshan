import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    Calendar,
    Clock,
    User,
    Building2,
    Stethoscope,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { appointmentSuperAdminApi, AppointmentBooking } from '../../../services/appointmentService';

const SuperAdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await appointmentSuperAdminApi.getAllAppointments();

            if (response.status === 200) {
                setAppointments(response.appointments);
                setCount(response.count);
            } else {
                setError('Failed to load appointments');
            }
        } catch (err) {
            console.error('Error loading appointments:', err);
            setError('An error occurred while fetching appointments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'in_session': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'checked_in': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-800';
            case 'pending': return 'bg-orange-100 text-orange-800';
            case 'refunded': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <SidebarMenu items={SuperAdminMenuItems} />

            <div className="p-6 mt-20 ml-[16rem] mr-[30px] min-h-screen bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
                        <p className="text-gray-500 mt-1">View all patient-doctor appointments across the system</p>
                    </div>

                    <button
                        onClick={loadAppointments}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh List
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Appointment List</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Total: {count}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20 text-gray-500">
                            <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                            <p>Loading all appointments...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No appointments found in the system.
                                            </td>
                                        </tr>
                                    ) : (
                                        appointments.map((apt) => (
                                            <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {apt.appointment_date}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 pl-6">
                                                            <Clock className="w-3 h-3" />
                                                            {apt.appointment_time}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                            {(apt.patient_name || 'U').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{apt.patient_name || 'Unknown Patient'}</div>
                                                            <div className="text-xs text-gray-500 font-mono">#{apt.patient_id?.slice(-6)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900">{apt.doctor_name || 'Unknown Doctor'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900">{apt.branch_name || 'Unknown Branch'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(apt.status)}`}>
                                                        {apt.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(apt.payment_status)}`}>
                                                        {apt.payment_status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminAppointments;
