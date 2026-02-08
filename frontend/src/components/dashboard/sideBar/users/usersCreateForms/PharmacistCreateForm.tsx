import axios from 'axios';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appendFormData } from "../../../../../utils/formUtils.ts";
import api from "../../../../../utils/api/axios";
import alert from "../../../../../utils/alert.ts";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import Select, { SingleValue } from "react-select";
import { pharmacist_create_form_initial_state } from "../../../../../utils/api/user/PharmacistData.ts";

interface PharmacistCreateFormProps {
    onSuccess?: () => void;
}

const PharmacistCreateForm: React.FC<PharmacistCreateFormProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(
        pharmacist_create_form_initial_state,
    );
    const [recentPhotoPreview, setRecentPhotoPreview] = useState<string | null>(
        null,
    );
    const [nicPhotoPreview, setNicPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [branchOptions, setBranchOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const [isBranchAdmin, setIsBranchAdmin] = useState(false);
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
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
                    const options = data.map(
                        (branch: IBranchData) => ({
                            value: branch.id!, // Ensure ID is present
                            label: branch.center_name,
                        }),
                    );
                    setBranchOptions(options);
                }
            } catch (error) {
                console.error("Failed to fetch branch list", error);
            }
        };

        fetchBranchList();
    }, []);

    const handleInputChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
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

    const handleBranchChange = (
        selectedOption: SingleValue<{ value: string; label: string }>,
    ) => {
        setFormData((prevData) => ({
            ...prevData,
            branch_id: selectedOption ? selectedOption.value : "",
        }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Basic validation
        if (!formData.first_name.trim()) {
            alert.warn('First name is required');
            return;
        }
        if (!formData.last_name.trim()) {
            alert.warn('Last name is required');
            return;
        }
        if (!formData.email.trim()) {
            alert.warn('Email is required');
            return;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            alert.warn('Please enter a valid email address');
            return;
        }
        if (!formData.password.trim()) {
            alert.warn('Password is required');
            return;
        } else if (formData.password.length < 6) {
            alert.warn('Password must be at least 6 characters');
            return;
        }
        if (!confirmPassword.trim()) {
            alert.warn('Please confirm your password');
            return;
        } else if (formData.password !== confirmPassword) {
            alert.warn('Passwords do not match');
            return;
        }

        try {
            setIsSubmitting(true);
            const formDataToSend = appendFormData(formData);
            console.log("form data", formDataToSend);
            // Use consistent endpoint, permissions handled by backend
            const endpoint = "pharmacist/create-pharmacist";
            const response = await api.post(
                endpoint,
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );
            console.log("response", response);

            // Response is already unwrapped by axios interceptor (response.data)
            if (response && response.message) {
                alert.success(response.message);

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
                if (error.response?.status === 400) {
                    // Handle 400 errors (email exists, invalid branch, etc.)
                    const errorMessage = error.response.data?.detail || 'Bad request';
                    if (errorMessage.includes('email already exists')) {
                        alert.warn('This email address is already registered. Please use a different email.');
                    } else if (errorMessage.includes('Branch')) {
                        alert.warn('Invalid branch selected. Please select a valid branch.');
                    } else {
                        alert.warn(errorMessage);
                    }
                } else if (error.response?.status === 422) {
                    console.log(error);
                    setErrors(error.response.data.errors || {});
                    alert.warn('Please check the form for validation errors.');
                } else {
                    alert.warn(
                        "Failed to create pharmacist: " + (error.response?.data?.detail || error.message),
                    );
                }
            } else {
                alert.warn(
                    "Failed to create pharmacist: " + (error as Error).message,
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow-md"
        >
            {/* Form fields remain unchanged... */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    First Name
                </label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.first_name && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.first_name[0]}
                    </p>
                )}
            </div>

            {/* Last Name */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Last Name
                </label>
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.last_name && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.last_name[0]}
                    </p>
                )}
            </div>

            {/* Date of Birth */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Date of Birth
                </label>
                <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.date_of_birth && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.date_of_birth[0]}
                    </p>
                )}
            </div>

            {/* Gender */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Gender
                </label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                {errors.gender && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.gender[0]}
                    </p>
                )}
            </div>

            {/* NIC Number */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC Number
                </label>
                <input
                    type="text"
                    name="nic_number"
                    value={formData.nic_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.nic_number && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.nic_number[0]}
                    </p>
                )}
            </div>

            {/* Mobile Number */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Mobile Number
                </label>
                <input
                    type="text"
                    name="contact_number_mobile"
                    value={formData.contact_number_mobile}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.contact_number_mobile && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contact_number_mobile[0]}
                    </p>
                )}
            </div>

            {/* Landline Number */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Landline Number
                </label>
                <input
                    type="text"
                    name="contact_number_landline"
                    value={formData.contact_number_landline}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.contact_number_landline && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contact_number_landline[0]}
                    </p>
                )}
            </div>

            {/* Email */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.email && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.email[0]}
                    </p>
                )}
            </div>

            {/* Home Address */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Home Address
                </label>
                <textarea
                    name="home_address"
                    value={formData.home_address}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    rows={3}
                />
                {errors.home_address && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.home_address[0]}
                    </p>
                )}
            </div>

            {/* Emergency Contact Info */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Emergency Contact Info
                </label>
                <textarea
                    name="emergency_contact_info"
                    value={formData.emergency_contact_info}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    rows={2}
                />
                {errors.emergency_contact_info && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.emergency_contact_info[0]}
                    </p>
                )}
            </div>

            {/* Branch Selection */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Branch (optional)
                </label>
                {isBranchAdmin ? (
                    <input
                        type="text"
                        value={userBranchName}
                        disabled
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm bg-gray-100"
                    />
                ) : (
                    <Select
                        options={branchOptions}
                        onChange={handleBranchChange}
                        value={branchOptions.find(option => option.value === formData.branch_id)}
                        className="mt-1"
                        placeholder="Select Branch"
                        isClearable
                    />
                )}
                {errors.branch_id && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.branch_id[0]}
                    </p>
                )}
            </div>

            {/* Pharmacist Registration Number */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Registration Number
                </label>
                <input
                    type="text"
                    name="pharmacist_registration_number"
                    value={formData.pharmacist_registration_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.pharmacist_registration_number && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.pharmacist_registration_number[0]}
                    </p>
                )}
            </div>

            {/* Qualifications */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Qualifications
                </label>
                <textarea
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    rows={3}
                />
                {errors.qualifications && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.qualifications[0]}
                    </p>
                )}
            </div>


            {/* Work Experience */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Work Experience
                </label>
                <textarea
                    name="work_experience"
                    value={formData.work_experience}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    rows={3}
                />
                {errors.work_experience && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.work_experience[0]}
                    </p>
                )}
            </div>

            {/* Years of Experience */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Years of Experience
                </label>
                <input
                    type="number"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.years_of_experience && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.years_of_experience[0]}
                    </p>
                )}
            </div>

            {/* Previous Employment */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Previous Employment
                </label>
                <input
                    type="text"
                    name="previous_employment"
                    value={formData.previous_employment}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.previous_employment && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.previous_employment[0]}
                    </p>
                )}
            </div>

            {/* License Validity Date */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    License Validity Date
                </label>
                <input
                    type="date"
                    name="license_validity_date"
                    value={formData.license_validity_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.license_validity_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.license_validity_date[0]}
                    </p>
                )}
            </div>

            {/* Joining Date */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Joining Date
                </label>
                <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.joining_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.joining_date[0]}
                    </p>
                )}
            </div>

            {/* Contract Type */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Contract Type
                </label>
                <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                >
                    <option value="">Select Contract Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                </select>
                {errors.contract_type && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contract_type[0]}
                    </p>
                )}
            </div>

            {/* Contract Duration */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Contract Duration
                </label>
                <input
                    type="text"
                    name="contract_duration"
                    value={formData.contract_duration}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    placeholder="e.g. 1 Year"
                />
                {errors.contract_duration && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contract_duration[0]}
                    </p>
                )}
            </div>

            {/* Probation Start Date */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Probation Start Date
                </label>
                <input
                    type="date"
                    name="probation_start_date"
                    value={formData.probation_start_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.probation_start_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.probation_start_date[0]}
                    </p>
                )}
            </div>

            {/* Probation End Date */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Probation End Date
                </label>
                <input
                    type="date"
                    name="probation_end_date"
                    value={formData.probation_end_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.probation_end_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.probation_end_date[0]}
                    </p>
                )}
            </div>

            {/* Compensation Package */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700">
                    Compensation Package
                </label>
                <textarea
                    name="compensation_package"
                    value={formData.compensation_package}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    rows={2}
                />
                {errors.compensation_package && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.compensation_package[0]}
                    </p>
                )}
            </div>

            {/* Basic Salary */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Basic Salary
                </label>
                <input
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.basic_salary && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.basic_salary[0]}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.password[0]}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Confirm Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                        {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                </div>
            </div>

            {/* Photo Upload */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Photo
                </label>
                <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {recentPhotoPreview && (
                    <img
                        src={recentPhotoPreview}
                        alt="Preview"
                        className="mt-2 h-20 w-20 object-cover rounded-full"
                    />
                )}
                {errors.photo && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.photo[0]}
                    </p>
                )}
            </div>

            {/* NIC Photo Upload */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC Photo
                </label>
                <input
                    type="file"
                    name="nic_photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {nicPhotoPreview && (
                    <img
                        src={nicPhotoPreview}
                        alt="NIC Preview"
                        className="mt-2 h-20 w-32 object-cover rounded-md"
                    />
                )}
                {errors.nic_photo && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.nic_photo[0]}
                    </p>
                )}
            </div>

            <div className="col-span-2 flex justify-center mt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${isSubmitting
                        ? 'bg-neutral-400 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600'
                        }`}
                >
                    {isSubmitting ? 'Creating...' : 'Create Pharmacist'}
                </button>
            </div>
        </form>
    );
};

export default PharmacistCreateForm;
