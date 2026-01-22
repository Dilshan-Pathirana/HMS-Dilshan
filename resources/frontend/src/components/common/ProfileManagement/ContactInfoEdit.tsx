import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface ContactInfoEditProps {
    userId: string;
    initialData?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    onSuccess?: () => void;
}

export const ContactInfoEdit: React.FC<ContactInfoEditProps> = ({ 
    userId, 
    initialData,
    onSuccess 
}) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                first_name: initialData.first_name || '',
                last_name: initialData.last_name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                address: initialData.address || ''
            });
        }
    }, [initialData]);

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const re = /^[0-9+\-\s()]{10,}$/;
        return re.test(phone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!formData.first_name || !formData.last_name) {
            setError('First name and last name are required');
            return;
        }

        if (formData.email && !validateEmail(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            setError('Please enter a valid phone number');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(`/api/update-contact-info/${userId}`, formData);

            if (response.data.status === 200) {
                setSuccess(true);
                onSuccess?.();
                
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.data.message || 'Failed to update contact information');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error updating contact information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                    <p className="text-sm text-gray-500">Update your personal details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Enter first name"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Enter last name"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Enter email address"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        Address
                    </label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter your address"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Contact information updated successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};
