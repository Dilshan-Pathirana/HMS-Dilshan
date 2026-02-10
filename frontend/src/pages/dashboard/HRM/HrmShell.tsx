import React from 'react';
import {
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    CalendarDays,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    FileCheck,
    FileText,
    History,
    Mail,
    Shield,
    TrendingUp,
    User,
    UserCheck,
    Users,
} from 'lucide-react';

import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';

type Props = {
    children: React.ReactNode;
};

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
};

const getUserName = (userInfo: any) => {
    const name = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim();
    return name || 'User';
};

const superAdminHrmMenuItems = [
    { label: 'Dashboard', path: '/super-admin/hrm', icon: <Building2 className="w-5 h-5" /> },
    { label: 'HR Policies', path: '/super-admin/hrm/policies', icon: <FileText className="w-5 h-5" /> },
    { label: 'Salary Structures', path: '/super-admin/hrm/salary-structures', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'EPF/ETF Config', path: '/super-admin/hrm/epf-etf', icon: <Shield className="w-5 h-5" /> },
    { label: 'Leave Types', path: '/super-admin/hrm/leave-types', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Shift Templates', path: '/super-admin/hrm/shift-templates', icon: <Clock className="w-5 h-5" /> },
    { label: 'Payroll Config', path: '/super-admin/hrm/payroll-config', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Payroll Management', path: '/super-admin/hrm/payroll', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Analytics', path: '/super-admin/hrm/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Audit Logs', path: '/super-admin/hrm/audit-logs', icon: <FileCheck className="w-5 h-5" /> },
];

const branchAdminHrmMenuItems = [
    { label: 'Dashboard', path: '/branch-admin/hrm', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Staff', path: '/branch-admin/hrm/staff', icon: <Users className="w-5 h-5" /> },
    { label: 'Scheduling', path: '/branch-admin/hrm/scheduling', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Attendance', path: '/branch-admin/hrm/attendance', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Leave Approvals', path: '/branch-admin/hrm/leave-approvals', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Overtime', path: '/branch-admin/hrm/overtime', icon: <Clock className="w-5 h-5" /> },
    { label: 'Payroll', path: '/branch-admin/hrm/payroll', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Service Letters', path: '/branch-admin/hrm/service-letters', icon: <Mail className="w-5 h-5" /> },
    { label: 'Reports', path: '/branch-admin/hrm/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Audit Logs', path: '/branch-admin/hrm/audit-logs', icon: <History className="w-5 h-5" /> },
];

const employeeHrmMenuItems = [
    { label: 'Dashboard', path: '/dashboard/hrm', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'My Profile', path: '/dashboard/hrm/profile', icon: <User className="w-5 h-5" /> },
    { label: 'Leave', path: '/dashboard/hrm/leave', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Payslips', path: '/dashboard/hrm/payslips', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'My Shifts', path: '/dashboard/hrm/shifts', icon: <Clock className="w-5 h-5" /> },
    { label: 'Schedule Requests', path: '/dashboard/hrm/schedule-acknowledgment', icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Overtime', path: '/dashboard/hrm/overtime', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Documents', path: '/dashboard/hrm/documents', icon: <FileText className="w-5 h-5" /> },
];

export const SuperAdminHrmShell: React.FC<Props> = ({ children }) => {
    const userInfo = getUserInfo();

    return (
        <DashboardLayout
            userName={getUserName(userInfo)}
            userRole="Super Admin"
            profileImage={userInfo.profile_picture || ''}
            sidebarContent={<SidebarMenu items={superAdminHrmMenuItems} />}
        >
            {children}
        </DashboardLayout>
    );
};

export const BranchAdminHrmShell: React.FC<Props> = ({ children }) => {
    const userInfo = getUserInfo();

    return (
        <DashboardLayout
            userName={getUserName(userInfo)}
            userRole="Branch Admin"
            profileImage={userInfo.profile_picture || ''}
            sidebarContent={<SidebarMenu items={branchAdminHrmMenuItems} />}
        >
            {children}
        </DashboardLayout>
    );
};

export const EmployeeHrmShell: React.FC<Props> = ({ children }) => {
    const userInfo = getUserInfo();

    return (
        <DashboardLayout
            userName={getUserName(userInfo)}
            userRole="Employee"
            profileImage={sessionStorage.getItem('profileImage') || userInfo.profile_picture || ''}
            sidebarContent={<SidebarMenu items={employeeHrmMenuItems} />}
        >
            {children}
        </DashboardLayout>
    );
};
