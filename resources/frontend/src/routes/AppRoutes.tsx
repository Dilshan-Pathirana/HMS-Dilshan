import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout.tsx";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
import PharmacyDashboardLayout from "../layout/pharmacy/PharmacyDashboardLayout.tsx";
import POSDashboardLayout from "../layout/pharmacyPOS/POSDashboardLayout.tsx";
import HRDashboardLayout from "../layout/Hr/HRDashboardLayout.tsx";
import Dashboard from "../pages/UserWeb/Dashboard.tsx";
import LoginPage from "../pages/Login/LoginPage.tsx";
import WebDoctorScheduleDetails from "../pages/UserWeb/AppointmentSchedule/WebDoctorSchedule/WebDoctorScheduleDetails.tsx";
import WhyChooseUs from "../pages/UserWeb/WhyChooseUs.tsx";
import About from "../pages/UserWeb/About.tsx";
import SignupPage from "../pages/Login/SignupPage.tsx";
import Mission from "../pages/UserWeb/About/Mission/Mission.tsx";
import BoneJointDisorders from "../pages/UserWeb/Treatments/BoneJointDisorders.tsx";
import FertilityProblems from "../pages/UserWeb/Treatments/FertilityProblems.tsx";
import GastrointestinalDisorders from "../pages/UserWeb/Treatments/GastrointestinalDisorders.tsx";
import HormonalDisorders from "../pages/UserWeb/Treatments/HormonalDisorders.tsx";
import PsychiatricDisorders from "../pages/UserWeb/Treatments/PsychiatricDisorders.tsx";
import RespiratoryDisorders from "../pages/UserWeb/Treatments/RespiratoryDisorders.tsx";
import SkinHairDisorders from "../pages/UserWeb/Treatments/SkinHairDisorders.tsx";
import VascularDisorders from "../pages/UserWeb/Treatments/VascularDisorders.tsx";
import PrivacyPolicy from "../pages/UserWeb/PrivacyPolicy.tsx";
import PatientDashboard from "../pages/PatientDashboard/PatientDashboard.tsx";
import PatientDashboardNew from "../pages/PatientDashboard/PatientDashboardNew.tsx";
import DoctorScheduleDetails from "../pages/UserWeb/AppointmentSchedule/DoctorScheduleDetails.tsx";
import ForgotPassword from "../pages/UserWeb/ForgotPassword.tsx";
import CartComingSoon from "../pages/UserWeb/CartComingSoon.tsx";
import PatientAppoinmentChange
    from "../pages/PatientDashboard/PatientAppointment/PatientAppointmentTable/PatientAppoinmentChange.tsx";
