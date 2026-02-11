import axios from 'axios';
import React, { useEffect, useState } from "react";
import api from "../../../../../utils/api/axios";
import { useNavigate } from "react-router-dom";
import alert from "../../../../../utils/alert.ts";
import {
    doctorCreateFormInitialState,
    qualificationsOptions,
    specializationOptions,
} from "../../../../../utils/api/user/DoctorData.ts";
import { appendFormData } from "../../../../../utils/formUtils.ts";
import Select, { MultiValue } from "react-select";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import { getAllBranches } from "../../../../../utils/api/branch/GetAllBranches.ts";
import { IDoctorUserFormTypes } from "../../../../../utils/types/users/IDoctorUserFormTypes.ts";
import FileUploadField from "../../../../common/FileUploadField";

interface DoctorCreateFormProps {
    onSuccess?: () => void;
}

const DoctorCreateForm: React.FC<DoctorCreateFormProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<IDoctorUserFormTypes>({
        ...doctorCreateFormInitialState,
        areas_of_specialization: [],
        branch_ids: [],
    });
    const [selectedSpecializations, setSelectedSpecializations] = useState<
        { label: string; value: string }[]
    >([]);
    const [branchOptions, setBranchOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const [selectedBranches, setSelectedBranches] = useState<
        { value: string; label: string }[]
    >([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isBranchAdmin, setIsBranchAdmin] = useState(false);
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [nicPhotoFile, setNicPhotoFile] = useState<File | null>(null);

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
                setFormData(prev => ({
                    ...prev,
                    branch_ids: [userInfo.branch_id]
                }));
                setSelectedBranches([{ value: userInfo.branch_id, label: userInfo.branch_name || userInfo.center_name || 'Your Branch' }]);
            }
        }

        const fetchBranchList = async () => {
            try {
                const response = await getAllBranches();
                // Response is already IBranchData[] from axios interceptor
                const options = response.map(
                    (branch: IBranchData) => ({
                        value: branch.id,
                        label: branch.center_name,
                    }),
                );
                setBranchOptions(options);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn("Failed to fetch branch list: " + error.message);
                } else {
                    alert.warn("Failed to fetch branch list.");
                }
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

    const handleSpecializationChange = (
        selected: MultiValue<{ label: string; value: string }>,
    ) => {
        setSelectedSpecializations(
            selected as { label: string; value: string }[],
        );
        setFormData({
            ...formData,
            areas_of_specialization: selected.map((option) => option.value),
        });


    };

    const handleBranchChange = (
        selectedOptions: MultiValue<{ value: string; label: string }>,
    ) => {
        const selectedBranchIds: string[] = selectedOptions.map(
            (option) => option.value,
        );

        setSelectedBranches([...selectedOptions]);

        setFormData((prevData) => ({
            ...prevData,
            branch_ids: selectedBranchIds,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Comprehensive frontend validation — collect ALL errors before returning
        const validationErrors: Record<string, string[]> = {};

        // First Name
        if (!formData.first_name.trim()) {
            validationErrors.first_name = ['First name is required'];
        } else if (formData.first_name.trim().length < 2) {
            validationErrors.first_name = ['First name must be at least 2 characters'];
        }

        // Last Name
        if (!formData.last_name.trim()) {
            validationErrors.last_name = ['Last name is required'];
        } else if (formData.last_name.trim().length < 2) {
            validationErrors.last_name = ['Last name must be at least 2 characters'];
        }

        // Email
        if (!formData.email.trim()) {
            validationErrors.email = ['Email is required'];
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            validationErrors.email = ['Please enter a valid email address'];
        }

        // Mobile Number
        if (!formData.contact_number_mobile.trim()) {
            validationErrors.contact_number_mobile = ['Mobile number is required'];
        } else {
            const cleaned = formData.contact_number_mobile.replace(/[\s\-\(\)]/g, '');
            if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
                validationErrors.contact_number_mobile = ['Invalid phone number format'];
            }
        }

        // Date of Birth
        if (!formData.date_of_birth) {
            validationErrors.date_of_birth = ['Date of birth is required'];
        }

        // Gender
        if (!formData.gender) {
            validationErrors.gender = ['Gender is required'];
        }

        // Specialization
        if (!formData.areas_of_specialization || formData.areas_of_specialization.length === 0) {
            validationErrors.areas_of_specialization = ['At least one specialization is required'];
        }

        // Qualification
        if (!formData.qualifications) {
            validationErrors.qualifications = ['Qualification is required'];
        }

        // Password
        if (!formData.password.trim()) {
            validationErrors.password = ['Password is required'];
        } else if (formData.password.length < 6) {
            validationErrors.password = ['Password must be at least 6 characters'];
        }

        // Confirm Password
        if (!confirmPassword.trim()) {
            validationErrors.confirm_password = ['Please confirm your password'];
        } else if (formData.password !== confirmPassword) {
            validationErrors.confirm_password = ['Passwords do not match'];
        }

        // If ANY validation errors exist, show them all and stop
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            const errorMessages = Object.entries(validationErrors)
                .map(([field, messages]) => {
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `• ${fieldName}: ${messages.join(', ')}`;
                })
                .join('\n');
            alert.warn(`Please fix the following errors:\n\n${errorMessages}`);
            return;
        }

        // Clear previous errors
        setErrors({});
        setIsSubmitting(true);

        try {
            // Upload files first if provided
            let photoPath: string | undefined;
            let nicPhotoPath: string | undefined;

            if (photoFile) {
                const photoFormData = new FormData();
                photoFormData.append('photo', photoFile);
                const photoRes: any = await api.post('uploads/upload-photo', photoFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoPath = photoRes.data?.path || photoRes.path;
            }

            if (nicPhotoFile) {
                const nicFormData = new FormData();
                nicFormData.append('id_document', nicPhotoFile);
                const nicRes: any = await api.post('uploads/upload-id-document', nicFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                nicPhotoPath = nicRes.data?.path || nicRes.path;
            }

            const payload = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                specialization: formData.areas_of_specialization.join(', '),
                qualification: formData.qualifications,
                contact_number: formData.contact_number_mobile.trim(),
                experience_years: Number(formData.years_of_experience) || 0,
                branch_ids: formData.branch_ids && formData.branch_ids.length > 0 ? formData.branch_ids : undefined,
                photo_path: photoPath,
                nic_photo_path: nicPhotoPath,
            };

            const endpoint = "doctors/";
            const response: any = await api.post(endpoint, payload);

            if (response) {
                alert.success("Doctor created successfully");
                setErrors({});
                setConfirmPassword("");
                setSelectedSpecializations([]);
                if (!isBranchAdmin) {
                    setSelectedBranches([]);
                }
                setPhotoFile(null);
                setNicPhotoFile(null);
                setFormData(prev => ({
                    ...doctorCreateFormInitialState,
                    areas_of_specialization: [],
                    branch_ids: isBranchAdmin && userBranchId ? [userBranchId] : [],
                }));

                if (onSuccess) {
                    onSuccess();
                    return;
                }

                if (isBranchAdmin) {
                    navigate('/branch-admin/hrm/staff');
                } else {
                    navigate('/dashboard/users/list');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const detail = error.response?.data?.detail;

                if (status === 422) {
                    // Pydantic validation errors from backend
                    const pydanticErrors = error.response?.data?.detail;
                    if (Array.isArray(pydanticErrors)) {
                        const fieldErrors: Record<string, string[]> = {};
                        pydanticErrors.forEach((err: any) => {
                            const fieldName = err.loc?.[err.loc.length - 1] || 'general';
                            // Map backend field names to frontend field names
                            const fieldMap: Record<string, string> = {
                                'contact_number': 'contact_number_mobile',
                                'specialization': 'areas_of_specialization',
                                'qualification': 'qualifications',
                            };
                            const mappedField = fieldMap[fieldName] || fieldName;
                            if (!fieldErrors[mappedField]) fieldErrors[mappedField] = [];
                            fieldErrors[mappedField].push(err.msg?.replace('Value error, ', '') || 'Invalid value');
                        });
                        setErrors(fieldErrors);
                        const errorMessages = Object.entries(fieldErrors)
                            .map(([field, messages]) => {
                                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                return `• ${fieldName}: ${messages.join(', ')}`;
                            })
                            .join('\n');
                        alert.warn(`Validation errors:\n\n${errorMessages}`);
                    } else {
                        alert.warn('Validation failed. Please check your input.');
                    }
                } else if (status === 400 && detail?.errors) {
                    // Structured error response from backend
                    const backendErrors: Record<string, string[]> = {};
                    Object.entries(detail.errors).forEach(([field, message]) => {
                        const fieldMap: Record<string, string> = {
                            'contact_number': 'contact_number_mobile',
                            'specialization': 'areas_of_specialization',
                            'qualification': 'qualifications',
                        };
                        const mappedField = fieldMap[field] || field;
                        backendErrors[mappedField] = [message as string];
                    });
                    setErrors(backendErrors);
                    const errorMessages = Object.entries(backendErrors)
                        .map(([field, messages]) => {
                            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return `• ${fieldName}: ${messages.join(', ')}`;
                        })
                        .join('\n');
                    alert.warn(`${errorMessages}`);
                } else if (status === 400) {
                    const errorMessage = typeof detail === 'string' ? detail : 'Bad request';
                    if (errorMessage.includes('email already exists')) {
                        setErrors({ email: ['This email address is already registered'] });
                        alert.warn('This email address is already registered. Please use a different email.');
                    } else {
                        alert.warn(errorMessage);
                    }
                } else if (status === 401 || status === 403) {
                    alert.warn("You are not authorized to create doctors. Please login as Super Admin.");
                } else {
                    alert.warn("Failed to create doctor: " + (error as Error).message);
                }
            } else {
                alert.warn("An unexpected error occurred. Please try again.");
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.first_name ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.last_name ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                />
                {errors.last_name && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.last_name[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Select Branches
                </label>
                {isBranchAdmin ? (
                    <div className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm bg-neutral-100">
                        {userBranchName}
                        <input type="hidden" name="branch_ids" value={JSON.stringify([userBranchId])} />
                    </div>
                ) : (
                    <Select
                        isMulti
                        value={selectedBranches}
                        onChange={handleBranchChange}
                        options={branchOptions}
                        className="mt-1"
                        placeholder="Select Branches"
                        isClearable
                    />
                )}
                {errors.branch_ids && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.branch_ids[0]}
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
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
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.gender ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
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

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    NIC/Passport Number
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

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Mobile Number <span className="text-error-500">*</span>
                </label>
                <input
                    type="tel"
                    name="contact_number_mobile"
                    value={formData.contact_number_mobile}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.contact_number_mobile ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                />
                {errors.contact_number_mobile && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contact_number_mobile[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Landline Number
                </label>
                <input
                    type="tel"
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

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Email <span className="text-error-500">*</span>
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.email ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                />
                {errors.email && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.email[0]}
                    </p>
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
                {errors.home_address && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.home_address[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Emergency Contact Information
                </label>
                <input
                    type="text"
                    name="emergency_contact_info"
                    value={formData.emergency_contact_info}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.emergency_contact_info && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.emergency_contact_info[0]}
                    </p>
                )}
            </div>


            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Years of Experience
                </label>
                <input
                    type="text"
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
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Qualifications <span className="text-error-500">*</span>
                </label>
                <select
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className={`mt-1 p-2 block w-full border rounded-md shadow-sm ${errors.qualifications ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                >
                    <option value="">Select Qualification</option>
                    {qualificationsOptions.map((qualification, index) => (
                        <option key={index} value={qualification}>
                            {qualification}
                        </option>
                    ))}
                </select>
                {errors.qualifications && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.qualifications[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Areas of Specialization <span className="text-error-500">*</span>
                </label>
                <Select
                    isMulti
                    name="areas_of_specialization"
                    options={specializationOptions}
                    className="mt-1"
                    value={selectedSpecializations}
                    onChange={handleSpecializationChange}
                    placeholder="Select Specializations"
                    isClearable
                />
                {errors.areas_of_specialization && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.areas_of_specialization[0]}
                    </p>
                )}
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
                {errors.joining_date && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.joining_date[0]}
                    </p>
                )}
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
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="consultant">Consultant</option>
                </select>
                {errors.contract_type && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contract_type[0]}
                    </p>
                )}
            </div>
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
                />
                {errors.contract_duration && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.contract_duration[0]}
                    </p>
                )}
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-neutral-700">
                    Medical registration number
                </label>
                <input
                    type="text"
                    name="medical_registration_number"
                    value={formData.medical_registration_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-neutral-300 rounded-md shadow-sm"
                />
                {errors.medical_registration_number && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.medical_registration_number[0]}
                    </p>
                )}
            </div>


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
                {errors.compensation_package && (
                    <p className="text-error-500 text-sm mt-1">
                        {errors.compensation_package[0]}
                    </p>
                )}
            </div>

            {/* Photo & ID Upload Section */}
            <div className="col-span-2">
                <h3 className="text-lg font-semibold text-neutral-800 border-b pb-2 mb-2">Photo & ID Upload</h3>
            </div>

            <FileUploadField
                label="Profile Photo"
                name="photo"
                accept=".jpg,.jpeg,.png"
                maxSizeMB={2}
                error={errors.photo?.[0]}
                onFileSelect={(_, file) => setPhotoFile(file)}
            />

            <FileUploadField
                label="NIC / ID Document"
                name="nic_photo"
                accept=".jpg,.jpeg,.png,.pdf"
                maxSizeMB={5}
                error={errors.nic_photo?.[0]}
                onFileSelect={(_, file) => setNicPhotoFile(file)}
            />

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
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.password ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`mt-1 p-2 block w-full border rounded-md shadow-sm pr-10 ${errors.confirm_password ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
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

            <div className="col-span-2 flex justify-center mt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`text-white px-6 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'}`}
                >
                    {isSubmitting ? 'Creating...' : 'Create Doctor'}
                </button>
            </div>
        </form>
    );
};

export default DoctorCreateForm;
