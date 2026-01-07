# OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
# Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import asyncio
import logging
import os
import platform
import re
import shutil
from pathlib import Path

from error_codes import ErrorCode
from models.ollama import OllamaModel

logger = logging.getLogger(__name__)


def _is_valid_model_name(name: str) -> bool:
    """Validate model name to prevent command injection."""
    # Only allow alphanumeric, hyphens, underscores, colons, and forward slashes
    return bool(re.match(r'^[a-zA-Z0-9_\-/:\.]+$', name))


class OllamaServiceError(Exception):
    """Exception raised by Ollama service operations."""

    def __init__(self, error_code: ErrorCode, message: str = ""):
        self.error_code = error_code
        self.message = message
        super().__init__(message)


class OllamaService:
    """Service for interacting with Ollama CLI."""

    def __init__(self):
        self._ollama_path: str | None = None

    def _get_ollama_path(self) -> str:
        """Get the path to the ollama executable."""
        if self._ollama_path is None:
            self._ollama_path = shutil.which("ollama")
        if self._ollama_path is None:
            raise OllamaServiceError(
                ErrorCode.OLLAMA_NOT_INSTALLED,
                "Ollama is not installed or not in PATH"
            )
        return self._ollama_path

    async def check_ollama_running(self) -> bool:
        """Check if Ollama server is running."""
        try:
            ollama_path = self._get_ollama_path()
            process = await asyncio.create_subprocess_exec(
                ollama_path, "list",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await process.communicate()
            return process.returncode == 0
        except OllamaServiceError:
            raise
        except Exception as e:
            logger.error(f"Error checking Ollama status: {e}")
            return False

    async def list_models(self) -> list[OllamaModel]:
        """List all models available in Ollama."""
        ollama_path = self._get_ollama_path()

        process = await asyncio.create_subprocess_exec(
            ollama_path, "list",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode().strip() if stderr else "Unknown error"
            logger.error(f"Ollama list failed: {error_msg}")
            raise OllamaServiceError(
                ErrorCode.OLLAMA_NOT_RUNNING,
                f"Failed to list models: {error_msg}"
            )

        models: list[OllamaModel] = []
        lines = stdout.decode().strip().split("\n")

        # Skip header line
        for line in lines[1:]:
            if not line.strip():
                continue

            parts = line.split()
            if len(parts) >= 1:
                name = parts[0]
                # Parse size if available (usually 3rd column)
                size = None
                if len(parts) >= 3:
                    # Size is typically like "4.1 GB" (2 parts)
                    size = f"{parts[2]} {parts[3]}" if len(parts) >= 4 else parts[2]

                models.append(OllamaModel(name=name, size=size))

        return models

    async def model_exists(self, model_name: str) -> bool:
        """Check if a model exists in Ollama."""
        try:
            models = await self.list_models()
            # Check both exact match and with :latest suffix
            for model in models:
                if model.name == model_name or model.name == f"{model_name}:latest":
                    return True
                # Also match without tag
                if model.name.split(":")[0] == model_name:
                    return True
            return False
        except OllamaServiceError:
            raise
        except Exception as e:
            logger.error(f"Error checking model existence: {e}")
            return False

    async def create_model(self, model_name: str, modelfile_path: Path) -> bool:
        """Create a model in Ollama from a Modelfile."""
        if not modelfile_path.exists():
            raise OllamaServiceError(
                ErrorCode.OLLAMA_MODELFILE_NOT_FOUND,
                f"Modelfile not found: {modelfile_path}"
            )

        if not _is_valid_model_name(model_name):
            raise OllamaServiceError(
                ErrorCode.OLLAMA_CREATE_FAILED,
                "Invalid model name"
            )

        ollama_path = self._get_ollama_path()

        logger.info(f"Creating Ollama model '{model_name}' from {modelfile_path}")

        process = await asyncio.create_subprocess_exec(
            ollama_path, "create", model_name, "-f", str(modelfile_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode().strip() if stderr else "Unknown error"
            logger.error(f"Ollama create failed: {error_msg}")
            raise OllamaServiceError(
                ErrorCode.OLLAMA_CREATE_FAILED,
                f"Failed to create model: {error_msg}"
            )

        logger.info(f"Successfully created Ollama model '{model_name}'")
        return True

    def open_terminal_with_run(self, model_name: str) -> bool:
        """Open a new terminal window and run the model."""
        if not _is_valid_model_name(model_name):
            raise OllamaServiceError(
                ErrorCode.OLLAMA_RUN_FAILED,
                "Invalid model name"
            )

        system = platform.system()
        ollama_path = self._get_ollama_path()

        try:
            if system == "Darwin":  # macOS
                # Use osascript to open Terminal.app with the command
                # Using execFile-style approach with separate arguments
                script = f'''
                tell application "Terminal"
                    activate
                    do script "{ollama_path} run {model_name}"
                end tell
                '''
                import subprocess
                subprocess.Popen(["osascript", "-e", script])

            elif system == "Linux":
                import subprocess
                # Try different terminal emulators using execFile-style (no shell)
                terminals = [
                    ["gnome-terminal", "--", "bash", "-c", f"{ollama_path} run {model_name}; exec bash"],
                    ["konsole", "-e", "bash", "-c", f"{ollama_path} run {model_name}; exec bash"],
                    ["xfce4-terminal", "-x", "bash", "-c", f"{ollama_path} run {model_name}; exec bash"],
                    ["xterm", "-e", f"bash -c '{ollama_path} run {model_name}; exec bash'"],
                ]

                terminal_found = False
                for terminal_cmd in terminals:
                    terminal_exe = shutil.which(terminal_cmd[0])
                    if terminal_exe:
                        subprocess.Popen(terminal_cmd)
                        terminal_found = True
                        break

                if not terminal_found:
                    logger.warning("No supported terminal emulator found")
                    raise OllamaServiceError(
                        ErrorCode.OLLAMA_RUN_FAILED,
                        "No supported terminal emulator found"
                    )

            elif system == "Windows":
                import subprocess
                # Use os.startfile or direct execution without shell=True
                wt_path = shutil.which("wt")
                if wt_path:
                    # Windows Terminal: pass arguments as list
                    subprocess.Popen([wt_path, "cmd", "/k", ollama_path, "run", model_name])
                else:
                    # Fallback: use START command via cmd /c without shell=True
                    # We need to use the COMSPEC to launch a new window
                    comspec = os.environ.get("COMSPEC", "cmd.exe")
                    # Launch cmd in a new window using start
                    subprocess.Popen(
                        [comspec, "/c", "start", "cmd", "/k", ollama_path, "run", model_name]
                    )

            else:
                raise OllamaServiceError(
                    ErrorCode.OLLAMA_RUN_FAILED,
                    f"Unsupported operating system: {system}"
                )

            logger.info(f"Opened terminal to run model '{model_name}'")
            return True

        except OllamaServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to open terminal: {e}")
            raise OllamaServiceError(
                ErrorCode.OLLAMA_RUN_FAILED,
                f"Failed to open terminal: {str(e)}"
            )


# Singleton instance
ollama_service = OllamaService()
