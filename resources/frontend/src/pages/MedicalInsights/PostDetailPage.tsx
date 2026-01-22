import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FaBookMedical, FaFlask, FaVideo, FaNewspaper, 
    FaEye, FaHeart, FaRegHeart, FaComments, FaQuestionCircle,
    FaStar, FaCalendarAlt, FaUserMd, FaArrowLeft, FaClock,
    FaPaperPlane, FaReply, FaShare, FaDownload, FaFilePdf
} from 'react-icons/fa';
import NavBar from '../UserWeb/NavBar.tsx';
import Footer from '../UserWeb/Footer.tsx';
import axios from 'axios';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../../store.tsx';

interface MedicalPost {
    id: string;
    title: string;
    slug: string;
    category: 'success_story' | 'medical_finding' | 'video_vlog' | 'research_article';
    short_description: string;
    content: string;
    thumbnail_path: string | null;
    video_url: string | null;
    pdf_file_path: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    question_count: number;
    created_at: string;
    updated_at: string;
    doctor: {
        id: number;
        name: string;
        specialization?: string;
        profile_picture?: string;
    };
    average_rating: number;
    user_has_liked: boolean;
    user_rating: number | null;
}

interface Comment {
    id: string;
    content: string;
    status: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        profile_picture?: string;
    };
    replies: Comment[];
}

interface Question {
    id: string;
    question: string;
    answer: string | null;
    status: string;
    created_at: string;
    answered_at: string | null;
    patient: {
        id: number;
        name: string;
    };
    answered_by?: {
        id: number;
        name: string;
    };
}

