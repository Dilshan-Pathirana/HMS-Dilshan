import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaSave, FaImage, FaVideo, FaFilePdf,
    FaBookMedical, FaFlask, FaHeart, FaNewspaper,
    FaEye, FaEyeSlash, FaGlobe, FaUsers, FaLock, FaTrash
} from 'react-icons/fa';
import api from "../../utils/api/axios";
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../../store.tsx';

interface PostFormData {
    title: string;
    category: 'success_story' | 'medical_finding' | 'video_vlog' | 'research_article';
    short_description: string;
    content: string;
    video_url: string;
    visibility: 'public' | 'patients_only' | 'logged_in_only';
    status: 'draft' | 'published';
}

const categories = [
    { key: 'success_story', label: 'Success Story', icon: <FaHeart />, description: 'Share patient recovery stories and treatment outcomes' },
    { key: 'medical_finding', label: 'Medical Finding', icon: <FaFlask />, description: 'Share new medical discoveries and clinical findings' },
    { key: 'video_vlog', label: 'Video Vlog', icon: <FaVideo />, description: 'Educational videos about health topics' },
    { key: 'research_article', label: 'Research Article', icon: <FaNewspaper />, description: 'In-depth research papers and studies' },
];

const visibilityOptions = [
    { key: 'public', label: 'Public', icon: <FaGlobe />, description: 'Visible to everyone' },
    { key: 'logged_in_only', label: 'Logged In Only', icon: <FaUsers />, description: 'Only visible to registered users' },
    { key: 'patients_only', label: 'Patients Only', icon: <FaLock />, description: 'Only visible to patients' },
];

