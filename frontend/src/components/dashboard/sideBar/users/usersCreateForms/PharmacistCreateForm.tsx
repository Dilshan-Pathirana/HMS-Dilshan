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
                const response = await api.get("api/get-branches");

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

    const handleSubmit = async (e: React.FormEvent) => {
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
        if (!formData.branch_id) {
            alert.warn('Branch is required');
            return;
        }

        try {
            const formDataToSend = appendFormData(formData);
            console.log("form data", formDataToSend);
            // Use branch-admin prefixed endpoint for Branch Admin users
            const endpoint = isBranchAdmin ? "api/branch-admin/create-pharmacist" : "api/create-pharmacist";
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
            const { status, data } = response;

            if (status === 200) {
                alert.success(data.message);
                
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
                console.log(error);
                setErrors(error.response.data.errors || {});
            } else {
                alert.warn(
                    "Failed to create pharmacist: " + (error as Error).message,
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
                    Branch <span className="text-red-500">*</span>
                </label>
                {isBranchAdmin ? (
                    <div className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100">
                        {userBranchName}
                        <input type="hidden" name="branch_id" value={userBranchId} />
                    </div>
                ) : (
                    <Select
                        value={branchOptions.find(
                            (option) => option.value === formData.branch_id,
                        )}
                        onChange={handleBranchChange}
                        options={branchOptions}
                        className="mt-1"
                        placeholder="Select Branch"
                        isClearable
                    />
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
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Upload Recent Photo (JPG/PDF)
                </label>
                <input
                    type="file"
                    name="photo"
                    accept=".jpg,.jpeg,.pdf"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 border border-dashed border-gray-300 p-2 rounded-md"
                />
                {recentPhotoPreview && (
                    <div className="mt-2">
                        <img
                            src={recentPhotoPreview}
                            alt="Recent Preview"
                            className="w-32 h-32 object-cover rounded-md shadow-sm"
                        />
                    </div>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Upload NIC Photo (JPG/PDF)
                </label>
                <input
                    type="file"
                    name="nic_photo"
                    accept=".jpg,.jpeg,.pdf"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 border border-dashed border-gray-300 p-2 rounded-md"
                />
                {nicPhotoPreview && (
                    <div className="mt-2">
                        <img
                            src={nicPhotoPreview}
                            alt="NIC Preview"
                            className="w-32 h-32 object-cover rounded-md shadow-sm"
                        />
                    </div>
                )}
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Pharmacist Registration Number
                </label>
                <input
                    type="text"
                    name="pharmacist_registration_number"
                    value={formData.pharmacist_registration_number}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Work Experience
                </label>
                <input
                    type="text"
                    name="work_experience"
                    value={formData.work_experience}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
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
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Qualifications
                </label>
                <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
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
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                    Basic Salary
                </label>
                <input
                    type="number"
                    step="0.01"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    placeholder="Enter basic salary"
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                />
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
                    Create Pharmacist
                </button>
            </div>
        </form>
    );
};

export default PharmacistCreateForm;
