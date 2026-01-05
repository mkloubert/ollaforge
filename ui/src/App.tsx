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

import "./App.css";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

function App() {
  const { isLoading, isHealthy, error, refetch } = useHealthCheck();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">OllaForge</CardTitle>
          <CardDescription>
            Training LLMs with your own data for Ollama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">API Status</span>
            {isLoading ? (
              <Badge variant="secondary" className="gap-1.5">
                <Spinner className="size-3" />
                Checking...
              </Badge>
            ) : isHealthy ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Connected
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="cursor-pointer"
                onClick={refetch}
                title={error || "Click to retry"}
              >
                Disconnected
              </Badge>
            )}
          </div>
          {error && !isLoading && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
