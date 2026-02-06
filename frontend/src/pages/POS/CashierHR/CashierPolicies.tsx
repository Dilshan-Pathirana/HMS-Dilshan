import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, ArrowLeft, Download, Eye, FileText, Search,
    Loader2, Calendar, Users, Shield, DollarSign
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { toast } from 'react-toastify';

interface Policy {
    id: string;
    title: string;
    category: string;
    categoryName?: string;
    description: string;
    content?: string;
    effectiveDate?: string;
    expiryDate?: string;
    lastUpdated: string;
    documentUrl: string | null;
    version: string;
}

const policyCategories = [
    { value: 'all', label: 'All Policies', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'hr', label: 'HR Policies', icon: <Users className="w-4 h-4" /> },
    { value: 'leave', label: 'Leave Policy', icon: <Calendar className="w-4 h-4" /> },
    { value: 'code_of_conduct', label: 'Code of Conduct', icon: <Shield className="w-4 h-4" /> },
    { value: 'payroll', label: 'Payroll & Benefits', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'safety', label: 'Safety & Security', icon: <Shield className="w-4 h-4" /> }
];

const CashierPolicies: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/cashier/policies', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setPolicies(response.data.policies || []);
            }
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to load policies');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPolicy = async (policy: Policy) => {
        if (!policy.documentUrl) {
            toast.info('No document available for download');
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(policy.documentUrl, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${policy.title.replace(/\s+/g, '_')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Policy document downloaded successfully!');
        } catch (error) {
            console.error('Error downloading policy:', error);
            toast.error('Failed to download policy');
        }
    };

    const viewPolicy = (policy: Policy) => {
        setSelectedPolicy(policy);
        setShowViewModal(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getCategoryIcon = (category: string) => {
        const cat = policyCategories.find(c => c.value === category);
        return cat?.icon || <FileText className="w-4 h-4" />;
    };

    const filteredPolicies = policies.filter(policy => {
        const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
        const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            policy.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-neutral-600">Loading HR policies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/pos/hr')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">HR Policies & Documents</h1>
                            <p className="text-neutral-600 text-sm mt-1">View company policies and employee handbook</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search policies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {policyCategories.map(category => (
                            <button
                                key={category.value}
                                onClick={() => setSelectedCategory(category.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                                    selectedCategory === category.value
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                }`}
                            >
                                {category.icon}
                                <span className="text-sm font-medium">{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPolicies.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg text-neutral-500 mb-2">No policies found</p>
                        <p className="text-sm text-neutral-400">Try adjusting your filters or search terms</p>
                    </div>
                ) : (
                    filteredPolicies.map((policy) => (
                        <div
                            key={policy.id}
                            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${
                                    policy.category === 'hr' ? 'from-blue-500 to-blue-600' :
                                    policy.category === 'leave' ? 'from-green-500 to-green-600' :
                                    policy.category === 'code_of_conduct' ? 'from-purple-500 to-purple-600' :
                                    policy.category === 'payroll' ? 'from-amber-500 to-amber-600' :
                                    'from-indigo-500 to-indigo-600'
                                }`}>
                                    <div className="text-white">
                                        {getCategoryIcon(policy.category)}
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                                    v{policy.version || '1.0'}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                                {policy.title}
                            </h3>
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                                {policy.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                                <span>Last updated: {formatDate(policy.lastUpdated)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => viewPolicy(policy)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => downloadPolicy(policy)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View Modal */}
            {showViewModal && selectedPolicy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${
                                    selectedPolicy.category === 'hr' ? 'from-blue-500 to-blue-600' :
                                    selectedPolicy.category === 'leave' ? 'from-green-500 to-green-600' :
                                    selectedPolicy.category === 'code_of_conduct' ? 'from-purple-500 to-purple-600' :
                                    selectedPolicy.category === 'payroll' ? 'from-amber-500 to-amber-600' :
                                    'from-indigo-500 to-indigo-600'
                                }`}>
                                    <div className="text-white">
                                        {getCategoryIcon(selectedPolicy.category)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-800">{selectedPolicy.title}</h2>
                                    <p className="text-sm text-neutral-500">Version {selectedPolicy.version} • Last updated: {formatDate(selectedPolicy.lastUpdated)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="prose max-w-none">
                                <p className="text-neutral-700 mb-6">{selectedPolicy.description}</p>
                                
                                {/* Display policy content if available */}
                                {selectedPolicy.content ? (
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Policy Details</h3>
                                        <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                                            {selectedPolicy.content}
                                        </div>
                                    </div>
                                ) : selectedPolicy.documentUrl ? (
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                                        <p className="text-neutral-600 mb-4">Full policy document available for download</p>
                                        <button
                                            onClick={() => downloadPolicy(selectedPolicy)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download Full Document
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                                        <p className="text-neutral-500">No additional content available for this policy.</p>
                                    </div>
                                )}
                                
                                {/* Download button if document exists */}
                                {selectedPolicy.content && selectedPolicy.documentUrl && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => downloadPolicy(selectedPolicy)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download Full Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierPolicies;
