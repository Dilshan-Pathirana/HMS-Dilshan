import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PageLoadingFallback } from "../components/common/LoadingFallback.tsx";

// CRITICAL: Only import components that are absolutely needed immediately
// Everything else is lazy-loaded to dramatically reduce initial bundle size
import ProtectedRoute from "../components/ProtectedRoute.tsx";

// ============================================
// LAZY LOADED LAYOUTS
// ============================================
const DashboardLayout = lazy(() => import("../layout/DashboardLayout.tsx"));
const PharmacyDashboardLayout = lazy(() => import("../layout/pharmacy/PharmacyDashboardLayout.tsx"));
const POSDashboardLayout = lazy(() => import("../layout/pharmacyPOS/POSDashboardLayout.tsx"));
const HRDashboardLayout = lazy(() => import("../layout/Hr/HRDashboardLayout.tsx"));
const NurseDashboardLayout = lazy(() => import("../layout/nurse/NurseDashboardLayout"));

// ============================================
// LAZY LOADED PUBLIC PAGES
// ============================================
const Dashboard = lazy(() => import("../pages/UserWeb/Dashboard.tsx"));
const LoginPage = lazy(() => import("../pages/Login/LoginPage.tsx"));
const SignupPage = lazy(() => import("../pages/Login/SignupPage.tsx"));
const ForgotPassword = lazy(() => import("../pages/UserWeb/ForgotPassword.tsx"));
const WhyChooseUs = lazy(() => import("../pages/UserWeb/WhyChooseUs.tsx"));
const About = lazy(() => import("../pages/UserWeb/About.tsx"));
const Mission = lazy(() => import("../pages/UserWeb/About/Mission/Mission.tsx"));
const PrivacyPolicy = lazy(() => import("../pages/UserWeb/PrivacyPolicy.tsx"));
const AppointmentBookingTerms = lazy(() => import("../pages/UserWeb/AppointmentBookingTerms .tsx"));
const CartComingSoon = lazy(() => import("../pages/UserWeb/CartComingSoon.tsx"));

// Doctor Schedule Pages
const WebDoctorScheduleDetails = lazy(() => import("../pages/UserWeb/AppointmentSchedule/WebDoctorSchedule/WebDoctorScheduleDetails.tsx"));
const DoctorScheduleDetails = lazy(() => import("../pages/UserWeb/AppointmentSchedule/DoctorScheduleDetails.tsx"));
const AppointmentConfirmation = lazy(() => import("../pages/UserWeb/AppointmentConfirmation.tsx"));
const AppointmentCancelled = lazy(() => import("../pages/UserWeb/AppointmentCancelled.tsx"));

// Treatment Pages
const BoneJointDisorders = lazy(() => import("../pages/UserWeb/Treatments/BoneJointDisorders.tsx"));
const FertilityProblems = lazy(() => import("../pages/UserWeb/Treatments/FertilityProblems.tsx"));
const GastrointestinalDisorders = lazy(() => import("../pages/UserWeb/Treatments/GastrointestinalDisorders.tsx"));
const HormonalDisorders = lazy(() => import("../pages/UserWeb/Treatments/HormonalDisorders.tsx"));
const PsychiatricDisorders = lazy(() => import("../pages/UserWeb/Treatments/PsychiatricDisorders.tsx"));
const RespiratoryDisorders = lazy(() => import("../pages/UserWeb/Treatments/RespiratoryDisorders.tsx"));
const SkinHairDisorders = lazy(() => import("../pages/UserWeb/Treatments/SkinHairDisorders.tsx"));
const VascularDisorders = lazy(() => import("../pages/UserWeb/Treatments/VascularDisorders.tsx"));

// ============================================
// LAZY LOADED PATIENT MODULE
// ============================================
const PatientDashboard = lazy(() => import("../pages/PatientDashboard/PatientDashboard.tsx"));
const PatientDashboardNew = lazy(() => import("../pages/PatientDashboard/PatientDashboardNew.tsx"));
const PatientAppoinmentChange = lazy(() => import("../pages/PatientDashboard/PatientAppointment/PatientAppointmentTable/PatientAppoinmentChange.tsx"));

// ============================================
// LAZY LOADED DOCTOR MODULE
// ============================================
const DoctorDashboard = lazy(() => import("../pages/DoctorDashboard/DoctorDashboard.tsx"));
const DoctorDashboardNew = lazy(() => import("../pages/DoctorDashboard/DoctorDashboardNew.tsx"));
const AllDoctorRelatedAppointments = lazy(() => import("../pages/dashboard/Doctor/DoctorAppointment/AllDoctorRelatedAppointments.tsx"));
const CreateQuestions = lazy(() => import("../pages/dashboard/Doctor/Patient/CreateQuestions.tsx"));
const GetDoctorQuestions = lazy(() => import("../pages/dashboard/Doctor/Patient/GetDoctorQuestions.tsx"));
const DoctorScheduleCalendar = lazy(() => import("../pages/dashboard/Doctor/DoctorAppointment/DoctorScheduleCalendar.tsx"));
const GetDoctorSessions = lazy(() => import("../pages/DoctorDashboard/DoctorSessions/GetDoctorSessions.tsx"));
const DoctorPatients = lazy(() => import("../pages/dashboard/Doctor/Patient/DoctorPatients.tsx"));
const MedicalRecord = lazy(() => import("../pages/dashboard/Doctor/Patient/MedicalRecord.tsx"));

