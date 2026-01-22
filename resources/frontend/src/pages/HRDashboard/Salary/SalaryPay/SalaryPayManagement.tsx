import StaffSalaryPayTable from "./SalaryPayView/StaffSalaryPayTable.tsx";


const SalaryPayManagement: React.FC = () => {

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Salary Payment Management</h1>

            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <StaffSalaryPayTable/>
            </div>
        </div>
    );
};

export default SalaryPayManagement;
