import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import { SuperAdminAnalyticsContent } from './SuperAdminAnalyticsContent';

export const SuperAdminAnalytics: React.FC = () => {
    const [userName, setUserName] = useState('Super Admin');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const name = userInfo.first_name && userInfo.last_name
            ? `${userInfo.first_name} ${userInfo.last_name}`
            : 'Super Admin';
        setUserName(name);
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <SuperAdminAnalyticsContent />
        </DashboardLayout>
    );
};
