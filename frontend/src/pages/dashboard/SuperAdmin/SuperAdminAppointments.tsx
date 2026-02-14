import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    Building2,
    User,
    Stethoscope,
    RefreshCw,
    Eye
} from 'lucide-react';
import { appointmentSuperAdminApi, AppointmentBooking } from '../../../services/appointmentService';

const SuperAdminAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAppointments, setTotalAppointments] = useState(0);

    const loadAppointments = async (page: number = 1) => {
        try {
            setLoading(true);
            // Try raw endpoint first for debugging
            const rawResponse = await appointmentSuperAdminApi.getAllAppointments({
                page,
                per_page: 50
            });

            console.log("Raw appointments response:", rawResponse);

            if (rawResponse.status === 200) {
                setAppointments(rawResponse.appointments || []);
                setTotalPages(rawResponse.pagination?.total_pages || 1);
                setTotalAppointments(rawResponse.pagination?.total || 0);
            } else {
                setAppointments([]);
                setTotalPages(1);
                setTotalAppointments(0);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            setAppointments([]);
            setTotalPages(1);
            setTotalAppointments(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments(currentPage);
    }, [currentPage]);

    const handleRefresh = () => {
        loadAppointments(currentPage);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <DashboardLayout>
            <SidebarMenu items={SuperAdminMenuItems} />

            <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">All Appointments</h1>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-lg">Loading appointments...</span>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-gray-600">
                            Total Appointments: {totalAppointments}
                        </div>

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
                                            <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {appointments.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                                                    No appointments found
                                                </td>
                                            </tr>
                                        ) : (
                                            appointments.map((apt) => (
                                                <tr key={apt.id} className="hover:bg-neutral-50">
                                                    {/* Branch Name */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                            <span className="text-sm font-medium truncate max-w-[120px]" title={apt.branch_name || apt.branch_id}>
                                                                {apt.branch_name || `Branch ${apt.branch_id?.slice(-6)}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Appointment ID */}
                                                    <td className="px-3 py-3">
                                                        <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                            #{apt.id?.slice(-6)}
                                                        </span>
                                                    </td>
                                                    {/* Patient Name */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                            <span className="font-medium text-sm truncate max-w-[120px]" title={apt.patient_name || apt.patient_id}>
                                                                {apt.patient_name || `Patient ${apt.patient_id?.slice(-6)}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Doctor Name */}
                                                    <td className="px-3 py-3">
                                                        <span className="text-sm font-medium truncate max-w-[120px] block" title={apt.doctor_name || apt.doctor_id}>
                                                            {apt.doctor_name || `Doctor ${apt.doctor_id?.slice(-6)}`}
                                                        </span>
                                                    </td>
                                                    {/* Specialization */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <Stethoscope className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                                            <span className="text-xs text-neutral-600 truncate max-w-[100px]" title={apt.doctor_specialization || 'General'}>
                                                                {apt.doctor_specialization || 'General'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Date */}
                                                    <td className="px-3 py-3">
                                                        <span className="text-sm text-neutral-900">
                                                            {apt.appointment_date}
                                                        </span>
                                                    </td>
                                                    {/* Time */}
                                                    <td className="px-3 py-3">
                                                        <span className="text-sm text-neutral-600">
                                                            {apt.appointment_time}
                                                        </span>
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                            apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            apt.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                                                            apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {apt.status}
                                                        </span>
                                                    </td>
                                                    {/* Payment Status */}
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                            apt.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            apt.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {apt.payment_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminAppointments;