const CreatePostPage: React.FC = () => {
    const { postId } = useParams<{ postId?: string }>();
    const navigate = useNavigate();
    const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
    const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
    const userRole = useTypedSelector((state) => state.auth.userRole);
    const userId = useTypedSelector((state) => state.auth.userId);

    const isEditing = !!postId;

    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        category: 'success_story',
        short_description: '',
        content: '',
        video_url: '',
        visibility: 'public',
        status: 'draft',
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is a doctor (role_as = 6)
        if (!isAuthenticated || userRole !== 6) {
            navigate('/login');
            return;
        }

        if (isEditing) {
            fetchPost();
        }
    }, [isAuthenticated, userRole, postId]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/medical-insights/doctor/posts/${postId}`);
            const post = response.data;
            setFormData({
                title: post.title,
                category: post.category,
                short_description: post.short_description,
                content: post.content,
                video_url: post.video_url || '',
                visibility: post.visibility,
                status: post.status,
            });
            if (post.thumbnail_path) {
                setThumbnailPreview(post.thumbnail_path);
            }
            if (post.pdf_file_path) {
                setPdfFileName('Existing PDF Document');
            }
        } catch (err) {
            console.error('Failed to fetch post:', err);
            setError('Failed to load post for editing');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPdfFile(file);
            setPdfFileName(file.name);
        }
    };

    const handleSubmit = async (status: 'draft' | 'published') => {
        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!formData.short_description.trim()) {
            setError('Short description is required');
            return;
        }
        if (!formData.content.trim()) {
            setError('Content is required');
            return;
        }
        if (formData.category === 'video_vlog' && !formData.video_url.trim()) {
            setError('Video URL is required for video vlogs');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('category', formData.category);
            submitData.append('short_description', formData.short_description);
            submitData.append('content', formData.content);
            submitData.append('visibility', formData.visibility);
            submitData.append('status', status);

            if (formData.video_url) {
                submitData.append('video_url', formData.video_url);
            }
            if (thumbnailFile) {
                submitData.append('thumbnail', thumbnailFile);
            }
            if (pdfFile) {
                submitData.append('pdf_file', pdfFile);
            }

            let response;
            if (isEditing) {
                response = await api.post(`/medical-insights/doctor/posts/${postId}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('/medical-insights/doctor/posts', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setSuccess(status === 'published'
                ? 'Post published successfully!'
                : 'Draft saved successfully!');

            setTimeout(() => {
                navigate('/doctor-dashboard/posts');
            }, 1500);

        } catch (err: any) {
            console.error('Failed to save post:', err);
            setError(err.response?.data?.message || 'Failed to save post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            setSaving(true);
            await api.delete(`/medical-insights/doctor/posts/${postId}`);
            setSuccess('Post deleted successfully!');
            setTimeout(() => {
                navigate('/doctor-dashboard/posts');
            }, 1500);
        } catch (err) {
            console.error('Failed to delete post:', err);
            setError('Failed to delete post');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/doctor-dashboard/posts"
                            className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors"
                        >
                            <FaArrowLeft /> Back
                        </Link>
                        <h1 className="text-2xl font-bold text-neutral-800">
                            {isEditing ? 'Edit Post' : 'Create New Post'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <FaBookMedical className="text-primary-500" />
                        <span>Medical Insights</span>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-error-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Category Selection */}
                    <div className="p-6 border-b">
                        <label className="block text-sm font-medium text-neutral-700 mb-3">
                            Post Category *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map((cat) => (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.key as any }))}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                                        formData.category === cat.key
                                            ? 'border-primary-500 bg-blue-50'
                                            : 'border-neutral-200 hover:border-neutral-300'
                                    }`}
                                >
                                    <div className={`text-2xl mb-2 ${
                                        formData.category === cat.key ? 'text-primary-500' : 'text-neutral-400'
                                    }`}>
                                        {cat.icon}
                                    </div>
                                    <div className="font-medium text-neutral-800">{cat.label}</div>
                                    <div className="text-xs text-neutral-500 mt-1">{cat.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter a descriptive title for your post"
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Short Description */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Short Description *
                            </label>
                            <textarea
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleInputChange}
                                placeholder="A brief summary that will appear on the post card (max 200 characters)"
                                rows={2}
                                maxLength={200}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                {formData.short_description.length}/200 characters
                            </p>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Full Content *
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Write your full article content here. You can use markdown formatting:

## Heading
**Bold text**
*Italic text*
- Bullet points
1. Numbered lists"
                                rows={15}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Supports basic markdown formatting
                            </p>
                        </div>

                        {/* Video URL (for video vlogs) */}
                        {formData.category === 'video_vlog' && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    <FaVideo className="inline mr-2" />
                                    Video URL *
                                </label>
                                <input
                                    type="url"
                                    name="video_url"
                                    value={formData.video_url}
                                    onChange={handleInputChange}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    YouTube or Vimeo links are supported
                                </p>
                            </div>
                        )}

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                <FaImage className="inline mr-2" />
                                Thumbnail Image
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                        id="thumbnail-upload"
                                    />
                                    <label
                                        htmlFor="thumbnail-upload"
                                        className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                                    >
                                        <div className="text-center">
                                            <FaImage className="text-3xl text-neutral-400 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-500">Click to upload thumbnail</p>
                                            <p className="text-xs text-neutral-400">PNG, JPG up to 5MB</p>
                                        </div>
                                    </label>
                                </div>
                                {thumbnailPreview && (
                                    <div className="relative">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                            className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full p-1"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PDF Upload (for research articles) */}
                        {formData.category === 'research_article' && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    <FaFilePdf className="inline mr-2" />
                                    PDF Document
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handlePdfChange}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label
                                        htmlFor="pdf-upload"
                                        className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50"
                                    >
                                        <FaFilePdf className="text-error-500" />
                                        <span>Choose PDF</span>
                                    </label>
                                    {pdfFileName && (
                                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                                            <FaFilePdf className="text-error-500" />
                                            <span>{pdfFileName}</span>
                                            <button
                                                type="button"
                                                onClick={() => { setPdfFile(null); setPdfFileName(null); }}
                                                className="text-error-500 hover:text-red-700"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-3">
                                Visibility
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {visibilityOptions.map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, visibility: opt.key as any }))}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                            formData.visibility === opt.key
                                                ? 'border-primary-500 bg-blue-50'
                                                : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                    >
                                        <div className={`text-xl mb-2 ${
                                            formData.visibility === opt.key ? 'text-primary-500' : 'text-neutral-400'
                                        }`}>
                                            {opt.icon}
                                        </div>
                                        <div className="font-medium text-neutral-800">{opt.label}</div>
                                        <div className="text-xs text-neutral-500">{opt.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-neutral-50 border-t flex flex-wrap items-center justify-between gap-4">
                        <div>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <FaTrash /> Delete Post
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => handleSubmit('draft')}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                            >
                                <FaEyeSlash /> Save as Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit('published')}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaEye /> Publish
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePostPage;
