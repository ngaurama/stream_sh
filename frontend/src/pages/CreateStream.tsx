// pages/CreateStream.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import { api, BASE_URL } from '../api';
import { AxiosError } from 'axios';

interface FileUploadResponse {
  filename: string;
  url: string;
  message: string;
}

export default function CreateStream() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [streamId, setStreamId] = useState(0);
  const [streamKey, setStreamKey] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadThumbnail(file);
  };

  const uploadThumbnail = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<FileUploadResponse>(
        '/upload/stream-thumbnail',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setFormData(prev => ({
        ...prev,
        thumbnail: response.data.url
      }));

    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to upload thumbnail');
      else
        setError('Failed to upload thumbnail');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ stream_key: string; id: number }>(
        '/streams/create', 
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      setStreamId(response.data.id);
      setStreamKey(response.data.stream_key);
      setShowStreamKey(true);
      
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to create stream');
      else
        setError('Failed to create stream');
      console.error('Failed to create stream:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const copyStreamKey = async () => {
    try {
      await navigator.clipboard.writeText(streamKey);
      alert('Stream key copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy stream key:', err);
    }
  };

  const goToStream = () => {
    navigate(`/stream/${streamId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64 pt-16">
        <div className="text-lg text-red-500">Please log in to create a stream</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
      <div className="bg-[var(--background)] border-2 shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-[var(--accent)]">
          Create New Stream
        </h1>

        {showStreamKey ? (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
                Stream Created Successfully!
              </h2>
              <p className="text-green-700 dark:text-green-400 mb-4">
                Your stream has been created. Use the stream key below to start streaming.
              </p>
            </div>

            <div className="bg[var(--background)] border-2 p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Stream Key (Keep this secure!)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={streamKey}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm"
                />
                <button
                  onClick={copyStreamKey}
                  className="px-4 py-2"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-[var(--accent)] mt-2">
                Use this key in your streaming software (OBS, Streamlabs, etc.)
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={goToStream}
                className="px-6 py-3 bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Go to Stream
              </button>
              <button
                onClick={() => 
                  {
                    navigate("/")
                    setShowStreamKey(false)
                  }
                }
                className="px-6 py-3 text-[var(--accent)]"
              >
                Go to homepage
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[var(--accent)] mb-2">
                Stream Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="What are you streaming today?"
                className="w-full px-3 py-2 "
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Description */}
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
                placeholder="Tell viewers about your stream..."
                className="w-full px-3 py-2"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-[var(--accent)] mb-2">
                Thumbnail (Optional)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/jpg,image/gif"
                className="hidden"
              />

              {/* Upload  */}
              {!formData.thumbnail ? (
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed p-8 text-center cursor-pointer hover:border-[var(--accent)]"
                >
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                /* Thumbnail Preview */
                <div className="relative">
                  <div className="border border-gray-300 dark:border-gray-600 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={previewUrl || formData.thumbnail} 
                          alt="Thumbnail preview" 
                          className="w-20 h-20 object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--accent)]">
                          Thumbnail uploaded successfully
                        </p>
                        <p className="text-xs text-[var(--accent)]">
                          {formData.thumbnail.split('/').pop()}
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

              {/* URL Fallback */}
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
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Streaming Instructions */}
            <div className="bg-[var(--foreground)]/10 border-2 p-4">
              <h3 className="font-semibold text-[var(--accent)] mb-2">
                How to Start Streaming
              </h3>
              <ol className="text-sm text-var(--accent)] list-decimal list-inside space-y-1">
                <li>After creating the stream, you'll receive a stream key</li>
                <li>Use OBS, Streamlabs, or similar streaming software</li>
                <li>Set the server to: <code className="bg-[var(--background)] px-1">rtmp://${BASE_URL}/live</code></li>
                <li>Enter your stream key in the streaming software</li>
                <li>Start streaming and your stream will appear on the platform</li>
              </ol>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || uploading}
                className="flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Stream...' : 'Create Stream'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
