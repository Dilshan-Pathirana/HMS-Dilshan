import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    Users, Calendar, Clock, ChevronLeft, Download, Search, Plus, X, Upload,
    Folder, File, FileImage, FilePlus, Trash2, Eye, Edit2, FileText, Building2, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'other';
    category: string;
    uploadedBy: string;
    uploadedAt: string;
    size: string;
    staffId: string;
}

interface WorkHistory {
    id: string;
    staffId: string;
    staffName: string;
    position: string;
    department: string;
    startDate: string;
    endDate: string | null;
    status: 'current' | 'previous';
    notes: string;
}

interface StaffRecord {
    id: string;
    name: string;
    department: string;
    position: string;
    documentsCount: number;
    lastUpdated: string;
}

const documentCategories = [
    'Employment Contract',
    'ID Documents',
    'Certifications',
    'Performance Reviews',
    'Training Certificates',
    'Medical Records',
    'Other',
];

const mockDocuments: Document[] = [
    { id: '1', name: 'Employment_Contract_2023.pdf', type: 'pdf', category: 'Employment Contract', uploadedBy: 'HR', uploadedAt: '2023-01-15', size: '245 KB', staffId: '1' },
    { id: '2', name: 'Medical_License.pdf', type: 'pdf', category: 'Certifications', uploadedBy: 'Dr. Sarah Wilson', uploadedAt: '2023-05-20', size: '1.2 MB', staffId: '1' },
    { id: '3', name: 'ID_Card_Scan.jpg', type: 'image', category: 'ID Documents', uploadedBy: 'HR', uploadedAt: '2023-01-10', size: '520 KB', staffId: '1' },
    { id: '4', name: 'Annual_Review_2024.docx', type: 'doc', category: 'Performance Reviews', uploadedBy: 'Branch Admin', uploadedAt: '2024-12-01', size: '156 KB', staffId: '1' },
];

const mockWorkHistory: WorkHistory[] = [
    { id: '1', staffId: '1', staffName: 'Dr. Sarah Wilson', position: 'Senior Cardiologist', department: 'Cardiology', startDate: '2023-01-15', endDate: null, status: 'current', notes: 'Promoted from Cardiologist' },
    { id: '2', staffId: '1', staffName: 'Dr. Sarah Wilson', position: 'Cardiologist', department: 'Cardiology', startDate: '2020-06-01', endDate: '2022-12-31', status: 'previous', notes: 'Initial position' },
    { id: '3', staffId: '1', staffName: 'Dr. Sarah Wilson', position: 'Resident Doctor', department: 'General Medicine', startDate: '2018-01-01', endDate: '2020-05-31', status: 'previous', notes: 'Residency program' },
];

const mockStaffRecords: StaffRecord[] = [
    { id: '1', name: 'Dr. Sarah Wilson', department: 'Cardiology', position: 'Senior Cardiologist', documentsCount: 12, lastUpdated: '2025-12-15' },
    { id: '2', name: 'John Doe', department: 'Emergency', position: 'Nurse', documentsCount: 8, lastUpdated: '2025-12-10' },
    { id: '3', name: 'Emily Chen', department: 'Pediatrics', position: 'Pediatrician', documentsCount: 15, lastUpdated: '2025-12-18' },
    { id: '4', name: 'Mike Johnson', department: 'Radiology', position: 'Technician', documentsCount: 6, lastUpdated: '2025-11-28' },
];

export const EmployeeRecords: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [activeTab, setActiveTab] = useState<'records' | 'documents' | 'history'>('records');
    const [staffRecords] = useState<StaffRecord[]>(mockStaffRecords);
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);
    const [workHistory] = useState<WorkHistory[]>(mockWorkHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleDeleteDocument = (id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        toast.success('Document deleted');
    };

    const handleSelectStaff = (staff: StaffRecord) => {
        setSelectedStaff(staff);
        setActiveTab('documents');
    };

    const filteredRecords = staffRecords.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDocuments = documents.filter(d =>
        filterCategory === 'all' || d.category === filterCategory
    );

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
            case 'doc': return <File className="w-8 h-8 text-blue-500" />;
            case 'image': return <FileImage className="w-8 h-8 text-green-500" />;
            default: return <File className="w-8 h-8 text-gray-500" />;
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.path === '/branch-admin/hrm'
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
        { id: 'records', label: 'Staff Records', icon: <Users className="w-4 h-4" /> },
        { id: 'documents', label: 'Documents', icon: <Folder className="w-4 h-4" /> },
        { id: 'history', label: 'Work History', icon: <Clock className="w-4 h-4" /> },
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
                            <h1 className="text-2xl font-bold text-gray-800">Employee Records</h1>
                            <p className="text-gray-500">Manage documents and work history</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Document
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Staff Records</p>
                                <p className="text-2xl font-bold text-blue-600">{staffRecords.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Documents</p>
                                <p className="text-2xl font-bold text-emerald-600">{staffRecords.reduce((sum, s) => sum + s.documentsCount, 0)}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <Folder className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending Updates</p>
                                <p className="text-2xl font-bold text-orange-600">3</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <FilePlus className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Positions</p>
                                <p className="text-2xl font-bold text-purple-600">{workHistory.filter(w => w.status === 'current').length}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Staff Info */}
                {selectedStaff && (
                    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{selectedStaff.name}</h3>
                                    <p className="text-sm text-gray-600">{selectedStaff.position} • {selectedStaff.department}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Staff Records Tab */}
                        {activeTab === 'records' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search staff records..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Documents</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Updated</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredRecords.map(record => (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-800">{record.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{record.position}</td>
                                                    <td className="px-4 py-3 text-gray-600">{record.department}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                                            {record.documentsCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{record.lastUpdated}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleSelectStaff(record)}
                                                            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600"
                                                        >
                                                            View Records
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {documentCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredDocuments.map(doc => (
                                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-3">
                                                {getFileIcon(doc.type)}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-800 truncate">{doc.name}</h4>
                                                    <p className="text-sm text-gray-500">{doc.category}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                        <span>{doc.size}</span>
                                                        <span>•</span>
                                                        <span>{doc.uploadedAt}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                                <button className="p-1.5 hover:bg-gray-100 rounded">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-1.5 hover:bg-gray-100 rounded">
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="p-1.5 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredDocuments.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">No documents found</p>
                                )}
                            </div>
                        )}

                        {/* Work History Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    {workHistory.map((history, index) => (
                                        <div key={history.id} className="flex gap-4 pb-6">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-4 h-4 rounded-full ${history.status === 'current' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                {index < workHistory.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                                                )}
                                            </div>
                                            <div className={`flex-1 border rounded-lg p-4 ${history.status === 'current' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">{history.position}</h4>
                                                        <p className="text-sm text-gray-600">{history.department}</p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {history.startDate} - {history.endDate || 'Present'}
                                                        </p>
                                                        {history.notes && (
                                                            <p className="text-sm text-gray-600 mt-2 italic">{history.notes}</p>
                                                        )}
                                                    </div>
                                                    {history.status === 'current' && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Current</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
                                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                        {staffRecords.map(staff => (
                                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                        {documentCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                        Upload
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
