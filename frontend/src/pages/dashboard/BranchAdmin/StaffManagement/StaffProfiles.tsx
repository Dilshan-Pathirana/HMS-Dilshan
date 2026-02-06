import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, UserPlus, Search, Filter, Download, Upload, Edit2, Trash2,
    Phone, Mail, MapPin, Briefcase, Shield, Eye, X, Check, ChevronLeft,
    ChevronRight, MoreVertical, Clock, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string;
    address: string;
    profile_picture: string;
    role: string;
    role_as: number;
    department: string;
    designation: string;
    employee_id: string;
    joining_date: string;
    employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated';
    qualifications: string[];
    shift: string;
}

const roles = [
    { value: 2, label: 'Branch Admin' },
    { value: 5, label: 'Doctor' },
    { value: 7, label: 'Nurse' },
    { value: 3, label: 'Cashier' },
    { value: 4, label: 'Pharmacist' },
    { value: 6, label: 'Receptionist' },
    { value: 8, label: 'IT Support' },
    { value: 9, label: 'Center Aid' },
    { value: 10, label: 'Auditor' },
];

const departments = [
    'Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Oncology', 'Radiology', 'Pharmacy', 'Administration', 'IT', 'HR'
];

const employmentStatuses = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
    { value: 'inactive', label: 'Inactive', color: 'bg-neutral-100 text-neutral-700' },
    { value: 'on_leave', label: 'On Leave', color: 'bg-orange-100 text-orange-700' },
    { value: 'terminated', label: 'Terminated', color: 'bg-error-100 text-red-700' },
];

// Mock data
const mockStaff: StaffMember[] = [
    {
        id: '1',
        first_name: 'Dr. Sarah',
        last_name: 'Wilson',
        email: 'sarah.wilson@hospital.com',
        phone: '+1 234 567 8901',
        gender: 'Female',
        date_of_birth: '1985-03-15',
        address: '123 Medical Lane, City',
        profile_picture: '',
        role: 'Doctor',
        role_as: 5,
        department: 'Cardiology',
        designation: 'Senior Cardiologist',
        employee_id: 'EMP001',
        joining_date: '2020-01-15',
        employment_status: 'active',
        qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
        shift: 'Day Shift'
    },
    {
        id: '2',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@hospital.com',
        phone: '+1 234 567 8902',
        gender: 'Male',
        date_of_birth: '1990-07-22',
        address: '456 Health Street, City',
        profile_picture: '',
        role: 'Nurse',
        role_as: 7,
        department: 'Emergency',
        designation: 'Head Nurse',
        employee_id: 'EMP002',
        joining_date: '2019-06-10',
        employment_status: 'active',
        qualifications: ['BSN', 'RN Certification'],
        shift: 'Night Shift'
    },
    {
        id: '3',
        first_name: 'Emily',
        last_name: 'Chen',
        email: 'emily.chen@hospital.com',
        phone: '+1 234 567 8903',
        gender: 'Female',
        date_of_birth: '1988-11-30',
        address: '789 Care Avenue, City',
        profile_picture: '',
        role: 'Doctor',
        role_as: 5,
        department: 'Pediatrics',
        designation: 'Pediatrician',
        employee_id: 'EMP003',
        joining_date: '2021-03-20',
        employment_status: 'on_leave',
        qualifications: ['MBBS', 'MD Pediatrics'],
        shift: 'Day Shift'
    },
];

