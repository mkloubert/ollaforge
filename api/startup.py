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

from config import get_config


def ensure_directories() -> None:
    """
    Ensure all required directories exist on startup.
    Creates the OllaForge base directory and projects directory if they don't exist.
    """
    config = get_config()

    # Ensure base .ollaforge directory exists
    ollaforge_dir = config.ollaforge_dir
    ollaforge_dir.mkdir(parents=True, exist_ok=True)

    # Ensure projects directory exists
    projects_dir = config.projects_dir
    projects_dir.mkdir(parents=True, exist_ok=True)


def run_startup_tasks() -> None:
    """Run all startup tasks."""
    ensure_directories()
