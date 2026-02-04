import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Send, Search, User, Clock,
    ChevronRight, Filter, Plus, Phone, Mail,
    FileText, Stethoscope, Users, AlertCircle
} from 'lucide-react';

interface Message {
    id: string;
    type: 'sent' | 'received';
    sender: string;
    sender_role: string;
    recipient: string;
    subject: string;
    content: string;
    timestamp: string;
    is_read: boolean;
    priority: 'normal' | 'urgent' | 'clarification';
    related_prescription?: string;
}

interface Contact {
    id: string;
    name: string;
    role: string;
    department: string;
    status: 'online' | 'offline' | 'busy';
    avatar?: string;
}

export const PharmacistMessages: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'clarifications' | 'handover'>('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState({ to: '', subject: '', content: '' });
    const [showCompose, setShowCompose] = useState(false);

    useEffect(() => {
        fetchMessages();
        fetchContacts();
    }, []);

    const fetchMessages = async () => {
        const mockMessages: Message[] = [
            {
                id: '1',
                type: 'received',
                sender: 'Dr. A. Silva',
                sender_role: 'Consultant Physician',
                recipient: 'You',
                subject: 'Re: Clarification - RX-2025-001234',
                content: 'Regarding your query about the Metformin dosage, please proceed with 500mg BD as prescribed. The patient has been on this dosage previously with good tolerance.',
                timestamp: '2025-12-18T10:30:00',
                is_read: false,
                priority: 'clarification',
                related_prescription: 'RX-2025-001234'
            },
            {
                id: '2',
                type: 'received',
                sender: 'Dr. K. Perera',
                sender_role: 'Medical Officer',
                recipient: 'You',
                subject: 'Urgent: Patient Allergy Update',
                content: 'Please note that patient ID PAT-001 has developed a new allergy to Penicillin derivatives. Update the dispensing system accordingly.',
                timestamp: '2025-12-18T09:15:00',
                is_read: true,
                priority: 'urgent'
            },
            {
                id: '3',
                type: 'sent',
                sender: 'You',
                sender_role: 'Pharmacist',
                recipient: 'Dr. A. Silva',
                subject: 'Clarification Request - RX-2025-001234',
                content: 'Regarding prescription RX-2025-001234, the dosage for Metformin appears to be higher than usual (1000mg TDS). Could you please confirm if this is correct?',
                timestamp: '2025-12-18T08:00:00',
                is_read: true,
                priority: 'clarification',
                related_prescription: 'RX-2025-001234'
            },
            {
                id: '4',
                type: 'received',
                sender: 'Ward 3B - Nurse Station',
                sender_role: 'Ward Nurse',
                recipient: 'You',
                subject: 'Stock Request for Ward 3B',
                content: 'We require the following medications for the ward: Paracetamol IV 1g x 20, Normal Saline 0.9% x 50, Omeprazole 40mg x 30',
                timestamp: '2025-12-17T16:30:00',
                is_read: true,
                priority: 'normal'
            }
        ];
        setMessages(mockMessages);
    };

    const fetchContacts = async () => {
        const mockContacts: Contact[] = [
            { id: '1', name: 'Dr. A. Silva', role: 'Consultant Physician', department: 'Internal Medicine', status: 'online' },
            { id: '2', name: 'Dr. K. Perera', role: 'Medical Officer', department: 'Emergency', status: 'busy' },
            { id: '3', name: 'Dr. M. Fernando', role: 'Senior Registrar', department: 'Cardiology', status: 'offline' },
            { id: '4', name: 'Nurse R. Jayasinghe', role: 'Ward Nurse', department: 'Ward 3B', status: 'online' },
            { id: '5', name: 'IT Support', role: 'Technical Support', department: 'IT', status: 'online' }
        ];
        setContacts(mockContacts);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Urgent</span>;
            case 'clarification':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Clarification</span>;
            default:
                return null;
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             msg.sender.toLowerCase().includes(searchQuery.toLowerCase());
        
        switch (activeTab) {
            case 'inbox': return msg.type === 'received' && matchesSearch;
            case 'sent': return msg.type === 'sent' && matchesSearch;
            case 'clarifications': return msg.priority === 'clarification' && matchesSearch;
            default: return matchesSearch;
        }
    });

    const unreadCount = messages.filter(m => !m.is_read && m.type === 'received').length;

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-7 h-7 text-purple-600" />
                            Messages & Communication
                        </h1>
                        <p className="text-gray-600">Internal messaging with doctors and staff</p>
                    </div>
                    <button
                        onClick={() => setShowCompose(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Message
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Contacts */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Quick Contacts
                                </h3>
                            </div>
                            <div className="p-2 max-h-[500px] overflow-y-auto">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        onClick={() => {
                                            setSelectedContact(contact);
                                            setShowCompose(true);
                                            setNewMessage(prev => ({ ...prev, to: contact.name }));
                                        }}
                                        className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                                            selectedContact?.id === contact.id ? 'bg-purple-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(contact.status)} rounded-full border-2 border-white`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500">{contact.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Messages */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow">
                            {/* Tabs */}
                            <div className="flex border-b">
                                <button
                                    onClick={() => setActiveTab('inbox')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                                        activeTab === 'inbox' 
                                            ? 'text-purple-600 border-b-2 border-purple-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Inbox {unreadCount > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                                        activeTab === 'sent' 
                                            ? 'text-purple-600 border-b-2 border-purple-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Sent
                                </button>
                                <button
                                    onClick={() => setActiveTab('clarifications')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                                        activeTab === 'clarifications' 
                                            ? 'text-purple-600 border-b-2 border-purple-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Clarifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('handover')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                                        activeTab === 'handover' 
                                            ? 'text-purple-600 border-b-2 border-purple-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Handover Notes
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                                {activeTab === 'handover' ? (
                                    <div className="p-8 text-center">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">Shift handover notes appear here</p>
                                        <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                            Create Handover Note
                                        </button>
                                    </div>
                                ) : filteredMessages.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No messages found</p>
                                    </div>
                                ) : (
                                    filteredMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            onClick={() => setSelectedMessage(message)}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer ${
                                                !message.is_read ? 'bg-purple-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {message.sender_role.includes('Doctor') ? (
                                                        <Stethoscope className="w-5 h-5 text-purple-600" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-purple-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {message.type === 'sent' ? `To: ${message.recipient}` : message.sender}
                                                            </span>
                                                            {getPriorityBadge(message.priority)}
                                                            {!message.is_read && (
                                                                <span className="w-2 h-2 bg-purple-600 rounded-full" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(message.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${!message.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        {message.subject}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate mt-1">
                                                        {message.content}
                                                    </p>
                                                    {message.related_prescription && (
                                                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                                            <FileText className="w-3 h-3" />
                                                            Related: {message.related_prescription}
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compose Modal */}
                {showCompose && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-purple-600" />
                                    New Message
                                </h3>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                                    <input
                                        type="text"
                                        value={newMessage.to}
                                        onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Search for a contact..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                                    <input
                                        type="text"
                                        value={newMessage.subject}
                                        onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Enter subject..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                                    <textarea
                                        value={newMessage.content}
                                        onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Type your message..."
                                    />
                                </div>
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedMessage.subject}</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedMessage.type === 'sent' ? 
                                            `To: ${selectedMessage.recipient}` : 
                                            `From: ${selectedMessage.sender}`
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                                    <span>{selectedMessage.sender_role}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                                    {getPriorityBadge(selectedMessage.priority)}
                                </div>
                                <div className="prose max-w-none">
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.content}</p>
                                </div>
                                {selectedMessage.related_prescription && (
                                    <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-blue-800">
                                        <FileText className="w-5 h-5" />
                                        <span>Related Prescription: {selectedMessage.related_prescription}</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                {selectedMessage.type === 'received' && (
                                    <button
                                        onClick={() => {
                                            setNewMessage({
                                                to: selectedMessage.sender,
                                                subject: `Re: ${selectedMessage.subject}`,
                                                content: ''
                                            });
                                            setSelectedMessage(null);
                                            setShowCompose(true);
                                        }}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Reply
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistMessages;
