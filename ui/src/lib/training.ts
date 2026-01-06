// OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
// Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import axios from "axios";

import type {
  StartTrainingRequest,
  StartTrainingResponse,
  TrainingStatusResponse,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:23979";

// Convert HTTP URL to WebSocket URL
export function getTrainingWebSocketUrl(slug: string): string {
  const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";
  const baseUrl = API_BASE.replace(/^https?/, wsProtocol);
  return `${baseUrl}/api/projects/${slug}/train/ws`;
}

export async function startTraining(
  slug: string,
  request: StartTrainingRequest
): Promise<StartTrainingResponse> {
  const response = await axios.post<StartTrainingResponse>(
    `${API_BASE}/api/projects/${slug}/train`,
    request
  );
  return response.data;
}

export async function cancelTraining(slug: string): Promise<void> {
  await axios.post(`${API_BASE}/api/projects/${slug}/train/cancel`);
}

export async function fetchTrainingStatus(
  slug: string
): Promise<TrainingStatusResponse> {
  const response = await axios.get<TrainingStatusResponse>(
    `${API_BASE}/api/projects/${slug}/train/status`
  );
  return response.data;
}

export interface TrainingWebSocketMessage {
  type: "status" | "progress" | "log" | "done" | "error";
  job_id?: string | null;
  status?: string;
  progress?: number;
  current_step?: number;
  total_steps?: number;
  device?: string | null;
  error_code?: string | null;
  can_start?: boolean;
  timestamp?: string;
  message?: string;
}

export interface TrainingWebSocketCallbacks {
  onStatus: (data: TrainingWebSocketMessage) => void;
  onLog: (timestamp: string, message: string) => void;
  onDone: (status: string, errorCode: string | null) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function createTrainingWebSocket(
  slug: string,
  callbacks: TrainingWebSocketCallbacks
): WebSocket {
  const url = getTrainingWebSocketUrl(slug);
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`[Training WS] Connected to ${url}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as TrainingWebSocketMessage;

      switch (data.type) {
        case "status":
        case "progress":
          callbacks.onStatus(data);
          break;
        case "log":
          if (data.timestamp && data.message) {
            callbacks.onLog(data.timestamp, data.message);
          }
          break;
        case "done":
          callbacks.onDone(data.status || "completed", data.error_code || null);
          break;
        case "error":
          callbacks.onError(data.message || "Unknown error");
          break;
      }
    } catch (e) {
      console.error("[Training WS] Failed to parse message:", e);
    }
  };

  ws.onerror = (error) => {
    console.error("[Training WS] Error:", error);
    callbacks.onError("WebSocket connection error");
  };

  ws.onclose = () => {
    console.log("[Training WS] Connection closed");
    callbacks.onClose();
  };

  return ws;
}
