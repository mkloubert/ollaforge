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

import argparse
import os
from pathlib import Path


def get_default_ollaforge_dir() -> Path:
    """Get the default OllaForge base directory."""
    return Path.home() / ".ollaforge"


def get_default_projects_dir() -> Path:
    """Get the default projects directory."""
    return get_default_ollaforge_dir() / "projects"


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="OllaForge API - Training LLMs with your own data"
    )
    parser.add_argument(
        "--projects",
        type=str,
        default=None,
        help="Path to the projects root directory (overrides OLLAFORGE_PROJECTS env var)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind the server to (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=23979,
        help="Port to bind the server to (default: 23979)",
    )
    return parser.parse_args()


class Config:
    """Application configuration."""

    def __init__(self, args: argparse.Namespace | None = None):
        self._args = args or parse_args()
        self._projects_dir: Path | None = None

    @property
    def ollaforge_dir(self) -> Path:
        """Get the OllaForge base directory."""
        return get_default_ollaforge_dir()

    @property
    def projects_dir(self) -> Path:
        """
        Get the projects directory.
        Priority: CLI flag > environment variable > default
        """
        if self._projects_dir is not None:
            return self._projects_dir

        # 1. CLI flag has highest priority
        if self._args.projects:
            self._projects_dir = Path(self._args.projects)
            return self._projects_dir

        # 2. Environment variable
        env_projects = os.environ.get("OLLAFORGE_PROJECTS")
        if env_projects:
            self._projects_dir = Path(env_projects)
            return self._projects_dir

        # 3. Default
        self._projects_dir = get_default_projects_dir()
        return self._projects_dir

    @property
    def hf_token_file(self) -> Path:
        """Get the path to the Hugging Face token file."""
        return self.ollaforge_dir / "hf_token"

    @property
    def host(self) -> str:
        """Get the host to bind the server to."""
        return self._args.host

    @property
    def port(self) -> int:
        """Get the port to bind the server to."""
        return self._args.port


# Global config instance (initialized in main.py)
config: Config | None = None


def init_config(args: argparse.Namespace | None = None) -> Config:
    """Initialize the global configuration."""
    global config
    config = Config(args)
    return config


def get_config() -> Config:
    """Get the global configuration instance."""
    if config is None:
        raise RuntimeError("Configuration not initialized. Call init_config() first.")
    return config
