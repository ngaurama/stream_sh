// components/StreamInfo.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { api, IMAGE_URL } from '../api';
import type { Stream } from '../types/StreamTypes';
import { useViewerCount } from '../hooks/useViewerCount';
import { AxiosError } from 'axios';

export default function StreamInfo({ stream }: {stream: Stream}) {
  const { viewerCount } = useViewerCount(stream.id);
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const checkIfFollowing = async () => {
      if (!user || user.id === stream.owner.id) return;
      
      try {
        const response = await api.get(`/users/${stream.owner.id}/follow-status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setIsFollowing(response.data.is_following);
      } catch (err) {
        console.error('Failed to check follow status:', err);
      }
    };

    checkIfFollowing();
  }, [user, stream.owner.id]);

  useEffect(() => {
    const getFollowersCount = async () => {
      try {
        const response = await api.get(`/users/${stream.owner.id}/followers/count`);
        setFollowersCount(response.data.count);
      } catch (err) {
        console.error('Failed to get followers count:', err);
      }
    };

    getFollowersCount();
  }, [stream.owner.id]);

  const handleFollow = async () => {
    if (!user) {
      alert('Please log in to follow streamers');
      return;
    }

    if (user.id === stream.owner.id) {
      alert('You cannot follow yourself');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${stream.owner.id}/unfollow`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/users/${stream.owner.id}/follow`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error('Follow action failed:', err);
        alert(err.response?.data?.detail || 'Action failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const streamUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream.title,
          text: `Watch ${stream.owner.username}'s stream: ${stream.title}`,
          url: streamUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(streamUrl);
        alert('Stream link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert(`Share this link: ${streamUrl}`);
      }
    }
  };

  const description = stream.description || '';
  const shouldTruncate = description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded 
    ? `${description.substring(0, 150)}...` 
    : description;

  return (
    <div className="mt-4 p-4 bg-card border-2">
      <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center overflow-hidden">
            {stream.owner.profile_picture ? (
              <img 
                src={`${IMAGE_URL}${stream.owner.profile_picture}`} 
                alt={stream.owner.username}
                className="w-12 h-12 object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-white">
                {stream.owner.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{stream.owner.username}</h3>
            <p className="text-sm text-gray-400">
              {viewerCount.toLocaleString()} viewers • {followersCount.toLocaleString()} followers
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {user?.id !== stream.owner.id && (
            <button 
              onClick={handleFollow}
              disabled={loading}
              className={`px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button 
            onClick={handleShare}
            className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Share
          </button>
        </div>
      </div>

      {description && (
        <div className="border-t pt-3">
          <h3 className="font-semibold mb-2">About this stream</h3>
          <p className="text-gray-300">
            {displayDescription}
            {shouldTruncate && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 text-primary hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
