import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Download, Search, Check, X, Plus,
    Shield, AlertTriangle, FileCheck, History, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface License {
    id: string;
    staffName: string;
    licenseType: string;
    licenseNumber: string;
    issuedDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
    verifiedBy: string;
}

interface AuditLog {
    id: string;
    action: string;
    performedBy: string;
    targetUser: string;
    timestamp: string;
    details: string;
    category: 'access' | 'data' | 'system' | 'compliance';
}

interface ComplianceCheck {
    id: string;
    checkName: string;
    category: string;
    lastCheck: string;
    status: 'passed' | 'failed' | 'pending';
    nextDue: string;
}

const mockLicenses: License[] = [
    { id: '1', staffName: 'Dr. Sarah Wilson', licenseType: 'Medical License', licenseNumber: 'ML-2023-001', issuedDate: '2023-01-15', expiryDate: '2026-01-15', status: 'valid', verifiedBy: 'Admin' },
    { id: '2', staffName: 'Dr. Emily Chen', licenseType: 'Medical License', licenseNumber: 'ML-2022-045', issuedDate: '2022-06-20', expiryDate: '2025-01-20', status: 'expiring', verifiedBy: 'Admin' },
    { id: '3', staffName: 'John Doe', licenseType: 'Nursing License', licenseNumber: 'NL-2021-112', issuedDate: '2021-03-10', expiryDate: '2024-03-10', status: 'expired', verifiedBy: 'HR' },
    { id: '4', staffName: 'Mike Johnson', licenseType: 'Radiology Technician License', licenseNumber: 'RT-2023-078', issuedDate: '2023-09-01', expiryDate: '2026-09-01', status: 'valid', verifiedBy: 'Admin' },
];

const mockAuditLogs: AuditLog[] = [
    { id: '1', action: 'Login', performedBy: 'Dr. Sarah Wilson', targetUser: '-', timestamp: '2025-12-18 09:15:23', details: 'Successful login from IP 192.168.1.45', category: 'access' },
    { id: '2', action: 'Patient Record Update', performedBy: 'John Doe', targetUser: 'Patient #1234', timestamp: '2025-12-18 10:30:45', details: 'Updated medication history', category: 'data' },
    { id: '3', action: 'Permission Change', performedBy: 'Admin', targetUser: 'Emily Chen', timestamp: '2025-12-18 11:00:00', details: 'Granted prescription authority', category: 'system' },
    { id: '4', action: 'HIPAA Training Completed', performedBy: 'Mike Johnson', targetUser: '-', timestamp: '2025-12-17 14:20:00', details: 'Annual HIPAA compliance training completed', category: 'compliance' },
];

const mockComplianceChecks: ComplianceCheck[] = [
    { id: '1', checkName: 'HIPAA Compliance Audit', category: 'Privacy', lastCheck: '2025-11-15', status: 'passed', nextDue: '2026-05-15' },
    { id: '2', checkName: 'Background Check Verification', category: 'HR', lastCheck: '2025-12-01', status: 'passed', nextDue: '2026-12-01' },
    { id: '3', checkName: 'Emergency Preparedness Drill', category: 'Safety', lastCheck: '2025-10-20', status: 'passed', nextDue: '2026-01-20' },
    { id: '4', checkName: 'Drug Testing', category: 'HR', lastCheck: '2025-09-15', status: 'pending', nextDue: '2025-12-15' },
];

export const ComplianceLegal: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'licenses' | 'audit' | 'compliance'>('licenses');
    const [licenses] = useState<License[]>(mockLicenses);
    const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
    const [complianceChecks] = useState<ComplianceCheck[]>(mockComplianceChecks);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const expiringLicenses = licenses.filter(l => l.status === 'expiring' || l.status === 'expired').length;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'valid': case 'passed': return 'bg-green-100 text-green-700';
            case 'expiring': case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'expired': case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'access': return 'bg-blue-100 text-blue-700';
            case 'data': return 'bg-purple-100 text-purple-700';
            case 'system': return 'bg-orange-100 text-orange-700';
            case 'compliance': return 'bg-green-100 text-green-700';
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
        { id: 'licenses', label: 'Licenses & Credentials', icon: <FileCheck className="w-4 h-4" />, count: expiringLicenses },
        { id: 'audit', label: 'Audit Trails', icon: <History className="w-4 h-4" /> },
        { id: 'compliance', label: 'Compliance Checks', icon: <Shield className="w-4 h-4" /> },
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
                            <h1 className="text-2xl font-bold text-gray-800">Compliance & Legal</h1>
                            <p className="text-gray-500">Manage licenses, audit trails, and regulatory compliance</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Valid Licenses</p>
                                <p className="text-2xl font-bold text-green-600">{licenses.filter(l => l.status === 'valid').length}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FileCheck className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Expiring Soon</p>
                                <p className="text-2xl font-bold text-yellow-600">{licenses.filter(l => l.status === 'expiring').length}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Compliance Score</p>
                                <p className="text-2xl font-bold text-emerald-600">94%</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Audit Events (Today)</p>
                                <p className="text-2xl font-bold text-blue-600">{auditLogs.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <History className="w-6 h-6 text-blue-600" />
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
                        {/* Licenses Tab */}
                        {activeTab === 'licenses' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search licenses..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                        <Plus className="w-4 h-4" />
                                        Add License
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License #</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {licenses.map(license => (
                                                <tr key={license.id} className={`hover:bg-gray-50 ${license.status === 'expired' ? 'bg-red-50' : ''}`}>
                                                    <td className="px-4 py-3 font-medium text-gray-800">{license.staffName}</td>
                                                    <td className="px-4 py-3 text-gray-600">{license.licenseType}</td>
                                                    <td className="px-4 py-3 text-gray-600">{license.licenseNumber}</td>
                                                    <td className="px-4 py-3 text-gray-600">{license.expiryDate}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(license.status)}`}>
                                                            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button className="p-1.5 hover:bg-gray-100 rounded">
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Audit Trails Tab */}
                        {activeTab === 'audit' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="access">Access</option>
                                        <option value="data">Data</option>
                                        <option value="system">System</option>
                                        <option value="compliance">Compliance</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    {auditLogs.filter(log => filterCategory === 'all' || log.category === filterCategory).map(log => (
                                        <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-lg mt-1">
                                                        <History className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-gray-800">{log.action}</h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyle(log.category)}`}>
                                                                {log.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                            <span>By: {log.performedBy}</span>
                                                            {log.targetUser !== '-' && <span>Target: {log.targetUser}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">{log.timestamp}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Compliance Checks Tab */}
                        {activeTab === 'compliance' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {complianceChecks.map(check => (
                                        <div key={check.id} className={`border rounded-lg p-4 ${check.status === 'failed' ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{check.checkName}</h4>
                                                    <p className="text-sm text-gray-500">{check.category}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(check.status)}`}>
                                                    {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Last Check: {check.lastCheck}</span>
                                                <span>Next Due: {check.nextDue}</span>
                                            </div>
                                            {check.status === 'pending' && (
                                                <button className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                                                    Run Check
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
