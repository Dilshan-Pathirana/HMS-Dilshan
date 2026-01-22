import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Check, X, Plus, Search,
    GraduationCap, Award, BookOpen, Video, AlertTriangle, Eye, Edit2, Trash2, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface TrainingProgram {
    id: string;
    title: string;
    category: 'mandatory' | 'skill' | 'compliance' | 'leadership';
    description: string;
    duration: string;
    format: 'online' | 'in-person' | 'hybrid';
    assignedTo: string[];
    completionRate: number;
    dueDate: string;
    status: 'active' | 'scheduled' | 'completed';
}

interface StaffProgress {
    staffId: string;
    staffName: string;
    department: string;
    completedTrainings: number;
    pendingTrainings: number;
    certifications: number;
    expiringCerts: number;
    lastTraining: string;
}

interface Certification {
    id: string;
    staffName: string;
    certName: string;
    issuedDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
}

const categories = [
    { value: 'mandatory', label: 'Mandatory', color: 'bg-red-100 text-red-700' },
    { value: 'skill', label: 'Skill Development', color: 'bg-blue-100 text-blue-700' },
    { value: 'compliance', label: 'Compliance', color: 'bg-orange-100 text-orange-700' },
    { value: 'leadership', label: 'Leadership', color: 'bg-purple-100 text-purple-700' },
];

const mockTrainingPrograms: TrainingProgram[] = [
    { id: '1', title: 'HIPAA Compliance Training', category: 'compliance', description: 'Annual HIPAA privacy and security training', duration: '2 hours', format: 'online', assignedTo: ['All Staff'], completionRate: 75, dueDate: '2025-12-31', status: 'active' },
    { id: '2', title: 'CPR & First Aid Certification', category: 'mandatory', description: 'Basic life support and first aid training', duration: '4 hours', format: 'in-person', assignedTo: ['Nurses', 'Doctors'], completionRate: 85, dueDate: '2025-12-20', status: 'active' },
    { id: '3', title: 'Leadership Development', category: 'leadership', description: 'Leadership skills for senior staff', duration: '8 hours', format: 'hybrid', assignedTo: ['Department Heads'], completionRate: 60, dueDate: '2026-01-15', status: 'scheduled' },
    { id: '4', title: 'Patient Communication Skills', category: 'skill', description: 'Effective patient communication techniques', duration: '3 hours', format: 'online', assignedTo: ['All Staff'], completionRate: 100, dueDate: '2025-11-30', status: 'completed' },
];

const mockStaffProgress: StaffProgress[] = [
    { staffId: '1', staffName: 'Dr. Sarah Wilson', department: 'Cardiology', completedTrainings: 8, pendingTrainings: 2, certifications: 5, expiringCerts: 1, lastTraining: '2025-12-10' },
    { staffId: '2', staffName: 'John Doe', department: 'Emergency', completedTrainings: 6, pendingTrainings: 3, certifications: 4, expiringCerts: 0, lastTraining: '2025-12-05' },
    { staffId: '3', staffName: 'Emily Chen', department: 'Pediatrics', completedTrainings: 10, pendingTrainings: 1, certifications: 6, expiringCerts: 2, lastTraining: '2025-12-15' },
];

const mockCertifications: Certification[] = [
    { id: '1', staffName: 'Dr. Sarah Wilson', certName: 'Board Certification - Cardiology', issuedDate: '2023-05-15', expiryDate: '2026-05-15', status: 'valid' },
    { id: '2', staffName: 'Dr. Sarah Wilson', certName: 'ACLS Certification', issuedDate: '2024-01-10', expiryDate: '2025-01-10', status: 'expiring' },
    { id: '3', staffName: 'John Doe', certName: 'BLS Certification', issuedDate: '2024-06-20', expiryDate: '2026-06-20', status: 'valid' },
    { id: '4', staffName: 'Emily Chen', certName: 'Pediatric Advanced Life Support', issuedDate: '2023-03-01', expiryDate: '2024-03-01', status: 'expired' },
];