// ============================================
// LAZY LOADED BRANCH ADMIN MODULE
// ============================================
const BranchDashboardSimple = lazy(() => import("../pages/BranchDashboard/BranchDashboardSimple.tsx"));
const BranchPharmacies = lazy(() => import("../pages/BranchDashboard/BranchPharmacies.tsx"));
const BranchInventory = lazy(() => import("../pages/BranchDashboard/BranchInventory.tsx"));
const BranchStaff = lazy(() => import("../pages/BranchDashboard/BranchStaff.tsx"));
const BranchTransactions = lazy(() => import("../pages/BranchDashboard/BranchTransactions.tsx"));
const BranchAdminDashboard = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminDashboard.tsx").then(m => ({ default: m.BranchAdminDashboard })));
const BranchAdminProfile = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminProfile.tsx").then(m => ({ default: m.BranchAdminProfile })));
const BranchAdminDoctorSchedules = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminDoctorSchedules.tsx").then(m => ({ default: m.BranchAdminDoctorSchedules })));
const BranchAdminPurchaseRequests = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminPurchaseRequests.tsx").then(m => ({ default: m.BranchAdminPurchaseRequests })));
const BranchAdminAppointments = lazy(() => import("../pages/BranchDashboard/Appointments/BranchAdminAppointmentsNew.tsx"));
const BranchAdminReports = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminReports.tsx").then(m => ({ default: m.BranchAdminReports })));
const BranchAdminAnalytics = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminAnalytics.tsx").then(m => ({ default: m.BranchAdminAnalytics })));
const BranchAdminSettings = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminSettings.tsx").then(m => ({ default: m.BranchAdminSettings })));
const BranchAdminFeedbacks = lazy(() => import("../pages/dashboard/BranchAdmin/BranchAdminFeedbacks.tsx").then(m => ({ default: m.BranchAdminFeedbacks })));

// Branch Admin Requests Module
const BranchAdminRequests = lazy(() => import("../pages/dashboard/BranchAdmin/Requests").then(m => ({ default: m.BranchAdminRequests })));
const BranchAdminEODReports = lazy(() => import("../pages/dashboard/BranchAdmin/Requests").then(m => ({ default: m.BranchAdminEODReports })));
const BranchAdminCashEntries = lazy(() => import("../pages/dashboard/BranchAdmin/Requests").then(m => ({ default: m.BranchAdminCashEntries })));
const BranchAdminScheduleRequests = lazy(() => import("../pages/dashboard/BranchAdmin/Requests").then(m => ({ default: m.BranchAdminScheduleRequests })));
const BranchAdminModificationRequests = lazy(() => import("../pages/dashboard/BranchAdmin/Requests").then(m => ({ default: m.BranchAdminModificationRequests })));

// ============================================
// LAZY LOADED SUPER ADMIN MODULE
// ============================================
const SuperAdminDashboard = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminDashboard.tsx").then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminMainDashboard = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminMainDashboard.tsx"));

const BranchView = lazy(() => import("../pages/dashboard/Branch/BranchView/BranchView.tsx"));
const BranchManage = lazy(() => import("../pages/dashboard/Branch/BranchManage.tsx"));
const BranchAssign = lazy(() => import("../pages/dashboard/Branch/BranchAssign.tsx"));
const BranchDetails = lazy(() => import("../pages/dashboard/Branch/BranchDetails.tsx"));
const BranchStaffManagement = lazy(() => import("../pages/dashboard/Branch/BranchStaffManagement/BranchStaffManagement.tsx"));
const UserManagement = lazy(() => import("../pages/dashboard/Users/UserManagement/UserManagement.tsx"));

// ============================================
// LAZY LOADED BRANCH ADMIN STAFF MANAGEMENT
// ============================================

const StaffManagementDashboard = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.StaffManagementDashboard })));
const StaffProfiles = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.StaffProfiles })));
const AddStaff = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.AddStaff })));
const StaffScheduling = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.StaffScheduling })));
const TrainingDevelopment = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.TrainingDevelopment })));
const ComplianceLegal = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.ComplianceLegal })));
const StaffCommunication = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.StaffCommunication })));
const EmployeeRecords = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.EmployeeRecords })));
const StaffFeedback = lazy(() => import("../pages/dashboard/BranchAdmin/StaffManagement").then(m => ({ default: m.StaffFeedback })));

