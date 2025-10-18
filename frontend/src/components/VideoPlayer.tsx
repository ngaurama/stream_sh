// components/VideoPlayer.tsx
import { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// import { useViewerCount } from '../hooks/useViewerCount';
import { API_URL } from '../api';

interface VideoPlayerProps {
  streamId: string | number;
  isLive: boolean;
  title: string;
  username: string;
}

export default function VideoPlayer({ 
  streamId, 
  isLive, 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string>('');
  // const { viewerCount } = useViewerCount(Number(streamId))

  useEffect(() => {
    if (!videoRef.current) return;

    if (playerRef.current) {
      playerRef.current.dispose();
    }

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-default-skin');
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: isLive,
      sources: [{
        src: `${API_URL}/streams/redirect/${streamId}`,
        type: 'application/x-mpegURL'
      }],
      html5: {
        vhs: {
          overrideNative: true
        }
      },
    }, () => {
      // console.log('Player is ready');
    });

    player.on('error', () => {
      const error = player.error();
      setError(error?.message || 'Failed to load stream');
    });

    player.on('loadeddata', () => {
      setError('');
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [streamId, isLive]);

  return (
    <div className="relative bg-black w-full aspect-video border-2">
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
          <div className="text-center text-white">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-lg">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div data-vjs-player>
        <div ref={videoRef} />
      </div>

      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {isLive && (
          <div className="bg-red-500 text-white px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 bg-white animate-pulse rounded-full"></div>
            <span className="text-sm font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* <div className="absolute top-4 right-4 text-right z-10">
         <div className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm">
          {viewerCount.toLocaleString()} viewers
        </div>
      </div> */}
    </div>
  );
}
