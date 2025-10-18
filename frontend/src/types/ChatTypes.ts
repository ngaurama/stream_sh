import type { User } from "./UserTypes";

export interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
  isStreamer?: boolean;
}

export interface ChatResponse {
  id: number;
  user: User;
  message: string;
  timestamp: Date;
  isStreamer?: boolean;
}

export interface ChatProps {
  streamId: number;
  streamerId: number;
  isAuthenticated: boolean;
}
