// components/StreamCard.tsx
import { Link } from 'react-router';
import type { Stream } from '../types/StreamTypes'
import './StreamCard.css'
import { IMAGE_URL } from '../api';
import { useViewerCount } from '../hooks/useViewerCount';

function formatViews(num: number): string {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' });
  return `${formatter.format(num)}`;
}

export default function StreamCard({ stream }: {stream: Stream}) {
    const { viewerCount } = useViewerCount(stream.id);

    return (
        <Link to={`/stream/${stream.id}`} className="block hover:scale-105 transition-transform">
            <div className="bg-card overflow-hidden shadow-lg">
                <div className="aspect-video bg-gray-800 relative">
                    <img src={stream.thumbnail ? `${IMAGE_URL}${stream.thumbnail}` : "thumbnail.jpg"} className="border-4 border-solid border-[var(--accent)]"/>
                    {/* <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white">Live Stream Preview</span>
                    </div> */}
                    {stream.is_live && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm">
                            LIVE
                        </div>
                    )}
                    {stream.is_live && (
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 text-sm">
                            {formatViews(viewerCount)} viewers
                        </div>
                    )}
                </div>
                <div className="py-3 flex items-center gap-2">
                    <img
                        src={stream.owner.profile_picture ? IMAGE_URL + stream.owner.profile_picture : "default-avatar.png"}
                        alt="Avatar"
                        className="w-12 h-12 object-cover rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{stream.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-400">{stream.owner.username}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
