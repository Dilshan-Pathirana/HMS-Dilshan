import React from "react";
import { useSelector } from "react-redux";

import DoctorScheduleCalendar from "./DoctorScheduleCalendar";
import SuperAdminScheduleCalendar from "./SuperAdminScheduleCalendar";

const ScheduleManagementPage: React.FC = () => {
    const userRole = useSelector((state: any) => state.auth.userRole);

    if (userRole === 1) {
        return <SuperAdminScheduleCalendar />;
    }

    return <DoctorScheduleCalendar />;
};

export default ScheduleManagementPage;
