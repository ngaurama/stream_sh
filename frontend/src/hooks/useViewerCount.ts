// hooks/useViewerCount.ts
import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { api, API_URL, WEBSOCKET_URL } from '../api';

export function useViewerCount(streamId: number) {
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const { isConnected: wsConnected } = useWebSocket(
    `${WEBSOCKET_URL}/ws/streams/${streamId}/viewer?token=${localStorage.getItem("token") ? localStorage.getItem("token") : ""}`,
    (message) => {
      if (message.type === 'viewer_count_update') {
        setViewerCount(message.data.viewer_count);
      }
    }
  );

  useEffect(() => {
    const fetchViewerCount = async () => {
      try {
        const response = await api.get(`${API_URL}/streams/${streamId}`);
        const stream = response.data;
        setViewerCount(stream.viewer_count);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch viewer count:', error);
        setIsConnected(false);
      }
    };

    fetchViewerCount();

    // 30 secs fallback
    const interval = setInterval(fetchViewerCount, 30000);

    return () => clearInterval(interval);
  }, [streamId]);

  return { viewerCount, isConnected: isConnected && wsConnected };
}
