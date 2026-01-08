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
  checkModelExistsInOllama,
  runModelInOllama,
} from "@/lib/ollama";

interface UseOllamaResult {
  modelExists: boolean;
  modelName: string | null;
  isChecking: boolean;
  isRunning: boolean;
  error: string | null;
  checkExists: () => Promise<void>;
  run: () => Promise<boolean>;
  clearError: () => void;
}

export function useOllama(projectSlug: string | undefined): UseOllamaResult {
  const [modelExists, setModelExists] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkExists = useCallback(async () => {
    if (!projectSlug) return;

    setIsChecking(true);
    setError(null);

    try {
      const response = await checkModelExistsInOllama(projectSlug);
      if (mountedRef.current) {
        setModelExists(response.exists);
        setModelName(response.model_name);
      }
    } catch (err) {
      if (mountedRef.current) {
        // Don't treat Ollama not running as an error for the UI
        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          const errorCode = err.response.data.detail.error_code;
          // Only set error for non-service errors
          if (!["ERR_OLLAMA_6001", "ERR_OLLAMA_6002"].includes(errorCode)) {
            setError(errorCode);
          }
        }
        setModelExists(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [projectSlug]);

  const run = useCallback(async (): Promise<boolean> => {
    if (!projectSlug) return false;

    setIsRunning(true);
    setError(null);

    try {
      await runModelInOllama(projectSlug);
      return true;
    } catch (err) {
      if (mountedRef.current) {
        if (axios.isAxiosError(err) && err.response?.data?.detail?.error_code) {
          setError(err.response.data.detail.error_code);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("ERR_OLLAMA_6006");
        }
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsRunning(false);
      }
    }
  }, [projectSlug]);

  // Check on mount
  useEffect(() => {
    mountedRef.current = true;

    if (projectSlug) {
      checkExists();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [projectSlug, checkExists]);

  return {
    modelExists,
    modelName,
    isChecking,
    isRunning,
    error,
    checkExists,
    run,
    clearError,
  };
}
