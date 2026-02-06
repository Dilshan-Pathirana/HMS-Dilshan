import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ArrowLeft, Download, Eye, Loader2, Search,
    BookOpen, Shield, Clock, Users, Briefcase, AlertCircle,
    ChevronRight, ExternalLink
} from 'lucide-react';
import api from "../../../../utils/api/axios";

interface Policy {
    id: string;
    title: string;
    category: string;
    categoryName?: string;
    version: string;
    lastUpdated: string;
    description: string;
    content?: string;
    fileUrl?: string;
    documentUrl?: string;
    isRequired: boolean;
    effectiveDate?: string;
    expiryDate?: string;
}

const policyCategories = [
    { id: 'all', name: 'All Policies', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'hr', name: 'HR & Employment', icon: <Users className="w-4 h-4" /> },
    { id: 'safety', name: 'Health & Safety', icon: <Shield className="w-4 h-4" /> },
    { id: 'leave', name: 'Leave Policies', icon: <Clock className="w-4 h-4" /> },
    { id: 'payroll', name: 'Salary & Benefits', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'code_of_conduct', name: 'Code of Conduct', icon: <Briefcase className="w-4 h-4" /> }
];

const NursePolicies: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

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

            if (response.data.status === 200 && response.data.policies) {
                // Transform API response to match frontend interface
                const transformedPolicies = response.data.policies.map((policy: any) => ({
                    id: String(policy.id),
                    title: policy.title || policy.policy_name || 'Untitled Policy',
                    category: policy.category || 'hr',
                    categoryName: policy.categoryName || policy.policy_category || 'HR',
                    version: policy.version || '1.0',
                    lastUpdated: policy.lastUpdated || policy.updated_at || new Date().toISOString(),
                    description: policy.description || '',
                    content: policy.content || policy.policy_content || '',
                    fileUrl: policy.documentUrl || policy.fileUrl || null,
                    documentUrl: policy.documentUrl || null,
                    isRequired: policy.isRequired ?? (policy.category === 'safety' || policy.category === 'code_of_conduct'),
                    effectiveDate: policy.effectiveDate || null,
                    expiryDate: policy.expiryDate || null
                }));
                setPolicies(transformedPolicies);
            } else {
                // No policies from API, show empty state
                setPolicies([]);
            }
        } catch (error) {
            console.error('Error fetching policies:', error);
            // Show empty state on error instead of mock data
            setPolicies([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPolicies = policies.filter(policy => {
        const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
        const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (policy.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getCategoryName = (categoryId: string) => {
        const category = policyCategories.find(c => c.id === categoryId);
        return category?.name || categoryId;
    };

    const getCategoryIcon = (categoryId: string) => {
        const category = policyCategories.find(c => c.id === categoryId);
        return category?.icon || <BookOpen className="w-4 h-4" />;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-neutral-600">Loading policies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/nurse-dashboard/hr')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">HR Policies & Guidelines</h1>
                            <p className="text-neutral-600 text-sm mt-1">Access company policies and nursing guidelines</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search policies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <h3 className="font-semibold text-neutral-800 mb-3">Categories</h3>
                        <nav className="space-y-1">
                            {policyCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                        selectedCategory === category.id
                                            ? 'bg-teal-50 text-teal-700'
                                            : 'text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                >
                                    {category.icon}
                                    <span className="text-sm font-medium">{category.name}</span>
                                    <span className="ml-auto text-xs text-neutral-400">
                                        {category.id === 'all'
                                            ? policies.length
                                            : policies.filter(p => p.category === category.id).length}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Required Reading Notice */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-amber-800 text-sm">Required Reading</h4>
                                <p className="text-xs text-amber-700 mt-1">
                                    Policies marked with a star are mandatory. Please review them regularly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policies List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                            <h2 className="font-semibold text-neutral-800">
                                {getCategoryName(selectedCategory)} ({filteredPolicies.length})
                            </h2>
                        </div>

                        {filteredPolicies.length === 0 ? (
                            <div className="p-12 text-center text-neutral-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No policies found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredPolicies.map((policy) => (
                                    <div
                                        key={policy.id}
                                        className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedPolicy(policy)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    policy.isRequired ? 'bg-amber-100' : 'bg-neutral-100'
                                                }`}>
                                                    {getCategoryIcon(policy.category)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-neutral-800">{policy.title}</h3>
                                                        {policy.isRequired && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                                        {policy.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-xs text-neutral-500">
                                                            Version {policy.version}
                                                        </span>
                                                        <span className="text-xs text-neutral-500">
                                                            Updated: {formatDate(policy.lastUpdated)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Policy Detail Modal */}
            {selectedPolicy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        selectedPolicy.isRequired ? 'bg-amber-100' : 'bg-teal-100'
                                    }`}>
                                        {getCategoryIcon(selectedPolicy.category)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-neutral-800">{selectedPolicy.title}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-neutral-500">
                                                Version {selectedPolicy.version}
                                            </span>
                                            {selectedPolicy.isRequired && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                                    Required Reading
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPolicy(null)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="prose prose-sm max-w-none">
                                <p className="text-neutral-700">{selectedPolicy.description}</p>
                                
                                {/* Show policy content if available */}
                                {selectedPolicy.content && (
                                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                        <h4 className="font-medium text-neutral-800 mb-2">Policy Content</h4>
                                        <div 
                                            className="text-neutral-700 text-sm whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: selectedPolicy.content }}
                                        />
                                    </div>
                                )}
                                
                                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                                    <h4 className="font-medium text-neutral-800 mb-2">Policy Details</h4>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <dt className="text-neutral-500">Category</dt>
                                            <dd className="font-medium text-neutral-800">{selectedPolicy.categoryName || getCategoryName(selectedPolicy.category)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-neutral-500">Version</dt>
                                            <dd className="font-medium text-neutral-800">{selectedPolicy.version}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-neutral-500">Last Updated</dt>
                                            <dd className="font-medium text-neutral-800">{formatDate(selectedPolicy.lastUpdated)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-neutral-500">Status</dt>
                                            <dd className="font-medium text-neutral-800">
                                                {selectedPolicy.isRequired ? 'Mandatory' : 'Optional'}
                                            </dd>
                                        </div>
                                        {selectedPolicy.effectiveDate && (
                                            <div>
                                                <dt className="text-neutral-500">Effective Date</dt>
                                                <dd className="font-medium text-neutral-800">{formatDate(selectedPolicy.effectiveDate)}</dd>
                                            </div>
                                        )}
                                        {selectedPolicy.expiryDate && (
                                            <div>
                                                <dt className="text-neutral-500">Expiry Date</dt>
                                                <dd className="font-medium text-neutral-800">{formatDate(selectedPolicy.expiryDate)}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedPolicy(null)}
                                    className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                                >
                                    Close
                                </button>
                                {selectedPolicy.documentUrl && (
                                    <a 
                                        href={selectedPolicy.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NursePolicies;