import DoctorDashboard from "../pages/DoctorDashboard/DoctorDashboard.tsx";
import AllDoctorRelatedAppointments from "../pages/dashboard/Doctor/DoctorAppointment/AllDoctorRelatedAppointments.tsx";
import CreateQuestions from "../pages/dashboard/Doctor/Patient/CreateQuestions.tsx";
import GetDoctorQuestions from "../pages/dashboard/Doctor/Patient/GetDoctorQuestions.tsx";
import DoctorScheduleCalendar from "../pages/dashboard/Doctor/DoctorAppointment/DoctorScheduleCalendar.tsx";
import AppointmentBookingTerms from "../pages/UserWeb/AppointmentBookingTerms .tsx";
import GetDoctorSessions from "../pages/DoctorDashboard/DoctorSessions/GetDoctorSessions.tsx";
import AppointmentConfirmation from "../pages/UserWeb/AppointmentConfirmation.tsx";
import AppointmentCancelled from "../pages/UserWeb/AppointmentCancelled.tsx";
import BranchDashboardSimple from "../pages/BranchDashboard/BranchDashboardSimple.tsx";
import BranchPharmacies from "../pages/BranchDashboard/BranchPharmacies.tsx";
import BranchInventory from "../pages/BranchDashboard/BranchInventory.tsx";
import BranchStaff from "../pages/BranchDashboard/BranchStaff.tsx";
import BranchTransactions from "../pages/BranchDashboard/BranchTransactions.tsx";
import { BranchAdminDashboard } from "../pages/dashboard/BranchAdmin/BranchAdminDashboard.tsx";
import { BranchAdminProfile } from "../pages/dashboard/BranchAdmin/BranchAdminProfile.tsx";
import { BranchAdminDoctorSchedules } from "../pages/dashboard/BranchAdmin/BranchAdminDoctorSchedules.tsx";
import { BranchAdminPurchaseRequests } from "../pages/dashboard/BranchAdmin/BranchAdminPurchaseRequests.tsx";
import { 
    BranchAdminRequests,
    BranchAdminEODReports,
    BranchAdminCashEntries,
    BranchAdminScheduleRequests,
    BranchAdminModificationRequests
} from "../pages/dashboard/BranchAdmin/Requests";
import { 
    StaffManagementDashboard,
    StaffProfiles,
    AddStaff,
    StaffScheduling,
    // LeaveManagement, AttendanceMonitoring, PayrollManagement, StaffReports - Redirected to HRM module
    TrainingDevelopment,
    ComplianceLegal,
    StaffCommunication,
    EmployeeRecords,
    StaffFeedback,
} from "../pages/dashboard/BranchAdmin/StaffManagement";
import { 
    SuperAdminStaffDashboard,
    SuperAdminStaffScheduling
} from "../pages/dashboard/SuperAdmin/StaffManagement";
import ShiftManagement from "../pages/dashboard/Users/ShiftManagement/ShiftManagementNew.tsx";
// Old appointments import replaced with new appointment booking module
// import { BranchAdminAppointments } from "../pages/dashboard/BranchAdmin/BranchAdminAppointments.tsx";
// import BranchAdminAppointments from "../pages/BranchDashboard/Appointments/BranchAdminAppointments.tsx";
import BranchAdminAppointments from "../pages/BranchDashboard/Appointments/BranchAdminAppointmentsNew.tsx";
import { BranchAdminReports } from "../pages/dashboard/BranchAdmin/BranchAdminReports.tsx";
import { BranchAdminAnalytics } from "../pages/dashboard/BranchAdmin/BranchAdminAnalytics.tsx";
// Medical Insights Module
import { 
    MedicalInsightsPage, 
    PostDetailPage, 
    CreatePostPage, 
    DoctorPostsPage 
} from "../pages/MedicalInsights";
import { BranchAdminSettings } from "../pages/dashboard/BranchAdmin/BranchAdminSettings.tsx";
import { BranchAdminFeedbacks } from "../pages/dashboard/BranchAdmin/BranchAdminFeedbacks.tsx";
import { SuperAdminFeedbacks } from "../pages/dashboard/SuperAdmin/SuperAdminFeedbacks.tsx";
import SuperAdminChatbotManagement from "../pages/dashboard/SuperAdmin/SuperAdminChatbotManagement.tsx";
import { SuperAdminReports } from "../pages/dashboard/SuperAdmin/SuperAdminReports.tsx";
import SuperAdminAppointments from "../pages/dashboard/SuperAdmin/SuperAdminAppointments.tsx";
import NurseDashboardLayout from "../layout/nurse/NurseDashboardLayout";
import { ITAssistantDashboard } from "../pages/dashboard/ITAssistant/ITAssistantDashboard.tsx";
import ReceptionistDashboard from "../pages/dashboard/Receptionist/ReceptionistDashboard.tsx";
import DoctorDashboardNew from "../pages/DoctorDashboard/DoctorDashboardNew.tsx";
// HRM Module Imports
import {
    SuperAdminHRMDashboard,
    SuperAdminPayrollManagement,
    HRMPolicies,
    SalaryStructures,
    EPFETFConfig,
    LeaveTypes,
    ShiftTemplates,
    PayrollConfig,
    HRMReports,
    HRMAuditLogs,
    BranchAdminHRMDashboard,
    BranchHRMStaff,
    BranchLeaveApprovals,
    BranchPayrollSummary,
    BranchAttendance,
    BranchOvertime,
    BranchHRMReports,
    BranchHRMAuditLogs,
    BranchServiceLetters,
    EmployeeHRMDashboard,
    EmployeeProfile,
    EmployeeLeaveRequest,
    EmployeePayslips,
    EmployeeShifts,
    EmployeeOvertime,
    EmployeeScheduleAcknowledgment
} from "../pages/dashboard/HRM";


