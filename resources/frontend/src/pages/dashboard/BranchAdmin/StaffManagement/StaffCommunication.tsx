import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Send, Plus, Search, X,
    MessageSquare, Bell, Video, Mail, Pin, Trash2, Eye, User, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface Announcement {
    id: string;
    title: string;
    content: string;
    author: string;
    targetAudience: string[];
    createdAt: string;
    priority: 'high' | 'medium' | 'low';
    isPinned: boolean;
    readCount: number;
}

interface Message {
    id: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

interface Meeting {
    id: string;
    title: string;
    organizer: string;
    attendees: string[];
    date: string;
    time: string;
    duration: string;
    type: 'in-person' | 'virtual';
    location: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

const mockAnnouncements: Announcement[] = [
    { id: '1', title: 'Holiday Schedule Update', content: 'Please note the updated holiday schedule for December 2025. All departments should submit their coverage plans by Dec 15th.', author: 'Branch Admin', targetAudience: ['All Staff'], createdAt: '2025-12-15', priority: 'high', isPinned: true, readCount: 45 },
    { id: '2', title: 'New COVID-19 Protocol', content: 'Updated safety protocols have been implemented. Please review the attached document and complete the acknowledgment form.', author: 'HR Department', targetAudience: ['All Staff'], createdAt: '2025-12-14', priority: 'high', isPinned: false, readCount: 52 },
    { id: '3', title: 'Staff Appreciation Event', content: 'Join us for our annual staff appreciation event on Dec 20th at 6 PM in the main conference hall.', author: 'Events Committee', targetAudience: ['All Staff'], createdAt: '2025-12-12', priority: 'low', isPinned: false, readCount: 38 },
];

const mockMessages: Message[] = [
    { id: '1', from: 'Dr. Sarah Wilson', to: 'You', subject: 'Shift Coverage Request', content: 'Hi, I need to request coverage for my Dec 22nd morning shift. Would you be able to find a replacement?', timestamp: '2025-12-18 10:30', isRead: false },
    { id: '2', from: 'John Doe', to: 'You', subject: 'Leave Application Query', content: 'I wanted to follow up on my leave application submitted last week.', timestamp: '2025-12-17 15:45', isRead: true },
    { id: '3', from: 'HR Department', to: 'You', subject: 'Monthly Report Due', content: 'Reminder: Monthly staff performance reports are due by end of day Friday.', timestamp: '2025-12-16 09:00', isRead: true },
];

const mockMeetings: Meeting[] = [
    { id: '1', title: 'Weekly Staff Meeting', organizer: 'Branch Admin', attendees: ['All Department Heads'], date: '2025-12-20', time: '10:00 AM', duration: '1 hour', type: 'in-person', location: 'Conference Room A', status: 'scheduled' },
    { id: '2', title: 'Performance Review - Q4', organizer: 'HR Manager', attendees: ['Senior Staff'], date: '2025-12-22', time: '2:00 PM', duration: '2 hours', type: 'virtual', location: 'Zoom', status: 'scheduled' },
    { id: '3', title: 'Emergency Protocol Training', organizer: 'Safety Officer', attendees: ['All Staff'], date: '2025-12-15', time: '3:00 PM', duration: '1.5 hours', type: 'in-person', location: 'Training Hall', status: 'completed' },
];

export const StaffCommunication: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'announcements' | 'messages' | 'meetings'>('announcements');
    const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [meetings] = useState<Meeting[]>(mockMeetings);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handlePinAnnouncement = (id: string) => {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
        toast.success('Announcement updated');
    };

    const handleDeleteAnnouncement = (id: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast.success('Announcement deleted');
    };

    const handleMarkAsRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    };

    const unreadCount = messages.filter(m => !m.isRead).length;

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
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
        { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, count: unreadCount },
        { id: 'meetings', label: 'Meetings', icon: <Video className="w-4 h-4" /> },
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
                            <h1 className="text-2xl font-bold text-gray-800">Staff Communication</h1>
                            <p className="text-gray-500">Manage announcements, messages, and meetings</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90"
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Announcements</p>
                                <p className="text-2xl font-bold text-blue-600">{announcements.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Bell className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Unread Messages</p>
                                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Mail className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Upcoming Meetings</p>
                                <p className="text-2xl font-bold text-purple-600">{meetings.filter(m => m.status === 'scheduled').length}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Video className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pinned Items</p>
                                <p className="text-2xl font-bold text-emerald-600">{announcements.filter(a => a.isPinned).length}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <Pin className="w-6 h-6 text-emerald-600" />
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
                        {/* Announcements Tab */}
                        {activeTab === 'announcements' && (
                            <div className="space-y-4">
                                {/* Pinned Announcements */}
                                {announcements.filter(a => a.isPinned).length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                                            <Pin className="w-4 h-4" /> Pinned
                                        </h4>
                                        {announcements.filter(a => a.isPinned).map(announcement => (
                                            <div key={announcement.id} className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg p-4 mb-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-gray-800">{announcement.title}</h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityStyle(announcement.priority)}`}>
                                                                {announcement.priority}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{announcement.content}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                            <span>By: {announcement.author}</span>
                                                            <span>{announcement.createdAt}</span>
                                                            <span>{announcement.readCount} views</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handlePinAnnouncement(announcement.id)} className="p-1.5 hover:bg-white rounded">
                                                            <Pin className="w-4 h-4 text-emerald-600" />
                                                        </button>
                                                        <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="p-1.5 hover:bg-white rounded">
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Other Announcements */}
                                <div className="space-y-3">
                                    {announcements.filter(a => !a.isPinned).map(announcement => (
                                        <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-800">{announcement.title}</h4>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getPriorityStyle(announcement.priority)}`}>
                                                            {announcement.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{announcement.content}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span>By: {announcement.author}</span>
                                                        <span>{announcement.createdAt}</span>
                                                        <span>{announcement.readCount} views</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handlePinAnnouncement(announcement.id)} className="p-1.5 hover:bg-gray-100 rounded">
                                                        <Pin className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="p-1.5 hover:bg-red-50 rounded">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages Tab */}
                        {activeTab === 'messages' && (
                            <div className="space-y-3">
                                {messages.map(message => (
                                    <div 
                                        key={message.id} 
                                        className={`border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${
                                            !message.isRead ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                        }`}
                                        onClick={() => handleMarkAsRead(message.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-800">{message.from}</h4>
                                                        {!message.isRead && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">{message.subject}</p>
                                                    <p className="text-sm text-gray-500 mt-1">{message.content}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">{message.timestamp}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Meetings Tab */}
                        {activeTab === 'meetings' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                        <Plus className="w-4 h-4" />
                                        Schedule Meeting
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {meetings.map(meeting => (
                                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{meeting.title}</h4>
                                                    <p className="text-sm text-gray-500">Organized by {meeting.organizer}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(meeting.status)}`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{meeting.date} at {meeting.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{meeting.duration}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {meeting.type === 'virtual' ? <Video className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                                    <span>{meeting.location}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500">Attendees: {meeting.attendees.join(', ')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Announcement Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-800">New Announcement</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" rows={4}></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                            <option value="all">All Staff</option>
                                            <option value="doctors">Doctors</option>
                                            <option value="nurses">Nurses</option>
                                            <option value="admin">Administrative</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:opacity-90">
                                        <Send className="w-4 h-4" />
                                        Publish
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
