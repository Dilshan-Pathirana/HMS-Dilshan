import React, { useEffect, useState } from "react";
import axios from "axios";
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
import {IDoctorUserFormTypes} from "../../../../../utils/types/users/IDoctorUserFormTypes.ts";

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
                    branch_id: JSON.stringify([userInfo.branch_id])
                }));
                setSelectedBranches([{ value: userInfo.branch_id, label: userInfo.branch_name || userInfo.center_name || 'Your Branch' }]);
            }
        }

        const fetchBranchList = async () => {
            try {
                const response = await getAllBranches();
                if (response.data.status === 200) {
                    const options = response.data.branches.map(
                        (branch: IBranchData) => ({
                            value: branch.id,
                            label: branch.center_name,
                        }),
                    );
                    setBranchOptions(options);
                }
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
            branch_id: JSON.stringify(selectedBranchIds),
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
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
        if (!formData.date_of_birth) {
            alert.warn('Date of birth is required');
            return;
        }
        if (!formData.branch_id) {
            alert.warn('Branch is required');
            return;
        }
        
        try {
            const formDataToSend = new FormData();
            
            // Required fields
            formDataToSend.append('first_name', formData.first_name);
            formDataToSend.append('last_name', formData.last_name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('date_of_birth', formData.date_of_birth);
            formDataToSend.append('branch_id', formData.branch_id);
            formDataToSend.append('nic_number', formData.nic_number || 'N/A');
            formDataToSend.append('contact_number_mobile', formData.contact_number_mobile || 'N/A');
            formDataToSend.append('contact_number_landline', formData.contact_number_landline || 'N/A');
            formDataToSend.append('emergency_contact_info', formData.emergency_contact_info || 'N/A');
            formDataToSend.append('contract_type', formData.contract_type || 'full-time');
            
            // Optional fields - only send if not empty
            if (formData.gender) {
                formDataToSend.append('gender', formData.gender.toLowerCase());
            }
            if (formData.home_address) {
                formDataToSend.append('home_address', formData.home_address);
            }
            if (formData.medical_registration_number || formData.medical_reg_number) {
                formDataToSend.append('medical_registration_number', formData.medical_registration_number || formData.medical_reg_number);
            }
            if (formData.qualifications) {
                formDataToSend.append('qualifications', formData.qualifications);
            }
            if (formData.years_of_experience > 0) {
                formDataToSend.append('years_of_experience', formData.years_of_experience.toString());
            }
            if (formData.areas_of_specialization && formData.areas_of_specialization.length > 0) {
                formDataToSend.append('areas_of_specialization', JSON.stringify(formData.areas_of_specialization));
            }
            if (formData.previous_employment || formData.work_experience) {
                formDataToSend.append('previous_employment', formData.previous_employment || formData.work_experience);
            }
            if (formData.license_validity_date) {
                formDataToSend.append('license_validity_date', formData.license_validity_date);
            }
            if (formData.joining_date) {
                formDataToSend.append('joining_date', formData.joining_date);
            }
            if (formData.contract_duration) {
                formDataToSend.append('contract_duration', formData.contract_duration);
            }
            if (formData.probation_start_date) {
                formDataToSend.append('probation_start_date', formData.probation_start_date);
            }
            if (formData.probation_end_date) {
                formDataToSend.append('probation_end_date', formData.probation_end_date);
            }
            if (formData.compensation_package) {
                formDataToSend.append('compensation_package', formData.compensation_package);
            }
            if (formData.recent_photo) {
                formDataToSend.append('photo', formData.recent_photo);
            }

            // Use branch-admin prefixed endpoint for Branch Admin users
            const endpoint = isBranchAdmin ? "api/branch-admin/create-doctor" : "api/create-doctor";
            const response = await axios.post(
                endpoint,
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            if (response.status === 200) {
                alert.success(response.data.message);
                
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
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const validationErrors = error.response.data.errors || {};
                setErrors(validationErrors);
                
                // Show user-friendly error message
                const errorMessages = Object.entries(validationErrors)
                    .map(([field, messages]) => {
                        const messageArray = Array.isArray(messages) ? messages : [messages];
                        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return `• ${fieldName}: ${messageArray.join(', ')}`;
                    })
                    .join('\n');
                
                alert.warn(`Please fix the following errors:\n\n${errorMessages}`);
            } else {
                alert.warn(
                    "Failed to create doctor: " + (error as Error).message,
                );
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow-md"
        >
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    First Name
                </label>
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.first_name[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Last Name
                </label>
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.last_name[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Select Branches <span className="text-red-500">*</span>
                </label>
                {isBranchAdmin ? (
                    <div className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100">
                        {userBranchName}
                        <input type="hidden" name="branch_id" value={JSON.stringify([userBranchId])} />
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
                {errors.branch_id && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.branch_id[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                </label>
                <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.date_of_birth[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Gender
                </label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.gender[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    NIC/Passport Number
                </label>
                <input
                    type="text"
                    name="nic_number"
                    value={formData.nic_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.nic_number && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.nic_number[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Mobile Number
                </label>
                <input
                    type="tel"
                    name="contact_number_mobile"
                    value={formData.contact_number_mobile}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.contact_number_mobile && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.contact_number_mobile[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Landline Number
                </label>
                <input
                    type="tel"
                    name="contact_number_landline"
                    value={formData.contact_number_landline}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.contact_number_landline && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.contact_number_landline[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.email[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Home Address
                </label>
                <textarea
                    name="home_address"
                    value={formData.home_address}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.home_address && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.home_address[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Emergency Contact Information
                </label>
                <input
                    type="text"
                    name="emergency_contact_info"
                    value={formData.emergency_contact_info}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.emergency_contact_info && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.emergency_contact_info[0]}
                    </p>
                )}
            </div>


            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Years of Experience
                </label>
                <input
                    type="text"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.years_of_experience && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.years_of_experience[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Previous Employment
                </label>
                <input
                    type="text"
                    name="previous_employment"
                    value={formData.previous_employment}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.previous_employment && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.previous_employment[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    License Validity Date
                </label>
                <input
                    type="date"
                    name="license_validity_date"
                    value={formData.license_validity_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.license_validity_date && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.license_validity_date[0]}
                    </p>
                )}
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Qualifications
                </label>
                <select
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">Select Qualification</option>
                    {qualificationsOptions.map((qualification, index) => (
                        <option key={index} value={qualification}>
                            {qualification}
                        </option>
                    ))}
                    {errors.qualifications && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.qualifications[0]}
                        </p>
                    )}
                </select>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Areas of Specialization
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
                    <p className="text-red-500 text-sm mt-1">
                        {errors.areas_of_specialization[0]}
                    </p>
                )}
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Joining Date
                </label>
                <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.joining_date && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.joining_date[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Contract Type
                </label>
                <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">Select Contract Type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="consultant">Consultant</option>
                </select>
                {errors.contract_type && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.contract_type[0]}
                    </p>
                )}
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Contract Duration
                </label>
                <input
                    type="text"
                    name="contract_duration"
                    value={formData.contract_duration}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.contract_duration && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.contract_duration[0]}
                    </p>
                )}
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Medical registration number
                </label>
                <input
                    type="text"
                    name="medical_registration_number"
                    value={formData.medical_registration_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.medical_registration_number && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.medical_registration_number[0]}
                    </p>
                )}
            </div>


            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Probation Start Date
                </label>
                <input
                    type="date"
                    name="probation_start_date"
                    value={formData.probation_start_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.probation_start_date && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.probation_start_date[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Probation End Date
                </label>
                <input
                    type="date"
                    name="probation_end_date"
                    value={formData.probation_end_date}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.probation_end_date && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.probation_end_date[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Compensation Package
                </label>
                <input
                    type="text"
                    name="compensation_package"
                    value={formData.compensation_package}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
                {errors.compensation_package && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.compensation_package[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter login password (min 6 characters)"
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.password[0]}
                    </p>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>

            <div className="col-span-2 flex justify-center mt-6">
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Create Doctor
                </button>
            </div>
        </form>
    );
};

export default DoctorCreateForm;
