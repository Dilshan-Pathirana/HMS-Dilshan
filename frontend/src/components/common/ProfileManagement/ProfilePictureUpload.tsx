import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import api from "../../../utils/api/axios";

interface ProfilePictureUploadProps {
    currentImage?: string;
    userId: string;
    onUploadSuccess?: (imageUrl: string) => void;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
    currentImage,
    userId,
    onUploadSuccess
}) => {
    const [preview, setPreview] = useState<string | undefined>(currentImage);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        setError('');
        
        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('profile_picture', file);
            
            const response = await api.post(`/upload-profile-picture/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 200) {
                onUploadSuccess?.(response.data.data.image_url);
            } else {
                setError('Failed to upload image');
            }
        } catch (err) {
            setError('Error uploading image. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        try {
            setUploading(true);
            await api.delete(`/remove-profile-picture/${userId}`);
            setPreview(undefined);
            onUploadSuccess?.('');
        } catch (err) {
            setError('Error removing image');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center shadow-lg">
                    {preview ? (
                        <img 
                            src={preview} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Camera className="w-12 h-12 text-emerald-600" />
                    )}
                </div>
                
                {preview && (
                    <button
                        onClick={handleRemove}
                        disabled={uploading}
                        className="absolute top-0 right-0 bg-error-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <label 
                    htmlFor="profile-picture-input"
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-emerald-500 to-primary-500 text-white rounded-full p-2 shadow-md cursor-pointer hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                </label>
                <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                />
            </div>

            {error && (
                <p className="text-sm text-error-500">{error}</p>
            )}

            <p className="text-xs text-neutral-500 text-center">
                Click the upload button to change your profile picture
                <br />
                Max size: 5MB (JPG, PNG, GIF)
            </p>
        </div>
    );
};
