import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { 
    Calendar, 
    UserPlus,
    ClipboardList,
    BarChart3,
    User,
    Ticket,
    FileText,
    CalendarPlus
} from 'lucide-react';
import ReceptionistDashboardMain from './ReceptionistDashboardMain';
import PatientRegistration from './PatientRegistration';
import ReceptionistAppointments from './ReceptionistAppointments';
import ReceptionistAppointmentBooking from '../../BranchDashboard/Appointments/ReceptionistAppointments';
import ReceptionistQueue from './ReceptionistQueue';
import ReceptionistVisits from './ReceptionistVisits';
import ReceptionistProfile from './ReceptionistProfile';
import ReceptionistReports from './ReceptionistReports';

const ReceptionistMenuItems = [
    { label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, path: '/receptionist-dashboard' },
    { label: 'Patient Registration', icon: <UserPlus className="w-5 h-5" />, path: '/receptionist-dashboard/register-patient' },
    { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/receptionist-dashboard/appointments' },
    { label: 'Appointment Booking', icon: <CalendarPlus className="w-5 h-5" />, path: '/receptionist-dashboard/appointment-booking' },
    { label: 'Patient Queue', icon: <Ticket className="w-5 h-5" />, path: '/receptionist-dashboard/queue' },
    { label: 'Visit Records', icon: <FileText className="w-5 h-5" />, path: '/receptionist-dashboard/visits' },
    { label: 'Reports', icon: <ClipboardList className="w-5 h-5" />, path: '/receptionist-dashboard/reports' },
    { label: 'My Profile', icon: <User className="w-5 h-5" />, path: '/receptionist-dashboard/profile' },
];

export const ReceptionistDashboard: React.FC = () => {
    const [userName, setUserName] = useState('Receptionist');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'Receptionist');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    return (
        <DashboardLayout
            userName={userName}
            userRole="Receptionist"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={ReceptionistMenuItems} />}
        >
            <Routes>
                <Route index element={<ReceptionistDashboardMain />} />
                <Route path="register-patient" element={<PatientRegistration />} />
                <Route path="appointments" element={<ReceptionistAppointments />} />
                <Route path="appointment-booking/*" element={<ReceptionistAppointmentBooking />} />
                <Route path="queue" element={<ReceptionistQueue />} />
                <Route path="visits" element={<ReceptionistVisits />} />
                <Route path="reports" element={<ReceptionistReports />} />
                <Route path="profile" element={<ReceptionistProfile />} />
                <Route path="*" element={<Navigate to="/receptionist-dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    );
};

export default ReceptionistDashboard;