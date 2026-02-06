import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Edit, Save, Building2, CreditCard, Calendar, Briefcase, Phone, Mail, MapPin } from 'lucide-react';

const EmployeeProfile: React.FC = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        // Personal Info
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@hospital.com',
        phone: '+94 77 123 4567',
        address: '123 Main Street, Colombo 05',
        
        // Employment Info
        employeeId: 'EMP-2022-0045',
        branch: 'Main Branch',
        jobTitle: 'Senior Doctor',
        department: 'General Medicine',
        employmentType: 'Permanent',
        dateOfJoining: '2022-03-15',
        confirmationDate: '2022-09-15',
        
        // Salary Info
        basicSalary: 150000,
        medicalAllowance: 15000,
        transportAllowance: 10000,
        housingAllowance: 20000,
        epfApplicable: true,
        
        // Bank Details
        bankName: 'Commercial Bank',
        bankBranch: 'Colombo 03',
        accountNumber: '1234567890',
        accountName: 'John Smith'
    });

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/hrm')}
                            className="p-2 hover:bg-neutral-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">My HR Profile</h1>
                            <p className="text-neutral-500">View and update your employment details</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            isEditing 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                    >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                {/* Profile Header Card */}
                <div className="bg-gradient-to-r from-emerald-500 to-primary-500 rounded-xl p-6 mb-6 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
                            {profile.firstName[0]}{profile.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                            <p className="text-emerald-100">{profile.jobTitle} • {profile.department}</p>
                            <p className="text-sm text-emerald-200 mt-1">Employee ID: {profile.employeeId}</p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="w-5 h-5 text-primary-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-800">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Email</label>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-800">{profile.email}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Phone</label>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-800">{profile.phone}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-neutral-500 mb-1">Address</label>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-800">{profile.address}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employment Information */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-800">Employment Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Branch</label>
                            <span className="text-neutral-800">{profile.branch}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Employment Type</label>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{profile.employmentType}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Date of Joining</label>
                            <span className="text-neutral-800">{profile.dateOfJoining}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Confirmation Date</label>
                            <span className="text-neutral-800">{profile.confirmationDate}</span>
                        </div>
                    </div>
                </div>

                {/* Salary Information */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-800">Salary Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Basic Salary</label>
                            <span className="text-neutral-800 font-semibold">LKR {profile.basicSalary.toLocaleString()}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">EPF/ETF Applicable</label>
                            <span className={`px-2 py-1 rounded text-sm ${profile.epfApplicable ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>
                                {profile.epfApplicable ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Allowances</label>
                            <div className="text-sm text-neutral-600">
                                <p>Medical: LKR {profile.medicalAllowance.toLocaleString()}</p>
                                <p>Transport: LKR {profile.transportAllowance.toLocaleString()}</p>
                                <p>Housing: LKR {profile.housingAllowance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Total Gross</label>
                            <span className="text-emerald-600 font-bold text-lg">
                                LKR {(profile.basicSalary + profile.medicalAllowance + profile.transportAllowance + profile.housingAllowance).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-800">Bank Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Bank Name</label>
                            <span className="text-neutral-800">{profile.bankName}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Branch</label>
                            <span className="text-neutral-800">{profile.bankBranch}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Account Number</label>
                            <span className="text-neutral-800">{profile.accountNumber}</span>
                        </div>
                        <div>
                            <label className="block text-sm text-neutral-500 mb-1">Account Name</label>
                            <span className="text-neutral-800">{profile.accountName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
