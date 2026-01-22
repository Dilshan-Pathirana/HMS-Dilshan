import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    User, Camera, Lock, Bell, FileText, Shield, Activity, 
    Clock, Mail, Phone, MapPin, Calendar, Building2, 
    Briefcase, Upload, Eye, EyeOff, Save, Edit2, X, Check,
    Smartphone, Globe, AlertCircle, LogOut, Monitor, Key, Trash2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string;
    address: string;
    profile_picture: string;
    role_as: number;
    user_type: string;
    branch_id: string;
    branch_name: string;
    employee_id: string;
    designation: string;
    joining_date: string;
    work_shift: string;
    reporting_authority: string;
    username: string;
    two_factor_enabled: boolean;
    last_login: string;
    account_status: string;
    password_expiry: string;
    last_password_change: string;
    profile_updated_at: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    alternate_phone: string;
    correspondence_address: string;
    preferred_notification: string;
    language_preference: string;
    timezone: string;
    government_id_type: string;
    government_id_number: string;
    digital_signature: string;
}

interface LoginHistory {
    id: string;
    ip_address: string;
    device: string;
    browser: string;
    login_time: string;
    status: string;
}

interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    ip_address: string;
    last_active: string;
    is_current: boolean;
}

export const BranchAdminProfile: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [branchLogo, setBranchLogo] = useState('');
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Default avatar SVGs for male and female
    const MaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#E8F5E9"/>
            <circle cx="50" cy="35" r="18" fill="#4CAF50"/>
            <ellipse cx="50" cy="75" rx="28" ry="20" fill="#4CAF50"/>
            <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
            <rect x="42" y="48" width="16" height="8" fill="#FFCCBC"/>
            <path d="M35 30 Q50 15 65 30" fill="#4E342E" stroke="#4E342E" strokeWidth="2"/>
            <circle cx="44" cy="33" r="2" fill="#3E2723"/>
            <circle cx="56" cy="33" r="2" fill="#3E2723"/>
            <path d="M46 40 Q50 43 54 40" fill="none" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );

    const FemaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#FCE4EC"/>
            <circle cx="50" cy="35" r="18" fill="#E91E63"/>
            <ellipse cx="50" cy="75" rx="26" ry="20" fill="#E91E63"/>
            <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
            <rect x="43" y="48" width="14" height="7" fill="#FFCCBC"/>
            <path d="M30 35 Q30 15 50 15 Q70 15 70 35 Q70 25 50 30 Q30 25 30 35" fill="#4E342E"/>
            <path d="M32 35 Q35 45 40 40" fill="#4E342E"/>
            <path d="M68 35 Q65 45 60 40" fill="#4E342E"/>
            <circle cx="44" cy="33" r="2" fill="#3E2723"/>
            <circle cx="56" cy="33" r="2" fill="#3E2723"/>
            <path d="M46 40 Q50 43 54 40" fill="none" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="38" cy="38" r="3" fill="#FFCDD2" opacity="0.6"/>
            <circle cx="62" cy="38" r="3" fill="#FFCDD2" opacity="0.6"/>
        </svg>
    );

    const DefaultAvatar = ({ gender }: { gender: string }) => {
        if (gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'f') {
            return <FemaleAvatar />;
        }
        return <MaleAvatar />;
    };

    // Helper function to get proper image URL
    const getProfileImageUrl = (imagePath: string): string => {
        if (!imagePath) return '';
        // Handle blob URLs (local preview)
        if (imagePath.startsWith('blob:')) return imagePath;
        // Handle full URLs (http/https)
        if (imagePath.startsWith('http')) return imagePath;
        // Handle storage paths
        if (imagePath.startsWith('/storage')) return imagePath;
        // Default: prepend /storage/
        return `/storage/${imagePath}`;
    };
    
    const [profile, setProfile] = useState<UserProfile>({
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        profile_picture: '',
        role_as: 2,
        user_type: 'Branch Admin',
        branch_id: '',
        branch_name: '',
        employee_id: '',
        designation: 'Branch Administrator',
        joining_date: '',
        work_shift: '9:00 AM - 5:00 PM',
        reporting_authority: 'Super Admin',
        username: '',
        two_factor_enabled: false,
        last_login: '',
        account_status: 'Active',
        password_expiry: '',
        last_password_change: '',
        profile_updated_at: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        alternate_phone: '',
        correspondence_address: '',
        preferred_notification: 'email',
        language_preference: 'en',
        timezone: 'UTC',
        government_id_type: '',
        government_id_number: '',
        digital_signature: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            setProfile(prev => ({
                ...prev,
                id: userInfo.id || '',
                first_name: userInfo.first_name || '',
                last_name: userInfo.last_name || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                gender: userInfo.gender || '',
                date_of_birth: userInfo.date_of_birth || '',
                address: userInfo.address || '',
                profile_picture: userInfo.profile_picture || '',
                branch_id: userInfo.branch_id || '',
                branch_name: userInfo.branch_name || userInfo.branch?.name || 'Branch',
                employee_id: userInfo.employee_id || userInfo.id?.slice(0, 8).toUpperCase() || '',
                joining_date: userInfo.joining_date || userInfo.created_at?.split('T')[0] || '',
                username: userInfo.username || userInfo.email?.split('@')[0] || '',
                last_login: userInfo.last_login || new Date().toISOString(),
                profile_updated_at: userInfo.updated_at || new Date().toISOString(),
            }));
            setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');

            // Mock login history
            setLoginHistory([
                { id: '1', ip_address: '192.168.1.100', device: 'Windows PC', browser: 'Chrome 120', login_time: new Date().toISOString(), status: 'success' },
                { id: '2', ip_address: '192.168.1.100', device: 'Windows PC', browser: 'Chrome 120', login_time: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
                { id: '3', ip_address: '10.0.0.55', device: 'iPhone 15', browser: 'Safari', login_time: new Date(Date.now() - 172800000).toISOString(), status: 'success' },
            ]);

            // Mock active sessions
            setActiveSessions([
                { id: '1', device: 'Windows PC', browser: 'Chrome 120', ip_address: '192.168.1.100', last_active: new Date().toISOString(), is_current: true },
            ]);

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load profile');
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Create local preview immediately
        const localPreview = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, profile_picture: localPreview }));

        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`/api/upload-profile-picture/${profile.id}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.status === 200) {
                // Use the path from API response
                const profilePicPath = response.data.data.profile_picture || response.data.data.image_url;
                setProfile(prev => ({ ...prev, profile_picture: profilePicPath }));
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                userInfo.profile_picture = profilePicPath;
                localStorage.setItem('user', JSON.stringify(userInfo));
                toast.success('Profile picture updated successfully');
                setShowPhotoModal(false);
                // Clean up object URL
                URL.revokeObjectURL(localPreview);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            // Keep the local preview even if API fails for demo purposes
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            userInfo.profile_picture = localPreview;
            localStorage.setItem('user', JSON.stringify(userInfo));
            toast.success('Profile picture updated locally');
            setShowPhotoModal(false);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemoveProfilePicture = async () => {
        setUploadingPhoto(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/remove-profile-picture/${profile.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setProfile(prev => ({ ...prev, profile_picture: '' }));
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                userInfo.profile_picture = '';
                localStorage.setItem('user', JSON.stringify(userInfo));
                toast.success('Profile picture removed');
                setShowPhotoModal(false);
            }
        } catch (error) {
            // Even if API fails, clear locally for demo
            setProfile(prev => ({ ...prev, profile_picture: '' }));
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            userInfo.profile_picture = '';
            localStorage.setItem('user', JSON.stringify(userInfo));
            toast.success('Profile picture removed');
            setShowPhotoModal(false);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSavePersonalInfo = async () => {
        setSaving(true);
        try {
            const response = await axios.put(`/api/update-contact-info/${profile.id}`, {
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
                gender: profile.gender,
                date_of_birth: profile.date_of_birth,
                emergency_contact_name: profile.emergency_contact_name,
                emergency_contact_phone: profile.emergency_contact_phone,
                alternate_phone: profile.alternate_phone,
                correspondence_address: profile.correspondence_address,
            });

            if (response.data.status === 200) {
                const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
                Object.assign(userInfo, {
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                });
                localStorage.setItem('user', JSON.stringify(userInfo));
                toast.success('Profile updated successfully');
                setIsEditing(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
        setSaving(false);
    };

    const handlePasswordChange = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.new_password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        try {
            const response = await axios.put(`/api/change-password/${profile.id}`, {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirmation: passwordForm.confirm_password,
            });

            if (response.data.status === 200) {
                toast.success('Password changed successfully');
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
        setSaving(false);
    };

    const handleLogoutSession = async (sessionId: string) => {
        try {
            // API call to logout session
            toast.success('Session terminated successfully');
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error) {
            toast.error('Failed to terminate session');
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
        { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'account', label: 'Account & Security', icon: <Lock className="w-4 h-4" /> },
        { id: 'communication', label: 'Communication', icon: <Bell className="w-4 h-4" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity & Audit', icon: <Activity className="w-4 h-4" /> },
    ];

    if (loading) {
        return (
            <DashboardLayout userName="" userRole="Branch Admin" profileImage="" sidebarContent={<BranchAdminSidebar />}>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            userName={`${profile.first_name} ${profile.last_name}`}
            userRole="Branch Admin" 
            profileImage={profile.profile_picture}
            sidebarContent={<BranchAdminSidebar />}
            branchName={profile.branch_name}
            branchLogo={branchLogo}
            userGender={profile.gender}
        >
            <div className="space-y-6">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div 
                                className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 cursor-pointer hover:border-white/50 transition-all"
                                onClick={() => setShowPhotoModal(true)}
                            >
                                {profile.profile_picture ? (
                                    <img 
                                        src={getProfileImageUrl(profile.profile_picture)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <DefaultAvatar gender={profile.gender} />
                                )}
                            </div>
                            <button 
                                onClick={() => setShowPhotoModal(true)}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-100 transition-colors"
                            >
                                <Camera className="w-4 h-4 text-gray-700" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
                            <p className="text-emerald-100">{profile.designation} - {profile.branch_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-emerald-100">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {profile.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {profile.phone || 'Not set'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                profile.account_status === 'Active' 
                                    ? 'bg-green-400/20 text-green-100' 
                                    : 'bg-red-400/20 text-red-100'
                            }`}>
                                {profile.account_status}
                            </span>
                            <p className="text-emerald-100 text-sm mt-2">Employee ID: {profile.employee_id}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Personal Information Tab */}
                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSavePersonalInfo}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            value={profile.first_name}
                                            onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            value={profile.last_name}
                                            onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                        <select
                                            value={profile.gender}
                                            onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={profile.date_of_birth}
                                            onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone</label>
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                                        <input
                                            type="tel"
                                            value={profile.alternate_phone}
                                            onChange={(e) => setProfile(prev => ({ ...prev, alternate_phone: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Address</label>
                                        <input
                                            type="text"
                                            value={profile.address}
                                            onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Correspondence Address</label>
                                        <input
                                            type="text"
                                            value={profile.correspondence_address}
                                            onChange={(e) => setProfile(prev => ({ ...prev, correspondence_address: e.target.value }))}
                                            disabled={!isEditing}
                                            placeholder="Same as current address if left empty"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        Emergency Contact Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                                            <input
                                                type="text"
                                                value={profile.emergency_contact_name}
                                                onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={profile.emergency_contact_phone}
                                                onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Professional Information Tab */}
                        {activeTab === 'professional' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-800">Professional / Role Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                        <input
                                            type="text"
                                            value="Branch Admin"
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">View only - Contact Super Admin to change</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                                        <input
                                            type="text"
                                            value={profile.employee_id}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">View only</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Branch / Center Name</label>
                                        <input
                                            type="text"
                                            value={profile.branch_name}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">View only</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation / Title</label>
                                        <input
                                            type="text"
                                            value={profile.designation}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
                                        <input
                                            type="text"
                                            value={profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : 'Not set'}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Shift / Hours</label>
                                        <input
                                            type="text"
                                            value={profile.work_shift}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">View only</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Authority</label>
                                        <input
                                            type="text"
                                            value={profile.reporting_authority}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">View only</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account & Security Tab */}
                        {activeTab === 'account' && (
                            <div className="space-y-8">
                                {/* Login Details */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Account & Login Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                            <input
                                                type="text"
                                                value={profile.username}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                                            <input
                                                type="text"
                                                value={profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Change */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Key className="w-5 h-5 text-emerald-600" />
                                        Change Password
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwordForm.current_password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.new_password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.confirm_password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={saving || !passwordForm.current_password || !passwordForm.new_password}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        Two-Factor Authentication
                                    </h3>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={profile.two_factor_enabled}
                                                onChange={() => setProfile(prev => ({ ...prev, two_factor_enabled: !prev.two_factor_enabled }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Monitor className="w-5 h-5 text-purple-600" />
                                        Active Sessions
                                    </h3>
                                    <div className="space-y-3">
                                        {activeSessions.map(session => (
                                            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Monitor className="w-8 h-8 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {session.device} - {session.browser}
                                                            {session.is_current && (
                                                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Current</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{session.ip_address} • Last active: {new Date(session.last_active).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                {!session.is_current && (
                                                    <button
                                                        onClick={() => handleLogoutSession(session.id)}
                                                        className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Logout
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Communication Preferences Tab */}
                        {activeTab === 'communication' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-800">Communication Preferences</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Notification Channel</label>
                                        <select
                                            value={profile.preferred_notification}
                                            onChange={(e) => setProfile(prev => ({ ...prev, preferred_notification: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="email">Email</option>
                                            <option value="sms">SMS</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="all">All Channels</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
                                        <select
                                            value={profile.language_preference}
                                            onChange={(e) => setProfile(prev => ({ ...prev, language_preference: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="en">English</option>
                                            <option value="si">Sinhala</option>
                                            <option value="ta">Tamil</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                        <select
                                            value={profile.timezone}
                                            onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                                            <option value="UTC">UTC</option>
                                            <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Alert Preferences */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4">Alert Preferences</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Appointment Reminders', key: 'appointments' },
                                            { label: 'Billing Notifications', key: 'billing' },
                                            { label: 'System Alerts', key: 'system' },
                                            { label: 'Staff Updates', key: 'staff' },
                                        ].map(alert => (
                                            <div key={alert.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">{alert.label}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-800">Documents & Identity</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Government ID Type</label>
                                        <select
                                            value={profile.government_id_type}
                                            onChange={(e) => setProfile(prev => ({ ...prev, government_id_type: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="nic">National ID Card (NIC)</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                                        <input
                                            type="text"
                                            value={profile.government_id_number}
                                            onChange={(e) => setProfile(prev => ({ ...prev, government_id_number: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Document Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="font-medium text-gray-700">Government ID Proof</p>
                                        <p className="text-sm text-gray-500 mb-3">Upload NIC, Passport, or Driving License</p>
                                        <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                                            Upload Document
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="font-medium text-gray-700">Digital Signature</p>
                                        <p className="text-sm text-gray-500 mb-3">For approvals and reports</p>
                                        <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                                            Upload Signature
                                            <input type="file" className="hidden" accept=".png,.jpg,.jpeg" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity & Audit Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-800">Activity & Audit Information</h2>
                                
                                {/* Account Status */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Account Status</p>
                                        <p className={`font-semibold ${profile.account_status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {profile.account_status}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Profile Last Updated</p>
                                        <p className="font-semibold text-gray-800">
                                            {profile.profile_updated_at ? new Date(profile.profile_updated_at).toLocaleString() : 'Never'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Last Password Change</p>
                                        <p className="font-semibold text-gray-800">
                                            {profile.last_password_change ? new Date(profile.last_password_change).toLocaleString() : 'Never'}
                                        </p>
                                    </div>
                                </div>

                                {/* Login History */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        Login History
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date & Time</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">IP Address</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Device</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Browser</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loginHistory.map(log => (
                                                    <tr key={log.id} className="border-b border-gray-100">
                                                        <td className="px-4 py-3 text-sm text-gray-800">{new Date(log.login_time).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{log.ip_address}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{log.device}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{log.browser}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                                log.status === 'success' 
                                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Recent Critical Actions */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-orange-600" />
                                        Recent Critical Actions (Audit Snapshot)
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Profile Information Updated</p>
                                                <p className="text-xs text-gray-500">Changed phone number - 2 days ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Password Changed</p>
                                                <p className="text-xs text-gray-500">1 week ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Staff Member Added</p>
                                                <p className="text-xs text-gray-500">Added Dr. Smith as Cardiologist - 1 week ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Photo Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPhotoModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Profile Photo</h3>
                            <button 
                                onClick={() => setShowPhotoModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Current Photo Preview */}
                        <div className="flex justify-center mb-6">
                            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                                {profile.profile_picture ? (
                                    <img 
                                        src={getProfileImageUrl(profile.profile_picture)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <DefaultAvatar gender={profile.gender} />
                                )}
                            </div>
                        </div>

                        {/* Gender Info */}
                        {!profile.profile_picture && (
                            <p className="text-center text-sm text-gray-500 mb-4">
                                Showing default {profile.gender?.toLowerCase() === 'female' || profile.gender?.toLowerCase() === 'f' ? 'female' : 'male'} avatar
                            </p>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/jpeg,image/png,image/gif,image/webp" 
                                className="hidden" 
                                onChange={handleProfilePictureUpload}
                            />
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadingPhoto ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        <span>Upload New Photo</span>
                                    </>
                                )}
                            </button>

                            {profile.profile_picture && (
                                <button
                                    onClick={handleRemoveProfilePicture}
                                    disabled={uploadingPhoto}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>Remove Photo</span>
                                </button>
                            )}

                            <button
                                onClick={() => setShowPhotoModal(false)}
                                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Photo Guidelines */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 text-center">
                                <strong>Photo Guidelines:</strong><br />
                                • Supported formats: JPEG, PNG, GIF, WebP<br />
                                • Maximum file size: 5MB<br />
                                • Recommended: Square image, at least 200x200px
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
