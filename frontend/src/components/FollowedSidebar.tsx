// components/FollowedStreamersSidebar.tsx
import { useEffect, useState } from 'react';
import { api, IMAGE_URL } from '../api';
import { useAuth } from '../contexts/useAuth';
import type { Stream } from '../types/StreamTypes';
import { Link } from 'react-router';
import { useViewerCount } from '../hooks/useViewerCount';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

interface FollowedUser {
  id: number;
  username: string;
  profile_picture?: string;
  email: string;
  created_at: string;
}

export default function FollowedSidebar({ isExpanded, setIsExpanded }: SidebarProps) {
  const { user } = useAuth();
  const [followedStreamers, setFollowedStreamers] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowedStreamers = async () => {
      if (!user) return;

      try {
        const followedUsersResponse = await api.get<FollowedUser[]>('/users/me/following', {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        const followedUsers = followedUsersResponse.data;

        const streamsWithLiveStatus = await Promise.all(
          followedUsers.map(async (followedUser) => {
            try {
              const streamResponse = await api.get(`/streams/user/${followedUser.id}/current`);
              if (streamResponse.data) {
                return {
                  ...streamResponse.data,
                  owner: followedUser,
                  is_live: true
                };
              } else {
                return {
                  id: 0,
                  title: '',
                  description: '',
                  thumbnail: null,
                  is_live: false,
                  viewer_count: 0,
                  started_at: null,
                  ended_at: null,
                  owner: followedUser,
                  hls_url: ''
                };
              }
            } catch (error) {
              console.error(`Failed to fetch stream for user ${followedUser.username}:`, error);
              return {
                id: 0,
                title: '',
                description: '',
                thumbnail: null,
                is_live: false,
                viewer_count: 0,
                started_at: null,
                ended_at: null,
                owner: followedUser,
                hls_url: ''
              };
            }
          })
        );

        setFollowedStreamers(streamsWithLiveStatus);
      } catch (error) {
        console.error('Failed to fetch followed streamers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedStreamers();
  }, [user]);

  const getProfilePictureUrl = (profilePicture?: string) => {
    if (!profilePicture) return "/default-avatar.png";
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${IMAGE_URL}${profilePicture}`;
  };

  const sortedStreams = [...followedStreamers].sort((a, b) => {
    if (a.is_live && !b.is_live) return -1;
    if (!a.is_live && b.is_live) return 1;
    return 0;
  });

  const liveStreams = sortedStreams.filter(s => s.is_live);
  const offlineStreams = sortedStreams.filter(s => !s.is_live);

  if (loading) {
    return (
      <div className={`bg-sidebar bg-[var(--background)] border-2 flex flex-col h-full ${
        isExpanded ? 'w-80' : 'w-18'
      } transition-all duration-300`}>
        <div className="p-4 text-center">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  function LiveStreamerItem({ stream }: { stream: Stream }) {
    const { viewerCount } = useViewerCount(stream.id);
    
    return (
      <Link
        to={`/stream/${stream.id}`}
        key={`live-${stream.owner.id}`}
        className="flex items-center p-2 hover:bg-[var(--foreground)]/10 cursor-pointer transition-colors group"
      >
        <div className="relative flex-shrink-0">
          <img
            src={getProfilePictureUrl(stream.owner.profile_picture)}
            alt={stream.owner.username}
            className="w-10 h-10 rounded-full"
          />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-sm font-medium truncate">
              {stream.owner.username}
            </span>
          </div>
          <div className="text-xs text-gray-400 truncate">
            {stream.title}
          </div>
          <div className="text-xs text-gray-400">
            • {viewerCount} viewers
          </div>
        </div>
      </Link>
    );
  }


  return (
    <div className={`bg-sidebar bg-[var(--background)] border-2 flex flex-col h-full ${
      isExpanded ? 'w-80' : 'w-18'
    } transition-all duration-300`}>
      
      {/* Header */}
      <div className={`py-3 flex items-center ${ isExpanded ? 'border-b justify-between px-2' : 'justify-center' }`}>
        {isExpanded && (
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            Followed Channels
          </h3>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-700 transition-colors"
        >
          {isExpanded ? '‹' : '›'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isExpanded ? (
          <div className="p-2 space-y-2">
            {/* Live Stremers */}
            {liveStreams.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">
                  Live Now ({liveStreams.length})
                </div>
                {liveStreams.map(stream => (
                  <LiveStreamerItem key={`live-${stream.owner.id}`} stream={stream} />
                ))}
              </div>
            )}

            {/* Offline */}
            {offlineStreams.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Offline ({offlineStreams.length})
                </div>
                {offlineStreams.map(streamer => (
                  <div
                    key={`offline-${streamer.owner.id}`}
                    className="flex items-center p-2 hover:bg-[var(--foreground)]/10 cursor-pointer transition-colors group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={getProfilePictureUrl(streamer.owner.profile_picture)}
                        alt={streamer.owner.username}
                        className="w-10 h-10 opacity-50 rounded-full"
                      />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {streamer.owner.username}
                      </div>
                      <div className="text-xs text-gray-400">
                        Not Live
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No followed streamers */}
            {followedStreamers.length === 0 && (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-400">No followed channels</div>
                <div className="text-xs text-gray-500 mt-1">
                  Follow streamers to see them here
                </div>
              </div>
            )}
          </div>
        ) : (
          // Collapsed 
          <div className="p-3 space-y-3">
            {sortedStreams.map(stream => (
              <Link to={stream.is_live ? `/stream/${stream.id}` : "#"} key={`collapsed-${stream.owner.id}`} className="relative group">
                <img
                  src={getProfilePictureUrl(stream.owner.profile_picture)}
                  alt={stream.owner.username}
                  className={`w-10 h-10 cursor-pointer rounded-full ${
                    !stream.is_live ? 'opacity-50' : ''
                  }`}
                />
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {stream.owner.username}
                  {stream.is_live && ' 🔴 LIVE'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
