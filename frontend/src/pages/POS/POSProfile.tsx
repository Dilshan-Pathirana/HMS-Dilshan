import React, { useEffect, useState } from 'react';
import { 
    User, Mail, Phone, MapPin, Lock, Camera, Save, Eye, EyeOff, 
    CheckCircle, AlertCircle, Shield, Key, Settings, Bell, 
    ChevronRight, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from "../../utils/api/axios";

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address?: string;
    profile_picture?: string;
    role_as: number;
    branch_id?: string;
    is_active: boolean;
    gender?: string;
}

const POSProfile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'settings'>('profile');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Edit states
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: ''
    });
    
    // Password states
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    // Profile picture
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchProfile = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Stored user:', storedUser);
            
            // Try to fetch from cashier profile API
            try {
                const response = await api.get(
                    `http://127.0.0.1:8000/api/cashier-profile`,
                    getAuthHeaders()
                );
                console.log('API response:', response.data);
                if (response.data.status === 200 && response.data.data?.update_user_details) {
                    const userData = response.data.data.update_user_details;
                    setProfile(userData);
                    setEditData({
                        first_name: userData.first_name || '',
                        last_name: userData.last_name || '',
                        phone: userData.phone || '',
                        address: userData.address || ''
                    });
                    setLoading(false);
                    return;
                }
            } catch (apiError) {
                console.error('API error, falling back to localStorage:', apiError);
            }
            
            // Fallback to localStorage data
            const nameParts = (storedUser.name || '').split(' ');
            const profileData: UserProfile = {
                id: storedUser.id || '',
                first_name: storedUser.first_name || nameParts[0] || 'User',
                last_name: storedUser.last_name || nameParts.slice(1).join(' ') || '',
                email: storedUser.email || '',
                phone: storedUser.phone || '',
                address: storedUser.address || '',
                profile_picture: storedUser.profile_picture || '',
                role_as: storedUser.role_as || storedUser.role || 3,
                is_active: true,
                gender: storedUser.gender || ''
            };
            
            setProfile(profileData);
            setEditData({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone: profileData.phone,
                address: profileData.address || ''
            });
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            // Set a minimal profile from localStorage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const nameParts = (storedUser.name || 'User').split(' ');
            setProfile({
                id: storedUser.id || '',
                first_name: nameParts[0] || 'User',
                last_name: nameParts.slice(1).join(' ') || '',
                email: storedUser.email || '',
                phone: storedUser.phone || '',
                role_as: storedUser.role_as || 3,
                is_active: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const response = await api.put(
                `http://127.0.0.1:8000/api/cashier-profile`,
                editData,
                getAuthHeaders()
            );
            if (response.data.status === 200) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setEditMode(false);
                // Update localStorage
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...storedUser,
                    ...editData,
                    name: `${editData.first_name} ${editData.last_name}`
                }));
                fetchProfile();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        
        setSaving(true);
        try {
            const response = await api.put(
                `http://127.0.0.1:8000/api/cashier-profile/password`,
                {
                    current_password: passwordData.current_password,
                    password: passwordData.new_password,
                    password_confirmation: passwordData.confirm_password
                },
                getAuthHeaders()
            );
            if (response.data.status === 200) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                `http://127.0.0.1:8000/api/cashier-profile/picture`,
                formData,
                {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (response.data.profile_picture) {
                // Get current profile or create from localStorage
                const localStoredUser = JSON.parse(localStorage.getItem('user') || '{}');
                const nameParts = (localStoredUser.name || 'User').split(' ');
                const currentProfile: UserProfile = profile || {
                    id: localStoredUser.id || '',
                    first_name: nameParts[0] || 'User',
                    last_name: nameParts.slice(1).join(' ') || '',
                    email: localStoredUser.email || '',
                    phone: localStoredUser.phone || '',
                    role_as: localStoredUser.role_as || 3,
                    is_active: true,
                    profile_picture: localStoredUser.profile_picture || '',
                    address: localStoredUser.address || '',
                    gender: localStoredUser.gender || ''
                };
                setProfile({ ...currentProfile, profile_picture: response.data.profile_picture });
                // Update localStorage
                localStorage.setItem('user', JSON.stringify({
                    ...localStoredUser,
                    profile_picture: response.data.profile_picture
                }));
                setMessage({ type: 'success', text: 'Profile picture updated!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload photo' });
        } finally {
            setUploadingPhoto(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const getImageUrl = (imagePath?: string): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('blob:')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/storage')) return imagePath;
        return `/storage/${imagePath}`;
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    // If profile is null after loading, create a minimal profile from localStorage
    const displayProfile = profile || (() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const nameParts = (storedUser.name || 'User').split(' ');
        return {
            id: storedUser.id || '',
            first_name: nameParts[0] || 'User',
            last_name: nameParts.slice(1).join(' ') || '',
            email: storedUser.email || '',
            phone: storedUser.phone || '',
            role_as: storedUser.role_as || storedUser.role || 3,
            is_active: true,
            profile_picture: storedUser.profile_picture || '',
            address: storedUser.address || '',
            gender: storedUser.gender || ''
        } as UserProfile;
    })();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/pos" 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-500 text-sm">Manage your account settings</p>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Profile Picture Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="text-center">
                            {/* Avatar */}
                            <div className="relative inline-block">
                                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 border-4 border-white shadow-lg mx-auto">
                                    {displayProfile.profile_picture ? (
                                        <img 
                                            src={getImageUrl(displayProfile.profile_picture)} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-emerald-600">
                                            {displayProfile.first_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full text-white cursor-pointer hover:shadow-lg transition-shadow">
                                    <Camera className="w-4 h-4" />
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                    />
                                </label>
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Name & Role */}
                            <h3 className="text-lg font-bold text-gray-900 mt-4">
                                {displayProfile.first_name} {displayProfile.last_name}
                            </h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-semibold rounded-full">
                                {getRoleName(displayProfile.role_as)}
                            </span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3">Account Info</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Status</p>
                                    <p className="font-medium text-green-600">Active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-gray-500 text-xs">Email</p>
                                    <p className="font-medium text-gray-800 truncate">{displayProfile.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                activeTab === 'profile' 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 border-l-4 border-emerald-500' 
                                    : 'hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="font-medium">Edit Profile</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                activeTab === 'password' 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 border-l-4 border-emerald-500' 
                                    : 'hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <Key className="w-5 h-5" />
                            <span className="font-medium">Change Password</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                activeTab === 'settings' 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 border-l-4 border-emerald-500' 
                                    : 'hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                    </div>
                </div>

                {/* Right Column - Content */}
                <div className="lg:col-span-3">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                                {!editMode ? (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={editData.first_name}
                                            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                            disabled={!editMode}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                                                editMode 
                                                    ? 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                                    : 'border-gray-200 bg-gray-50'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={editData.last_name}
                                            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                            disabled={!editMode}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                                                editMode 
                                                    ? 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                                    : 'border-gray-200 bg-gray-50'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={displayProfile?.email || ''}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            disabled={!editMode}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                                                editMode 
                                                    ? 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                                    : 'border-gray-200 bg-gray-50'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                                        <textarea
                                            value={editData.address}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            disabled={!editMode}
                                            rows={3}
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                                                editMode 
                                                    ? 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                                                    : 'border-gray-200 bg-gray-50'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Change Password</h2>
                            
                            <div className="max-w-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                                    className="w-full mt-4 px-6 py-3 text-white font-medium bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Changing Password...' : 'Change Password'}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <h4 className="text-sm font-semibold text-amber-800 mb-2">Password Requirements</h4>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    <li>• Minimum 6 characters</li>
                                    <li>• Use a mix of letters and numbers for better security</li>
                                    <li>• Avoid using easily guessable passwords</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Settings</h2>
                            
                            <div className="space-y-6">
                                {/* Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Notifications</h4>
                                            <p className="text-sm text-gray-500">Receive alerts for transactions</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Sound Effects */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Settings className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Sound Effects</h4>
                                            <p className="text-sm text-gray-500">Play sound on successful transaction</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Auto-lock Screen</h4>
                                            <p className="text-sm text-gray-500">Lock after 5 minutes of inactivity</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default POSProfile;
