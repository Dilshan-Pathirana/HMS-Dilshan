import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/common/Layout/DashboardLayout';
import { SidebarMenu } from '../../components/common/Layout/SidebarMenu';
import { ProfilePictureUpload } from '../../components/common/ProfileManagement/ProfilePictureUpload';
import { PasswordChange } from '../../components/common/ProfileManagement/PasswordChange';
import { ContactInfoEdit } from '../../components/common/ProfileManagement/ContactInfoEdit';
import { UserRole } from '../../utils/types/users/UserRole';
import {
    SuperAdminMenuItems,
    DoctorMenuItems,
    PharmacistMenuItems,
    CashierMenuItems,
    PatientMenuItems,
    SupplierMenuItems
} from '../../components/common/Layout/SidebarMenu';
import api from "../../utils/api/axios";

export const ProfilePage: React.FC = () => {
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

            // Fetch full user details
            const response = await api.get(`/users/${storedUser.id}`);
            if (response.data.status === 200) {
                setUserInfo(response.data.data.update_user_details);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            // Fallback to localStorage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUserInfo(storedUser);
        } finally {
            setLoading(false);
        }
    };

    const getMenuItemsByRole = (roleAs: number) => {
        switch (roleAs) {
            case UserRole.SuperAdmin:
            case UserRole.Admin:
                return SuperAdminMenuItems;
            case UserRole.Doctor:
                return DoctorMenuItems;
            case UserRole.Pharmacist:
                return PharmacistMenuItems;
            case UserRole.Cashier:
                return CashierMenuItems;
            case UserRole.Patient:
                return PatientMenuItems;
            // case UserRole.SupplierEntity:
            //     return SupplierMenuItems;
            default:
                return SuperAdminMenuItems;
        }
    };

    const getRoleName = (roleAs: number) => {
        const roleMap: Record<number, string> = {
            1: 'Super Admin',
            2: 'Branch Admin',
            3: 'Doctor',
            4: 'Nurse',
            5: 'Patient',
            6: 'Cashier',
            7: 'Pharmacist',
            8: 'IT Support',
            9: 'Center Aid',
            10: 'Auditor'
        };
        return roleMap[roleAs] || 'User';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-white">
                <div className="text-center">
                    <p className="text-error-600">Error loading profile. Please try again.</p>
                </div>
            </div>
        );
    }

    const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User';
    const roleName = getRoleName(userInfo.role_as);
    const menuItems = getMenuItemsByRole(userInfo.role_as);

    return (
        <DashboardLayout
            userName={userName}
            userRole={roleName}
            profileImage={userInfo.profile_picture}
            sidebarContent={<SidebarMenu items={menuItems} />}
        >
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        My Profile
                    </h1>
                    <p className="text-neutral-600 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Profile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Picture */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Profile Picture</h3>
                            <ProfilePictureUpload
                                currentImage={userInfo.profile_picture}
                                userId={userInfo.id}
                                onUploadSuccess={(imageUrl) => {
                                    setUserInfo({ ...userInfo, profile_picture: imageUrl });
                                }}
                            />
                        </div>

                        {/* User Info Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mt-6">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Account Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-neutral-500">User ID</p>
                                    <p className="text-sm font-medium text-neutral-800">{userInfo.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Role</p>
                                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-500 to-primary-500 text-white text-xs font-semibold rounded-full">
                                        {roleName}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Username</p>
                                    <p className="text-sm font-medium text-neutral-800">{userInfo.username || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Status</p>
                                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                                        userInfo.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-error-100 text-red-700'
                                    }`}>
                                        {userInfo.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <ContactInfoEdit
                            userId={userInfo.id}
                            initialData={{
                                first_name: userInfo.first_name,
                                last_name: userInfo.last_name,
                                email: userInfo.email,
                                phone: userInfo.phone,
                                address: userInfo.address
                            }}
                            onSuccess={fetchUserInfo}
                        />

                        {/* Password Change */}
                        <PasswordChange
                            userId={userInfo.id}
                            onSuccess={() => {
                                console.log('Password changed successfully');
                            }}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
