import axios from 'axios';
import React, { useEffect, useState } from "react";
import api from "../../../../../utils/api/axios";
import { useNavigate } from "react-router-dom";
import alert from "../../../../../utils/alert.ts";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import Select, { SingleValue } from 'react-select';
import FileUploadField from "../../../../common/FileUploadField";

interface NurseCreateFormProps {
    onSuccess?: () => void;
}

const NurseCreateForm: React.FC<NurseCreateFormProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        nic_or_passport: '',
        mobile_number: '',
        landline_number: '',
        email: '',
        password: '',
        home_address: '',
        emergency_contact: '',
        nursing_reg_number: '',
        qualifications: '',
        years_of_experience: 0,
        specialization: '',
        nurse_training_certifications: '',
        license_validity_date: '',
        additional_certifications: '',
        joining_date: '',
        employee_id: '',
        contract_type: '',
        probation_start: '',
        probation_end: '',
        compensation_package: '',
        basic_salary: '',
        branch_id: '',
        photo: null as File | null,
        nic_photo: null as File | null,
    });

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [branchOptions, setBranchOptions] = useState<{ value: string; label: string; }[]>([]);
    const [isBranchAdmin, setIsBranchAdmin] = useState(false);
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

        // Fetch branch list (for Super Admin or if branch not auto-set)
        const fetchBranchList = async () => {
            try {
                // Endpoint is /branches, and interceptor returns data directly (Array of branches)
                const data = await api.get<IBranchData[]>("/branches");

                if (Array.isArray(data)) {
                    const options = data.map((branch: IBranchData) => ({
                        value: branch.id!,
                        label: branch.center_name
                    }));
                    setBranchOptions(options);
                }
            } catch (error) {
                console.error("Failed to fetch branch list", error);
            }
        };
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
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleBranchChange = (selectedOption: SingleValue<{ value: string; label: string }>) => {
        setFormData(prevData => ({
            ...prevData,
            branch_id: selectedOption ? selectedOption.value : ''
        }));
        if (errors.branch_id) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.branch_id;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string[]> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = ['First name is required'];
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = ['Last name is required'];
        }
        if (!formData.email.trim()) {
            newErrors.email = ['Email is required'];
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = ['Please enter a valid email address'];
        }
        if (!formData.password.trim()) {
            newErrors.password = ['Password is required'];
        } else if (formData.password.length < 6) {
            newErrors.password = ['Password must be at least 6 characters'];
        }
        if (!confirmPassword.trim()) {
            newErrors.confirm_password = ['Please confirm your password'];
        } else if (formData.password !== confirmPassword) {
            newErrors.confirm_password = ['Passwords do not match'];
        }
        if (!formData.date_of_birth) {
            newErrors.date_of_birth = ['Date of birth is required'];
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form submission started');
        console.log('Form data:', formData);

        if (!validateForm()) {
            alert.warn('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        console.log('Validation passed, sending request...');

        try {
            const formDataToSend = new FormData();

            // Required fields - always sent
            formDataToSend.append('first_name', formData.first_name);
            formDataToSend.append('last_name', formData.last_name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('date_of_birth', formData.date_of_birth);
            if (formData.branch_id) {
                formDataToSend.append('branch_id', formData.branch_id);
            }
            formDataToSend.append('employee_id', formData.employee_id || `NRS${Date.now()}`);
            formDataToSend.append('contract_type', formData.contract_type || 'full-time');

            // Optional fields - only send if not empty
            if (formData.gender) {
                formDataToSend.append('gender', formData.gender.toLowerCase());
            }
            if (formData.nic_or_passport) {
                formDataToSend.append('nic_number', formData.nic_or_passport);
            }
            if (formData.mobile_number) {
                formDataToSend.append('contact_number_mobile', formData.mobile_number);
            }
            if (formData.landline_number) {
                formDataToSend.append('contact_number_landline', formData.landline_number);
            }
            if (formData.home_address) {
                formDataToSend.append('home_address', formData.home_address);
            }
            if (formData.emergency_contact) {
                formDataToSend.append('emergency_contact_info', formData.emergency_contact);
            }
            if (formData.joining_date) {
                formDataToSend.append('joining_date', formData.joining_date);
            }
            if (formData.nursing_reg_number) {
                formDataToSend.append('medical_registration_number', formData.nursing_reg_number);
            }
            if (formData.qualifications) {
                formDataToSend.append('qualifications', formData.qualifications);
            }
            if (formData.years_of_experience > 0) {
                formDataToSend.append('years_of_experience', formData.years_of_experience.toString());
            }
            if (formData.license_validity_date) {
                formDataToSend.append('license_validity_date', formData.license_validity_date);
            }
            if (formData.probation_start) {
                formDataToSend.append('probation_start_date', formData.probation_start);
            }
            if (formData.probation_end) {
                formDataToSend.append('probation_end_date', formData.probation_end);
            }
            if (formData.basic_salary) {
                formDataToSend.append('basic_salary', formData.basic_salary);
            }
            if (formData.compensation_package) {
                formDataToSend.append('compensation_package', formData.compensation_package);
            }

            if (formData.photo) {
                formDataToSend.append('photo', formData.photo);
            }
            if (formData.nic_photo) {
                formDataToSend.append('nic_photo', formData.nic_photo);
            }

            // Use branch-admin prefixed endpoint for Branch Admin users
            const endpoint = isBranchAdmin ? "branch-admin/create-nurse" : "create-nurse";
            const response = await api.post(endpoint, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Response is already unwrapped by axios interceptor (response.data)
            if (response && response.message) {
                alert.success(response.message || 'Nurse created successfully');
                setTimeout(() => {
                    // Call onSuccess callback or navigate back based on user role
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

                if (response?.status === 422) {
                    const validationErrors = response.data.errors || response.data.error || {};
                    setErrors(validationErrors);

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

                const errorMsg = response?.data?.message || response?.data?.error || error.message;
                alert.warn(`Unable to create Nurse account:\n\n${errorMsg}`);
            } else {
                alert.warn(`Unable to create Nurse account:\n\n${(error as Error).message}`);
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
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    First Name <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.first_name ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.first_name && (
                    <p className="text-error-500 text-sm mt-1">{errors.first_name[0]}</p>
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.last_name ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.last_name && (
                    <p className="text-error-500 text-sm mt-1">{errors.last_name[0]}</p>
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.date_of_birth ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.date_of_birth && (
                    <p className="text-error-500 text-sm mt-1">{errors.date_of_birth[0]}</p>
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.gender ? 'border-error-500' : 'border-neutral-300'}`}
                >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                {errors.gender && (
                    <p className="text-error-500 text-sm mt-1">{errors.gender[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC/Passport Number
                </label>
                <input
                    type="text"
                    name="nic_or_passport"
                    value={formData.nic_or_passport}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Mobile Number <span className="text-error-500">*</span>
                </label>
                <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.mobile_number ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.mobile_number && (
                    <p className="text-error-500 text-sm mt-1">{errors.mobile_number[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Landline Number
                </label>
                <input
                    type="tel"
                    name="landline_number"
                    value={formData.landline_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.email ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.email && (
                    <p className="text-error-500 text-sm mt-1">{errors.email[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">                    Password <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter login password (min 6 characters)"
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.password ? 'border-error-500' : 'border-neutral-300'}`}
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
                    <p className="text-error-500 text-sm mt-1">{errors.password[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">                    Confirm Password <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.confirm_password ? 'border-error-500' : 'border-neutral-300'}`}
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
                    <p className="text-error-500 text-sm mt-1">{errors.confirm_password[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Home Address
                </label>
                <textarea
                    name="home_address"
                    value={formData.home_address}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Emergency Contact Information
                </label>
                <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <FileUploadField
                label="Profile Photo"
                name="photo"
                accept=".jpg,.jpeg,.png"
                maxSizeMB={2}
                error={errors.photo?.[0]}
                onFileSelect={(_, file) => setFormData(prev => ({ ...prev, photo: file }))}
            />

            <FileUploadField
                label="NIC / ID Document"
                name="nic_photo"
                accept=".jpg,.jpeg,.png,.pdf"
                maxSizeMB={5}
                error={errors.nic_photo?.[0]}
                onFileSelect={(_, file) => setFormData(prev => ({ ...prev, nic_photo: file }))}
            />

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
                        placeholder="Select a branch"
                        isClearable
                    />
                )}
                {errors.branch_id && (
                    <p className="text-error-500 text-sm mt-1">{errors.branch_id[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Nursing Registration Number <span className="text-error-500">*</span>
                </label>
                <input
                    type="text"
                    name="nursing_reg_number"
                    value={formData.nursing_reg_number}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.nursing_reg_number ? 'border-error-500' : 'border-neutral-300'}`}
                />
                {errors.nursing_reg_number && (
                    <p className="text-error-500 text-sm mt-1">{errors.nursing_reg_number[0]}</p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Qualifications
                </label>
                <select
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                >
                    <option value="">Select Qualification</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="HND">Higher national Diploma</option>
                    <option value="Degree">Degree</option>
                    <option value="Master">Master</option>
                    <option value="Phd">Phd</option>
                </select>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Years of Experience
                </label>
                <input
                    type="number"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    min={0}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Specialization
                </label>
                <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>


            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Nurse Training Certifications
                </label>
                <input
                    type="text"
                    name="nurse_training_certifications"
                    value={formData.nurse_training_certifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Additional Certifications
                </label>
                <input
                    type="text"
                    name="additional_certifications"
                    value={formData.additional_certifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

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
            </div>

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
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Employee ID
                </label>
                <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

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
                    <option value="Full_time">Full-time</option>
                    <option value="Part_time">Part-time</option>
                    <option value="Consultant">Consultant</option>
                </select>
            </div>

            {/* Probation Period Start */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Probation Start
                </label>
                <input
                    type="date"
                    name="probation_start"
                    value={formData.probation_start}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            {/* Probation Period End */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Probation End
                </label>
                <input
                    type="date"
                    name="probation_end"
                    value={formData.probation_end}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            {/* Basic Salary */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Basic Salary
                </label>
                <input
                    type="number"
                    step="0.01"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    placeholder="Enter basic salary"
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            {/* Compensation Package */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Compensation Package
                </label>
                <input
                    type="text"
                    name="compensation_package"
                    value={formData.compensation_package}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-2 flex justify-center mt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium ${isSubmitting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                >
                    {isSubmitting ? 'Creating...' : 'Create Nurse'}
                </button>
            </div>
        </form>
    );
};

export default NurseCreateForm;