export const TrainingDevelopment: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'programs' | 'progress' | 'certifications'>('programs');
    const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>(mockTrainingPrograms);
    const [staffProgress] = useState<StaffProgress[]>(mockStaffProgress);
    const [certifications, setCertifications] = useState<Certification[]>(mockCertifications);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleDeleteProgram = (id: string) => {
        setTrainingPrograms(prev => prev.filter(p => p.id !== id));
        toast.success('Training program deleted');
    };

    const handleViewProgram = (program: TrainingProgram) => {
        setSelectedProgram(program);
        setShowViewModal(true);
    };

    const filteredPrograms = trainingPrograms.filter(p => {
        if (filterCategory !== 'all' && p.category !== filterCategory) return false;
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const expiringCertsCount = certifications.filter(c => c.status === 'expiring' || c.status === 'expired').length;
    const pendingTrainingsCount = staffProgress.reduce((sum, s) => sum + s.pendingTrainings, 0);

    const getCategoryStyle = (category: string) => {
        return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCertStatusStyle = (status: string) => {
        switch (status) {
            case 'valid': return 'bg-green-100 text-green-700';
            case 'expiring': return 'bg-yellow-100 text-yellow-700';
            case 'expired': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
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

    const tabs = [
        { id: 'programs', label: 'Training Programs', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'progress', label: 'Staff Progress', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" />, count: expiringCertsCount },
    ];

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
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Training & Development</h1>
                            <p className="text-gray-500">Manage training programs and track staff certifications</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90"
                    >
                        <Plus className="w-4 h-4" />
                        Create Program
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Programs</p>
                                <p className="text-2xl font-bold text-emerald-600">{trainingPrograms.filter(p => p.status === 'active').length}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending Trainings</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingTrainingsCount}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Valid Certifications</p>
                                <p className="text-2xl font-bold text-blue-600">{certifications.filter(c => c.status === 'valid').length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Award className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Expiring Soon</p>
                                <p className="text-2xl font-bold text-red-600">{expiringCertsCount}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Training Programs Tab */}
                        {activeTab === 'programs' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search programs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {/* Programs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredPrograms.map(program => (
                                        <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyle(program.category)}`}>
                                                            {categories.find(c => c.value === program.category)?.label}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(program.status)}`}>
                                                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-gray-800">{program.title}</h4>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleViewProgram(program)}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded">
                                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProgram(program.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> {program.duration}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Video className="w-4 h-4" /> {program.format}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> Due: {program.dueDate}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Completion: {program.completionRate}%</span>
                                                <div className="w-32 h-2 bg-gray-200 rounded-full">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            program.completionRate >= 80 ? 'bg-green-500' :
                                                            program.completionRate >= 50 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${program.completionRate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Staff Progress Tab */}
                        {activeTab === 'progress' && (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Completed</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pending</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Certifications</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Expiring</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Training</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {staffProgress.map(staff => (
                                                <tr key={staff.staffId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-800">{staff.staffName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{staff.department}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                                                            {staff.completedTrainings}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                                            staff.pendingTrainings > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {staff.pendingTrainings}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                                            {staff.certifications}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {staff.expiringCerts > 0 ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium flex items-center gap-1 justify-center">
                                                                <AlertTriangle className="w-3 h-3" /> {staff.expiringCerts}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{staff.lastTraining}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Certifications Tab */}
                        {activeTab === 'certifications' && (
                            <div className="space-y-4">
                                {/* Alert for expiring certs */}
                                {expiringCertsCount > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <p className="text-sm text-yellow-800">
                                            <strong>{expiringCertsCount} certification(s)</strong> are expiring soon or have expired. Please take action.
                                        </p>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Certification</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issued Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {certifications.map(cert => (
                                                <tr key={cert.id} className={`hover:bg-gray-50 ${cert.status === 'expired' ? 'bg-red-50' : ''}`}>
                                                    <td className="px-4 py-3 font-medium text-gray-800">{cert.staffName}</td>
                                                    <td className="px-4 py-3 text-gray-600">{cert.certName}</td>
                                                    <td className="px-4 py-3 text-gray-600">{cert.issuedDate}</td>
                                                    <td className="px-4 py-3 text-gray-600">{cert.expiryDate}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCertStatusStyle(cert.status)}`}>
                                                            {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {cert.status !== 'valid' && (
                                                            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                                                Send Reminder
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Program Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Create Training Program</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" rows={3}></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                        <input type="text" placeholder="e.g., 2 hours" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                            <option value="online">Online</option>
                                            <option value="in-person">In-Person</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                        Create Program
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Program Modal */}
                {showViewModal && selectedProgram && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-800">{selectedProgram.title}</h3>
                                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyle(selectedProgram.category)}`}>
                                        {categories.find(c => c.value === selectedProgram.category)?.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(selectedProgram.status)}`}>
                                        {selectedProgram.status.charAt(0).toUpperCase() + selectedProgram.status.slice(1)}
                                    </span>
                                </div>
                                <p className="text-gray-600">{selectedProgram.description}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Duration</p>
                                        <p className="font-medium">{selectedProgram.duration}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Format</p>
                                        <p className="font-medium capitalize">{selectedProgram.format}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Due Date</p>
                                        <p className="font-medium">{selectedProgram.dueDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Completion Rate</p>
                                        <p className="font-medium">{selectedProgram.completionRate}%</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Assigned To</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProgram.assignedTo.map((group, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{group}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
