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

import { useCallback, useEffect, useState } from "react";

import {
  getHuggingFaceStatus,
  loginToHuggingFace,
} from "@/lib/huggingface";
import type { HuggingFaceLoginResponse } from "@/types";

interface UseHuggingFaceResult {
  isLoading: boolean;
  loggedIn: boolean;
  username: string | null;
  login: (token: string) => Promise<HuggingFaceLoginResponse>;
  refresh: () => Promise<void>;
}

export function useHuggingFace(): UseHuggingFaceResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);

    try {
      const status = await getHuggingFaceStatus();
      setLoggedIn(status.logged_in);
      setUsername(status.username);
    } catch {
      setLoggedIn(false);
      setUsername(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (token: string): Promise<HuggingFaceLoginResponse> => {
      const response = await loginToHuggingFace(token);

      if (response.success) {
        setLoggedIn(true);
        setUsername(response.username);
      }

      return response;
    },
    []
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    isLoading,
    loggedIn,
    username,
    login,
    refresh: loadStatus,
  };
}
