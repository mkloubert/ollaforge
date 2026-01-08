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
  getLLMProvidersStatus,
  loginLLMProvider,
} from "@/lib/llmProviders";
import type {
  LLMProviderLoginResponse,
  LLMProviderStatus,
  LLMProviderType,
} from "@/types";

export type OverallStatus = "green" | "yellow" | "gray";

interface UseLLMProvidersResult {
  isLoading: boolean;
  providers: LLMProviderStatus[];
  login: (
    provider: LLMProviderType,
    token: string
  ) => Promise<LLMProviderLoginResponse>;
  refresh: () => Promise<void>;
  getOverallStatus: () => OverallStatus;
  getProviderStatus: (provider: LLMProviderType) => LLMProviderStatus | undefined;
}

export function useLLMProviders(): UseLLMProvidersResult {
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<LLMProviderStatus[]>([]);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getLLMProvidersStatus();
      setProviders(response.providers);
    } catch {
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (
      provider: LLMProviderType,
      token: string
    ): Promise<LLMProviderLoginResponse> => {
      const response = await loginLLMProvider(provider, token);

      if (response.success) {
        // Update the provider status locally
        setProviders((prev) =>
          prev.map((p) =>
            p.provider === provider
              ? { ...p, valid: true, configured: true }
              : p
          )
        );
      }

      return response;
    },
    []
  );

  const getOverallStatus = useCallback((): OverallStatus => {
    if (providers.length === 0) {
      return "gray";
    }

    const configuredProviders = providers.filter((p) => p.configured);

    if (configuredProviders.length === 0) {
      // No providers configured
      return "gray";
    }

    const allValid = configuredProviders.every((p) => p.valid);

    if (allValid) {
      // All configured providers are valid
      return "green";
    }

    // At least one configured provider is invalid
    return "yellow";
  }, [providers]);

  const getProviderStatus = useCallback(
    (provider: LLMProviderType): LLMProviderStatus | undefined => {
      return providers.find((p) => p.provider === provider);
    },
    [providers]
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    isLoading,
    providers,
    login,
    refresh: loadStatus,
    getOverallStatus,
    getProviderStatus,
  };
}
