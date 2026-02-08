import axios from 'axios';
import React, { useEffect, useState } from "react";
import api from "../../../../../utils/api/axios";
import { useNavigate } from "react-router-dom";
import alert from "../../../../../utils/alert.ts";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import Select, { SingleValue } from 'react-select';

interface GenericUserCreateFormProps {
    userType: string;
    onSuccess?: () => void;
}

const GenericUserCreateForm: React.FC<GenericUserCreateFormProps> = ({ userType, onSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        nic: '',
        date_of_birth: '',
        gender: '',
        branch_id: '',
        joining_date: '',
        basic_salary: '',
        password: '',
        confirm_password: '',
        photo: null as File | null,
        nic_photo: null as File | null,
    });
    const [recentPhotoPreview, setRecentPhotoPreview] = useState<string | null>(null);
    const [nicPhotoPreview, setNicPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [branchOptions, setBranchOptions] = useState<{ value: string; label: string; }[]>([]);
    const [isBranchAdmin, setIsBranchAdmin] = useState(false);
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Check if user is Branch Admin and get their branch
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const roleAs = userInfo.role_as;

        // Role 2 is Branch Admin
        if (roleAs === 2) {
            setIsBranchAdmin(true);
            if (userInfo.branch_id) {
                setUserBranchId(userInfo.branch_id);
                setUserBranchName(userInfo.branch_name || userInfo.center_name || 'Your Branch');
                setFormData(prev => ({ ...prev, branch_id: userInfo.branch_id }));
            }
        }

        const fetchBranchList = async () => {
            try {
                // Endpoint is /branches, and interceptor returns data directly (Array of branches)
                const data = await api.get<IBranchData[]>("/branches");

                if (Array.isArray(data)) {
                    const options = data.map((branch: IBranchData) => ({
                        value: branch.id!, // Ensure ID is present
                        label: branch.center_name
                    }));
                    setBranchOptions(options);
                }
            } catch (error) {
                console.error("Failed to fetch branch list", error);

                /*
                if (axios.isAxiosError(error)) {
                   // Optional: toast.error or existing alert
                }
                */
            }
        };

        // Only fetch branches if NOT a branch admin (who is locked to their branch)
        // Or fetch anyway to populate the one option?
        // Logic below (line 49) sets userBranchId if Branch Admin.
        // If we are Super Admin, we need the list.
        fetchBranchList();
    }, []);

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = event.target;
        if (files && files.length > 0) {
            const file = files[0];
            setFormData({
                ...formData,
                [name]: file,
            });

            if (name === "photo") {
                setRecentPhotoPreview(URL.createObjectURL(file));
            } else if (name === "nic_photo") {
                setNicPhotoPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleBranchChange = (selectedOption: SingleValue<{ value: string; label: string }>) => {
        setFormData(prevData => ({
            ...prevData,
            branch_id: selectedOption ? selectedOption.value : ''
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic required fields
        const newErrors: Record<string, string[]> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = ['First name is required'];
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = ['Last name is required'];
        }
        if (!formData.email.trim()) {
            newErrors.email = ['Email is required'];
        }

        if (!formData.password.trim()) {
            newErrors.password = ['Password is required'];
        } else if (formData.password.length < 6) {
            newErrors.password = ['Password must be at least 6 characters'];
        }

        if (!formData.confirm_password.trim()) {
            newErrors.confirm_password = ['Please confirm your password'];
        } else if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = ['Passwords do not match'];
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            alert.warn('Please fix the password errors before submitting');
            return;
        }

        // Branch validation

        // Ensure Super Admin has no branch
        if (userType === "Super Admin") {
            // force clear branch_id for Super Admin just in case
            formData.branch_id = "";
        }

        // Map user types to their API endpoints
        // Use branch-admin prefixed endpoints for Branch Admin users
        const baseEndpointMap: Record<string, string> = {
            "IT Assistant": "create-it-assistant",
            "Branch Admin": "create-branch-admin",
            "Center Aids": "create-center-aids",
            "Support Staff": "create-support-staff",
            "Receptionist": "create-receptionist",
            "Therapist": "create-therapist",
            "Radiology/Imaging Technologist": "create-radiology-technologist",
            "Medical Technologist": "create-medical-technologist",
            "Phlebotomist": "create-phlebotomist",
            "Surgical Technologist": "create-surgical-technologist",
            "Counselor": "create-counselor",
            "HRM Manager": "create-hrm-manager",
            "Dietitian": "create-dietitian",
            "Paramedic/EMT": "create-paramedic",
            "Audiologist": "create-audiologist",
            "Medical Assistant": "create-medical-assistant",
            "Clerk": "create-clerk",
            "Director": "create-director",
            "Secretary": "create-secretary"
        };

        const baseEndpoint = baseEndpointMap[userType] || 'create-user';
        // Use branch-admin prefix for Branch Admin users (except for creating other Branch Admins)
        const endpoint = isBranchAdmin && userType !== "Branch Admin"
            ? `branch-admin/${baseEndpoint}`
            : baseEndpoint;

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                // Don't send confirm_password to backend
                if (key === 'confirm_password') return;
                if (key === 'branch_id' && (!value || value === '')) return; // optional branch
                if (value !== null && value !== '') {
                    formDataToSend.append(key, value);
                }
            });
            formDataToSend.append('user_type', userType);

            // Use generic staff endpoint for all user types
            const response = await api.post('users/create-staff', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Response is already unwrapped by axios interceptor (response.data)
            if (response && response.message) {
                alert.success(response.message || `${userType} created successfully`);

                // Call onSuccess callback or redirect based on user role
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    } else if (isBranchAdmin) {
                        navigate('/branch-admin/hrm/staff');
                    } else {
                        navigate('/dashboard/users/list');
                    }
                }, 1500);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const response = error.response;

                // Handle 400 Bad Request (email exists, etc.)
                if (response?.status === 400) {
                    const errorMessage = response.data?.detail || 'Bad request';
                    if (errorMessage.includes('email already exists')) {
                        alert.warn('This email address is already registered. Please use a different email.');
                    } else {
                        alert.warn(errorMessage);
                    }
                    return;
                }

                // Handle 422 Validation Errors
                if (response?.status === 422) {
                    const validationErrors = response.data.errors || response.data.error || {};
                    setErrors(validationErrors);

                    // Create a detailed error message
                    const errorMessages = Object.entries(validationErrors)
                        .map(([field, messages]) => {
                            const messageArray = Array.isArray(messages) ? messages : [messages];
                            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return `• ${fieldName}: ${messageArray.join(', ')}`;
                        })
                        .join('\n');

                    alert.warn(`Please fix the following errors:\n\n${errorMessages}`);
                    return;
                }

                // Handle 404 Not Found (endpoint doesn't exist)
                if (response?.status === 404) {
                    alert.warn(`Sorry, the system is not yet set up to create ${userType} accounts.\n\nPlease contact your system administrator for assistance.`);
                    return;
                }

                // Handle 405 Method Not Allowed
                if (response?.status === 405) {
                    alert.warn(`Sorry, the system is not yet configured to create ${userType} accounts.\n\nPlease contact your system administrator for assistance.`);
                    return;
                }

                // Handle other HTTP errors
                const errorMsg = response?.data?.detail || response?.data?.message || response?.data?.error || error.message;
                alert.warn(`Unable to create ${userType} account:\n\n${errorMsg}\n\nPlease try again or contact support if the problem continues.`);
            } else {
                alert.warn(`Unable to create ${userType} account:\n\n${(error as Error).message}\n\nPlease try again or contact support if the problem continues.`);
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow-md"
        >
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    First Name <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.first_name && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.first_name[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Last Name <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.last_name && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.last_name[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Email <span className="text-error-500">*</span>
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.email && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.email[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Phone <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.phone && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.phone[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.nic && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.nic[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Date of Birth <span className="text-error-500">*</span>
                </label>
                <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.date_of_birth && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.date_of_birth[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Gender <span className="text-error-500">*</span>
                </label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                {errors.gender && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.gender[0]}
                    </p>
                )}
            </div>

            {userType !== "Super Admin" && (
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-neutral-700">
                        Branch (optional)
                    </label>
                    {isBranchAdmin ? (
                        <div className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm bg-neutral-100">
                            {userBranchName}
                            <input type="hidden" name="branch_id" value={userBranchId} />
                        </div>
                    ) : (
                        <Select
                            options={branchOptions}
                            onChange={handleBranchChange}
                            value={branchOptions.find(opt => opt.value === formData.branch_id) || null}
                            className="mt-1"
                            placeholder="Select a branch (Optional)"
                            isClearable
                        />
                    )}
                    {errors.branch_id && (
                        <p className="text-error-500 text-sm mt-1">
                            {errors.branch_id[0]}
                        </p>
                    )}
                </div>
            )}

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Joining Date <span className="text-error-500">*</span>
                </label>
                <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.joining_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.joining_date[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Basic Salary <span className="text-error-500">*</span>
                </label>
                <input
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    required
                />
                {errors.basic_salary && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.basic_salary[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Password <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter login password (min 6 characters)"
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.password ? 'border-error-500' : 'border-neutral-300'}`}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.password[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Confirm Password <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.confirm_password ? 'border-error-500' : 'border-neutral-300'}`}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    >
                        {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                {errors.confirm_password && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.confirm_password[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Address
                </label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.address && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.address[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Recent Photo
                </label>
                <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {recentPhotoPreview && (
                    <img
                        src={recentPhotoPreview}
                        alt="Recent Photo Preview"
                        className="mt-2 w-32 h-32 object-cover rounded-md"
                    />
                )}
                {errors.photo && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.photo[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC Photo
                </label>
                <input
                    type="file"
                    name="nic_photo"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {nicPhotoPreview && (
                    <img
                        src={nicPhotoPreview}
                        alt="NIC Photo Preview"
                        className="mt-2 w-32 h-32 object-cover rounded-md"
                    />
                )}
                {errors.nic_photo && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.nic_photo[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1 md:col-span-2">
                <button
                    type="submit"
                    className="w-full bg-primary-500 text-white p-2 rounded-md shadow-sm hover:bg-primary-600"
                >
                    Create {userType}
                </button>
            </div>
        </form>
    );
};

export default GenericUserCreateForm;
