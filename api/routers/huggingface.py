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
import re

from fastapi import APIRouter

from config import get_config
from error_codes import ErrorCode
from models.huggingface import (
    HuggingFaceLoginRequest,
    HuggingFaceLoginResponse,
    HuggingFaceStatusResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/huggingface", tags=["huggingface"])

# Regex to remove ANSI escape codes from CLI output
ANSI_ESCAPE_PATTERN = re.compile(r'\x1b\[[0-9;]*m')


def strip_ansi_codes(text: str) -> str:
    """Remove ANSI escape codes from text."""
    return ANSI_ESCAPE_PATTERN.sub('', text)


def get_stored_token() -> str | None:
    """
    Get the stored Hugging Face token.
    Priority: HF_TOKEN env var > stored token file
    """
    # 1. Check environment variable first
    env_token = os.environ.get("HF_TOKEN")
    if env_token:
        return env_token.strip()

    # 2. Check stored token file
    config = get_config()
    token_file = config.hf_token_file
    if token_file.exists():
        try:
            token = token_file.read_text().strip()
            if token:
                return token
        except Exception as e:
            logger.error(f"Error reading token file: {e}")

    return None


def save_token(token: str) -> bool:
    """Save the Hugging Face token to the token file."""
    try:
        config = get_config()
        token_file = config.hf_token_file

        # Ensure parent directory exists
        token_file.parent.mkdir(parents=True, exist_ok=True)

        # Write token with restricted permissions (owner read/write only)
        token_file.write_text(token)
        token_file.chmod(0o600)

        logger.info(f"Token saved to {token_file}")
        return True
    except Exception as e:
        logger.error(f"Error saving token: {e}")
        return False


async def run_hf_cli(args: list[str], token: str | None = None) -> tuple[int, str, str]:
    """
    Run hf CLI with given arguments safely.
    Uses create_subprocess_exec with argument list (no shell injection possible).
    If token is provided, it's passed via HF_TOKEN environment variable.
    Returns tuple of (exit_code, stdout, stderr).
    ANSI escape codes are stripped from output.
    """
    # Prepare environment with HF_TOKEN if provided
    env = os.environ.copy()
    if token:
        env["HF_TOKEN"] = token

    process = await asyncio.create_subprocess_exec(
        "hf",
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    stdout, stderr = await process.communicate()
    return (
        process.returncode or 0,
        strip_ansi_codes(stdout.decode().strip()),
        strip_ansi_codes(stderr.decode().strip()),
    )


def extract_username(output: str) -> str | None:
    """Extract username from hf auth whoami output."""
    if not output or "Not logged in" in output:
        return None

    first_line = output.split("\n")[0].strip()
    if first_line.lower().startswith("user:"):
        return first_line.split(":", 1)[1].strip()
    return first_line


@router.get("/status", response_model=HuggingFaceStatusResponse)
async def get_huggingface_status() -> HuggingFaceStatusResponse:
    """
    Check if the user is logged in to Hugging Face.
    Uses the stored OllaForge token and passes it via HF_TOKEN to 'hf auth whoami'.
    """
    token = get_stored_token()

    if not token:
        logger.info("No Hugging Face token stored")
        return HuggingFaceStatusResponse(logged_in=False, username=None)

    try:
        exit_code, stdout, stderr = await run_hf_cli(["auth", "whoami"], token=token)

        if exit_code == 0:
            username = extract_username(stdout)
            if username:
                logger.info(f"Hugging Face user logged in: {username}")
                return HuggingFaceStatusResponse(logged_in=True, username=username)

        logger.info("Hugging Face token invalid or user not logged in")
        return HuggingFaceStatusResponse(logged_in=False, username=None)

    except FileNotFoundError:
        logger.warning("hf CLI not found, assuming not logged in")
        return HuggingFaceStatusResponse(logged_in=False, username=None)
    except Exception as e:
        logger.error(f"Error checking Hugging Face status: {e}")
        return HuggingFaceStatusResponse(logged_in=False, username=None)


@router.post("/login", response_model=HuggingFaceLoginResponse)
async def login_to_huggingface(request: HuggingFaceLoginRequest) -> HuggingFaceLoginResponse:
    """
    Save and validate a Hugging Face token.
    The token is stored in ~/.ollaforge/hf_token and validated via 'hf auth whoami'.
    """
    token = request.token.strip()

    # Basic token validation
    if not token.startswith("hf_"):
        logger.warning("Invalid token format: does not start with 'hf_'")
        return HuggingFaceLoginResponse(
            success=False,
            username=None,
            error_code=ErrorCode.HF_INVALID_TOKEN.value,
        )

    try:
        # Validate token by calling whoami with HF_TOKEN env var
        exit_code, stdout, stderr = await run_hf_cli(["auth", "whoami"], token=token)

        if exit_code != 0:
            logger.error(f"Hugging Face token validation failed: {stderr}")
            return HuggingFaceLoginResponse(
                success=False,
                username=None,
                error_code=ErrorCode.HF_INVALID_TOKEN.value,
            )

        username = extract_username(stdout)
        if not username:
            logger.error("Could not extract username from whoami response")
            return HuggingFaceLoginResponse(
                success=False,
                username=None,
                error_code=ErrorCode.HF_LOGIN_FAILED.value,
            )

        # Token is valid, save it
        if not save_token(token):
            logger.error("Failed to save token")
            return HuggingFaceLoginResponse(
                success=False,
                username=None,
                error_code=ErrorCode.HF_LOGIN_FAILED.value,
            )

        # Update HF_TOKEN environment variable so huggingface_hub/transformers can use it
        os.environ["HF_TOKEN"] = token
        logger.info(f"HF_TOKEN environment variable updated")

        logger.info(f"Hugging Face token saved for user: {username}")
        return HuggingFaceLoginResponse(
            success=True,
            username=username,
            error_code=None,
        )

    except FileNotFoundError:
        logger.error("hf CLI not found")
        return HuggingFaceLoginResponse(
            success=False,
            username=None,
            error_code=ErrorCode.HF_LOGIN_FAILED.value,
        )
    except Exception as e:
        logger.error(f"Error during Hugging Face login: {e}")
        return HuggingFaceLoginResponse(
            success=False,
            username=None,
            error_code=ErrorCode.HF_LOGIN_FAILED.value,
        )
