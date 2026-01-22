import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    FaBookMedical, FaFlask, FaVideo, FaNewspaper, 
    FaSearch, FaEye, FaHeart, FaComments, FaQuestionCircle,
    FaStar, FaFilter, FaCalendarAlt, FaUserMd, FaClock
} from 'react-icons/fa';
import NavBar from '../UserWeb/NavBar.tsx';
import Footer from '../UserWeb/Footer.tsx';
import axios from 'axios';

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
    doctor: {
        id: number;
        name: string;
        specialization?: string;
        profile_picture?: string;
    };
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
    { key: 'all', label: 'All Posts', icon: <FaBookMedical />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { key: 'success_story', label: 'Success Stories', icon: <FaHeart />, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'medical_finding', label: 'Medical Findings', icon: <FaFlask />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { key: 'video_vlog', label: 'Video Vlogs', icon: <FaVideo />, color: 'text-red-600', bgColor: 'bg-red-100' },
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

            const response = await axios.get(`/api/medical-insights/posts?${params.toString()}`);
            // Handle various response structures
            const postsData = response.data?.data || response.data?.posts || response.data || [];
            setPosts(Array.isArray(postsData) ? postsData : []);
            setTotalPages(response.data?.last_page || response.data?.meta?.last_page || 1);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
            // Set demo data on error for now
            setPosts(getDemoData());
            setError(null); // Don't show error when using demo data
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
            comment_count: 23,
            question_count: 5,
            created_at: new Date().toISOString(),
            doctor: { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Homeopathy' },
            average_rating: 4.8
        },
        {
            id: '2',
            title: 'Latest Research on Natural Remedies for Digestive Health',
            slug: 'natural-remedies-digestive-health',
            category: 'medical_finding',
            short_description: 'Our latest clinical findings on the effectiveness of specific homeopathic remedies for various digestive disorders.',
            thumbnail_path: null,
            video_url: null,
            view_count: 890,
            like_count: 56,
            comment_count: 12,
            question_count: 8,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            doctor: { id: 2, name: 'Dr. Michael Chen', specialization: 'Gastroenterology' },
            average_rating: 4.5
        },
        {
            id: '3',
            title: 'Understanding Holistic Healing: A Video Guide',
            slug: 'understanding-holistic-healing-video',
            category: 'video_vlog',
            short_description: 'Join me as I explain the principles of holistic healing and how it differs from conventional medicine.',
            thumbnail_path: null,
            video_url: 'https://youtube.com/example',
            view_count: 2100,
            like_count: 178,
            comment_count: 45,
            question_count: 12,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            doctor: { id: 3, name: 'Dr. Emily White', specialization: 'Alternative Medicine' },
            average_rating: 4.9
        },
        {
            id: '4',
            title: 'Comparative Study: Homeopathy vs Allopathy in Treating Allergies',
            slug: 'homeopathy-vs-allopathy-allergies',
            category: 'research_article',
            short_description: 'A comprehensive research article comparing the effectiveness and side effects of both treatment approaches for seasonal allergies.',
            thumbnail_path: null,
            video_url: null,
            view_count: 650,
            like_count: 34,
            comment_count: 8,
            question_count: 15,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            doctor: { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Homeopathy' },
            average_rating: 4.6
        },
    ];

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        setSearchParams(category === 'all' ? {} : { category });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPosts();
    };

    const getCategoryInfo = (category: string): CategoryInfo => {
        return categories.find(c => c.key === category) || categories[0];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar 
                        key={star} 
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'} 
                        size={14}
                    />
                ))}
                <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Medical Insights & Knowledge Hub
                    </h1>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                        Discover success stories, medical findings, video vlogs, and research articles 
                        from our expert doctors. Learn, engage, and grow your health knowledge.
                    </p>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex max-w-xl">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles, topics, or doctors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-l-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-400 px-6 py-3 rounded-r-lg font-semibold transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex overflow-x-auto py-4 gap-2 md:gap-4 scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category.key}
                                onClick={() => handleCategoryChange(category.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                                    selectedCategory === category.key
                                        ? `${category.bgColor} ${category.color} font-semibold`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {category.icon}
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Sort Options */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {getCategoryInfo(selectedCategory).label}
                    </h2>
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="latest">Latest First</option>
                            <option value="popular">Most Popular</option>
                            <option value="most_viewed">Most Viewed</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Posts Grid */}
                {!loading && Array.isArray(posts) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => {
                            const categoryInfo = getCategoryInfo(post.category);
                            return (
                                <Link
                                    key={post.id}
                                    to={`/medical-insights/${post.slug}`}
                                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
                                        {post.thumbnail_path ? (
                                            <img 
                                                src={post.thumbnail_path} 
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className={`text-5xl ${categoryInfo.color}`}>
                                                    {categoryInfo.icon}
                                                </span>
                                            </div>
                                        )}
                                        {post.video_url && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                <FaVideo className="text-white text-4xl" />
                                            </div>
                                        )}
                                        <span className={`absolute top-3 left-3 ${categoryInfo.bgColor} ${categoryInfo.color} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                                            {categoryInfo.icon}
                                            {categoryInfo.label}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                                            {post.short_description}
                                        </p>

                                        {/* Doctor Info */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <FaUserMd className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{post.doctor.name}</p>
                                                <p className="text-xs text-gray-500">{post.doctor.specialization || 'Medical Professional'}</p>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        {renderStars(post.average_rating)}

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <FaEye /> {post.view_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaHeart className="text-red-500" /> {post.like_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaComments /> {post.comment_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaQuestionCircle /> {post.question_count}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1">
                                                <FaClock /> {formatDate(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* No Posts Message */}
                {!loading && Array.isArray(posts) && posts.length === 0 && (
                    <div className="text-center py-20">
                        <FaBookMedical className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                            Math.max(0, currentPage - 3),
                            Math.min(totalPages, currentPage + 2)
                        ).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 rounded-lg ${
                                    page === currentPage
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default MedicalInsightsPage;