// ============================================
// LAZY LOADED SUPER ADMIN MODULE
// ============================================
const SuperAdminFeedbacks = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminFeedbacks.tsx").then(m => ({ default: m.SuperAdminFeedbacks })));
const SuperAdminChatbotManagement = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminChatbotManagement.tsx"));
const SuperAdminReports = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminReports.tsx").then(m => ({ default: m.SuperAdminReports })));
const SuperAdminAppointments = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminAppointments.tsx"));
const SuperAdminPharmacies = lazy(() => import("../pages/dashboard/SuperAdmin/SuperAdminPharmacies.tsx"));

// Super Admin Staff Management
const SuperAdminStaffDashboard = lazy(() => import("../pages/dashboard/SuperAdmin/StaffManagement").then(m => ({ default: m.SuperAdminStaffDashboard })));
const SuperAdminStaffScheduling = lazy(() => import("../pages/dashboard/SuperAdmin/StaffManagement").then(m => ({ default: m.SuperAdminStaffScheduling })));

// ============================================
// LAZY LOADED HRM MODULE
// ============================================
const SuperAdminHRMDashboard = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.SuperAdminHRMDashboard })));
const SuperAdminPayrollManagement = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.SuperAdminPayrollManagement })));
const HRMPolicies = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.HRMPolicies })));
const SalaryStructures = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.SalaryStructures })));
const EPFETFConfig = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EPFETFConfig })));
const LeaveTypes = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.LeaveTypes })));
const ShiftTemplates = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.ShiftTemplates })));
const PayrollConfig = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.PayrollConfig })));
const HRMReports = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.HRMReports })));
const HRMAuditLogs = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.HRMAuditLogs })));
const BranchAdminHRMDashboard = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchAdminHRMDashboard })));
const BranchHRMStaff = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchHRMStaff })));
const BranchLeaveApprovals = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchLeaveApprovals })));
const BranchPayrollSummary = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchPayrollSummary })));
const BranchAttendance = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchAttendance })));
const BranchOvertime = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchOvertime })));
const BranchHRMReports = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchHRMReports })));
const BranchHRMAuditLogs = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchHRMAuditLogs })));
const BranchServiceLetters = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.BranchServiceLetters })));
const EmployeeHRMDashboard = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeHRMDashboard })));
const EmployeeProfile = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeProfile })));
const EmployeeLeaveRequest = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeLeaveRequest })));
const EmployeePayslips = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeePayslips })));
const EmployeeShifts = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeShifts })));
const EmployeeOvertime = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeOvertime })));
const EmployeeScheduleAcknowledgment = lazy(() => import("../pages/dashboard/HRM").then(m => ({ default: m.EmployeeScheduleAcknowledgment })));

// ============================================
// LAZY LOADED MEDICAL INSIGHTS MODULE
// ============================================
const MedicalInsightsPage = lazy(() => import("../pages/MedicalInsights").then(m => ({ default: m.MedicalInsightsPage })));
const PostDetailPage = lazy(() => import("../pages/MedicalInsights").then(m => ({ default: m.PostDetailPage })));
const CreatePostPage = lazy(() => import("../pages/MedicalInsights").then(m => ({ default: m.CreatePostPage })));
const DoctorPostsPage = lazy(() => import("../pages/MedicalInsights").then(m => ({ default: m.DoctorPostsPage })));

// ============================================
// LAZY LOADED OTHER DASHBOARD MODULES
// ============================================
const ShiftManagement = lazy(() => import("../pages/dashboard/Users/ShiftManagement/ShiftManagementNew.tsx"));
const ITAssistantDashboard = lazy(() => import("../pages/dashboard/ITAssistant/ITAssistantDashboard.tsx").then(m => ({ default: m.ITAssistantDashboard })));
const ReceptionistDashboard = lazy(() => import("../pages/dashboard/Receptionist/ReceptionistDashboard.tsx"));


const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard/pharmacies" element={<SuperAdminPharmacies />} />
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

                {/* Super Admin Dashboard - Role 1 */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    }
                />



                <Route
                    path="/dashboard/branch/management"
                    element={
                        <ProtectedRoute>
                            <BranchStaffManagement />
                        </ProtectedRoute>
                    }
                />

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
                            <UserManagement />
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

                <Route
                    path="/dashboard/branches"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <Navigate to="/dashboard/branches/view" replace />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/branches/view"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <BranchView />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard/branches/manage"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <Navigate to="/dashboard/branches/view" replace />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/branches/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <BranchManage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/branches/:id/assign"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <BranchAssign />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/branches/:id/manage"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <BranchManage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard/branches/:id"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <BranchDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard/users/list"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                            <UserManagement />
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
                <Route
                    path="/doctor/schedule"
                    element={
                        <ProtectedRoute allowedRoles={['doctor']}>
                            <DoctorScheduleCalendar />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/patients"
                    element={
                        <ProtectedRoute allowedRoles={['doctor']}>
                            <DoctorPatients />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/patients/:id"
                    element={
                        <ProtectedRoute allowedRoles={['doctor']}>
                            <MedicalRecord />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor/appointments"
                    element={
                        <ProtectedRoute allowedRoles={['doctor']}>
                            <AllDoctorRelatedAppointments />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
