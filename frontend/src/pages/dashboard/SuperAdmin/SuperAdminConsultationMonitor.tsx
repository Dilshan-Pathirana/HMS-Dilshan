import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import ConsultationMonitor from '../ConsultationMonitor/ConsultationMonitor';

/**
 * Super Admin view — can filter by branch or see all branches combined.
 */
export const SuperAdminConsultationMonitor: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            branchName="All Branches"
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <ConsultationMonitor
                title="All-Branch Consultation Monitor"
                showBranchFilter={true}
            />
        </DashboardLayout>
    );
};

export default SuperAdminConsultationMonitor;
