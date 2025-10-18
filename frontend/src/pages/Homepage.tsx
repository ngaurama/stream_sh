// pages/Homepage.tsx
import { useState, useEffect } from 'react';
import { api } from '../api';
import StreamCard from '../components/StreamCard';
import type { Stream } from '../types/StreamTypes'

export default function Homepage() {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getStreams = async () => {
            try {
                // const response = await getMockStreams();
                const response = await api.get('/streams/all');
                setStreams(response.data);
            } catch (error) {
                console.error('Failed to fetch streams:', error);
            } finally {
                setLoading(false);
            }
        };
        getStreams();
    }, []);

    if (loading) 
        return <div>Loading streams...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Live Streams</h1>
            
            {streams.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl">No live streams at the moment</p>
                    <p className="text-gray-500">Check back later or start your own stream!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {streams.map((stream: Stream) => (
                            <StreamCard key={stream.id} stream={stream} />
                    ))}
                </div>
            )}
        </div>
    );
}
