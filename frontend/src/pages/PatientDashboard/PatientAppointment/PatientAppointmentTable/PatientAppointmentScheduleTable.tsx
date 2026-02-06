import React from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { IPatientAppointmentScheduleProp } from "../../../../utils/types/Appointment/IAppointment.ts";
import PatientAppointmentScheduleTableHeader from "./PatientAppointmentScheduleTableHeader.tsx";
import { useNavigate } from "react-router-dom";
import { splitAndLimitItems } from "../../../../utils/helpers/doctorUtils";
import ShowMoreTooltip from "../../../../utils/components/ShowMoreTooltip";

const PatientAppointmentScheduleTable: React.FC<
    IPatientAppointmentScheduleProp
> = ({ filteredAppointments, visibleAppointments }) => {
    const navigate = useNavigate();

    return (
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
            <PatientAppointmentScheduleTableHeader />
            <tbody>
                {filteredAppointments
                    .slice(0, visibleAppointments)
                    .map((appointment, index) => {
                        const appointmentDate = new Date(appointment.date);
                        const currentDate = new Date();
                        const twoDaysFromNow = new Date();
                        twoDaysFromNow.setDate(currentDate.getDate() + 2);
                        const isDateChangeable =
                            appointmentDate > twoDaysFromNow;

                        return (
                            <tr
                                key={index}
                                className="border-b hover:bg-neutral-50 transition-colors duration-200"
                            >
                                <td className="p-4 font-medium text-neutral-700">
                                    #{appointment.slot}
                                </td>
                                <td className="p-4 text-primary-500 font-medium text-sm">
                                    Dr. {appointment.doctor_first_name}{" "}
                                    {appointment.doctor_last_name}
                                </td>
                                <td className="p-4 text-neutral-600 text-sm font-medium relative">
                                    {(() => {
                                        const {
                                            visible,
                                            hiddenItems,
                                            hiddenCount,
                                        } = splitAndLimitItems(
                                            appointment.areas_of_specialization ||
                                                "",
                                            2,
                                        );
                                        return (
                                            <ShowMoreTooltip
                                                visibleText={visible}
                                                hiddenItems={hiddenItems}
                                                hiddenCount={hiddenCount}
                                                uniqueKey={`spec-${appointment.doctor_first_name}-${appointment.doctor_last_name}-${index}`}
                                                containerClassName="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 text-xs font-medium rounded-full shadow-sm break-words whitespace-normal max-w-full"
                                                tooltipClassName="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white border border-neutral-200 rounded-md shadow-xl p-3 z-[9999] min-w-max max-w-xs"
                                            />
                                        );
                                    })()}
                                </td>
                                <td className="p-4 flex items-center gap-3 text-neutral-600 text-sm">
                                    <FaCalendarAlt className="text-primary-500" />
                                    {appointmentDate.toLocaleDateString(
                                        "en-US",
                                        {
                                            timeZone: "UTC",
                                            weekday: "short",
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        },
                                    )}
                                </td>
                                <td>
                                    <button
                                        disabled={!isDateChangeable}
                                        className={`${
                                            isDateChangeable
                                                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-primary-500 hover:to-blue-700"
                                                : "bg-gray-400 cursor-not-allowed"
                                        } text-white px-3 py-2 rounded text-xs transition duration-200 flex items-center gap-1 m-1`}
                                        onClick={() =>
                                            navigate(
                                                "/patient-appointment-date",
                                                { state: { appointment } },
                                            )
                                        }
                                    >
                                        <FaCalendarAlt className="text-xs" />
                                        Change Date
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );
};

export default PatientAppointmentScheduleTable;