const categoryInfo: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    success_story: { label: 'Success Story', icon: <FaHeart />, color: 'text-green-600', bgColor: 'bg-green-100' },
    medical_finding: { label: 'Medical Finding', icon: <FaFlask />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    video_vlog: { label: 'Video Vlog', icon: <FaVideo />, color: 'text-red-600', bgColor: 'bg-red-100' },
    research_article: { label: 'Research Article', icon: <FaNewspaper />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

const PostDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
    const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
    const userRole = useTypedSelector((state) => state.auth.userRole);
    const userId = useTypedSelector((state) => state.auth.userId);

    const [post, setPost] = useState<MedicalPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [newComment, setNewComment] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [isLiked, setIsLiked] = useState(false);
    const [activeTab, setActiveTab] = useState<'comments' | 'questions'>('comments');

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
    }, [slug]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/medical-insights/posts/${slug}`);
            const data = response.data;
            setPost(data.post);
            setComments(data.comments || []);
            setQuestions(data.questions || []);
            setIsLiked(data.post.user_has_liked || false);
            setUserRating(data.post.user_rating || 0);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch post:', err);
            setError('Failed to load the article. It may have been removed or does not exist.');
            // Demo data for development
            setPost(getDemoPost());
            setComments(getDemoComments());
            setQuestions(getDemoQuestions());
        } finally {
            setLoading(false);
        }
    };

    const getDemoPost = (): MedicalPost => ({
        id: '1',
        title: 'Patient Recovery Story: Overcoming Chronic Fatigue with Homeopathy',
        slug: 'patient-recovery-chronic-fatigue',
        category: 'success_story',
        short_description: 'A remarkable journey of a 45-year-old patient who recovered from chronic fatigue syndrome through holistic homeopathic treatment over 6 months.',
        content: `
## The Beginning

When Mrs. Sharma first walked into our clinic, she had been suffering from chronic fatigue syndrome for over three years. She described feeling constantly exhausted, unable to complete even simple daily tasks, and had seen numerous specialists with little improvement.

## The Treatment Journey

After a thorough consultation and understanding her complete medical history, we developed a personalized homeopathic treatment plan that focused on:

1. **Constitutional Treatment**: We identified her unique constitutional remedy based on her physical, mental, and emotional symptoms.

2. **Lifestyle Modifications**: We recommended gentle exercises, proper sleep hygiene, and stress management techniques.

3. **Dietary Adjustments**: We suggested foods that would support her natural healing process.

## The Results

Over the course of 6 months, Mrs. Sharma showed remarkable improvement:

- **Month 1-2**: Initial detox symptoms followed by improved sleep quality
- **Month 3-4**: Significant increase in energy levels
- **Month 5-6**: Complete return to normal daily activities

## Key Takeaways

This case demonstrates the effectiveness of holistic treatment when conventional approaches have limited success. The key factors in Mrs. Sharma's recovery were:

- Patient commitment to the treatment plan
- Regular follow-ups and adjustments
- Integration of lifestyle changes with homeopathic remedies

*Note: Individual results may vary. Always consult with a qualified practitioner before starting any treatment.*
        `,
        thumbnail_path: null,
        video_url: null,
        pdf_file_path: null,
        view_count: 1250,
        like_count: 89,
        comment_count: 23,
        question_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        doctor: { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Homeopathy' },
        average_rating: 4.8,
        user_has_liked: false,
        user_rating: null
    });

    const getDemoComments = (): Comment[] => [
        {
            id: '1',
            content: 'This is such an inspiring story! My mother has been suffering from similar symptoms, and this gives me hope that homeopathy might help her too.',
            status: 'visible',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            user: { id: 1, name: 'John Doe' },
            replies: [
                {
                    id: '2',
                    content: 'I hope your mother finds relief! Make sure to consult with a qualified homeopath for a personalized treatment plan.',
                    status: 'visible',
                    created_at: new Date(Date.now() - 43200000).toISOString(),
                    user: { id: 2, name: 'Dr. Sarah Johnson' },
                    replies: []
                }
            ]
        },
        {
            id: '3',
            content: 'Thank you for sharing this detailed case study. It would be helpful to know what specific remedies were used.',
            status: 'visible',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            user: { id: 3, name: 'Medical Student' },
            replies: []
        }
    ];

    const getDemoQuestions = (): Question[] => [
        {
            id: '1',
            question: 'How long does it typically take to see improvements with homeopathic treatment for chronic fatigue?',
            answer: 'The timeline varies for each patient depending on the severity and duration of their condition. Generally, patients start noticing improvements within 4-8 weeks, though complete recovery may take 3-6 months. Consistency with treatment and lifestyle modifications is crucial.',
            status: 'answered',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            answered_at: new Date(Date.now() - 172800000).toISOString(),
            patient: { id: 4, name: 'Curious Patient' },
            answered_by: { id: 1, name: 'Dr. Sarah Johnson' }
        },
        {
            id: '2',
            question: 'Are there any side effects of the homeopathic remedies used for chronic fatigue?',
            answer: null,
            status: 'pending',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            answered_at: null,
            patient: { id: 5, name: 'Health Seeker' }
        }
    ];

    const handleLike = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await axios.post(`/api/medical-insights/posts/${post?.id}/like`);
            setIsLiked(!isLiked);
            if (post) {
                setPost({
                    ...post,
                    like_count: isLiked ? post.like_count - 1 : post.like_count + 1
                });
            }
        } catch (err) {
            console.error('Failed to toggle like:', err);
            // Still update UI for demo
            setIsLiked(!isLiked);
        }
    };

    const handleRate = async (rating: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await axios.post(`/api/medical-insights/posts/${post?.id}/rate`, { rating });
            setUserRating(rating);
        } catch (err) {
            console.error('Failed to rate:', err);
            setUserRating(rating);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!newComment.trim()) return;

        try {
            const response = await axios.post(`/api/medical-insights/posts/${post?.id}/comments`, {
                content: newComment
            });
            setComments([response.data.comment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment:', err);
            // Add demo comment for development
            const demoComment: Comment = {
                id: Date.now().toString(),
                content: newComment,
                status: 'visible',
                created_at: new Date().toISOString(),
                user: { id: userId || 0, name: 'You' },
                replies: []
            };
            setComments([demoComment, ...comments]);
            setNewComment('');
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!replyContent.trim()) return;

        try {
            const response = await axios.post(`/api/medical-insights/posts/${post?.id}/comments`, {
                content: replyContent,
                parent_id: parentId
            });
            // Update comments with new reply
            const updatedComments = comments.map(comment => {
                if (comment.id === parentId) {
                    return {
                        ...comment,
                        replies: [...comment.replies, response.data.comment]
                    };
                }
                return comment;
            });
            setComments(updatedComments);
            setReplyingTo(null);
            setReplyContent('');
        } catch (err) {
            console.error('Failed to post reply:', err);
            // Demo reply
            const demoReply: Comment = {
                id: Date.now().toString(),
                content: replyContent,
                status: 'visible',
                created_at: new Date().toISOString(),
                user: { id: userId || 0, name: 'You' },
                replies: []
            };
            const updatedComments = comments.map(comment => {
                if (comment.id === parentId) {
                    return { ...comment, replies: [...comment.replies, demoReply] };
                }
                return comment;
            });
            setComments(updatedComments);
            setReplyingTo(null);
            setReplyContent('');
        }
    };

    const handleSubmitQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!newQuestion.trim()) return;

        try {
            const response = await axios.post(`/api/medical-insights/posts/${post?.id}/questions`, {
                question: newQuestion
            });
            setQuestions([...questions, response.data.question]);
            setNewQuestion('');
        } catch (err) {
            console.error('Failed to submit question:', err);
            // Demo question
            const demoQuestion: Question = {
                id: Date.now().toString(),
                question: newQuestion,
                answer: null,
                status: 'pending',
                created_at: new Date().toISOString(),
                answered_at: null,
                patient: { id: userId || 0, name: 'You' }
            };
            setQuestions([...questions, demoQuestion]);
            setNewQuestion('');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getYoutubeEmbedUrl = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 
            ? `https://www.youtube.com/embed/${match[2]}` 
            : url;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="flex justify-center items-center py-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <FaBookMedical className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Article Not Found</h2>
                    <p className="text-gray-500 mb-6">{error || 'The article you are looking for does not exist.'}</p>
                    <Link 
                        to="/medical-insights" 
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FaArrowLeft /> Back to Medical Insights
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const catInfo = categoryInfo[post.category];

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            
            {/* Back Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link 
                        to="/medical-insights" 
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <FaArrowLeft /> Back to Medical Insights
                    </Link>
                </div>
            </div>

            {/* Article Content */}
            <article className="max-w-4xl mx-auto px-6 py-8">
                {/* Category Badge */}
                <span className={`inline-flex items-center gap-2 ${catInfo.bgColor} ${catInfo.color} px-4 py-2 rounded-full text-sm font-medium mb-4`}>
                    {catInfo.icon}
                    {catInfo.label}
                </span>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {post.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6 pb-6 border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUserMd className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">{post.doctor.name}</p>
                            <p className="text-sm">{post.doctor.specialization || 'Medical Professional'}</p>
                        </div>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                        <FaCalendarAlt /> {formatDate(post.created_at)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                        <FaEye /> {post.view_count} views
                    </span>
                </div>

                {/* Video Embed */}
                {post.video_url && (
                    <div className="mb-8">
                        <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden">
                            <iframe
                                src={getYoutubeEmbedUrl(post.video_url)}
                                title={post.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                )}

                {/* Featured Image */}
                {post.thumbnail_path && !post.video_url && (
                    <img 
                        src={post.thumbnail_path} 
                        alt={post.title}
                        className="w-full rounded-xl mb-8"
                    />
                )}

                {/* Short Description */}
                <p className="text-xl text-gray-600 italic mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    {post.short_description}
                </p>

                {/* Main Content */}
                <div 
                    className="prose prose-lg max-w-none mb-8"
                    dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>').replace(/## /g, '<h2 class="text-2xl font-bold mt-6 mb-4">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                />

                {/* PDF Download */}
                {post.pdf_file_path && (
                    <div className="bg-gray-100 rounded-lg p-4 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaFilePdf className="text-red-600 text-2xl" />
                            <div>
                                <p className="font-medium">Download PDF</p>
                                <p className="text-sm text-gray-500">Full research document available</p>
                            </div>
                        </div>
                        <a 
                            href={post.pdf_file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <FaDownload /> Download
                        </a>
                    </div>
                )}

                {/* Engagement Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
                        {/* Like Button */}
                        <button 
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isLiked 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {isLiked ? <FaHeart /> : <FaRegHeart />}
                            <span>{post.like_count} Likes</span>
                        </button>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Rate this:</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none"
                                    >
                                        <FaStar 
                                            className={`text-xl transition-colors ${
                                                star <= (hoverRating || userRating)
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">
                                ({post.average_rating.toFixed(1)} avg)
                            </span>
                        </div>

                        {/* Share Button */}
                        <button 
                            onClick={() => navigator.clipboard.writeText(window.location.href)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                            <FaShare /> Share
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-around pt-6 text-center">
                        <div>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-600">
                                <FaEye /> {post.view_count}
                            </div>
                            <p className="text-sm text-gray-500">Views</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-500">
                                <FaHeart /> {post.like_count}
                            </div>
                            <p className="text-sm text-gray-500">Likes</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                                <FaComments /> {comments.length}
                            </div>
                            <p className="text-sm text-gray-500">Comments</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-purple-600">
                                <FaQuestionCircle /> {questions.length}
                            </div>
                            <p className="text-sm text-gray-500">Questions</p>
                        </div>
                    </div>
                </div>

                {/* Comments & Questions Tabs */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                                activeTab === 'comments'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <FaComments /> Comments ({comments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                                activeTab === 'questions'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <FaQuestionCircle /> Q&A ({questions.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Comments Tab */}
                        {activeTab === 'comments' && (
                            <div>
                                {/* New Comment Form */}
                                <form onSubmit={handleSubmitComment} className="mb-6">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={isAuthenticated ? "Share your thoughts..." : "Please login to comment"}
                                        disabled={!isAuthenticated}
                                        className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
                                        rows={3}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={!isAuthenticated || !newComment.trim()}
                                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaPaperPlane /> Post Comment
                                        </button>
                                    </div>
                                </form>

                                {/* Comments List */}
                                <div className="space-y-6">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="border-b pb-4 last:border-b-0">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-600 font-medium">
                                                        {comment.user.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">{comment.user.name}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(comment.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 mb-2">{comment.content}</p>
                                                    {isAuthenticated && (
                                                        <button
                                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <FaReply /> Reply
                                                        </button>
                                                    )}

                                                    {/* Reply Form */}
                                                    {replyingTo === comment.id && (
                                                        <div className="mt-3 ml-4">
                                                            <textarea
                                                                value={replyContent}
                                                                onChange={(e) => setReplyContent(e.target.value)}
                                                                placeholder="Write your reply..."
                                                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                                                rows={2}
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleSubmitReply(comment.id)}
                                                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                                >
                                                                    Reply
                                                                </button>
                                                                <button
                                                                    onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                                                    className="text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded hover:bg-gray-300"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Replies */}
                                                    {comment.replies.length > 0 && (
                                                        <div className="mt-4 ml-4 space-y-4">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                                        <span className="text-green-600 font-medium text-sm">
                                                                            {reply.user.name.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-medium text-sm">{reply.user.name}</span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {formatDate(reply.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700">{reply.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {comments.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            No comments yet. Be the first to share your thoughts!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Questions Tab */}
                        {activeTab === 'questions' && (
                            <div>
                                {/* New Question Form */}
                                <form onSubmit={handleSubmitQuestion} className="mb-6">
                                    <textarea
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        placeholder={isAuthenticated ? "Ask a question to the doctor..." : "Please login to ask a question"}
                                        disabled={!isAuthenticated}
                                        className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
                                        rows={3}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={!isAuthenticated || !newQuestion.trim()}
                                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaQuestionCircle /> Ask Question
                                        </button>
                                    </div>
                                </form>

                                {/* Questions List */}
                                <div className="space-y-6">
                                    {questions.map((question) => (
                                        <div key={question.id} className="border rounded-lg overflow-hidden">
                                            <div className="bg-purple-50 p-4">
                                                <div className="flex items-start gap-3">
                                                    <FaQuestionCircle className="text-purple-600 mt-1 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{question.question}</p>
                                                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                            <span>Asked by {question.patient.name}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(question.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {question.answer ? (
                                                <div className="bg-white p-4 border-t">
                                                    <div className="flex items-start gap-3">
                                                        <FaUserMd className="text-green-600 mt-1 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-gray-700">{question.answer}</p>
                                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                                <span>Answered by {question.answered_by?.name}</span>
                                                                <span>•</span>
                                                                <span>{formatDate(question.answered_at!)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 p-4 border-t">
                                                    <p className="text-yellow-700 flex items-center gap-2">
                                                        <FaClock /> Awaiting doctor's response...
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {questions.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            No questions yet. Be the first to ask!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </article>

            <Footer />
        </div>
    );
};

export default PostDetailPage;
