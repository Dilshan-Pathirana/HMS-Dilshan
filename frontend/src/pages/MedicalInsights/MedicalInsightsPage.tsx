import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    FaBookMedical, FaFlask, FaVideo, FaNewspaper,
    FaSearch, FaEye, FaHeart, FaComments, FaQuestionCircle,
    FaStar, FaFilter, FaCalendarAlt, FaUserMd, FaClock
} from 'react-icons/fa';
import NavBar from '../UserWeb/NavBar.tsx';
import Footer from '../UserWeb/Footer.tsx';
import api from "../../utils/api/axios";

interface MedicalPost {
    id: string;
    title: string;
    slug: string;
    category: 'success_story' | 'medical_finding' | 'video_vlog' | 'research_article';
    short_description: string;
    thumbnail_path: string | null;
    video_url: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    question_count: number;
    created_at: string;
    doctor?: {
        id?: number;
        name?: string;
        specialization?: string;
        profile_picture?: string;
    } | null;
    average_rating: number;
}

interface CategoryInfo {
    key: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const categories: CategoryInfo[] = [
    { key: 'all', label: 'All Posts', icon: <FaBookMedical />, color: 'text-primary-500', bgColor: 'bg-blue-100' },
    { key: 'success_story', label: 'Success Stories', icon: <FaHeart />, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'medical_finding', label: 'Medical Findings', icon: <FaFlask />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { key: 'video_vlog', label: 'Video Vlogs', icon: <FaVideo />, color: 'text-error-600', bgColor: 'bg-error-100' },
    { key: 'research_article', label: 'Research Articles', icon: <FaNewspaper />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
];

const MedicalInsightsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<MedicalPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'most_viewed'>('latest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const getDoctorName = (post: MedicalPost) => {
        return post.doctor?.name?.trim() || "Doctor";
    };

    useEffect(() => {
        fetchPosts();
    }, [selectedCategory, sortBy, currentPage, searchQuery]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (searchQuery) params.append('search', searchQuery);
            params.append('sort', sortBy);
            params.append('page', currentPage.toString());

            const response = await api.get(`/medical-insights/posts?${params.toString()}`);
            const postsData = response.data?.data || response.data?.posts || response.data || [];
            setPosts(Array.isArray(postsData) ? postsData : []);
            setTotalPages(response.data?.last_page || response.data?.meta?.last_page || 1);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
            setPosts(getDemoData());
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const getDemoData = (): MedicalPost[] => [
        {
            id: '1',
            title: 'Patient Recovery Story: Overcoming Chronic Fatigue with Homeopathy',
            slug: 'patient-recovery-chronic-fatigue',
            category: 'success_story',
            short_description: 'A remarkable journey of a 45-year-old patient who recovered from chronic fatigue syndrome through holistic homeopathic treatment over 6 months.',
            thumbnail_path: null,
            video_url: null,
            view_count: 1250,
            like_count: 89,
            comment_count: 12,
            question_count: 5,
            created_at: '2023-11-15T10:00:00Z',
            doctor: { id: 101, name: 'Dr. John Doe', specialization: 'Homeopathy' },
            average_rating: 4.8
        },
        {
            id: '2',
            title: 'New Research: Benefits of Arnica in Sports Injuries',
            slug: 'arnica-benefits-sports-injuries',
            category: 'research_article',
            short_description: 'Latest clinical studies show significant improvement in recovery times for athletes using Arnica Montana compared to placebo groups.',
            thumbnail_path: null,
            video_url: null,
            view_count: 850,
            like_count: 120,
            comment_count: 45,
            question_count: 8,
            created_at: '2023-10-20T14:30:00Z',
            doctor: { id: 102, name: 'Dr. Jane Smith', specialization: 'Sports Medicine' },
            average_rating: 4.9
        },
        {
            id: '3',
            title: 'Vlog: Daily Habits for a Healthy Immune System',
            slug: 'daily-habits-immune-system',
            category: 'video_vlog',
            short_description: 'Join Dr. Emily White as she discusses simple daily practices that can naturally boost your immunity during the flu season.',
            thumbnail_path: null,
            video_url: 'https://www.youtube.com/watch?v=example',
            view_count: 3200,
            like_count: 245,
            comment_count: 67,
            question_count: 15,
            created_at: '2023-11-05T09:15:00Z',
            doctor: { id: 103, name: 'Dr. Emily White', specialization: 'General Practice' },
            average_rating: 4.7
        },
    ];

    const getCategoryStyles = (catKey: string) => {
        const cat = categories.find(c => c.key === catKey);
        return cat ? `${cat.bgColor} ${cat.color}` : 'bg-gray-100 text-gray-600';
    };

    const getCategoryLabel = (catKey: string) => {
        return categories.find(c => c.key === catKey)?.label || catKey.replace('_', ' ');
    };

    return (
        <div className="bg-neutral-50 min-h-screen font-sans">
            <NavBar />

            <div className="pt-32 pb-20 container mx-auto px-6">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-primary-600 font-bold tracking-wider text-sm uppercase mb-3 block">Knowledge Hub</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
                        Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Insights</span>
                    </h1>
                    <p className="text-xl text-neutral-600 leading-relaxed">
                        Discover the latest breakthroughs in homeopathy, patient success stories, and expert health advice.
                    </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 mb-12 sticky top-24 z-30 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                        <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-3 w-full lg:w-auto no-scrollbar mask-gradient">
                            {categories.map((cat) => (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === cat.key
                                            ? 'bg-neutral-900 text-white shadow-lg scale-105'
                                            : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                        }`}
                                >
                                    <span className="text-lg">{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex w-full lg:w-auto gap-4">
                            <div className="relative flex-grow lg:w-80 group">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-neutral-400"
                                />
                            </div>
                            <div className="relative min-w-[140px]">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full pl-4 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-xl appearance-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none font-medium cursor-pointer"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="popular">Popular</option>
                                    <option value="most_viewed">Most Viewed</option>
                                </select>
                                <FaFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                to={`/medical-insights/${post.slug}`}
                                key={post.id}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-neutral-100 overflow-hidden flex flex-col h-full"
                            >
                                <div className="h-48 bg-neutral-100 relative overflow-hidden">
                                    {post.thumbnail_path ? (
                                        <img
                                            src={post.thumbnail_path}
                                            alt={post.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                            {categories.find(c => c.key === post.category)?.icon && (
                                                <div className="text-4xl opacity-20 text-neutral-400">
                                                    {categories.find(c => c.key === post.category)?.icon}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${getCategoryStyles(post.category)}`}>
                                            {getCategoryLabel(post.category)}
                                        </span>
                                    </div>
                                    {post.category === 'video_vlog' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform">
                                                <FaVideo className="text-primary-600 ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    {/* Author & Date */}
                                    <div className="flex items-center gap-3 mb-4 text-sm text-neutral-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs ring-2 ring-white">
                                                {getDoctorName(post).charAt(0)}
                                            </div>
                                            <span className="font-medium text-neutral-700 clamp-1">{getDoctorName(post)}</span>
                                        </div>
                                        <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                                        <div className="flex items-center gap-1">
                                            <FaCalendarAlt className="w-3 h-3" />
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-neutral-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                                        {post.short_description}
                                    </p>

                                    {/* Stats Footer */}
                                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-500 mt-auto">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 hover:text-primary-500 transition-colors" title="Views">
                                                <FaEye className="w-4 h-4" />
                                                <span>{post.view_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 hover:text-error-500 transition-colors" title="Likes">
                                                <FaHeart className="w-3.5 h-3.5" />
                                                <span>{post.like_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 hover:text-secondary-500 transition-colors" title="Comments">
                                                <FaComments className="w-3.5 h-3.5" />
                                                <span>{post.comment_count}</span>
                                            </div>
                                        </div>

                                        <span className="text-primary-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Read More →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-16 flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-300 ${currentPage === page
                                        ? 'bg-neutral-900 text-white shadow-lg'
                                        : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}

                {/* No Posts Message */}
                {!loading && posts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-neutral-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaBookMedical className="text-4xl text-neutral-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">No posts found</h3>
                        <p className="text-neutral-500 text-lg">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default MedicalInsightsPage;
