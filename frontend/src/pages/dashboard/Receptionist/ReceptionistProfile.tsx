import React, { useState, useEffect } from 'react';
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Building2, 
    Calendar,
    Lock,
    Save,
    Edit2,
    X,
    Check,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import receptionistService, { Profile } from '../../../services/receptionistService';

const ReceptionistProfile: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [editData, setEditData] = useState({
        phone: '',
        address: '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await receptionistService.getProfile();
            setProfile(data);
            setEditData({
                phone: data.phone || '',
                address: data.address || '',
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            await receptionistService.updateProfile(editData);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            setEditing(false);
            fetchProfile();
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordData.new_password.length < 8) {
            setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
            return;
        }

        setSaving(true);
        try {
            await receptionistService.changePassword(passwordData);
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setChangingPassword(false);
            setPasswordData({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-3xl font-bold">
                        {profile?.name?.charAt(0).toUpperCase() || 'R'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">{profile?.name || 'Receptionist'}</h1>
                        <p className="text-neutral-500">Receptionist • {profile?.branch || 'Branch'}</p>
                        <p className="text-sm text-neutral-400">Employee ID: {profile?.employee_id || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-error-50 text-red-800 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-800">Profile Information</h2>
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setEditing(false);
                                setEditData({
                                    phone: profile?.phone || '',
                                    address: profile?.address || '',
                                });
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    )}
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <User className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Full Name</p>
                                    <p className="font-medium text-neutral-800">{profile?.name || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <Mail className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Email</p>
                                    <p className="font-medium text-neutral-800">{profile?.email || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <Phone className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-500">Phone Number</p>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={editData.phone}
                                            onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <p className="font-medium text-neutral-800">{profile?.phone || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <Building2 className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Branch</p>
                                    <p className="font-medium text-neutral-800">{profile?.branch || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Joined Date</p>
                                    <p className="font-medium text-neutral-800">
                                        {profile?.joined_date ? new Date(profile.joined_date).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <MapPin className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-500">Address</p>
                                    {editing ? (
                                        <textarea
                                            value={editData.address}
                                            onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Enter address"
                                        />
                                    ) : (
                                        <p className="font-medium text-neutral-800">{profile?.address || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {editing && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-100 rounded-lg">
                            <Lock className="w-5 h-5 text-neutral-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-800">Password & Security</h2>
                            <p className="text-sm text-neutral-500">Manage your account password</p>
                        </div>
                    </div>
                    {!changingPassword && (
                        <button
                            onClick={() => setChangingPassword(true)}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                            <Lock className="w-4 h-4" />
                            Change Password
                        </button>
                    )}
                </div>

                {changingPassword && (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                                    className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                                        className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.new_password_confirmation}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setChangingPassword(false);
                                    setPasswordData({
                                        current_password: '',
                                        new_password: '',
                                        new_password_confirmation: '',
                                    });
                                }}
                                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={saving || !passwordData.current_password || !passwordData.new_password}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                            >
                                <Lock className="w-4 h-4" />
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceptionistProfile;
