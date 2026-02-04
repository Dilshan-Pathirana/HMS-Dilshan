import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    BarChart3,
    Settings,
    User,
    Calendar,
    Package,
    DollarSign,
    Stethoscope,
    Clipboard,
    ChevronDown,
    ChevronRight,
    ShoppingCart,
    UserPlus,
    Briefcase,
    HeartPulse,
    Activity,
    MessageSquare
} from 'lucide-react';

export interface SubMenuItem {
    label: string;
    path: string;
}

export interface MenuItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
    children?: SubMenuItem[];
}

interface SidebarMenuProps {
    items: MenuItem[];
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ items }) => {
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const location = useLocation();

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        );
    };

    const isChildActive = (children?: SubMenuItem[]) => {
        if (!children) return false;
        return children.some(child => location.pathname === child.path);
    };

    return (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Navigation
                </h2>
            </div>
            <ul className="space-y-1 px-2">
                {items.map((item, index) => (
                    <li key={index}>
                        {item.children ? (
                            // Menu item with children (expandable)
                            <div>
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${isChildActive(item.children) || expandedMenus.includes(item.label)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <span className="flex-1 font-medium text-left">{item.label}</span>
                                    {expandedMenus.includes(item.label) ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                                {expandedMenus.includes(item.label) && (
                                    <ul className="mt-1 ml-6 space-y-1 border-l-2 border-primary-200 pl-4">
                                        {item.children.map((child, childIndex) => (
                                            <li key={childIndex}>
                                                <NavLink
                                                    to={child.path}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                                            ? 'bg-primary-600 text-white shadow-sm'
                                                            : 'text-slate-600 hover:bg-slate-100'
                                                        }`
                                                    }
                                                >
                                                    {child.label}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            // Regular menu item without children
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-primary-600 text-white shadow-primary'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`
                                }
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <span className="flex-1 font-medium">{item.label}</span>
                                {item.badge && (
                                    <span className="px-2 py-1 text-xs font-bold bg-rose-500 text-white rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

// Predefined menu items for Super Admin with all content
export const SuperAdminMenuItems: MenuItem[] = [
    {
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
    },
    {
        label: 'Branch Management',
        icon: <Building2 className="w-5 h-5" />,
        path: '/dashboard/branch/management'
    },
    {
        label: 'Pharmacies',
        icon: <Package className="w-5 h-5" />,
        path: '/dashboard/super-admin/pharmacies'
    },
    {
        label: 'User Management',
        icon: <UserPlus className="w-5 h-5" />,
        path: '/dashboard/users/list'
    },
    {
        label: 'Appointments',
        icon: <Calendar className="w-5 h-5" />,
        path: '/super-admin/appointments'
    },
    {
        label: 'Patient Section',
        icon: <HeartPulse className="w-5 h-5" />,
        path: '/dashboard/patient',
        children: [
            { label: 'Create Questions', path: '/dashboard/patient/create-questions' },
            { label: 'All Questions', path: '/dashboard/patient/all-questions' },
        ]
    },
    {
        label: 'Doctor Section',
        icon: <Stethoscope className="w-5 h-5" />,
        path: '/dashboard/doctor',
        children: [
            { label: 'Doctor Schedule', path: '/dashboard/doctor/schedule' },
            { label: 'Schedule Details', path: '/dashboard/doctor/doctor-schedule-details' },
            { label: 'Cancel Requests', path: '/dashboard/doctor/schedule/cancel-request' },
            { label: 'Create Session', path: '/dashboard/doctor/create-session' },
        ]
    },
    {
        label: 'Doctor Diseases',
        icon: <Activity className="w-5 h-5" />,
        path: '/dashboard/doctor-diseases',
        children: [
            { label: 'Create Diseases', path: '/dashboard/doctor/create-diseases' },
            { label: 'All Diseases', path: '/dashboard/doctor/all-diseases' },
        ]
    },
    {
        label: 'POS Management',
        icon: <ShoppingCart className="w-5 h-5" />,
        path: '/dashboard/pos'
    },
    {
        label: 'HR Management',
        icon: <Briefcase className="w-5 h-5" />,
        path: '/hr-dashboard'
    },
    {
        label: 'Feedbacks',
        icon: <MessageSquare className="w-5 h-5" />,
        path: '/super-admin/feedbacks'
    },
    {
        label: 'Chatbot Manager',
        icon: <MessageSquare className="w-5 h-5" />,
        path: '/super-admin/chatbot'
    },
    {
        label: 'Reports',
        icon: <FileText className="w-5 h-5" />,
        path: '/dashboard/super-admin/reports'
    },
    {
        label: 'Analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        path: '/dashboard/super-admin/analytics'
    },
    {
        label: 'Settings',
        icon: <Settings className="w-5 h-5" />,
        path: '/dashboard/super-admin/settings'
    },
    {
        label: 'Profile',
        icon: <User className="w-5 h-5" />,
        path: '/profile'
    },
];

export const DoctorMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/doctor/dashboard' },
    { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/doctor/appointments' },
    { label: 'Patients', icon: <Users className="w-5 h-5" />, path: '/doctor/patients' },
    { label: 'Prescriptions', icon: <Clipboard className="w-5 h-5" />, path: '/doctor/prescriptions' },
    { label: 'Schedule', icon: <Calendar className="w-5 h-5" />, path: '/doctor/schedule' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const PharmacistMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/pharmacist/dashboard' },
    { label: 'Inventory', icon: <Package className="w-5 h-5" />, path: '/pharmacy-dashboard/product-list' },
    { label: 'Prescriptions', icon: <Clipboard className="w-5 h-5" />, path: '/pharmacist/prescriptions' },
    { label: 'Sales', icon: <DollarSign className="w-5 h-5" />, path: '/pharmacist/sales' },
    { label: 'Suppliers', icon: <Building2 className="w-5 h-5" />, path: '/pharmacy-dashboard/supplier-list' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const CashierMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/pos' },
    { label: 'Billing', icon: <FileText className="w-5 h-5" />, path: '/pos/pos' },
    { label: 'Cash Entries', icon: <DollarSign className="w-5 h-5" />, path: '/pos/cash-entries' },
    { label: 'Transactions', icon: <BarChart3 className="w-5 h-5" />, path: '/pos/transactions' },
    { label: 'End of Day', icon: <Calendar className="w-5 h-5" />, path: '/pos/eod' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/pos/reports' },
];

export const PatientMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/patient/dashboard' },
    { label: 'My Appointments', icon: <Calendar className="w-5 h-5" />, path: '/patient/appointments' },
    { label: 'Medical History', icon: <Clipboard className="w-5 h-5" />, path: '/patient/medical-history' },
    { label: 'Prescriptions', icon: <FileText className="w-5 h-5" />, path: '/patient/prescriptions' },
    { label: 'Payments', icon: <DollarSign className="w-5 h-5" />, path: '/patient/payments' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const SupplierMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/supplier/dashboard' },
    { label: 'Orders', icon: <Package className="w-5 h-5" />, path: '/supplier/orders' },
    { label: 'Products', icon: <Package className="w-5 h-5" />, path: '/supplier/products' },
    { label: 'Payments', icon: <DollarSign className="w-5 h-5" />, path: '/supplier/payments' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

// Staff Role Menu Items
export const ReceptionistMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/receptionist/dashboard' },
    { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/receptionist/appointments' },
    { label: 'Patient Registration', icon: <Users className="w-5 h-5" />, path: '/receptionist/registration' },
    { label: 'Patient Records', icon: <FileText className="w-5 h-5" />, path: '/receptionist/records' },
    { label: 'Visitors', icon: <Users className="w-5 h-5" />, path: '/receptionist/visitors' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const NurseMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/nurse/dashboard' },
    { label: 'Patient Care', icon: <Stethoscope className="w-5 h-5" />, path: '/nurse/patient-care' },
    { label: 'Vital Signs', icon: <BarChart3 className="w-5 h-5" />, path: '/nurse/vital-signs' },
    { label: 'Medications', icon: <Package className="w-5 h-5" />, path: '/nurse/medications' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/nurse/reports' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const ITAssistantMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/it-assistant/dashboard' },
    { label: 'System Status', icon: <BarChart3 className="w-5 h-5" />, path: '/it-assistant/system-status' },
    { label: 'Support Tickets', icon: <FileText className="w-5 h-5" />, path: '/it-assistant/tickets' },
    { label: 'User Management', icon: <Users className="w-5 h-5" />, path: '/it-assistant/users' },
    { label: 'Security', icon: <Settings className="w-5 h-5" />, path: '/it-assistant/security' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const ClerkMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/clerk/dashboard' },
    { label: 'Records', icon: <FileText className="w-5 h-5" />, path: '/clerk/records' },
    { label: 'File Documents', icon: <FileText className="w-5 h-5" />, path: '/clerk/documents' },
    { label: 'Archive', icon: <Package className="w-5 h-5" />, path: '/clerk/archive' },
    { label: 'Search', icon: <BarChart3 className="w-5 h-5" />, path: '/clerk/search' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const DirectorMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/director/dashboard' },
    { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, path: '/director/analytics' },
    { label: 'Staff Overview', icon: <Users className="w-5 h-5" />, path: '/director/staff' },
    { label: 'Branch Performance', icon: <Building2 className="w-5 h-5" />, path: '/director/branch-performance' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/director/reports' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const SecretaryMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/secretary/dashboard' },
    { label: 'Schedule', icon: <Calendar className="w-5 h-5" />, path: '/secretary/schedule' },
    { label: 'Correspondence', icon: <FileText className="w-5 h-5" />, path: '/secretary/correspondence' },
    { label: 'Documents', icon: <FileText className="w-5 h-5" />, path: '/secretary/documents' },
    { label: 'Calls', icon: <Users className="w-5 h-5" />, path: '/secretary/calls' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const ParamedicMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/paramedic/dashboard' },
    { label: 'Active Emergencies', icon: <Stethoscope className="w-5 h-5" />, path: '/paramedic/emergencies' },
    { label: 'Response History', icon: <FileText className="w-5 h-5" />, path: '/paramedic/history' },
    { label: 'Equipment Status', icon: <Settings className="w-5 h-5" />, path: '/paramedic/equipment' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const AudiologistMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/audiologist/dashboard' },
    { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/audiologist/appointments' },
    { label: 'Hearing Tests', icon: <Stethoscope className="w-5 h-5" />, path: '/audiologist/hearing-tests' },
    { label: 'Test Results', icon: <FileText className="w-5 h-5" />, path: '/audiologist/results' },
    { label: 'Equipment', icon: <Settings className="w-5 h-5" />, path: '/audiologist/equipment' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

export const MedicalAssistantMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/medical-assistant/dashboard' },
    { label: 'Patient Queue', icon: <Users className="w-5 h-5" />, path: '/medical-assistant/queue' },
    { label: 'Vital Signs', icon: <BarChart3 className="w-5 h-5" />, path: '/medical-assistant/vital-signs' },
    { label: 'Lab Samples', icon: <Package className="w-5 h-5" />, path: '/medical-assistant/lab-samples' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/medical-assistant/reports' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' },
];

// Branch Admin Menu Items
export const BranchAdminMenuItems: MenuItem[] = [
    {
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/branch-admin/dashboard'
    },
    {
        label: 'POS Management',
        icon: <ShoppingCart className="w-5 h-5" />,
        path: '/pos',
        children: [
            { label: 'POS Dashboard', path: '/pos' },
            { label: 'New Sale', path: '/pos/pos' },
            { label: 'Transactions', path: '/pos/transactions' },
            { label: 'Cash Entries', path: '/pos/cash-entries' },
            { label: 'EOD Process', path: '/pos/eod' },
            { label: 'Analytics', path: '/pos/analytics' },
            { label: 'Cashiers', path: '/pos/cashiers' },
        ]
    },
    {
        label: 'Appointments',
        icon: <Calendar className="w-5 h-5" />,
        path: '/branch-admin/appointments'
    },
    {
        label: 'Patient Section',
        icon: <HeartPulse className="w-5 h-5" />,
        path: '/branch-admin/patients'
    },
    {
        label: 'Reports',
        icon: <FileText className="w-5 h-5" />,
        path: '/branch-admin/reports'
    },
    {
        label: 'Analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        path: '/branch-admin/analytics'
    },
    {
        label: 'Settings',
        icon: <Settings className="w-5 h-5" />,
        path: '/branch-admin/settings'
    },
    {
        label: 'Profile',
        icon: <User className="w-5 h-5" />,
        path: '/profile'
    },
];