const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Public doctor search page - anyone can search doctors */}
            <Route
                path="/doctor-schedule"
                element={<WebDoctorScheduleDetails />}
            />
            <Route path="/why-choose-us" element={<WhyChooseUs />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/about-us/mission" element={<Mission />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/appointment-booking-terms" element={<AppointmentBookingTerms />} />
            <Route
                path="/specialised-treatments/bone-joint-disorders"
                element={<BoneJointDisorders />}
            />
            <Route
                path="/specialised-treatments/fertility-problems"
                element={<FertilityProblems />}
            />
            <Route
                path="/specialised-treatments/gastrointestinal-disorders"
                element={<GastrointestinalDisorders />}
            />
            <Route
                path="/specialised-treatments/hormonal-disorders"
                element={<HormonalDisorders />}
            />
            <Route
                path="/specialised-treatments/psychiatric-disorders"
                element={<PsychiatricDisorders />}
            />
            <Route
                path="/specialised-treatments/respiratory-disorders"
                element={<RespiratoryDisorders />}
            />
            <Route
                path="/specialised-treatments/skinHair-disorders"
                element={<SkinHairDisorders />}
            />
            <Route
                path="/specialised-treatments/vascular-disorders"
                element={<VascularDisorders />}
            />
            {/* Protected booking page - requires login */}
            <Route
                path="/doctor-schedule/doctor-schedule-details"
                element={
                    <ProtectedRoute redirectTo="/login">
                        <DoctorScheduleDetails />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/patient-appointment-date"
                element={<PatientAppoinmentChange />}
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/appointment-confirmation/:orderId" element={<AppointmentConfirmation />} />
            <Route path="/appointment-cancelled/:orderId" element={<AppointmentCancelled />} />
            
            {/* Medical Insights Module - Public Routes */}
            <Route path="/medical-insights" element={<MedicalInsightsPage />} />
            <Route path="/medical-insights/:slug" element={<PostDetailPage />} />
            
            {/* Shopping Cart - Coming Soon */}
            <Route path="/shop/cart" element={<CartComingSoon />} />
            
            <Route
                path="/branch/:id"
                element={
                    <ProtectedRoute>
                        <BranchDashboardSimple />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch/:id/pharmacies"
                element={
                    <ProtectedRoute>
                        <BranchPharmacies />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch/:id/inventory"
                element={
                    <ProtectedRoute>
                        <BranchInventory />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch/:id/staff"
                element={
                    <ProtectedRoute>
                        <BranchStaff />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch/:id/transactions"
                element={
                    <ProtectedRoute>
                        <BranchTransactions />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/dashboard"
                element={
                    <ProtectedRoute>
                        <BranchAdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/profile"
                element={
                    <ProtectedRoute>
                        <BranchAdminProfile />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/doctor-schedules"
                element={
                    <ProtectedRoute>
                        <BranchAdminDoctorSchedules />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/appointments/*"
                element={
                    <ProtectedRoute>
                        <BranchAdminAppointments />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/reports"
                element={
                    <ProtectedRoute>
                        <BranchAdminReports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/analytics"
                element={
                    <ProtectedRoute>
                        <BranchAdminAnalytics />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/settings"
                element={
                    <ProtectedRoute>
                        <BranchAdminSettings />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/feedbacks"
                element={
                    <ProtectedRoute>
                        <BranchAdminFeedbacks />
                    </ProtectedRoute>
                }
            />
            {/* Requests Module Routes */}
            <Route
                path="/branch-admin/requests"
                element={
                    <ProtectedRoute>
                        <BranchAdminRequests />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/requests/purchase-requests"
                element={
                    <ProtectedRoute>
                        <BranchAdminPurchaseRequests />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/requests/eod-reports"
                element={
                    <ProtectedRoute>
                        <BranchAdminEODReports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/requests/cash-entries"
                element={
                    <ProtectedRoute>
                        <BranchAdminCashEntries />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/requests/schedule-requests"
                element={
                    <ProtectedRoute>
                        <BranchAdminScheduleRequests />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/requests/modification-requests"
                element={
                    <ProtectedRoute>
                        <BranchAdminModificationRequests />
                    </ProtectedRoute>
                }
            />
            {/* Legacy Purchase Requests Route - redirect to new location */}
            <Route
                path="/branch-admin/purchase-requests"
                element={
                    <ProtectedRoute>
                        <BranchAdminPurchaseRequests />
                    </ProtectedRoute>
                }
            />
            {/* Redirect old Staff Management routes to HRM module */}
            <Route
                path="/branch-admin/staff"
                element={<Navigate to="/branch-admin/hrm/staff" replace />}
            />
            <Route
                path="/branch-admin/staff/profiles"
                element={<Navigate to="/branch-admin/hrm/staff" replace />}
            />
            <Route
                path="/branch-admin/staff/add"
                element={
                    <ProtectedRoute>
                        <AddStaff />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/scheduling"
                element={<Navigate to="/branch-admin/hrm/scheduling" replace />}
            />
            {/* Redirect duplicate Staff Management routes to HRM */}
            <Route
                path="/branch-admin/staff/leave"
                element={<Navigate to="/branch-admin/hrm/leave-approvals" replace />}
            />
            <Route
                path="/branch-admin/staff/attendance"
                element={<Navigate to="/branch-admin/hrm/attendance" replace />}
            />
            <Route
                path="/branch-admin/staff/training"
                element={
                    <ProtectedRoute>
                        <TrainingDevelopment />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/payroll"
                element={<Navigate to="/branch-admin/hrm/payroll" replace />}
            />
            <Route
                path="/branch-admin/staff/compliance"
                element={
                    <ProtectedRoute>
                        <ComplianceLegal />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/communication"
                element={
                    <ProtectedRoute>
                        <StaffCommunication />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/records"
                element={
                    <ProtectedRoute>
                        <EmployeeRecords />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/feedback"
                element={
                    <ProtectedRoute>
                        <StaffFeedback />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/staff/reports"
                element={<Navigate to="/branch-admin/hrm/reports" replace />}
            />
            {/* Super Admin Staff Management Routes */}
            <Route
                path="/super-admin/staff"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/scheduling"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffScheduling />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/profiles"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/leave"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/attendance"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/training"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/payroll"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/compliance"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/communication"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/records"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/feedback"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/staff/reports"
                element={
                    <ProtectedRoute>
                        <SuperAdminStaffDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/reports"
                element={
                    <ProtectedRoute>
                        <SuperAdminReports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/feedbacks"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminFeedbacks />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/chatbot"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminChatbotManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/appointments/*"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminAppointments />
                    </ProtectedRoute>
                }
            />
            
            {/* ============================================ */}
            {/* HRM MODULE ROUTES - Sri Lanka Compliant      */}
            {/* ============================================ */}
            
            {/* Super Admin HRM Routes */}
            <Route
                path="/super-admin/hrm"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminHRMDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/policies"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <HRMPolicies />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/salary-structures"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SalaryStructures />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/epf-etf"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <EPFETFConfig />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/leave-types"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <LeaveTypes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/shift-templates"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <ShiftTemplates />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/payroll"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminPayrollManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/payroll-config"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <PayrollConfig />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/reports"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <HRMReports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/hrm/audit-logs"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <HRMAuditLogs />
                    </ProtectedRoute>
                }
            />
            
            {/* Branch Admin HRM Routes */}
            <Route
                path="/branch-admin/hrm"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchAdminHRMDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/staff"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchHRMStaff />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/scheduling"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <StaffScheduling />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/staff/add"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <AddStaff />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/leave-approvals"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchLeaveApprovals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/payroll"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchPayrollSummary />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/attendance"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchAttendance />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/overtime"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchOvertime />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/reports"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchHRMReports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/audit-logs"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchHRMAuditLogs />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/branch-admin/hrm/service-letters"
                element={
                    <ProtectedRoute allowedRoles={['branch_admin']}>
                        <BranchServiceLetters />
                    </ProtectedRoute>
                }
            />
            
            {/* Employee Self-Service HRM Routes */}
            <Route
                path="/dashboard/hrm"
                element={
                    <ProtectedRoute>
                        <EmployeeHRMDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/profile"
                element={
                    <ProtectedRoute>
                        <EmployeeProfile />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/leave"
                element={
                    <ProtectedRoute>
                        <EmployeeLeaveRequest />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/payslips"
                element={
                    <ProtectedRoute>
                        <EmployeePayslips />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/shifts"
                element={
                    <ProtectedRoute>
                        <EmployeeShifts />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/overtime"
                element={
                    <ProtectedRoute>
                        <EmployeeOvertime />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/hrm/schedule-acknowledgment"
                element={
                    <ProtectedRoute>
                        <EmployeeScheduleAcknowledgment />
                    </ProtectedRoute>
                }
            />
            
            {/* End HRM Module Routes */}
            
            <Route
                path="/shift-management"
                element={
                    <ProtectedRoute>
                        <ShiftManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/*"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/pharmacy-dashboard/*"
                element={
                    <ProtectedRoute>
                        <PharmacyDashboardLayout />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/pos-dashboard/*"
                element={
                    <ProtectedRoute>
                        <POSDashboardLayout />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/hr-dashboard/*"
                element={
                    <ProtectedRoute>
                        <HRDashboardLayout />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/patient-dashboard/*"
                element={
                    <ProtectedRoute>
                        <PatientDashboardNew />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/doctor-dashboard"
                element={<Navigate to="/doctor-dashboard-new" replace />}
            />

            <Route
                path="/pos/*"
                element={
                    <ProtectedRoute>
                        <POSDashboardLayout />
                    </ProtectedRoute>
                }
            />

            {/* Cashier routes redirect to POS */}
            <Route
                path="/cashier/dashboard"
                element={<Navigate to="/pos" replace />}
            />
            <Route
                path="/cashier/billing"
                element={<Navigate to="/pos/pos" replace />}
            />
            <Route
                path="/cashier/transactions"
                element={<Navigate to="/pos/transactions" replace />}
            />
            <Route
                path="/cashier/payments"
                element={<Navigate to="/pos/cash-entries" replace />}
            />
            <Route
                path="/cashier/*"
                element={<Navigate to="/pos" replace />}
            />

            <Route
                path="/doctor-dashboard/*"
                element={<Navigate to="/doctor-dashboard-new" replace />}
            />

            <Route
                path="/nurse-dashboard/*"
                element={
                    <ProtectedRoute>
                        <NurseDashboardLayout />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/doctor-dashboard-new/*"
                element={
                    <ProtectedRoute>
                        <DoctorDashboardNew />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/receptionist-dashboard/*"
                element={
                    <ProtectedRoute>
                        <ReceptionistDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/it-support-dashboard"
                element={
                    <ProtectedRoute>
                        <ITAssistantDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Medical Insights - Doctor Post Management Routes */}
            <Route
                path="/doctor-dashboard/posts"
                element={
                    <ProtectedRoute>
                        <DoctorPostsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor-dashboard/posts/create"
                element={
                    <ProtectedRoute>
                        <CreatePostPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor-dashboard/posts/edit/:postId"
                element={
                    <ProtectedRoute>
                        <CreatePostPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default AppRoutes;
