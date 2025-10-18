// pages/AccountPage.tsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router';
import { api, IMAGE_URL } from '../api';
import { AxiosError } from 'axios';

interface FileUploadResponse {
  filename: string;
  url: string;
  message: string;
}

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/auth/me', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      updateUser(response.data);
      setSuccess('Profile updated successfully!');
      
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to update profile');
      else
        setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
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

    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await api.post<FileUploadResponse>(
        '/upload/profile-picture',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      updateUser({ ...user!, profile_picture: response.data.url });
      setSuccess('Profile picture updated successfully!');

    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to upload profile picture');
      else
        setError('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      logout();
      navigate('/');
      
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to delete account');
      else
        setError('Failed to delete account');
      setLoading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      await api.delete('/upload/profile-picture', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      updateUser({ ...user!, profile_picture: undefined });
      setSuccess('Profile picture removed successfully!');
      
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.detail || 'Failed to remove profile picture');
      else
        setError('Failed to remove profile picture');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getProfilePictureUrl = () => {
    if (!user?.profile_picture) return "/default-avatar.png";
    if (user.profile_picture.startsWith('http')) return user.profile_picture;
    // console.log(user.profile_picture)
    return `${IMAGE_URL}${user.profile_picture}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64 pt-16">
        <div className="text-lg text-red-500">Please log in to view account settings</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
      <div className="bg-[var(--background)] shadow-lg p-6 border-2">
        <h1 className="text-3xl font-bold mb-6 text-[var(--accent)]">
          Account Settings
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-4 mb-6">
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-[var(--accent)] mb-4">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={getProfilePictureUrl()}
                  alt="Profile"
                  className="w-20 h-20 object-cover border-2 rounded-full border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="px-4 py-2"
                >
                  {uploading ? 'Uploading...' : 'Change Picture'}
                </button>
                 {user?.profile_picture && (
                  <button
                    type="button"
                    onClick={removeProfilePicture}
                    disabled={uploading}
                    className="px-4 py-2 ml-2"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--accent)] mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              maxLength={50}
              className="w-full px-3 py-2 "
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--accent)] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full px-3 py-2 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Update Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-6 py-3"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>

        {/* Delete Account stuf */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="danger px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete Account
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Once you delete your account, there is no going back. This action cannot be undone.
          </p>
        </div>
      </div>

      {/* Delete Confirmation  */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              Delete Account
            </h3>
            <p className="text-[var(--accent)] mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="danger flex-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
