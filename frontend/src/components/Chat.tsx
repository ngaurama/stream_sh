// components/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../contexts/useAuth';
import type { ChatProps, ChatMessage, ChatResponse } from '../types/ChatTypes'
import { useWebSocket } from '../hooks/useWebSocket';
import { api, WEBSOCKET_URL } from '../api';

const USER_COLORS = [
  '#FF4500', // OrangeRed
  '#1E90FF', // DodgerBlue
  '#32CD32', // LimeGreen
  '#FF69B4', // HotPink
  '#BA55D3', // MediumOrchid
  '#FFD700', // Gold
  '#00CED1', // DarkTurquoise
  '#FF6347', // Tomato
  '#ADFF2F', // GreenYellow
  '#FF1493', // DeepPink
];

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export default function Chat({ streamId, streamerId, isAuthenticated }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  // const [isConnected, setIsConnected] = useState(false);
  const [emotes, setEmotes] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const { user } = useAuth();

  const { isConnected, sendMessage } = useWebSocket(
    `${WEBSOCKET_URL}/ws/streams/${streamId}/chat?token=${localStorage.getItem("token")}`,
    (message) => {
      // console.log("WEBSOCKST", message)
      if (message.type === 'chat_message') {
        const chatMessage: ChatMessage = {
          id: message.data.id,
          userId: message.data.user_id,
          username: message.data.username,
          message: message.data.message,
          timestamp: new Date(message.data.timestamp),
          isStreamer: message.data.user_id === streamerId,
        };
        setMessages(prev => [...prev, chatMessage]);
      }
    }
  );

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await api.get(`/streams/${streamId}/chat`);
        // console.log(response.data)
        const chatHistory: ChatMessage[] = response.data.map((msg: ChatResponse) => ({
          id: msg.id,
          userId: msg.user.id,
          username: msg.user?.username || 'Unknown',
          message: msg.message,
          timestamp: new Date(msg.timestamp),
          isStreamer: msg.user.id === streamerId,
        }));
        setMessages(chatHistory);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [streamId, streamerId]);

  useEffect(() => {
    const loadAllEmotes = async () => {
      const urls = [
        "https://api.betterttv.net/3/cached/emotes/global",
        "https://api.frankerfacez.com/v1/set/global",
        "https://api.7tv.app/v3/emote-sets/01G0X6HFX8000EH87BCAZW2PPP",
        "https://api.7tv.app/v3/emote-sets/01F6197X28000B6V3DJP9R671R",
        "https://api.7tv.app/v3/emote-sets/01GW8MRR8R0000XWTYFAW9XRTZ"
      ];

      const map = new Map<string, string>();

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await res.json();

          if (url.includes("betterttv")) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.forEach((e: any) => map.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/1x`));
          } else if (url.includes("frankerfacez")) {
              const sets = data.sets;
              for (const key in sets) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  sets[key].emoticons.forEach((e: any) =>
                  map.set(e.name, e.urls["1"] || e.urls["2"])
                  );
          }
          } else if (url.includes("7tv")) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.emotes.forEach((e: any) => 
                  map.set(e.name, `https:${e.data.host.url}/${e.data.host.files[0].name}`));
          }
        } catch (err) {
            console.warn(`Failed to load from ${url}`, err);
        }
      }
      setEmotes(map);
    };

    loadAllEmotes();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isAuthenticated || !isConnected) return;
    sendMessage({
      type: 'chat_message',
      data: {
        message: newMessage.trim()
      }
    });

    setNewMessage('');
  };

  function renderMessageWithEmotes(text: string) {
    const parts = text.split(/\s+/);
    return parts.map((part, i) =>
        emotes.has(part)
        ? (
            <img
                key={i}
                src={emotes.get(part)}
                alt={part}
                className="inline w-6 h-6 mx-0.5 align-middle"
            />
          )
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="bg-chat bg-[var(--background)] h-full flex flex-col border-2">
      <div className="p-3 border-b border-chat-border">
        <h3 className="font-semibold">Stream Chat</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1 leading-snug">
            {messages.map((message) => (
                <div key={message.id} className="text-md break-words flex flex-wrap items-center gap-x-1 p-1">
                    <span className="text-xs text-gray-400 mr-2 whitespace-nowrap">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                        className="font-semibold mr-1 whitespace-nowrap"
                        style={{
                        color: message.isStreamer 
                            ? '#FFD700' 
                            : getUsernameColor(message.username)
                        }}
                    >
                        {message.username}:
                    </span>
                    {/* <span className="flex flex-wrap items-center"> */}
                        {renderMessageWithEmotes(message.message)}
                    {/* </span> */}
                </div>

            ))}
            <div ref={messagesEndRef} />
        </div>

      <div className="p-3 border-t border-chat-border">
        {isAuthenticated ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-input border border-input-border px-3 py-2 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-primary px-4 py-2 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="text-center p-2">
            <p className="text-md">
              Please <a href="/login" className="text-primary hover:underline">login</a> to chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
