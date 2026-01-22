import { useSelector } from "react-redux";
import LeaveRequestTable from "./LeaveRequestView/LeaveRequestTable.tsx";
import AdminLeaveRequestTable from "./LeaveRequestView/AdminLeaveRequestTable.tsx";

const LeaveRequestManagement = () => {
    const assignerId = useSelector((state: any) => state.auth.userId);
    const userRole = useSelector((state: any) => state.auth.userRole);

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            {userRole !== 1 && <LeaveRequestTable assignerId={assignerId} />}
            {userRole === 1 && <AdminLeaveRequestTable />}
        </div>
    );
};

export default LeaveRequestManagement;
