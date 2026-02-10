// HRM Module Exports

// Super Admin HRM
export { default as SuperAdminHRMDashboard } from './SuperAdmin/SuperAdminHRMDashboard';
export { default as SuperAdminPayrollManagement } from './SuperAdmin/SuperAdminPayrollManagement';
export { default as HRMPolicies } from '../../HRM/HRPolicies';
export { default as SalaryStructures } from '../../HRM/SalaryStructures';
export { default as EPFETFConfig } from '../../HRM/EPFETFConfig';
export { default as LeaveTypes } from '../../HRM/LeaveTypes';
export { default as ShiftTemplates } from '../../HRM/ShiftTemplates';
export { default as PayrollConfig } from '../../HRM/PayrollConfig';
export { default as HRMReports } from '../../HRM/HRMReports';
export { default as HRMAuditLogs } from '../../HRM/HRMAuditLogs';

// Branch Admin HRM
export { default as BranchAdminHRMDashboard } from './BranchAdmin/BranchAdminHRMDashboard';
export { default as BranchHRMStaff } from './BranchAdmin/BranchHRMStaff';
export { default as BranchLeaveApprovals } from './BranchAdmin/BranchLeaveApprovals';
export { default as BranchPayrollSummary } from './BranchAdmin/BranchPayrollSummary';
export { default as BranchAttendance } from './BranchAdmin/BranchAttendance';
export { default as BranchOvertime } from './BranchAdmin/BranchOvertime';
export { default as BranchHRMReports } from './BranchAdmin/BranchHRMReports';
export { default as BranchHRMAuditLogs } from './BranchAdmin/BranchHRMAuditLogs';
export { default as BranchServiceLetters } from './BranchAdmin/BranchServiceLetters';

// Employee Self-Service HRM
export { default as EmployeeHRMDashboard } from './Employee/EmployeeHRMDashboard';
export { default as EmployeeProfile } from './Employee/EmployeeProfile';
export { default as EmployeeLeaveRequest } from './Employee/EmployeeLeaveRequest';
export { default as EmployeePayslips } from './Employee/EmployeePayslips';
export { default as EmployeeShifts } from './Employee/EmployeeShifts';
export { default as EmployeeOvertime } from './Employee/EmployeeOvertime';
export { default as EmployeeScheduleAcknowledgment } from './Employee/EmployeeScheduleAcknowledgment';

// Shared HRM layout shells
export { SuperAdminHrmShell, BranchAdminHrmShell, EmployeeHrmShell } from './HrmShell';
