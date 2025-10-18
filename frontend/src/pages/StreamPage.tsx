// pages/StreamPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import Chat from '../components/Chat';
import StreamInfo from '../components/StreamInfo';
import EditStreamModal from '../components/EditStreamModal';
import { api } from '../api';
import type { Stream } from '../types/StreamTypes'
import VideoPlayer from '../components/VideoPlayer';
// import { useViewerCount } from '../hooks/useViewerCount';
import { AxiosError } from 'axios';

export default function StreamPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  // const { viewerCount } = useViewerCount(Number(id));

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await api.get(`/streams/${id}`);
        setStream(response.data);
      } catch (err) {
        if (err instanceof AxiosError)
          setError('Stream not found or is offline');
        console.error('Failed to fetch stream:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStream();
  }, [id]);

  const handleStreamUpdate = (updatedStream: Stream) => {
    setStream(updatedStream);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 pt-16">
        <div className="text-lg">Loading stream...</div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex items-center justify-center min-h-64 pt-16">
        <div className="text-lg text-red-500">{error || 'Stream not found'}</div>
      </div>
    );
  }

  // const streamWithLiveViewerCount = {
  //   ...stream,
  //   viewer_count: viewerCount
  // };

  return (
    <div className="w-full min-h-screen bg-[var(--background)] p-5 pt-8">
      <div className="flex">
        <div className="flex-1 min-w-0 mr-100">
          <div className="w-full px-0">
            <VideoPlayer
              streamId={id!}
              isLive={stream.is_live}
              title={stream.title}
              username={stream.owner.username}
            />

            <div className="mx-auto">
              <StreamInfo stream={stream} />

              {user?.id === stream.owner.id && (
                <div className="mt-4 p-4 border-2">
                  <h3 className="font-semibold mb-2">Stream Controls</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert("Please end stream in your streaming software. Why do I have this button? Cause the single edit stream button looked weird to me :/")}
                      className="danger px-4 py-2 transition-colors"
                    >
                      End Stream
                    </button>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2"
                    >
                      Edit Stream Info
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed right-0 top-18 h-[calc(100vh-4.5rem)] w-100 z-40 bg-background"> 
          <Chat 
            streamId={Number(id)!} 
            streamerId={stream.owner.id}
            isAuthenticated={!!user}
          />
        </div>
      </div>

      {/* Edit Stream Modal */}
      <EditStreamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        stream={stream}
        onStreamUpdate={handleStreamUpdate}
      />
    </div>
  );
}
