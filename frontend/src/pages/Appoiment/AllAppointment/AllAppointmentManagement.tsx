import { useState } from "react";
import PatientAppointmentTable from "./PatientAppointmentTable.tsx";

const AllAppointmentManagement: React.FC = () => {
    const [refreshAppointments] = useState(false);

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">All Appointments</h1>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <PatientAppointmentTable
                    refreshAppointments={refreshAppointments}
                />
            </div>
        </div>
    );
};

export default AllAppointmentManagement;
