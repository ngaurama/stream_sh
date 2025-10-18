import type { User } from './UserTypes'

export interface Stream {
  id: number;
  title: string;
  description?: string;
  is_live: boolean;
  viewer_count: number,
  thumbnail?: string,
  started_at?: string;
  ended_at?: string;
  owner: User
}

export interface StreamCreate {
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface Stream extends StreamCreate {
  id: number;
  is_live: boolean;
  viewer_count: number;
  started_at?: string;
  ended_at?: string;
  owner: User
}

export interface StreamWithKey extends Stream {
  stream_key: string;
}