export const StaffProfiles: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState<Partial<StaffMember>>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'Male',
        date_of_birth: '',
        address: '',
        role_as: 5,
        department: '',
        designation: '',
        employment_status: 'active',
        shift: 'Day Shift',
        qualifications: [],
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
        fetchStaff();
    }, []);

    useEffect(() => {
        filterStaff();
    }, [searchQuery, selectedDepartment, selectedRole, selectedStatus, staffList]);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/branch-admin/staff');
            console.log('Staff API response:', response.data);
            if (response.data.status === 200) {
                setStaffList(response.data.data);
                setFilteredStaff(response.data.data);
            } else {
                console.error('Failed to fetch staff:', response.data.message);
                setStaffList([]);
                setFilteredStaff([]);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            // Fallback to empty list on error
            setStaffList([]);
            setFilteredStaff([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filterStaff = () => {
        let filtered = [...staffList];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                s.first_name.toLowerCase().includes(query) ||
                s.last_name.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query) ||
                s.employee_id.toLowerCase().includes(query)
            );
        }

        if (selectedDepartment) {
            filtered = filtered.filter(s => s.department === selectedDepartment);
        }

        if (selectedRole) {
            filtered = filtered.filter(s => s.role_as === parseInt(selectedRole));
        }

        if (selectedStatus) {
            filtered = filtered.filter(s => s.employment_status === selectedStatus);
        }

        setFilteredStaff(filtered);
        setCurrentPage(1);
    };

    const handleCreateStaff = () => {
        // Navigate to the Add Staff page instead of showing modal
        navigate('/branch-admin/hrm/staff/add');
    };

    const handleEditStaff = (staff: StaffMember) => {
        setModalMode('edit');
        setSelectedStaff(staff);
        setFormData(staff);
        setShowModal(true);
    };

    const handleViewStaff = (staff: StaffMember) => {
        setModalMode('view');
        setSelectedStaff(staff);
        setShowModal(true);
    };

    const handleDeleteClick = (staff: StaffMember) => {
        setStaffToDelete(staff);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!staffToDelete) return;
        
        try {
            // await api.delete(`/branch-admin/staff/${staffToDelete.id}`);
            setStaffList(prev => prev.filter(s => s.id !== staffToDelete.id));
            toast.success('Staff member deleted successfully');
        } catch (error) {
            toast.error('Failed to delete staff member');
        }
        setShowDeleteConfirm(false);
        setStaffToDelete(null);
    };

    const handleSaveStaff = async () => {
        try {
            if (modalMode === 'create') {
                const newStaff: StaffMember = {
                    ...formData as StaffMember,
                    id: Date.now().toString(),
                    employee_id: `EMP${String(staffList.length + 1).padStart(3, '0')}`,
                    joining_date: new Date().toISOString().split('T')[0],
                    role: roles.find(r => r.value === formData.role_as)?.label || 'Staff',
                    profile_picture: '',
                };
                // await api.post('/branch-admin/staff', newStaff);
                setStaffList(prev => [...prev, newStaff]);
                toast.success('Staff member created successfully');
            } else if (modalMode === 'edit' && selectedStaff) {
                const updatedStaff = { ...selectedStaff, ...formData };
                // await api.put(`/branch-admin/staff/${selectedStaff.id}`, updatedStaff);
                setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? updatedStaff as StaffMember : s));
                toast.success('Staff member updated successfully');
            }
            setShowModal(false);
        } catch (error) {
            toast.error('Failed to save staff member');
        }
    };

    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-primary-500 text-white shadow-md'
                                    : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const statusConfig = employmentStatuses.find(s => s.value === status);
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-neutral-100 text-neutral-700'}`}>
                {statusConfig?.label || status}
            </span>
        );
    };

    // Default avatar based on gender
    const MaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#E8F5E9"/>
            <circle cx="50" cy="35" r="18" fill="#4CAF50"/>
            <ellipse cx="50" cy="75" rx="28" ry="20" fill="#4CAF50"/>
            <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
            <path d="M35 30 Q50 15 65 30" fill="#4E342E"/>
            <circle cx="44" cy="33" r="2" fill="#3E2723"/>
            <circle cx="56" cy="33" r="2" fill="#3E2723"/>
        </svg>
    );

    const FemaleAvatar = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#FCE4EC"/>
            <circle cx="50" cy="35" r="18" fill="#E91E63"/>
            <ellipse cx="50" cy="75" rx="26" ry="20" fill="#E91E63"/>
            <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
            <path d="M30 35 Q30 15 50 15 Q70 15 70 35 Q70 25 50 30 Q30 25 30 35" fill="#4E342E"/>
            <circle cx="44" cy="33" r="2" fill="#3E2723"/>
            <circle cx="56" cy="33" r="2" fill="#3E2723"/>
        </svg>
    );

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('blob:') || path.startsWith('http') || path.startsWith('/storage')) return path;
        return `/storage/${path}`;
    };

    return (
        <DashboardLayout 
            userName={userName}
            userRole="Branch Admin" 
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Staff Profiles</h1>
                            <p className="text-neutral-500">Manage staff members, roles, and permissions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                            <Upload className="w-4 h-4" />
                            Import
                        </button>
                        <button 
                            onClick={handleCreateStaff}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add New Staff
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or employee ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-neutral-300 hover:bg-neutral-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Statuses</option>
                                    {employmentStatuses.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Staff Table */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedStaff.map((staff) => (
                                    <tr key={staff.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                    {staff.profile_picture ? (
                                                        <img src={getImageUrl(staff.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                    ) : staff.gender === 'Female' ? (
                                                        <FemaleAvatar />
                                                    ) : (
                                                        <MaleAvatar />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-800">{staff.first_name} {staff.last_name}</p>
                                                    <p className="text-sm text-neutral-500">{staff.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-neutral-800">{staff.role}</p>
                                            <p className="text-sm text-neutral-500">{staff.designation}</p>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600">{staff.department}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm text-neutral-600 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {staff.email}
                                                </span>
                                                <span className="text-sm text-neutral-500 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {staff.phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={staff.employment_status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleViewStaff(staff)}
                                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4 text-neutral-600" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditStaff(staff)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4 text-primary-500" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(staff)}
                                                    className="p-2 hover:bg-error-100 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-error-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                            <p className="text-sm text-neutral-600">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} results
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1 rounded-lg ${currentPage === i + 1 ? 'bg-emerald-500 text-white' : 'hover:bg-neutral-100'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-neutral-800">
                                {modalMode === 'create' ? 'Add New Staff Member' : modalMode === 'edit' ? 'Edit Staff Member' : 'Staff Details'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {modalMode === 'view' && selectedStaff ? (
                                // View Mode
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full overflow-hidden">
                                            {selectedStaff.profile_picture ? (
                                                <img src={getImageUrl(selectedStaff.profile_picture)} alt="" className="w-full h-full object-cover" />
                                            ) : selectedStaff.gender === 'Female' ? (
                                                <FemaleAvatar />
                                            ) : (
                                                <MaleAvatar />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-neutral-800">{selectedStaff.first_name} {selectedStaff.last_name}</h4>
                                            <p className="text-neutral-500">{selectedStaff.designation}</p>
                                            <StatusBadge status={selectedStaff.employment_status} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Employee ID</p>
                                            <p className="font-medium">{selectedStaff.employee_id}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Department</p>
                                            <p className="font-medium">{selectedStaff.department}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Role</p>
                                            <p className="font-medium">{selectedStaff.role}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Shift</p>
                                            <p className="font-medium">{selectedStaff.shift}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Email</p>
                                            <p className="font-medium">{selectedStaff.email}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Phone</p>
                                            <p className="font-medium">{selectedStaff.phone}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Joining Date</p>
                                            <p className="font-medium">{new Date(selectedStaff.joining_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-3 bg-neutral-50 rounded-lg">
                                            <p className="text-sm text-neutral-500">Gender</p>
                                            <p className="font-medium">{selectedStaff.gender}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-neutral-50 rounded-lg">
                                        <p className="text-sm text-neutral-500 mb-2">Qualifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStaff.qualifications.map((q, i) => (
                                                <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm">{q}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Create/Edit Mode
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">First Name *</label>
                                            <input
                                                type="text"
                                                value={formData.first_name || ''}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name *</label>
                                            <input
                                                type="text"
                                                value={formData.last_name || ''}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
                                            <input
                                                type="tel"
                                                value={formData.phone || ''}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
                                            <select
                                                value={formData.gender || 'Male'}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={formData.date_of_birth || ''}
                                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                        <textarea
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Role *</label>
                                            <select
                                                value={formData.role_as || 5}
                                                onChange={(e) => setFormData({ ...formData, role_as: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            >
                                                {roles.map(role => (
                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Department *</label>
                                            <select
                                                value={formData.department || ''}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Designation</label>
                                            <input
                                                type="text"
                                                value={formData.designation || ''}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Shift</label>
                                            <select
                                                value={formData.shift || 'Day Shift'}
                                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="Day Shift">Day Shift</option>
                                                <option value="Night Shift">Night Shift</option>
                                                <option value="Rotating">Rotating</option>
                                                <option value="On-Call">On-Call</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Employment Status</label>
                                        <select
                                            value={formData.employment_status || 'active'}
                                            onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {employmentStatuses.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                            >
                                {modalMode === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {modalMode !== 'view' && (
                                <button 
                                    onClick={handleSaveStaff}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600"
                                >
                                    {modalMode === 'create' ? 'Create Staff' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && staffToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-bold text-neutral-800 mb-4">Confirm Delete</h3>
                        <p className="text-neutral-600 mb-6">
                            Are you sure you want to delete <strong>{staffToDelete.first_name} {staffToDelete.last_name}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
