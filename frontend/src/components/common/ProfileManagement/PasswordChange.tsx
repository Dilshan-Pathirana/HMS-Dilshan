import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from "../../../utils/api/axios";

interface PasswordChangeProps {
    userId: string;
    onSuccess?: () => void;
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({ userId, onSuccess }) => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            setError('All fields are required');
            return;
        }

        const passwordError = validatePassword(formData.new_password);
        if (passwordError) {
            setError(passwordError);
            return;
         }

        if (formData.new_password !== formData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (formData.current_password === formData.new_password) {
            setError('New password must be different from current password');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(`/change-password/${userId}`, {
                current_password: formData.current_password,
                new_password: formData.new_password,
                new_password_confirmation: formData.confirm_password
            });

            if (response.data.status === 200) {
                setSuccess(true);
                setFormData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
                onSuccess?.();
                
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.data.message || 'Failed to change password');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error changing password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg">
                    <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-neutral-800">Change Password</h3>
                    <p className="text-sm text-neutral-500">Update your account password</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Current Password <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={formData.current_password}
                            onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        New Password <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={formData.new_password}
                            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                        Min 8 characters, include uppercase, lowercase, and number
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Confirm New Password <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-error-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Password changed successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-primary-500 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
};
