import React from 'react';
import { 
    LayoutDashboard, Users, FileText, Calendar, BarChart3, 
    Settings, User, ClipboardList, Stethoscope, ShoppingCart, MessageSquare, Briefcase
} from 'lucide-react';

export const BranchAdminMenuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/branch-admin/dashboard' },
    { label: 'HR Management', icon: <Briefcase className="w-5 h-5" />, path: '/branch-admin/hrm' },
    { label: 'Doctor Schedules', icon: <Stethoscope className="w-5 h-5" />, path: '/branch-admin/doctor-schedules' },
    { label: 'Requests', icon: <ClipboardList className="w-5 h-5" />, path: '/branch-admin/requests', badge: true },
    { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/branch-admin/appointments' },
    { label: 'Feedbacks', icon: <MessageSquare className="w-5 h-5" />, path: '/branch-admin/feedbacks' },
    { label: 'POS Management', icon: <ShoppingCart className="w-5 h-5" />, path: '/pos' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/branch-admin/reports' },
    { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, path: '/branch-admin/analytics' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/branch-admin/settings' },
    { label: 'My Profile', icon: <User className="w-5 h-5" />, path: '/branch-admin/profile' },
];
