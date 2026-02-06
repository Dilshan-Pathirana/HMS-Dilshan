import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Calendar, Award,
    Briefcase, Shield, Edit2, Save, X, Clock,
    Heart, Users, Activity, RefreshCw,
    Loader2, AlertCircle, Lock, Eye, EyeOff, Check
} from 'lucide-react';
import { nurseService, NurseShift } from '../../../services/nurseService';

interface ProfileData {
    id: number;
    name: string;
    email: string;
    phone: string;
    employee_id: string;
    license_number: string;
    specialization: string;
    department: string;
    joined_date: string;
    shift: string;
    certifications: string[];
    address?: string;
    emergency_contact?: string;
    emergency_contact_name?: string;
}

export const NurseProfile: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'certifications' | 'schedule' | 'password'>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [shifts, setShifts] = useState<NurseShift[]>([]);

    const [profile, setProfile] = useState<ProfileData>({
        id: 0,
        name: '',
        email: '',
        phone: '',
        employee_id: '',
        license_number: '',
        specialization: '',
        department: '',
        joined_date: '',
        shift: '',
        certifications: []
    });

    const [editProfile, setEditProfile] = useState<{phone: string; address: string; emergency_contact: string; emergency_contact_name: string}>({ 
        phone: '', 
        address: '', 
        emergency_contact: '',
        emergency_contact_name: ''
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Fetch profile from API
    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await nurseService.getProfile();
            // The service returns data directly, not wrapped in 'user'
            const data: any = response || {};
            setProfile({
                id: data.id || 0,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                employee_id: data.employee_id || `NUR-${data.id || '000'}`,
                license_number: data.license_number || 'Not specified',
                specialization: data.specialization || 'General Nursing',
                department: data.department || 'Not assigned',
                joined_date: data.joined_date || data.created_at || '',
                shift: data.current_shift || 'Not assigned',
                certifications: data.certifications || [],
                address: data.address || '',
                emergency_contact: data.emergency_contact || '',
                emergency_contact_name: data.emergency_contact_name || ''
            });
            setEditProfile({ 
                phone: data.phone || '',
                address: data.address || '',
                emergency_contact: data.emergency_contact || '',
                emergency_contact_name: data.emergency_contact_name || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch shifts for schedule
    const fetchShifts = async () => {
        try {
            const response = await nurseService.getShifts();
            setShifts(response || []);
        } catch (err) {
            console.error('Failed to fetch shifts:', err);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchShifts();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await nurseService.updateProfile({ 
                phone: editProfile.phone,
                address: editProfile.address,
                emergency_contact: editProfile.emergency_contact
            });
            setProfile({ 
                ...profile, 
                phone: editProfile.phone,
                address: editProfile.address,
                emergency_contact: editProfile.emergency_contact,
                emergency_contact_name: editProfile.emergency_contact_name
            });
            setIsEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            setError('New passwords do not match');
            return;
        }
        if (passwordData.new_password.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await nurseService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.new_password_confirmation
            });
            setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
            setSuccess('Password changed successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to change password:', err);
            setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setSaving(false);
        }
    };

    // Generate working days from shifts
    const generateWorkingDays = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => {
            const shift = shifts.find(s => {
                const shiftDate = new Date(s.shift_date);
                const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });
                return dayName === day;
            });
            if (shift) {
                return {
                    day,
                    shift: shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1),
                    hours: shift.actual_start 
                        ? `${shift.actual_start} - ${shift.actual_end || 'In progress'}`
                        : `${shift.scheduled_start} - ${shift.scheduled_end}`
                };
            }
            return { day, shift: 'Off', hours: '-' };
        });
    };

    const workingDays = generateWorkingDays();

    const [stats] = useState({
        patients_served: 0,
        tasks_completed: 0,
        avg_rating: 0,
        years_experience: 0
    });

    // Loading component
    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-neutral-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen sm:ml-64 mt-16">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <User className="w-7 h-7 text-teal-600" />
                            My Profile
                        </h1>
                        <p className="text-neutral-600">Manage your professional information and credentials</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchProfile}
                            className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-neutral-600" />
                        </button>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditProfile({ 
                                            phone: profile.phone,
                                            address: profile.address || '',
                                            emergency_contact: profile.emergency_contact || '',
                                            emergency_contact_name: profile.emergency_contact_name || ''
                                        });
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                                    disabled={saving}
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-error-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-error-600" />
                        <span className="text-red-800">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-error-600 hover:text-red-800">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">{success}</span>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-6 text-white">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <User className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                            <p className="text-blue-100 mb-2">{profile.specialization} • {profile.department}</p>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    {profile.employee_id}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shield className="w-4 h-4" />
                                    {profile.license_number}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Joined {new Date(profile.joined_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm mb-2">
                                <p className="text-xs text-blue-100">Current Shift</p>
                                <p className="font-semibold">{profile.shift}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Patients Served</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.patients_served}</p>
                            </div>
                            <Users className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Tasks Completed</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.tasks_completed}</p>
                            </div>
                            <Activity className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Average Rating</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.avg_rating}/5.0</p>
                            </div>
                            <Award className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Experience</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.years_experience} Years</p>
                            </div>
                            <Heart className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'profile'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('certifications')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'certifications'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Certifications
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'schedule'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'password'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Change Password
                            </span>
                        </button>
                    </div>

                    {/* Profile Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <User className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={profile.name}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">Name cannot be changed. Contact admin if needed.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <Mail className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">Email cannot be changed. Contact admin if needed.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number</label>
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${isEditing ? 'border-primary-500 bg-white' : 'border-neutral-300 bg-neutral-50'}`}>
                                        <Phone className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="tel"
                                            value={isEditing ? editProfile.phone : profile.phone}
                                            disabled={!isEditing}
                                            className="flex-1 border-none outline-none bg-transparent"
                                            onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                                        />
                                    </div>
                                    {isEditing && <p className="text-xs text-primary-500 mt-1">You can update your phone number</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Employee ID</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <Briefcase className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={profile.employee_id}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">License Number</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <Shield className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={profile.license_number}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Specialization</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <Award className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={profile.specialization}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Department</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <MapPin className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={profile.department}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Joined Date</label>
                                    <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50">
                                        <Calendar className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={new Date(profile.joined_date).toLocaleDateString()}
                                            disabled
                                            className="flex-1 border-none outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${isEditing ? 'border-primary-500 bg-white' : 'border-neutral-300 bg-neutral-50'}`}>
                                        <MapPin className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={isEditing ? editProfile.address : (profile.address || 'Not specified')}
                                            disabled={!isEditing}
                                            placeholder="Enter your address"
                                            className="flex-1 border-none outline-none bg-transparent"
                                            onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                                        />
                                    </div>
                                    {isEditing && <p className="text-xs text-primary-500 mt-1">You can update your address</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Emergency Contact Name</label>
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${isEditing ? 'border-primary-500 bg-white' : 'border-neutral-300 bg-neutral-50'}`}>
                                        <User className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={isEditing ? editProfile.emergency_contact_name : (profile.emergency_contact_name || 'Not specified')}
                                            disabled={!isEditing}
                                            placeholder="Enter emergency contact name"
                                            className="flex-1 border-none outline-none bg-transparent"
                                            onChange={(e) => setEditProfile({ ...editProfile, emergency_contact_name: e.target.value })}
                                        />
                                    </div>
                                    {isEditing && <p className="text-xs text-primary-500 mt-1">You can update emergency contact name</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Emergency Contact Number</label>
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${isEditing ? 'border-primary-500 bg-white' : 'border-neutral-300 bg-neutral-50'}`}>
                                        <Phone className="w-5 h-5 text-neutral-400" />
                                        <input
                                            type="tel"
                                            value={isEditing ? editProfile.emergency_contact : (profile.emergency_contact || 'Not specified')}
                                            disabled={!isEditing}
                                            placeholder="Enter emergency contact number"
                                            className="flex-1 border-none outline-none bg-transparent"
                                            onChange={(e) => setEditProfile({ ...editProfile, emergency_contact: e.target.value })}
                                        />
                                    </div>
                                    {isEditing && <p className="text-xs text-primary-500 mt-1">You can update emergency contact</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Certifications Tab */}
                    {activeTab === 'certifications' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.certifications.map((cert, index) => (
                                    <div key={index} className="p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Award className="w-6 h-6 text-primary-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900">{cert}</h4>
                                                <p className="text-sm text-neutral-500">Valid until 2026</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Day</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Shift</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Working Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {workingDays.map((day, index) => (
                                            <tr key={index} className={day.shift === 'Off' ? 'bg-neutral-50' : ''}>
                                                <td className="px-4 py-3 font-medium text-neutral-900">{day.day}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        day.shift === 'Off' ? 'bg-neutral-200 text-neutral-700' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {day.shift}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 flex items-center gap-2">
                                                    {day.shift !== 'Off' && <Clock className="w-4 h-4" />}
                                                    {day.hours}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Password Change Tab */}
                    {activeTab === 'password' && (
                        <div className="p-6">
                            <div className="max-w-md">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary-500" />
                                    Change Your Password
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordData.new_password_confirmation}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseProfile;
