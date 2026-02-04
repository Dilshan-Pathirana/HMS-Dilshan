import { useSelector } from "react-redux";
import HrManagementShiftTable from "./HRShiftView/HrManagementShiftTable.tsx";
import {RootState} from "../../../store.tsx";

const HRShiftManagement = () => {
    const userRole = useSelector((state: RootState) => state.auth.userRole);

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Shift Management</h1>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <HrManagementShiftTable userRole={userRole} />
            </div>
        </div>
    );
};

export default HRShiftManagement;
