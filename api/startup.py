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

import logging
import os

from config import get_config

logger = logging.getLogger(__name__)


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


def setup_hf_token() -> None:
    """
    Set up the HF_TOKEN environment variable from stored token on startup.
    Only sets if HF_TOKEN is not already set or is empty.
    This enables huggingface_hub/transformers to access private/gated models.
    """
    current_token = os.environ.get("HF_TOKEN", "").strip()
    if current_token:
        logger.info("HF_TOKEN already set in environment")
        return

    # Try to load from stored token file
    try:
        config = get_config()
        token_file = config.hf_token_file
        if token_file.exists():
            token = token_file.read_text().strip()
            if token:
                os.environ["HF_TOKEN"] = token
                logger.info("HF_TOKEN set from stored token file")
                return
    except Exception as e:
        logger.warning(f"Error reading HF token file: {e}")

    logger.info("No Hugging Face token configured")


def run_startup_tasks() -> None:
    """Run all startup tasks."""
    ensure_directories()
    setup_hf_token()
