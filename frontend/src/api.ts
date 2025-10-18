// src/api.ts
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost/api";
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost/api";
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "http://localhost/uploads";
export const BASE_URL = import.meta.env.VITE_BASE_URL || "localhost";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


// export async function getMockStreams() {
//   const res = await api.get("/mock/streams");
//   return res.data;
// }
