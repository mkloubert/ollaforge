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

"""Common utility functions for project operations."""

import json
import re
import unicodedata
from pathlib import Path

from fastapi import HTTPException, status

from config import get_config
from error_codes import ErrorCode


def slugify(text: str) -> str:
    """
    Convert text to a URL-friendly slug.

    - Normalize unicode characters to ASCII
    - Convert to lowercase
    - Replace spaces and special characters with hyphens
    - Remove consecutive hyphens
    """
    # Normalize unicode characters (e.g., ä -> a, ü -> u)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")

    # Convert to lowercase
    text = text.lower()

    # Replace any non-alphanumeric character with hyphen
    text = re.sub(r"[^a-z0-9]+", "-", text)

    # Remove leading/trailing hyphens and collapse multiple hyphens
    text = re.sub(r"-+", "-", text).strip("-")

    return text


def read_project_json(project_dir: Path) -> dict | None:
    """
    Read and validate project.json from a project directory.

    Returns None if the file doesn't exist or is invalid.
    """
    project_file = project_dir / "project.json"

    if not project_file.exists():
        return None

    try:
        with open(project_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Validate required fields
        if not isinstance(data, dict) or "name" not in data:
            return None

        if not isinstance(data["name"], str) or not data["name"].strip():
            return None

        return data
    except (json.JSONDecodeError, IOError):
        return None


def validate_project_exists(slug: str) -> Path:
    """
    Validate that the project exists and return its path.

    Raises HTTPException if project not found.
    """
    config = get_config()
    project_dir = config.projects_dir / slug
    project_file = project_dir / "project.json"

    if not project_dir.exists() or not project_dir.is_dir() or not project_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.PROJECT_NOT_FOUND},
        )

    return project_dir


def get_project_data_dir(slug: str) -> Path:
    """Get the data directory for a project."""
    config = get_config()
    return config.projects_dir / slug / "data"
