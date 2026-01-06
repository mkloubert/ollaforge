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

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  cancelTraining,
  fetchTrainingStatus,
  getTrainingWebSocketUrl,
  startTraining,
} from "@/lib/training";
import type {
  StartTrainingRequest,
  TrainingProgress,
  TrainingStatus,
  TrainingTask,
} from "@/types";

interface UseTrainingResult {
  status: TrainingStatus;
  progress: TrainingProgress | null;
  jobId: string | null;
  canStart: boolean;
  isStarting: boolean;
  isConnected: boolean;
  tasks: TrainingTask[];
  error: string | null;
  start: (request: StartTrainingRequest) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  clearError: () => void;
}

export function useTraining(
  projectSlug: string | undefined
): UseTrainingResult {
  const [status, setStatus] = useState<TrainingStatus>("idle");
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const shouldReconnectRef = useRef(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const closeWebSocket = useCallback((permanent = false) => {
    if (permanent) {
      shouldReconnectRef.current = false;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!projectSlug || !mountedRef.current) return;

    // Already connected or connecting
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    shouldReconnectRef.current = true;

    console.log(`[useTraining] Connecting WebSocket for ${projectSlug}`);

    const url = getTrainingWebSocketUrl(projectSlug);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setIsConnected(true);
      console.log(`[useTraining] WebSocket connected for ${projectSlug}`);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;

      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "status":
          case "progress": {
            const newStatus = (data.status || "idle") as TrainingStatus;
            setStatus(newStatus);
            setJobId(data.job_id || null);
            setCanStart(data.can_start ?? true);

            // Update tasks
            if (data.tasks) {
              setTasks(data.tasks);
            }

            setProgress({
              status: newStatus,
              progress: data.progress ?? 0,
              current_step: data.current_step ?? 0,
              total_steps: data.total_steps ?? 0,
              device: (data.device as "cuda" | "mps" | "cpu" | null) ?? null,
              error_code: data.error_code ?? null,
              tasks: data.tasks ?? [],
            });
            break;
          }
          case "done": {
            const finalStatus = (data.status || "completed") as TrainingStatus;
            setStatus(finalStatus);
            setCanStart(true);
            if (data.tasks) {
              setTasks(data.tasks);
            }
            // Set error if failed
            if (data.error_code && finalStatus === "failed") {
              setError(data.error_code);
            }
            break;
          }
          case "error":
            console.error(`[useTraining] Server error: ${data.message}`);
            setError(data.message || "Unknown error");
            break;
        }
      } catch (e) {
        console.error("[useTraining] Failed to parse message:", e);
      }
    };

    ws.onerror = () => {
      // Only log, don't set error state - onclose will handle reconnection
      console.error("[useTraining] WebSocket error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;

      setIsConnected(false);
      console.log("[useTraining] WebSocket closed");

      // Reconnect after a delay if still mounted and should reconnect
      if (shouldReconnectRef.current && projectSlug) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && shouldReconnectRef.current) {
            console.log("[useTraining] Attempting to reconnect...");
            connectWebSocket();
          }
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, [projectSlug]);

  // Initial status fetch and WebSocket connection
  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;

    if (!projectSlug) {
      setStatus("idle");
      setProgress(null);
      setJobId(null);
      setCanStart(true);
      setTasks([]);
      closeWebSocket(true);
      return;
    }

    // Fetch initial status
    const loadInitialStatus = async () => {
      if (!mountedRef.current) return;

      try {
        const data = await fetchTrainingStatus(projectSlug);
        if (!mountedRef.current) return;

        setStatus(data.status);
        setProgress(data.progress);
        setJobId(data.job_id);
        setCanStart(data.can_start);
        if (data.progress.tasks) {
          setTasks(data.progress.tasks);
        }

        if (data.progress.error_code) {
          setError(data.progress.error_code);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          setError(err.response.data.detail.error_code);
        }
      }

      // Connect WebSocket after initial fetch
      if (mountedRef.current) {
        connectWebSocket();
      }
    };

    loadInitialStatus();

    return () => {
      mountedRef.current = false;
      closeWebSocket(true);
    };
  }, [projectSlug, connectWebSocket, closeWebSocket]);

  const start = useCallback(
    async (request: StartTrainingRequest): Promise<boolean> => {
      if (!projectSlug) return false;

      setIsStarting(true);
      setError(null);
      setTasks([]);

      try {
        const response = await startTraining(projectSlug, request);
        setJobId(response.job_id);
        setStatus(response.status);
        setCanStart(false);

        // Ensure WebSocket is connected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }

        return true;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          const errorCode = err.response.data.detail.error_code;
          setError(errorCode);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("ERR_TRAINING_4001");
        }
        return false;
      } finally {
        setIsStarting(false);
      }
    },
    [projectSlug, connectWebSocket]
  );

  const cancelFn = useCallback(async (): Promise<boolean> => {
    if (!projectSlug) return false;

    try {
      await cancelTraining(projectSlug);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
        const errorCode = err.response.data.detail.error_code;
        setError(errorCode);
      } else if (err instanceof Error) {
        setError(err.message);
      }
      return false;
    }
  }, [projectSlug]);

  return {
    status,
    progress,
    jobId,
    canStart,
    isStarting,
    isConnected,
    tasks,
    error,
    start,
    cancel: cancelFn,
    clearError,
  };
}
