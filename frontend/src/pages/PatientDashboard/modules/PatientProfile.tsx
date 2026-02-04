import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Camera,
    Edit2,
    Save,
    X,
    Lock,
    Eye,
    EyeOff,
    Shield,
    CheckCircle,
    AlertCircle,
    Droplet,
    Heart,
    Activity
} from 'lucide-react';
import api from "../../../utils/api/axios";
import useFetchPatientDetails from '../../../utils/api/PatientAppointment/FetchPatientDetails';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PatientProfile: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const { userDetails: fetchedPatient } = useFetchPatientDetails(userId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Profile data
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        date_of_birth: '',
        gender: '',
        blood_type: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        profile_photo: ''
    });

    // Editable profile copy
    const [editedProfile, setEditedProfile] = useState({ ...profile });

    // Password change
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        if (fetchedPatient) {
            const profileData = {
                first_name: fetchedPatient.firstName || '',
                last_name: fetchedPatient.lastName || '',
                email: fetchedPatient.email || '',
                phone: fetchedPatient.phone || '',
                address: fetchedPatient.address || '',
                city: fetchedPatient.city || '',
                date_of_birth: fetchedPatient.dateOfBirth || '',
                gender: fetchedPatient.gender || '',
                blood_type: fetchedPatient.bloodType || '',
                emergency_contact_name: fetchedPatient.emergencyContactName || '',
                emergency_contact_phone: fetchedPatient.emergencyContactPhone || '',
                profile_photo: ''
            };
            setProfile(profileData);
            setEditedProfile(profileData);
        }
    }, [fetchedPatient]);

    const handleSaveProfile = async () => {
        setLoading(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const response = await api.put(`/patient/profile/${userId}`, editedProfile);
            if (response.data.status === 200) {
                setProfile(editedProfile);
                setIsEditing(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setSaveError(response.data.message || 'Failed to update profile');
            }
        } catch (error: any) {
            setSaveError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedProfile(profile);
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess(false);

        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            setPasswordError('All fields are required');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            const response = await api.put(`/change-password/${userId}`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.confirm_password
            });

            if (response.data.status === 200) {
                setPasswordSuccess(true);
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess(false);
                }, 2000);
            } else {
                setPasswordError(response.data.message || 'Failed to change password');
            }
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Current password is incorrect');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedProfile({ ...editedProfile, profile_photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = () => {
        const first = profile.first_name?.charAt(0) || '';
        const last = profile.last_name?.charAt(0) || '';
        return (first + last).toUpperCase() || 'P';
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} years old`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                    <p className="text-gray-500">Manage your personal information</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">Profile updated successfully!</span>
                </div>
            )}
            {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{saveError}</span>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cover & Avatar Section */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="relative">
                            {(isEditing ? editedProfile.profile_photo : profile.profile_photo) ? (
                                <img
                                    src={isEditing ? editedProfile.profile_photo : profile.profile_photo}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                                    {getInitials()}
                                </div>
                            )}
                            {isEditing && (
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors">
                                    <Camera className="w-4 h-4 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {profile.first_name} {profile.last_name}
                        </h2>
                        {profile.date_of_birth && (
                            <span className="text-gray-500">{calculateAge(profile.date_of_birth)}</span>
                        )}
                    </div>

                    {/* Quick Info Pills */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {profile.blood_type && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">
                                <Droplet className="w-4 h-4" />
                                Blood Type: {profile.blood_type}
                            </div>
                        )}
                        {profile.gender && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm">
                                <User className="w-4 h-4" />
                                {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                First Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.first_name}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.first_name || '-'}</p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Last Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.last_name}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.last_name || '-'}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedProfile.email}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.email || '-'}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editedProfile.phone}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.phone || '-'}</p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Date of Birth
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={editedProfile.date_of_birth}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">
                                    {profile.date_of_birth 
                                        ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                        : '-'
                                    }
                                </p>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender
                            </label>
                            {isEditing ? (
                                <select
                                    value={editedProfile.gender}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            ) : (
                                <p className="text-gray-800 py-2">
                                    {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '-'}
                                </p>
                            )}
                        </div>

                        {/* Blood Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Droplet className="w-4 h-4 inline mr-2" />
                                Blood Type
                            </label>
                            {isEditing ? (
                                <select
                                    value={editedProfile.blood_type}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, blood_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select blood type</option>
                                    {BLOOD_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-gray-800 py-2">{profile.blood_type || '-'}</p>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                City
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.city}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.city || '-'}</p>
                            )}
                        </div>

                        {/* Address - Full Width */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Address
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={editedProfile.address}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            ) : (
                                <p className="text-gray-800 py-2">{profile.address || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedProfile.emergency_contact_name}
                                onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact_name: e.target.value })}
                                placeholder="Emergency contact's name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        ) : (
                            <p className="text-gray-800 py-2">{profile.emergency_contact_name || '-'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={editedProfile.emergency_contact_phone}
                                onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact_phone: e.target.value })}
                                placeholder="Emergency contact's phone"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        ) : (
                            <p className="text-gray-800 py-2">{profile.emergency_contact_phone || '-'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Account Security
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-700">Password</p>
                        <p className="text-sm text-gray-500">Last changed: Unknown</p>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Lock className="w-5 h-5" />
                        Change Password
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                                        setPasswordError('');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {passwordSuccess ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-800">Password Changed!</h3>
                                    <p className="text-gray-500">Your password has been updated successfully.</p>
                                </div>
                            ) : (
                                <>
                                    {passwordError && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {passwordError}
                                        </div>
                                    )}

                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!passwordSuccess && (
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                                        setPasswordError('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Update Password
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfile;
