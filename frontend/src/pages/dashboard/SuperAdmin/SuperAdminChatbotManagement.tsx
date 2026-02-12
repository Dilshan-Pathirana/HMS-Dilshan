import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { SidebarMenu, SuperAdminMenuItems } from '../../../components/common/Layout/SidebarMenu';
import {
    MessageSquare,
    Search,
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    BarChart3,
    Database,
    AlertCircle,
    CheckCircle,
    X,
    TrendingUp,
    MessageCircle,
    HelpCircle,
    FileQuestion
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface FAQ {
    id: string;
    category: string;
    question_en: string;
    answer_en: string;
    question_si?: string;
    answer_si?: string;
    keywords: string[];
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

interface DiseaseMapping {
    id: string;
    disease_name: string;
    specialization: string;
    safe_response: string;
    is_active: boolean;
    created_at: string;
}

interface ChatLog {
    id: string;
    question: string;
    category_detected: string;
    response_given: string;
    was_helpful: boolean | null;
    session_id: string;
    created_at: string;
}

interface Analytics {
    total_interactions: number;
    satisfaction_rate: number;
    helpful_count: number;
    not_helpful_count: number;
    no_feedback_count: number;
    category_breakdown: Record<string, number>;
    recent_trend: Array<{ date: string; count: number }>;
}

const CATEGORIES = [
    { value: 'general_homeopathy', label: 'General Homeopathy' },
    { value: 'doctor_info', label: 'Doctor Information' },
    { value: 'hospital_info', label: 'Hospital/Branch Info' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'doctor_capability', label: 'Doctor Capability' },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const SuperAdminChatbotManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faqs' | 'mappings' | 'logs' | 'analytics'>('faqs');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [mappings, setMappings] = useState<DiseaseMapping[]>([]);
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [hasNotifiedEmptyFaqs, setHasNotifiedEmptyFaqs] = useState(false);

    // User info
    const [userName, setUserName] = useState('Super Admin');
    const [profileImage, setProfileImage] = useState('');

    // Modal states
    const [showFaqModal, setShowFaqModal] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [editingMapping, setEditingMapping] = useState<DiseaseMapping | null>(null);

    // Form states
    const [faqForm, setFaqForm] = useState({
        category: 'general_homeopathy',
        question_en: '',
        answer_en: '',
        question_si: '',
        answer_si: '',
        keywords: '',
        priority: 50
    });

    const [mappingForm, setMappingForm] = useState({
        disease_name: '',
        specialization: '',
        safe_response: ''
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    };

    // Fetch FAQs
    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter) params.append('category', categoryFilter);

            const response = await api.get(`/chatbot/admin/faqs?${params}`, {
                headers: getAuthHeaders()
            });
            const items = response?.data?.data || [];
            setFaqs(items);
            setError(null);

            if (!hasNotifiedEmptyFaqs && !searchTerm && !categoryFilter && items.length === 0) {
                toast.info('No FAQs created yet. Add your first FAQ.');
                setHasNotifiedEmptyFaqs(true);
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                setFaqs([]);
                setError(null);
                if (!hasNotifiedEmptyFaqs && !searchTerm && !categoryFilter) {
                    toast.info('No FAQs created yet. Add your first FAQ.');
                    setHasNotifiedEmptyFaqs(true);
                }
            } else {
                setError(err.response?.data?.message || 'Failed to fetch FAQs');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch Disease Mappings
    const fetchMappings = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chatbot/admin/disease-mappings`, {
                headers: getAuthHeaders()
            });
            setMappings(response.data.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch mappings');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chatbot/admin/logs`, {
                headers: getAuthHeaders()
            });
            setLogs(response.data.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Analytics
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chatbot/admin/analytics`, {
                headers: getAuthHeaders()
            });
            setAnalytics(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'faqs') fetchFaqs();
        else if (activeTab === 'mappings') fetchMappings();
        else if (activeTab === 'logs') fetchLogs();
        else if (activeTab === 'analytics') fetchAnalytics();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'faqs') {
            const debounce = setTimeout(() => fetchFaqs(), 300);
            return () => clearTimeout(debounce);
        }
    }, [searchTerm, categoryFilter]);

    // Save FAQ
    const saveFaq = async () => {
        try {
            const payload = {
                ...faqForm,
                keywords: faqForm.keywords.split(',').map(k => k.trim()).filter(k => k)
            };

            if (editingFaq) {
                await api.put(`/chatbot/admin/faqs/${editingFaq.id}`, payload, {
                    headers: getAuthHeaders()
                });
            } else {
                await api.post(`/chatbot/admin/faqs`, payload, {
                    headers: getAuthHeaders()
                });
            }

            setShowFaqModal(false);
            setEditingFaq(null);
            resetFaqForm();
            fetchFaqs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save FAQ');
        }
    };

    // Delete FAQ
    const deleteFaq = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            await api.delete(`/chatbot/admin/faqs/${id}`, {
                headers: getAuthHeaders()
            });
            fetchFaqs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete FAQ');
        }
    };

    // Toggle FAQ Status
    const toggleFaqStatus = async (id: string) => {
        try {
            await api.patch(`/chatbot/admin/faqs/${id}/toggle-status`, {}, {
                headers: getAuthHeaders()
            });
            fetchFaqs();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    // Save Disease Mapping
    const saveMapping = async () => {
        try {
            if (editingMapping) {
                await api.put(`/chatbot/admin/disease-mappings/${editingMapping.id}`, mappingForm, {
                    headers: getAuthHeaders()
                });
            } else {
                await api.post(`/chatbot/admin/disease-mappings`, mappingForm, {
                    headers: getAuthHeaders()
                });
            }

            setShowMappingModal(false);
            setEditingMapping(null);
            resetMappingForm();
            fetchMappings();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save mapping');
        }
    };

    // Delete Disease Mapping
    const deleteMapping = async (id: string) => {
        if (!confirm('Are you sure you want to delete this mapping?')) return;

        try {
            await api.delete(`/chatbot/admin/disease-mappings/${id}`, {
                headers: getAuthHeaders()
            });
            fetchMappings();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete mapping');
        }
    };

    const resetFaqForm = () => {
        setFaqForm({
            category: 'general_homeopathy',
            question_en: '',
            answer_en: '',
            question_si: '',
            answer_si: '',
            keywords: '',
            priority: 50
        });
    };

    const resetMappingForm = () => {
        setMappingForm({
            disease_name: '',
            specialization: '',
            safe_response: ''
        });
    };

    const openEditFaq = (faq: FAQ) => {
        setEditingFaq(faq);
        setFaqForm({
            category: faq.category,
            question_en: faq.question_en,
            answer_en: faq.answer_en,
            question_si: faq.question_si || '',
            answer_si: faq.answer_si || '',
            keywords: faq.keywords.join(', '),
            priority: faq.priority
        });
        setShowFaqModal(true);
    };

    const openEditMapping = (mapping: DiseaseMapping) => {
        setEditingMapping(mapping);
        setMappingForm({
            disease_name: mapping.disease_name,
            specialization: mapping.specialization,
            safe_response: mapping.safe_response
        });
        setShowMappingModal(true);
    };

    const getCategoryLabel = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.label || category;
    };

    // Get user info from localStorage
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userInfo = JSON.parse(userStr);
                setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'Super Admin');
                setProfileImage(userInfo.profile_picture || '');
            } catch (e) {
                console.error('Failed to parse user from localStorage');
            }
        }
    }, []);

    return (
        <DashboardLayout
            userName={userName}
            userRole="Super Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu items={SuperAdminMenuItems} />}
        >
            <div className="p-6 overflow-auto bg-neutral-50 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <MessageSquare className="w-7 h-7 text-primary-500" />
                        Chatbot Management #1
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Manage FAQ responses, disease mappings, and monitor chatbot performance
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-neutral-200">
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'faqs'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        <FileQuestion className="w-4 h-4" />
                        FAQs
                    </button>
                    <button
                        onClick={() => setActiveTab('mappings')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'mappings'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        <Database className="w-4 h-4" />
                        Disease Mappings
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Interaction Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analytics'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </button>
                </div>

                {/* FAQs Tab */}
                {activeTab === 'faqs' && (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-neutral-200 flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search FAQs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => fetchFaqs()}
                                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm('Seed default FAQs? This will add missing default questions.')) return;
                                    setLoading(true);
                                    try {
                                        const res = await api.post('/chatbot/admin/seed-faqs', {}, { headers: getAuthHeaders() });
                                        toast.success(res.data.message);
                                        fetchFaqs();
                                    } catch (err: any) {
                                        toast.error(err.response?.data?.message || 'Failed to seed FAQs');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-2 transition-colors"
                                title="Seed Defaults"
                            >
                                <Database className="w-4 h-4" />
                                <span className="font-medium">Seed Defaults</span>
                            </button>
                            <button
                                onClick={() => { resetFaqForm(); setEditingFaq(null); setShowFaqModal(true); }}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add FAQ
                            </button>
                        </div>

                        {/* FAQ List */}
                        <div className="divide-y divide-gray-100">
                            {loading && !faqs.length ? (
                                <div className="p-8 text-center text-neutral-500">Loading...</div>
                            ) : faqs.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    No FAQs found. Add your first FAQ!
                                </div>
                            ) : (
                                faqs.map(faq => (
                                    <div key={faq.id} className="p-4 hover:bg-neutral-50">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${faq.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-neutral-100 text-neutral-600'
                                                        }`}>
                                                        {faq.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                                        {getCategoryLabel(faq.category)}
                                                    </span>
                                                    <span className="text-xs text-neutral-400">
                                                        Priority: {faq.priority}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-neutral-900">{faq.question_en}</h3>
                                                {faq.question_si && (
                                                    <p className="text-sm text-neutral-500 mt-0.5">???? {faq.question_si}</p>
                                                )}
                                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                                    {faq.answer_en}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {faq.keywords.map((keyword, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleFaqStatus(faq.id)}
                                                    className={`p-2 rounded-lg transition-colors ${faq.is_active
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-neutral-400 hover:bg-neutral-100'
                                                        }`}
                                                    title={faq.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {faq.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => openEditFaq(faq)}
                                                    className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFaq(faq.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Disease Mappings Tab */}
                {activeTab === 'mappings' && (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="font-semibold text-neutral-900">Disease to Specialization Mappings</h2>
                            <button
                                onClick={() => { resetMappingForm(); setEditingMapping(null); setShowMappingModal(true); }}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Mapping
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Disease/Condition</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Specialization</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Safe Response</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && !mappings.length ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Loading...</td>
                                        </tr>
                                    ) : mappings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No mappings found</td>
                                        </tr>
                                    ) : (
                                        mappings.map(mapping => (
                                            <tr key={mapping.id} className="hover:bg-neutral-50">
                                                <td className="px-4 py-3 font-medium text-neutral-900">{mapping.disease_name}</td>
                                                <td className="px-4 py-3 text-neutral-600">{mapping.specialization}</td>
                                                <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">{mapping.safe_response}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${mapping.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-neutral-100 text-neutral-600'
                                                        }`}>
                                                        {mapping.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => openEditMapping(mapping)}
                                                        className="p-1.5 text-primary-500 hover:bg-blue-50 rounded"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMapping(mapping.id)}
                                                        className="p-1.5 text-error-600 hover:bg-error-50 rounded ml-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Interaction Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="font-semibold text-neutral-900">Recent Chatbot Interactions</h2>
                            <button
                                onClick={fetchLogs}
                                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {loading && !logs.length ? (
                                <div className="p-8 text-center text-neutral-500">Loading...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    No interactions logged yet
                                </div>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-neutral-50">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-neutral-400">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                                        {getCategoryLabel(log.category_detected)}
                                                    </span>
                                                    {log.was_helpful !== null && (
                                                        <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${log.was_helpful
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-error-100 text-red-700'
                                                            }`}>
                                                            {log.was_helpful ? (
                                                                <><CheckCircle className="w-3 h-3" /> Helpful</>
                                                            ) : (
                                                                <><X className="w-3 h-3" /> Not Helpful</>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium text-neutral-900 mb-1">
                                                    <span className="text-primary-500">Q:</span> {log.question}
                                                </p>
                                                <p className="text-sm text-neutral-600 line-clamp-2">
                                                    <span className="text-green-600">A:</span> {log.response_given}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Total Interactions</p>
                                        <p className="text-2xl font-bold text-neutral-900">
                                            {analytics?.total_interactions || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Satisfaction Rate</p>
                                        <p className="text-2xl font-bold text-neutral-900">
                                            {analytics?.satisfaction_rate?.toFixed(1) || 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Helpful Responses</p>
                                        <p className="text-2xl font-bold text-neutral-900">
                                            {analytics?.helpful_count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-error-100 rounded-lg">
                                        <X className="w-6 h-6 text-error-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Not Helpful</p>
                                        <p className="text-2xl font-bold text-neutral-900">
                                            {analytics?.not_helpful_count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                            <h3 className="font-semibold text-neutral-900 mb-4">Questions by Category</h3>
                            <div className="space-y-3">
                                {analytics?.category_breakdown && Object.entries(analytics.category_breakdown).map(([category, count]) => {
                                    const total = analytics.total_interactions || 1;
                                    const percentage = (count / total) * 100;
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-neutral-600">{getCategoryLabel(category)}</span>
                                                <span className="text-neutral-900 font-medium">{count} ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!analytics?.category_breakdown || Object.keys(analytics.category_breakdown).length === 0) && (
                                    <p className="text-neutral-500 text-center py-4">No data available yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* FAQ Modal */}
                {showFaqModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                                </h2>
                                <button onClick={() => setShowFaqModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                    <select
                                        value={faqForm.category}
                                        onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* English Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                        ???? English Content
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Question (English) *</label>
                                            <input
                                                type="text"
                                                value={faqForm.question_en}
                                                onChange={(e) => setFaqForm({ ...faqForm, question_en: e.target.value })}
                                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="What is homeopathy?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Answer (English) *</label>
                                            <textarea
                                                value={faqForm.answer_en}
                                                onChange={(e) => setFaqForm({ ...faqForm, answer_en: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="Provide a detailed answer in English..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sinhala Section */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                                        ???? Sinhala Content (Optional)
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Question (Sinhala)</label>
                                            <input
                                                type="text"
                                                value={faqForm.question_si}
                                                onChange={(e) => setFaqForm({ ...faqForm, question_si: e.target.value })}
                                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="????????? ??? ???????"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Answer (Sinhala)</label>
                                            <textarea
                                                value={faqForm.answer_si}
                                                onChange={(e) => setFaqForm({ ...faqForm, answer_si: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="????? ???????? ??????????? ????????? ??? ?????..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Keywords (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={faqForm.keywords}
                                        onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="homeopathy, treatment, medicine, ?????????"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Include both English and Sinhala keywords for better matching
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Priority (1-100)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={faqForm.priority}
                                        onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) || 50 })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Higher priority FAQs are matched first when multiple FAQs match a query
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowFaqModal(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveFaq}
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disease Mapping Modal */}
                {showMappingModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {editingMapping ? 'Edit Disease Mapping' : 'Add Disease Mapping'}
                                </h2>
                                <button onClick={() => setShowMappingModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Disease/Condition Name</label>
                                    <input
                                        type="text"
                                        value={mappingForm.disease_name}
                                        onChange={(e) => setMappingForm({ ...mappingForm, disease_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., allergies, asthma, skin problems"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Specialization</label>
                                    <input
                                        type="text"
                                        value={mappingForm.specialization}
                                        onChange={(e) => setMappingForm({ ...mappingForm, specialization: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Immunology, Dermatology"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Safe Response</label>
                                    <textarea
                                        value={mappingForm.safe_response}
                                        onChange={(e) => setMappingForm({ ...mappingForm, safe_response: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="A safe, informative response about this condition and available specialists..."
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowMappingModal(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveMapping}
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    {editingMapping ? 'Update Mapping' : 'Create Mapping'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminChatbotManagement;
