import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorCreateForm from '../../../../components/dashboard/sideBar/users/usersCreateForms/DoctorCreateForm';
import NurseCreateForm from '../../../../components/dashboard/sideBar/users/usersCreateForms/NurseCreateForm';
import CashierCreateForm from '../../../../components/dashboard/sideBar/users/usersCreateForms/CashierCreateForm';
import PharmacistCreateForm from '../../../../components/dashboard/sideBar/users/usersCreateForms/PharmacistCreateForm';
import GenericUserCreateForm from '../../../../components/dashboard/sideBar/users/usersCreateForms/GenericUserCreateForm';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

// User types available for Branch Admin to create (excluding Branch Admin and Super Admin)
const staffUserTypes = [
    "Doctor",
    "Nurse",
    "Cashier",
    "Pharmacist",
    "IT Assistant",
    "Center Aids",
    "Support Staff",
    "Receptionist",
    "Therapist",
    "Radiology/Imaging Technologist",
    "Medical Technologist",
    "Phlebotomist",
    "Surgical Technologist",
    "Counselor",
    "HRM Manager",
    "Dietitian",
    "Paramedic/EMT",
    "Audiologist",
    "Medical Assistant",
    "Clerk",
    "Director",
    "Secretary"
];

export const AddStaff: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [selectedUserType, setSelectedUserType] = useState<string>(staffUserTypes[0]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleUserTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUserType(event.target.value);
    };

    // User types with specific forms
    const hasSpecificForm = ["Doctor", "Nurse", "Cashier", "Pharmacist"].includes(selectedUserType);

    // Sidebar Menu Component
    const SidebarMenu = () => (
        <nav className="flex-1 py-4">
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-primary-500 text-white shadow-md'
                                    : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchLogo={branchLogo}
            branchName={branchName}
            userGender={userGender}
        >
            <div className="min-h-screen bg-neutral-50 p-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/branch-admin/hrm/staff')}
                        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Staff Profiles
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">Add New Staff</h1>
                            <p className="text-neutral-600">Create a new staff member for your branch</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    {/* User Type Selection */}
                    <div className="mb-6">
                        <label
                            htmlFor="userType"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Select Staff Type:
                        </label>
                        <select
                            id="userType"
                            value={selectedUserType}
                            onChange={handleUserTypeChange}
                            className="w-full max-w-md p-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        >
                            {staffUserTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Form Title */}
                    <div className="border-b border-neutral-200 pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-neutral-800">
                            {selectedUserType} Registration Form
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            Fill in the details below to create a new {selectedUserType.toLowerCase()} account
                        </p>
                    </div>

                    {/* Forms Container - Override default styling */}
                    <div className="add-staff-form-container">
                        {selectedUserType === "Doctor" && <DoctorCreateForm />}
                        {selectedUserType === "Nurse" && <NurseCreateForm />}
                        {selectedUserType === "Cashier" && <CashierCreateForm />}
                        {selectedUserType === "Pharmacist" && <PharmacistCreateForm />}
                        {!hasSpecificForm && <GenericUserCreateForm userType={selectedUserType} />}
                    </div>
                </div>
            </div>

            {/* Custom styles to override form positioning */}
            <style>{`
                .add-staff-form-container > div {
                    margin: 0 !important;
                    padding: 0 !important;
                    margin-left: 0 !important;
                    margin-top: 0 !important;
                }
                .add-staff-form-container form {
                    max-width: 100%;
                }
            `}</style>
        </DashboardLayout>
    );
};

export default AddStaff;
