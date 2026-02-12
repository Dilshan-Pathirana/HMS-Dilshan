import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import ConsultationMonitor from '../ConsultationMonitor/ConsultationMonitor';

/**
 * Branch Admin view — auto-scoped to their branch on the backend
 * (role_as === 2 → backend uses current_user.branch_id).
 */
export const BranchAdminConsultationMonitor: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            branchName={branchName}
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
        >
            <ConsultationMonitor
                title="Branch Consultation Monitor"
                showBranchFilter={false}
            />
        </DashboardLayout>
    );
};

export default BranchAdminConsultationMonitor;
