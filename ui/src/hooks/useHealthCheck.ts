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
import api from "@/lib/api";

interface HealthStatus {
  status: string;
}

interface UseHealthCheckResult {
  isLoading: boolean;
  isHealthy: boolean | null;
  error: string | null;
  refetch: () => void;
}

export function useHealthCheck(): UseHealthCheckResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<HealthStatus>("/api/healthz");
      setIsHealthy(response.data.status === "ok");
    } catch (err) {
      setIsHealthy(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to the API");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return {
    isLoading,
    isHealthy,
    error,
    refetch: fetchHealth,
  };
}
