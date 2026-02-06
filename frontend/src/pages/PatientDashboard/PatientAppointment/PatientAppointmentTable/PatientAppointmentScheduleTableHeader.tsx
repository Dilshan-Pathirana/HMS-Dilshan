import React from "react";

const PatientAppointmentScheduleTableHeader: React.FC = () => {
    return (
        <thead className="bg-gradient-to-r from-primary-500 to-blue-400">
            <tr>
                <th className="p-4 text-left text-white font-semibold">
                    Slot No
                </th>
                <th className="p-4 text-left text-white font-semibold">
                    Doctor
                </th>
                <th className="p-4 text-left text-white font-semibold">
                    Specialization
                </th>
                <th className="p-4 text-left text-white font-semibold">
                    Date & Time
                </th>
                <th className="p-4 text-left text-white font-semibold">
                    Action
                </th>
            </tr>
        </thead>
    );
};

export default PatientAppointmentScheduleTableHeader;
