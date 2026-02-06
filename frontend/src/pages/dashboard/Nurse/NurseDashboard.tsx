import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../../components/common/Layout/SidebarMenu';
import { 
    Activity, 
    Users, 
    ClipboardList,
    Heart,
    Syringe,
    FileText,
    AlertCircle,
    User,
    CheckSquare,
    RefreshCw,
    MessageSquare
} from 'lucide-react';
import { nurseService } from '../../../services/nurseService';
import NurseDashboardMain from './NurseDashboardMain';
import NurseProfile from './NurseProfile';
import NursePatients from './NursePatients';
import NurseVitalSigns from './NurseVitalSigns';
import NurseMedication from './NurseMedication';
import NurseTasks from './NurseTasks';
import NurseHandover from './NurseHandover';
import NurseFeedback from './NurseFeedback';

const NurseMenuItems = [
    { label: 'Dashboard', icon: <Activity className="w-5 h-5" />, path: '/nurse-dashboard' },
    { label: 'My Profile', icon: <User className="w-5 h-5" />, path: '/nurse-dashboard/profile' },
    { label: 'Patients', icon: <Users className="w-5 h-5" />, path: '/nurse-dashboard/patients' },
    { label: 'Tasks', icon: <CheckSquare className="w-5 h-5" />, path: '/nurse-dashboard/tasks' },
    { label: 'Handover', icon: <RefreshCw className="w-5 h-5" />, path: '/nurse-dashboard/handover' },
    { label: 'Feedback', icon: <MessageSquare className="w-5 h-5" />, path: '/nurse-dashboard/feedback' },
];

interface NurseStats {
    assignedPatients: number;
    pendingMedications: number;
    vitalSignsRecorded: number;
    criticalAlerts: number;
}

export const NurseDashboard: React.FC = () => {
    const [stats, setStats] = useState<NurseStats>({
        assignedPatients: 0,
        pendingMedications: 0,
        vitalSignsRecorded: 0,
        criticalAlerts: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Nurse');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await nurseService.getDashboardStats();
            if (data) {
                setStats({
                    assignedPatients: data.assignedPatients || 0,
                    pendingMedications: data.pendingHandovers || 0,
                    vitalSignsRecorded: data.vitalSignsRecorded || 0,
                    criticalAlerts: data.criticalAlerts || 0
                });
            }
            
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setProfileImage(userInfo.profile_picture || '');
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ 
        title, 
        value, 
        icon, 
        color 
    }: { 
        title: string; 
        value: number; 
        icon: React.ReactNode; 
        color: string;
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-neutral-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-neutral-800">{value}</p>
        </div>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Nurse"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={NurseMenuItems} />}
        >
            <Routes>
                <Route index element={<NurseDashboardMain />} />
                <Route path="profile" element={<NurseProfile />} />
                <Route path="patients" element={<NursePatients />} />
                <Route path="vital-signs" element={<NurseVitalSigns />} />
                <Route path="medication" element={<NurseMedication />} />
                <Route path="tasks" element={<NurseTasks />} />
                <Route path="handover" element={<NurseHandover />} />
                <Route path="feedback" element={<NurseFeedback />} />
                <Route path="*" element={<Navigate to="/nurse-dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    );
};
