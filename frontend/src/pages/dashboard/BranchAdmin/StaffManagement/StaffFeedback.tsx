import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Download, Search, Plus, X, Send,
    MessageCircle, Star, TrendingUp, ThumbsUp, ThumbsDown, Eye, FileText} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface Survey {
    id: string;
    title: string;
    description: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'completed';
    responses: number;
    totalTargeted: number;
}

interface FeedbackItem {
    id: string;
    type: 'suggestion' | 'complaint' | 'praise' | 'question';
    subject: string;
    message: string;
    submittedBy: string;
    department: string;
    submittedAt: string;
    status: 'new' | 'reviewed' | 'resolved';
    isAnonymous: boolean;
}

interface SurveyResult {
    question: string;
    responses: {
        option: string;
        count: number;
        percentage: number;
    }[];
}

const mockSurveys: Survey[] = [
    { id: '1', title: 'Employee Satisfaction Survey 2025', description: 'Annual employee satisfaction and engagement survey', targetAudience: 'All Staff', startDate: '2025-12-01', endDate: '2025-12-31', status: 'active', responses: 38, totalTargeted: 54 },
    { id: '2', title: 'Work Environment Assessment', description: 'Feedback on workplace conditions and facilities', targetAudience: 'All Staff', startDate: '2025-11-15', endDate: '2025-11-30', status: 'completed', responses: 48, totalTargeted: 54 },
    { id: '3', title: 'Training Needs Assessment', description: 'Identify training requirements for next quarter', targetAudience: 'Department Heads', startDate: '2026-01-01', endDate: '2026-01-15', status: 'draft', responses: 0, totalTargeted: 8 },
];

const mockFeedback: FeedbackItem[] = [
    { id: '1', type: 'suggestion', subject: 'Improve Break Room Facilities', message: 'It would be great to have a microwave and better seating in the break room.', submittedBy: 'Anonymous', department: 'General', submittedAt: '2025-12-17', status: 'new', isAnonymous: true },
    { id: '2', type: 'praise', subject: 'Great Team Leadership', message: 'Dr. Wilson has been an excellent team leader this quarter. Her guidance has improved our efficiency.', submittedBy: 'John Doe', department: 'Cardiology', submittedAt: '2025-12-16', status: 'reviewed', isAnonymous: false },
    { id: '3', type: 'complaint', subject: 'Scheduling Issues', message: 'The current scheduling system is making it difficult to balance work and personal commitments.', submittedBy: 'Anonymous', department: 'Emergency', submittedAt: '2025-12-15', status: 'new', isAnonymous: true },
    { id: '4', type: 'question', subject: 'Holiday Pay Policy', message: 'Can someone clarify the holiday pay policy for part-time employees?', submittedBy: 'Emily Chen', department: 'Pediatrics', submittedAt: '2025-12-14', status: 'resolved', isAnonymous: false },
];

const mockSurveyResults: SurveyResult[] = [
    { question: 'How satisfied are you with your work environment?', responses: [{ option: 'Very Satisfied', count: 20, percentage: 42 }, { option: 'Satisfied', count: 18, percentage: 38 }, { option: 'Neutral', count: 6, percentage: 12 }, { option: 'Dissatisfied', count: 4, percentage: 8 }] },
    { question: 'Do you feel valued by your team?', responses: [{ option: 'Yes', count: 35, percentage: 73 }, { option: 'Sometimes', count: 10, percentage: 21 }, { option: 'No', count: 3, percentage: 6 }] },
    { question: 'Would you recommend this workplace?', responses: [{ option: 'Definitely', count: 25, percentage: 52 }, { option: 'Probably', count: 15, percentage: 31 }, { option: 'Not Sure', count: 5, percentage: 11 }, { option: 'No', count: 3, percentage: 6 }] },
];

