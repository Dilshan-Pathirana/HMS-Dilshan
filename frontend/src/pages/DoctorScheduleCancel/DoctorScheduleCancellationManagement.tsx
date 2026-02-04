import DoctorScheduleCancellationTable from "./ScheduleCancelView/DoctorScheduleCancellationTable.tsx";

const DoctorScheduleCancellationManagement: React.FC = () => {
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Schedule Cancellation Requests</h1>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <DoctorScheduleCancellationTable />
            </div>
        </div>
    );
};

export default DoctorScheduleCancellationManagement;
