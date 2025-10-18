// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function useWebSocket(url: string, onMessage: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  const connect = () => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        // console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        // console.log('WebSocket disconnected');
        setIsConnected(false);
        
        reconnectTimeout.current = window.setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.close();
    }
  };

  useEffect(() => {
    connect();

    return () => {
      // console.log('Cleaning up WebSocket connection');
      disconnect();
    };
  }, [url]);

  return { isConnected, sendMessage, disconnect };
}
