import React, { useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import NurseNavbar from "./NurseNavbar";
import NurseSidebar from "./NurseSidebar";
import NurseDashboardMain from "../../pages/dashboard/Nurse/NurseDashboardMain";
import NurseProfile from "../../pages/dashboard/Nurse/NurseProfile";
import NursePatients from "../../pages/dashboard/Nurse/NursePatients";
import NurseVitalSigns from "../../pages/dashboard/Nurse/NurseVitalSigns";
import NurseMedication from "../../pages/dashboard/Nurse/NurseMedication";
import NurseTasks from "../../pages/dashboard/Nurse/NurseTasks";
import NurseHandover from "../../pages/dashboard/Nurse/NurseHandover";
import NurseFeedback from "../../pages/dashboard/Nurse/NurseFeedback";
import PatientSessionsList from "../../pages/dashboard/PatientSessions/PatientSessionsList";
import PatientProfilesList from "../../pages/dashboard/PatientProfiles/PatientProfilesList";
import PatientProfileDetails from "../../pages/dashboard/PatientProfiles/PatientProfileDetails";
import PatientSessionDetails from "../../pages/dashboard/PatientSessions/PatientSessionDetails";

// HR Module imports
import NurseHRDashboard from "../../pages/dashboard/Nurse/NurseHR/NurseHRDashboard";
import NurseSchedules from "../../pages/dashboard/Nurse/NurseHR/NurseSchedules";
import NurseScheduleRequests from "../../pages/dashboard/Nurse/NurseHR/NurseScheduleRequests";
import NurseOvertimeSalary from "../../pages/dashboard/Nurse/NurseHR/NurseOvertimeSalary";
import NursePayslips from "../../pages/dashboard/Nurse/NurseHR/NursePayslips";
import NurseServiceLetters from "../../pages/dashboard/Nurse/NurseHR/NurseServiceLetters";
import NursePolicies from "../../pages/dashboard/Nurse/NurseHR/NursePolicies";

const NurseDashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <NurseNavbar toggleSidebar={toggleSidebar} />
            <NurseSidebar isOpenSidebarMenu={isSidebarOpen} />

            <Routes>
                <Route path="/" element={<NurseDashboardMain />} />
                <Route path="/dashboard" element={<NurseDashboardMain />} />
                <Route path="/profile" element={<NurseProfile />} />
                <Route path="/patients" element={<NursePatients />} />
                <Route path="/vital-signs" element={<NurseVitalSigns />} />
                <Route path="/medication" element={<NurseMedication />} />
                <Route path="/tasks" element={<NurseTasks />} />
                <Route path="/handover" element={<NurseHandover />} />
                <Route path="/feedback" element={<NurseFeedback />} />
                <Route path="/patient-sessions" element={<PatientSessionsList />} />
                <Route path="/patient-sessions/:sessionId" element={<PatientSessionDetails />} />
                <Route path="/patient-profiles" element={<PatientProfilesList />} />
                <Route path="/patient-profiles/:patientId" element={<PatientProfileDetails />} />

                {/* HR Module Routes */}
                <Route path="/hr" element={<NurseHRDashboard />} />
                <Route path="/hr/schedules" element={<NurseSchedules />} />
                <Route path="/hr/schedule-requests" element={<NurseScheduleRequests />} />
                <Route path="/hr/overtime-salary" element={<NurseOvertimeSalary />} />
                <Route path="/hr/payslips" element={<NursePayslips />} />
                <Route path="/hr/service-letters" element={<NurseServiceLetters />} />
                <Route path="/hr/policies" element={<NursePolicies />} />

                <Route path="*" element={<Navigate to="/nurse-dashboard" replace />} />
            </Routes>
        </>
    );
};

export default NurseDashboardLayout;
