import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaPlus, FaEdit, FaEye, FaTrash, FaSearch,
    FaBookMedical, FaFlask, FaHeart, FaVideo, FaNewspaper,
    FaComments, FaQuestionCircle, FaClock, FaCheckCircle,
    FaFilter, FaSort
} from 'react-icons/fa';
import api from "../../utils/api/axios";
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../../store.tsx';

interface DoctorPost {
    id: string;
    title: string;
    slug: string;
    category: 'success_story' | 'medical_finding' | 'video_vlog' | 'research_article';
    status: 'draft' | 'published';
    visibility: 'public' | 'patients_only' | 'logged_in_only';
    view_count: number;
    like_count: number;
    comment_count: number;
    question_count: number;
    pending_questions: number;
    created_at: string;
    updated_at: string;
}

const categoryInfo: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    success_story: { label: 'Success Story', icon: <FaHeart />, color: 'text-green-600', bgColor: 'bg-green-100' },
    medical_finding: { label: 'Medical Finding', icon: <FaFlask />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    video_vlog: { label: 'Video Vlog', icon: <FaVideo />, color: 'text-error-600', bgColor: 'bg-error-100' },
    research_article: { label: 'Research Article', icon: <FaNewspaper />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

const DoctorPostsPage: React.FC = () => {
    const navigate = useNavigate();
    const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
    const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
    const userRole = useTypedSelector((state) => state.auth.userRole);

    const [posts, setPosts] = useState<DoctorPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [pendingQuestionsCount, setPendingQuestionsCount] = useState(0);

    useEffect(() => {
        // Check if user is a doctor (role_as = 6)
        if (!isAuthenticated || userRole !== 6) {
            navigate('/login');
            return;
        }

        fetchPosts();
        fetchPendingQuestions();
    }, [isAuthenticated, userRole]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/medical-insights/doctor/posts');
            setPosts(response.data.posts || []);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
            // Demo data
            setPosts(getDemoData());
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingQuestions = async () => {
        try {
            const response = await api.get('/medical-insights/doctor/questions/pending');
            setPendingQuestionsCount(response.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch pending questions:', err);
            setPendingQuestionsCount(3); // Demo
        }
    };

    const getDemoData = (): DoctorPost[] => [
        {
            id: '1',
            title: 'Patient Recovery Story: Overcoming Chronic Fatigue with Homeopathy',
            slug: 'patient-recovery-chronic-fatigue',
            category: 'success_story',
            status: 'published',
            visibility: 'public',
            view_count: 1250,
            like_count: 89,
            comment_count: 23,
            question_count: 5,
            pending_questions: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '2',
            title: 'Latest Research on Natural Remedies for Digestive Health',
            slug: 'natural-remedies-digestive-health',
            category: 'medical_finding',
            status: 'published',
            visibility: 'logged_in_only',
            view_count: 890,
            like_count: 56,
            comment_count: 12,
            question_count: 8,
            pending_questions: 1,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: '3',
            title: 'Draft: Holistic Approach to Managing Stress',
            slug: 'holistic-approach-managing-stress',
            category: 'video_vlog',
            status: 'draft',
            visibility: 'public',
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            question_count: 0,
            pending_questions: 0,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
        },
    ];

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await api.delete(`/medical-insights/doctor/posts/${postId}`);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
            setPosts(posts.filter(p => p.id !== postId)); // Demo
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
                            <FaBookMedical className="text-primary-500" />
                            My Medical Insights
                        </h1>
                        <p className="text-neutral-500">Manage your posts, view analytics, and answer questions</p>
                    </div>
                    <Link
                        to="/doctor-dashboard/posts/create"
                        className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <FaPlus /> Create New Post
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Total Posts</p>
                                <p className="text-2xl font-bold text-neutral-800">{posts.length}</p>
                            </div>
                            <FaBookMedical className="text-3xl text-blue-200" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Published</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {posts.filter(p => p.status === 'published').length}
                                </p>
                            </div>
                            <FaCheckCircle className="text-3xl text-green-200" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Total Views</p>
                                <p className="text-2xl font-bold text-neutral-800">
                                    {posts.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
                                </p>
                            </div>
                            <FaEye className="text-3xl text-blue-200" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Pending Questions</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingQuestionsCount}</p>
                            </div>
                            <FaQuestionCircle className="text-3xl text-orange-200" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-neutral-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Drafts</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="success_story">Success Stories</option>
                                <option value="medical_finding">Medical Findings</option>
                                <option value="video_vlog">Video Vlogs</option>
                                <option value="research_article">Research Articles</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Posts List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <FaBookMedical className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-neutral-600 mb-2">No posts found</h3>
                        <p className="text-neutral-500 mb-6">
                            {posts.length === 0
                                ? "You haven't created any posts yet. Share your knowledge with patients!"
                                : "No posts match your current filters."
                            }
                        </p>
                        <Link
                            to="/doctor-dashboard/posts/create"
                            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
                        >
                            <FaPlus /> Create Your First Post
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Post
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Engagement
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredPosts.map((post) => {
                                        const catInfo = categoryInfo[post.category];
                                        return (
                                            <tr key={post.id} className="hover:bg-neutral-50">
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="font-medium text-neutral-800 truncate">
                                                            {post.title}
                                                        </p>
                                                        <p className="text-sm text-neutral-500">
                                                            {post.slug}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${catInfo.bgColor} ${catInfo.color}`}>
                                                        {catInfo.icon}
                                                        {catInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {post.status === 'published' ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-600">
                                                            <FaCheckCircle /> Published
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-600">
                                                            <FaClock /> Draft
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                        <span className="flex items-center gap-1" title="Views">
                                                            <FaEye /> {post.view_count}
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Likes">
                                                            <FaHeart className="text-error-500" /> {post.like_count}
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Comments">
                                                            <FaComments /> {post.comment_count}
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Questions">
                                                            <FaQuestionCircle className={post.pending_questions > 0 ? 'text-orange-500' : ''} />
                                                            {post.question_count}
                                                            {post.pending_questions > 0 && (
                                                                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                                    {post.pending_questions}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-500">
                                                    {formatDate(post.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/medical-insights/${post.slug}`}
                                                            target="_blank"
                                                            className="p-2 text-neutral-500 hover:text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <FaEye />
                                                        </Link>
                                                        <Link
                                                            to={`/doctor-dashboard/posts/edit/${post.id}`}
                                                            className="p-2 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="p-2 text-neutral-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pending Questions Alert */}
                {pendingQuestionsCount > 0 && (
                    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaQuestionCircle className="text-orange-500 text-2xl" />
                                <div>
                                    <p className="font-medium text-orange-800">
                                        You have {pendingQuestionsCount} pending question{pendingQuestionsCount > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-orange-600">
                                        Patients are waiting for your expert responses
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/doctor-dashboard/posts/questions"
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Answer Questions
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPostsPage;
