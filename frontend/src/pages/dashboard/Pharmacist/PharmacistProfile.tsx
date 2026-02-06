import React, { useEffect, useState, useRef } from 'react';
import {
    User, Camera, Lock, Bell, FileText, Shield, Activity,
    Clock, Mail, Phone, MapPin, Calendar, Building2,
    Briefcase, Upload, Eye, EyeOff, Save, Edit2, X,
    AlertCircle, Award, Monitor, Trash2
} from 'lucide-react';
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
    license_number: string;
    license_expiry: string;
    pharmacy_council_reg: string;
    slmc_reg: string;
    government_id_type: string;
    government_id_number: string;
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

export const PharmacistProfile: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        role_as: 4,
        user_type: 'Pharmacist',
        branch_id: '',
        branch_name: '',
        employee_id: '',
        designation: 'Pharmacist',
        joining_date: '',
        work_shift: 'Morning',
        reporting_authority: 'Pharmacy Supervisor',
        username: '',
        two_factor_enabled: false,
        last_login: '',
        account_status: 'active',
        password_expiry: '',
        last_password_change: '',
        profile_updated_at: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        alternate_phone: '',
        correspondence_address: '',
        preferred_notification: 'email',
        language_preference: 'English',
        timezone: 'Asia/Colombo',
        license_number: '',
        license_expiry: '',
        pharmacy_council_reg: '',
        slmc_reg: '',
        government_id_type: 'NIC',
        government_id_number: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

    // Default avatar SVGs
    const MaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#E3F2FD" />
            <circle cx="50" cy="35" r="18" fill="#2196F3" />
            <ellipse cx="50" cy="75" rx="28" ry="20" fill="#2196F3" />
            <circle cx="50" cy="35" r="15" fill="#FFCCBC" />
            <path d="M 35 35 Q 35 30 40 30 Q 42 28 42 32 Q 42 35 40 36 Q 35 36 35 35 Z" fill="#333" />
            <path d="M 58 35 Q 58 30 63 30 Q 65 28 65 32 Q 65 35 63 36 Q 58 36 58 35 Z" fill="#333" />
            <path d="M 45 45 Q 50 48 55 45" fill="none" stroke="#333" strokeWidth="2" />
        </svg>
    );

    const FemaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#FCE4EC" />
            <circle cx="50" cy="35" r="18" fill="#E91E63" />
            <ellipse cx="50" cy="75" rx="28" ry="20" fill="#E91E63" />
            <circle cx="50" cy="35" r="15" fill="#FFCCBC" />
            <path d="M 35 35 Q 35 30 40 30 Q 42 28 42 32 Q 42 35 40 36 Q 35 36 35 35 Z" fill="#333" />
            <path d="M 58 35 Q 58 30 63 30 Q 65 28 65 32 Q 65 35 63 36 Q 58 36 58 35 Z" fill="#333" />
            <path d="M 45 45 Q 50 48 55 45" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M 30 25 Q 25 20 30 15" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M 70 25 Q 75 20 70 15" fill="none" stroke="#333" strokeWidth="2" />
        </svg>
    );

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
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
                branch_name: userInfo.branch_name || userInfo.center_name || 'Branch',
                employee_id: userInfo.employee_id || userInfo.id?.slice(0, 8).toUpperCase() || '',
                joining_date: userInfo.joining_date || userInfo.created_at?.split('T')[0] || '',
                username: userInfo.username || userInfo.email?.split('@')[0] || '',
                last_login: userInfo.last_login || new Date().toISOString(),
                profile_updated_at: userInfo.updated_at || new Date().toISOString(),
                license_number: userInfo.license_number || 'PH' + Math.floor(Math.random() * 100000),
                pharmacy_council_reg: userInfo.pharmacy_council_reg || 'PC' + Math.floor(Math.random() * 100000),
            }));

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
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, profile_picture: localPreview }));

        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        userInfo.profile_picture = localPreview;
        localStorage.setItem('user', JSON.stringify(userInfo));
        alert('Profile picture updated successfully');
        setShowPhotoModal(false);
    };

    const handleRemoveProfilePicture = () => {
        setProfile(prev => ({ ...prev, profile_picture: '' }));
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        userInfo.profile_picture = '';
        localStorage.setItem('user', JSON.stringify(userInfo));
        alert('Profile picture removed successfully');
        setShowPhotoModal(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setTimeout(() => {
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            Object.assign(userInfo, profile);
            localStorage.setItem('user', JSON.stringify(userInfo));
            setSaving(false);
            setIsEditing(false);
            alert('Profile updated successfully');
        }, 1000);
    };

    const handleChangePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            alert('New passwords do not match');
            return;
        }

        if (passwordForm.new_password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('Password changed successfully');
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        }, 1000);
    };

    const handleTerminateSession = (sessionId: string) => {
        setActiveSessions(sessions => sessions.filter(s => s.id !== sessionId));
        alert('Session terminated successfully');
    };

    const handleLogoutAllDevices = () => {
        if (confirm('Are you sure you want to logout from all devices?')) {
            setActiveSessions([]);
            localStorage.clear();
            navigate('/');
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
        { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'account', label: 'Account Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'communication', label: 'Communication', icon: <Bell className="w-4 h-4" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity Log', icon: <Activity className="w-4 h-4" /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-0 md:ml-64 min-h-screen bg-neutral-50 p-6 pt-24">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Profile Picture */}
                <div className="bg-gradient-to-r from-primary-500 to-cyan-700 rounded-xl shadow-lg p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                                {profile.profile_picture ? (
                                    <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profile.gender === 'female' ? <FemaleAvatar /> : <MaleAvatar />
                                )}
                            </div>
                            <button
                                onClick={() => setShowPhotoModal(true)}
                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-neutral-100 transition-colors"
                            >
                                <Camera className="w-5 h-5 text-primary-500" />
                            </button>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {profile.first_name} {profile.last_name}
                            </h1>
                            <p className="text-blue-100 text-lg mb-4">{profile.designation} • {profile.user_type}</p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                                    <Building2 className="w-4 h-4 text-white" />
                                    <span className="text-white">{profile.branch_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                                    <Briefcase className="w-4 h-4 text-white" />
                                    <span className="text-white">ID: {profile.employee_id}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                                    <Award className="w-4 h-4 text-white" />
                                    <span className="text-white">License: {profile.license_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-neutral-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-500 bg-blue-50'
                                        : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Personal Info Tab */}
                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-neutral-800">Personal Information</h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            value={profile.first_name}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name *</label>
                                        <input
                                            type="text"
                                            value={profile.last_name}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Phone *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                            <input
                                                type="date"
                                                value={profile.date_of_birth}
                                                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                                        <select
                                            value={profile.gender}
                                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                                            <textarea
                                                value={profile.address}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                disabled={!isEditing}
                                                rows={3}
                                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Emergency Contact Name</label>
                                        <input
                                            type="text"
                                            value={profile.emergency_contact_name}
                                            onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Emergency Contact Phone</label>
                                        <input
                                            type="tel"
                                            value={profile.emergency_contact_phone}
                                            onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Professional Info Tab */}
                        {activeTab === 'professional' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Professional Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Employee ID</label>
                                        <input
                                            type="text"
                                            value={profile.employee_id}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Designation</label>
                                        <input
                                            type="text"
                                            value={profile.designation}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Pharmacy License Number</label>
                                        <input
                                            type="text"
                                            value={profile.license_number}
                                            onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">License Expiry Date</label>
                                        <input
                                            type="date"
                                            value={profile.license_expiry}
                                            onChange={(e) => setProfile({ ...profile, license_expiry: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Pharmacy Council Registration</label>
                                        <input
                                            type="text"
                                            value={profile.pharmacy_council_reg}
                                            onChange={(e) => setProfile({ ...profile, pharmacy_council_reg: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">SLMC Registration (if applicable)</label>
                                        <input
                                            type="text"
                                            value={profile.slmc_reg}
                                            onChange={(e) => setProfile({ ...profile, slmc_reg: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Branch/Pharmacy</label>
                                        <input
                                            type="text"
                                            value={profile.branch_name}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Joining Date</label>
                                        <input
                                            type="date"
                                            value={profile.joining_date}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Work Shift</label>
                                        <select
                                            value={profile.work_shift}
                                            onChange={(e) => setProfile({ ...profile, work_shift: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        >
                                            <option value="Morning">Morning (8 AM - 4 PM)</option>
                                            <option value="Evening">Evening (4 PM - 12 AM)</option>
                                            <option value="Night">Night (12 AM - 8 AM)</option>
                                            <option value="Rotational">Rotational</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Reporting Authority</label>
                                        <input
                                            type="text"
                                            value={profile.reporting_authority}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-primary-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-blue-900">Professional Information Note</p>
                                            <p className="text-sm text-blue-700 mt-1">
                                                License and registration details are verified by HR department. Contact HR for any updates to employment details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Security Tab */}
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Account Security</h2>

                                {/* Change Password Section */}
                                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-primary-500" />
                                        Change Password
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwordForm.current_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5 text-neutral-400" /> : <Eye className="w-5 h-5 text-neutral-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.new_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-5 h-5 text-neutral-400" /> : <Eye className="w-5 h-5 text-neutral-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.confirm_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-neutral-400" /> : <Eye className="w-5 h-5 text-neutral-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleChangePassword}
                                            disabled={saving}
                                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </div>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        Two-Factor Authentication
                                    </h3>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-neutral-700">Add an extra layer of security to your account</p>
                                            <p className="text-sm text-neutral-500 mt-1">
                                                Status: <span className={profile.two_factor_enabled ? 'text-green-600 font-medium' : 'text-neutral-600'}>
                                                    {profile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setProfile({ ...profile, two_factor_enabled: !profile.two_factor_enabled })}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${profile.two_factor_enabled
                                                    ? 'bg-error-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {profile.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                                        </button>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Monitor className="w-5 h-5 text-purple-600" />
                                            Active Sessions
                                        </span>
                                        <button
                                            onClick={handleLogoutAllDevices}
                                            className="text-sm px-4 py-2 bg-error-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            Logout All Devices
                                        </button>
                                    </h3>

                                    <div className="space-y-3">
                                        {activeSessions.map(session => (
                                            <div key={session.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <Monitor className="w-5 h-5 text-neutral-600 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-neutral-800">
                                                            {session.device} • {session.browser}
                                                            {session.is_current && (
                                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Current</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-neutral-600">IP: {session.ip_address}</p>
                                                        <p className="text-xs text-neutral-500">Last active: {new Date(session.last_active).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                {!session.is_current && (
                                                    <button
                                                        onClick={() => handleTerminateSession(session.id)}
                                                        className="px-4 py-2 text-sm bg-error-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        Terminate
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Communication Tab */}
                        {activeTab === 'communication' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Communication Preferences</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Preferred Notification Method</label>
                                        <select
                                            value={profile.preferred_notification}
                                            onChange={(e) => setProfile({ ...profile, preferred_notification: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        >
                                            <option value="email">Email</option>
                                            <option value="sms">SMS</option>
                                            <option value="both">Both Email & SMS</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Language Preference</label>
                                        <select
                                            value={profile.language_preference}
                                            onChange={(e) => setProfile({ ...profile, language_preference: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        >
                                            <option value="English">English</option>
                                            <option value="Sinhala">Sinhala</option>
                                            <option value="Tamil">Tamil</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Timezone</label>
                                        <select
                                            value={profile.timezone}
                                            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        >
                                            <option value="Asia/Colombo">Asia/Colombo (IST +5:30)</option>
                                            <option value="UTC">UTC</option>
                                            <option value="GMT">GMT</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Alternate Phone</label>
                                        <input
                                            type="tel"
                                            value={profile.alternate_phone}
                                            onChange={(e) => setProfile({ ...profile, alternate_phone: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-3">Notification Types</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-500 rounded" />
                                            <span className="text-sm text-blue-900">Prescription alerts</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-500 rounded" />
                                            <span className="text-sm text-blue-900">Stock level alerts</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-500 rounded" />
                                            <span className="text-sm text-blue-900">Expiry date notifications</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-500 rounded" />
                                            <span className="text-sm text-blue-900">System updates</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" className="w-4 h-4 text-primary-500 rounded" />
                                            <span className="text-sm text-blue-900">Promotional messages</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Documents & Credentials</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-neutral-800">Pharmacy License</h4>
                                            <FileText className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-3">License No: {profile.license_number}</p>
                                        <button className="text-sm text-primary-500 hover:underline">View Document</button>
                                    </div>

                                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-neutral-800">Council Registration</h4>
                                            <FileText className="w-5 h-5 text-green-600" />
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-3">Reg No: {profile.pharmacy_council_reg}</p>
                                        <button className="text-sm text-primary-500 hover:underline">View Document</button>
                                    </div>

                                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-neutral-800">Government ID</h4>
                                            <FileText className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-3">{profile.government_id_type}: {profile.government_id_number || 'Not provided'}</p>
                                        <button className="text-sm text-primary-500 hover:underline">Upload/Update</button>
                                    </div>

                                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-neutral-800">Certificates</h4>
                                            <Award className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-3">Professional certifications</p>
                                        <button className="text-sm text-primary-500 hover:underline">Manage Certificates</button>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-900">Document Verification</p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                All documents must be verified by the HR department. Upload clear, legible copies of your professional credentials.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity Log Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Activity Log</h2>

                                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Login History</h3>
                                    <div className="space-y-3">
                                        {loginHistory.map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-5 h-5 text-neutral-600 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-neutral-800">{log.device} • {log.browser}</p>
                                                        <p className="text-sm text-neutral-600">IP: {log.ip_address}</p>
                                                        <p className="text-xs text-neutral-500">{new Date(log.login_time).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-error-100 text-red-700'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Profile Updates</h3>
                                    <p className="text-sm text-neutral-600">
                                        Last updated: {new Date(profile.profile_updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Photo Upload Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-neutral-800">Update Profile Picture</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-5 h-5" />
                                {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                            </button>

                            {profile.profile_picture && (
                                <button
                                    onClick={handleRemoveProfilePicture}
                                    disabled={uploadingPhoto}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-error-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Remove Photo
                                </button>
                            )}

                            <p className="text-xs text-neutral-500 text-center">
                                Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
