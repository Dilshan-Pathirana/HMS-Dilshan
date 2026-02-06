import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Award,
    GraduationCap,
    Briefcase,
    Edit3,
    Save,
    X,
    Loader2,
    Camera,
    Clock,
    Building,
    Calendar,
    Shield,
    Key,
    Eye,
    EyeOff,
    Check
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface DoctorProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    nic: string;
    specialization: string;
    qualifications: string[];
    experience_years: number;
    registration_number: string;
    bio: string;
    consultation_fee: number;
    available_days: string[];
    branches: { id: string; name: string }[];
    profile_image?: string;
    address: string;
    languages: string[];
}

const DoctorProfile: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<DoctorProfile>>({});
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    
    // Password change
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
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Mock data for now
            setProfile({
                id: userId || '',
                name: 'Doctor',
                email: 'doctor@example.com',
                phone: '+94 71 234 5678',
                nic: '123456789V',
                specialization: 'General Medicine',
                qualifications: ['MBBS', 'MD'],
                experience_years: 10,
                registration_number: 'SLMC-12345',
                bio: 'Experienced physician with a focus on patient-centered care.',
                consultation_fee: 2500,
                available_days: ['Monday', 'Wednesday', 'Friday'],
                branches: [{ id: '1', name: 'Main Branch' }],
                address: 'Colombo, Sri Lanka',
                languages: ['English', 'Sinhala']
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put(`/doctor/${userId}/profile`, editedProfile);
            setProfile({ ...profile, ...editedProfile } as DoctorProfile);
            setEditMode(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert('Passwords do not match');
            return;
        }

        try {
            setChangingPassword(true);
            await api.post('/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            alert('Password changed successfully!');
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-800">Profile Settings</h1>
                <p className="text-neutral-500">Manage your professional profile and account settings</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                            activeTab === 'profile'
                                ? 'text-primary-500 border-b-2 border-primary-500 bg-blue-50'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <User className="w-5 h-5" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                            activeTab === 'security'
                                ? 'text-primary-500 border-b-2 border-primary-500 bg-blue-50'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <Shield className="w-5 h-5" />
                        Security
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="p-6">
                        {/* Profile Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                        {profile.name.charAt(0)}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-neutral-50">
                                        <Camera className="w-4 h-4 text-neutral-600" />
                                    </button>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800">Dr. {profile.name}</h2>
                                    <p className="text-primary-500 font-medium">{profile.specialization}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <Award className="w-4 h-4" />
                                            {profile.registration_number}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-4 h-4" />
                                            {profile.experience_years} years exp.
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {!editMode ? (
                                <button
                                    onClick={() => {
                                        setEditedProfile(profile);
                                        setEditMode(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditMode(false);
                                            setEditedProfile({});
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Profile Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary-500" />
                                    Contact Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-neutral-500">Email</label>
                                        <input
                                            type="email"
                                            value={editMode ? (editedProfile.email || '') : profile.email}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                                            disabled={!editMode}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-500">Phone</label>
                                        <input
                                            type="tel"
                                            value={editMode ? (editedProfile.phone || '') : profile.phone}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                            disabled={!editMode}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-500">Address</label>
                                        <input
                                            type="text"
                                            value={editMode ? (editedProfile.address || '') : profile.address}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                                            disabled={!editMode}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-primary-500" />
                                    Professional Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-neutral-500">Specialization</label>
                                        <input
                                            type="text"
                                            value={profile.specialization}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-500">Qualifications</label>
                                        <input
                                            type="text"
                                            value={profile.qualifications.join(', ')}
                                            disabled
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-500">Consultation Fee (LKR)</label>
                                        <input
                                            type="number"
                                            value={editMode ? (editedProfile.consultation_fee || 0) : profile.consultation_fee}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, consultation_fee: parseInt(e.target.value) })}
                                            disabled={!editMode}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="md:col-span-2">
                                <h3 className="font-semibold text-neutral-800 mb-3">Bio</h3>
                                <textarea
                                    rows={4}
                                    value={editMode ? (editedProfile.bio || '') : profile.bio}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                                />
                            </div>

                            {/* Branches */}
                            <div>
                                <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-3">
                                    <Building className="w-5 h-5 text-primary-500" />
                                    Assigned Branches
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.branches.map((branch) => (
                                        <span key={branch.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {branch.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Languages */}
                            <div>
                                <h3 className="font-semibold text-neutral-800 mb-3">Languages</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.languages.map((lang, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="p-6">
                        <div className="max-w-md">
                            <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
                                <Key className="w-5 h-5 text-primary-500" />
                                Change Password
                            </h3>
                            
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                        >
                                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            required
                                            minLength={8}
                                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                                        <p className="text-error-500 text-sm mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || passwordData.new_password !== passwordData.confirm_password}
                                    className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {changingPassword ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorProfile;
