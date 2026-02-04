import {
    Appointment,
    AppointmentModalStructureProps,
} from "../../../../../../utils/types/users/IDoctorData.ts";
import { EmptyCalendarIcon } from "../../../../../../utils/types/Appointment/SvgComponents.tsx";
import { useMemo, useState } from "react";
import PatientDetailsShowTable from "./PatientDetailsShowTable.tsx";
import PatientAppointmentTableHeaderDetails from "./PatientAppointmentTableHeaderDetails.tsx";
import AppointmentModalHeader from "./AppointmentModalHeader.tsx";

const AppointmentModalStructure = ({
    handleModalClose,
    schedule,
    loading,
    appointments = [],
    userId,
    onAppointmentsCancelled,
}: AppointmentModalStructureProps) => {
    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort(
            (firstAppointment, secondAppointment) =>
                new Date(firstAppointment.date).getTime() -
                new Date(secondAppointment.date).getTime(),
        );
    }, [appointments]);

    const groupedAppointments = useMemo(() => {
        return sortedAppointments.reduce(
            (groups, appointment) => {
                const date = appointment.date;
                const group = groups.find((g) => g.date === date);
                if (group) {
                    group.appointments.push(appointment);
                } else {
                    groups.push({ date, appointments: [appointment] });
                }
                return groups;
            },
            [] as { date: string; appointments: Appointment[] }[],
        );
    }, [sortedAppointments]);

    const toggleDate = (date: string) => {
        setExpandedDates((prev) =>
            prev.includes(date)
                ? prev.filter((d) => d !== date)
                : [...prev, date],
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
                <AppointmentModalHeader
                    schedule={schedule}
                    handleModalClose={handleModalClose}
                />

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="text-sm text-gray-500">
                                Loading appointments for{" "}
                                {schedule?.branch_center_name}
                            </span>
                        </div>
                    ) : sortedAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3 text-center">
                            <EmptyCalendarIcon className="h-10 w-10 text-gray-300" />
                            <p className="text-sm text-gray-500 max-w-xs">
                                No appointments scheduled yet at{" "}
                                {schedule?.branch_center_name}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedAppointments.map(
                                ({
                                    date,
                                    appointments: appointmentWithGrouped,
                                }) => {
                                    const totalSlots =
                                        appointmentWithGrouped[0]
                                            ?.all_available_slots_for_doctor ||
                                        0;
                                    const bookedCount =
                                        appointmentWithGrouped.length;
                                    const availableSlots =
                                        totalSlots - bookedCount;
                                    return (
                                        <div
                                            key={date}
                                            className="bg-blue-50 rounded-md p-2 shadow-xs border border-blue-100"
                                        >
                                            <PatientAppointmentTableHeaderDetails
                                                date={date}
                                                bookedCount={bookedCount}
                                                availableSlots={availableSlots}
                                                expandedDates={expandedDates}
                                                toggleDate={toggleDate}
                                                schedule={schedule}
                                                userId={userId}
                                                onAppointmentsCancelled={
                                                    onAppointmentsCancelled
                                                }
                                                appointmentsForDate={
                                                    appointmentWithGrouped
                                                }
                                            />
                                            {expandedDates.includes(date) && (
                                                <PatientDetailsShowTable
                                                    appointmentWithGrouped={
                                                        appointmentWithGrouped
                                                    }
                                                />
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleModalClose}
                        className="w-full px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-xs"
                    >
                        Close Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AppointmentModalStructure;
