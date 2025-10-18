// components/EditStreamModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { api, IMAGE_URL } from '../api';
import type { Stream } from '../types/StreamTypes';
import { AxiosError } from 'axios';

interface EditStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: {
    id: number;
    title: string;
    description?: string;
    thumbnail?: string;
  };
  onStreamUpdate: (updatedStream: Stream) => void;
}

interface FileUploadResponse {
  filename: string;
  url: string;
  message: string;
}

export default function EditStreamModal({ isOpen, onClose, stream, onStreamUpdate }: EditStreamModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: ''
  });

  // Initialize form with current stream data
  useEffect(() => {
    if (isOpen && stream) {
      setFormData({
        title: stream.title || '',
        description: stream.description || '',
        thumbnail: stream.thumbnail || ''
      });
      setPreviewUrl(stream.thumbnail ? `${IMAGE_URL}${stream.thumbnail}` : '');
      setError('');
    }
  }, [isOpen, stream]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const thumbnailUrl = await uploadThumbnail(file);
      
      setFormData(prev => ({
        ...prev,
        thumbnail: thumbnailUrl
      }));
      
    } catch (err) {
      console.error('Upload error:', err);
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await api.post<FileUploadResponse>(
        '/upload/stream-thumbnail',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      return response.data.url;

    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMsg = err.response?.data?.detail || 'Failed to upload thumbnail';
        setError(errorMsg);
        throw new Error(errorMsg);
      } else {
        const errorMsg = 'Failed to upload thumbnail';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.put(
        `/streams/${stream.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      onStreamUpdate(response.data);
      onClose();
      
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to update stream');
      else
        setError('Failed to update stream')
      console.error('Failed to update stream:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeThumbnail = async () => {
    try {
      if (formData.thumbnail && formData.thumbnail.startsWith('/uploads/')) {
        await api.delete(`/upload/stream-thumbnail?stream_id=${stream.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      }
    } catch (err) {
      console.error('Failed to delete thumbnail from server:', err);
    } finally {
      setFormData(prev => ({ ...prev, thumbnail: '' }));
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--background)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-[var(--accent)] font-bold">
              Edit Stream Info
            </h2>
            <button
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700 p-4">
                <p className="">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--accent)] mb-2">
                Stream Title <span className='text-red-500'>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full px-3 py-2 shadow-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--accent)] mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border  shadow-sm "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--accent)] mb-2">
                Thumbnail
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/jpg,image/gif"
                className="hidden"
              />

              {!formData.thumbnail ? (
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed p-6 text-center cursor-pointer hover:border-[var(--accent)]"
                >
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload thumbnail'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="border border-gray-300 dark:border-gray-600 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={previewUrl} 
                          alt="Thumbnail preview" 
                          className="w-16 h-16 object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Thumbnail uploaded successfully
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input Fallback */}
              <div className="mt-4">
                <p className="text-sm text-[var(--accent)] mb-2">
                  Or enter thumbnail URL
                </p>
                <input
                  type="text"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-3 py-2 shadow-sm focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || uploading}
                className="flex-1 px-4 py-2 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Stream'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