export const StaffFeedback: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'surveys' | 'feedback' | 'analysis'>('surveys');
    const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
    const [feedback, setFeedback] = useState<FeedbackItem[]>(mockFeedback);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleUpdateFeedbackStatus = (id: string, status: 'reviewed' | 'resolved') => {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
        toast.success(`Feedback marked as ${status}`);
    };

    const handleActivateSurvey = (id: string) => {
        setSurveys(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
        toast.success('Survey activated');
    };

    const filteredFeedback = feedback.filter(f => {
        if (filterType !== 'all' && f.type !== filterType) return false;
        if (filterStatus !== 'all' && f.status !== filterStatus) return false;
        return true;
    });

    const newFeedbackCount = feedback.filter(f => f.status === 'new').length;

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'suggestion': return 'bg-blue-100 text-blue-700';
            case 'complaint': return 'bg-error-100 text-red-700';
            case 'praise': return 'bg-green-100 text-green-700';
            case 'question': return 'bg-purple-100 text-purple-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-neutral-100 text-neutral-700';
            case 'draft': return 'bg-yellow-100 text-yellow-700';
            case 'new': return 'bg-blue-100 text-blue-700';
            case 'reviewed': return 'bg-orange-100 text-orange-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'praise': return <ThumbsUp className="w-5 h-5 text-green-600" />;
            case 'complaint': return <ThumbsDown className="w-5 h-5 text-error-600" />;
            default: return <MessageCircle className="w-5 h-5 text-primary-500" />;
        }
    };

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

    const tabs = [
        { id: 'surveys', label: 'Surveys', icon: <FileText className="w-4 h-4" /> },
        { id: 'feedback', label: 'Feedback', icon: <MessageCircle className="w-4 h-4" />, count: newFeedbackCount },
        { id: 'analysis', label: 'Analysis', icon: <TrendingUp className="w-4 h-4" /> },
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
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Staff Feedback & Surveys</h1>
                            <p className="text-neutral-500">Collect and analyze staff feedback</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:opacity-90"
                    >
                        <Plus className="w-4 h-4" />
                        Create Survey
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Active Surveys</p>
                                <p className="text-2xl font-bold text-emerald-600">{surveys.filter(s => s.status === 'active').length}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <FileText className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Total Responses</p>
                                <p className="text-2xl font-bold text-primary-500">{surveys.reduce((sum, s) => sum + s.responses, 0)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <MessageCircle className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">New Feedback</p>
                                <p className="text-2xl font-bold text-orange-600">{newFeedbackCount}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Star className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Avg Satisfaction</p>
                                <p className="text-2xl font-bold text-purple-600">4.2/5</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="border-b border-neutral-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 bg-error-500 text-white text-xs rounded-full">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Surveys Tab */}
                        {activeTab === 'surveys' && (
                            <div className="space-y-4">
                                {surveys.map(survey => (
                                    <div key={survey.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-neutral-800">{survey.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(survey.status)}`}>
                                                        {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-600">{survey.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                                    <span>Target: {survey.targetAudience}</span>
                                                    <span>{survey.startDate} - {survey.endDate}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-neutral-800">{survey.responses}/{survey.totalTargeted}</p>
                                                <p className="text-sm text-neutral-500">responses</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-neutral-500">Response Rate</span>
                                                <span className="text-sm font-medium">{Math.round((survey.responses / survey.totalTargeted) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-neutral-200 rounded-full">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${(survey.responses / survey.totalTargeted) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                            {survey.status === 'draft' && (
                                                <button 
                                                    onClick={() => handleActivateSurvey(survey.id)}
                                                    className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                            {survey.status !== 'draft' && (
                                                <button 
                                                    onClick={() => { setSelectedSurvey(survey); setActiveTab('analysis'); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded text-sm hover:bg-neutral-50"
                                                >
                                                    <Eye className="w-4 h-4" /> View Results
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Feedback Tab */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="suggestion">Suggestions</option>
                                        <option value="complaint">Complaints</option>
                                        <option value="praise">Praise</option>
                                        <option value="question">Questions</option>
                                    </select>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="new">New</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    {filteredFeedback.map(item => (
                                        <div key={item.id} className={`border rounded-lg p-4 ${item.status === 'new' ? 'border-blue-300 bg-blue-50' : 'border-neutral-200'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-neutral-100 rounded-lg">
                                                    {getTypeIcon(item.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getTypeStyle(item.type)}`}>
                                                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(item.status)}`}>
                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-neutral-800">{item.subject}</h4>
                                                    <p className="text-sm text-neutral-600 mt-1">{item.message}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                                        <span>{item.isAnonymous ? 'Anonymous' : item.submittedBy}</span>
                                                        <span>{item.department}</span>
                                                        <span>{item.submittedAt}</span>
                                                    </div>
                                                </div>
                                                {item.status !== 'resolved' && (
                                                    <div className="flex gap-2">
                                                        {item.status === 'new' && (
                                                            <button 
                                                                onClick={() => handleUpdateFeedbackStatus(item.id, 'reviewed')}
                                                                className="px-3 py-1.5 border border-neutral-300 rounded text-sm hover:bg-neutral-50"
                                                            >
                                                                Mark Reviewed
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleUpdateFeedbackStatus(item.id, 'resolved')}
                                                            className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                                        >
                                                            Resolve
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Tab */}
                        {activeTab === 'analysis' && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h4 className="font-semibold text-neutral-800">
                                        {selectedSurvey ? selectedSurvey.title : 'Employee Satisfaction Survey 2025'} - Results
                                    </h4>
                                    <p className="text-sm text-neutral-500">Based on 48 responses</p>
                                </div>

                                {mockSurveyResults.map((result, index) => (
                                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                                        <h5 className="font-medium text-neutral-800 mb-4">{result.question}</h5>
                                        <div className="space-y-3">
                                            {result.responses.map((response, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm text-neutral-600">{response.option}</span>
                                                    <div className="flex-1 h-6 bg-neutral-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${
                                                                idx === 0 ? 'bg-green-500' :
                                                                idx === 1 ? 'bg-primary-500' :
                                                                idx === 2 ? 'bg-yellow-500' :
                                                                'bg-error-500'
                                                            }`}
                                                            style={{ width: `${response.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="w-16 text-sm font-medium text-right">{response.percentage}%</span>
                                                    <span className="w-12 text-xs text-neutral-400 text-right">({response.count})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-end">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                                        <Download className="w-4 h-4" />
                                        Export Full Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Survey Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-neutral-800">Create Survey</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Survey Title</label>
                                    <input type="text" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                    <textarea className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500" rows={3}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Target Audience</label>
                                    <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                        <option value="all">All Staff</option>
                                        <option value="doctors">Doctors</option>
                                        <option value="nurses">Nurses</option>
                                        <option value="admin">Administrative</option>
                                        <option value="heads">Department Heads</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                                        <input type="date" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                                        <input type="date" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-lg hover:opacity-90">
                                        Create Survey
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
