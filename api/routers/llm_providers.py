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
from pathlib import Path

import httpx
from fastapi import APIRouter

from config import get_config
from error_codes import ErrorCode
from models.llm_provider import (
    LLMProviderLoginRequest,
    LLMProviderLoginResponse,
    LLMProvidersStatusResponse,
    LLMProviderStatus,
    LLMProviderType,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/llm-providers", tags=["llm-providers"])

# Timeout for API validation requests (in seconds)
VALIDATION_TIMEOUT = 10.0

# Provider configuration mapping
PROVIDER_CONFIG = {
    LLMProviderType.OPENAI: {
        "token_file": "openai_token",
        "env_var": "OPENAI_API_KEY",
        "api_url": "https://api.openai.com/v1/models",
    },
    LLMProviderType.ANTHROPIC: {
        "token_file": "anthropic_token",
        "env_var": "ANTHROPIC_API_KEY",
        "api_url": "https://api.anthropic.com/v1/models",
    },
    LLMProviderType.MISTRAL: {
        "token_file": "mistral_token",
        "env_var": "MISTRAL_API_KEY",
        "api_url": "https://api.mistral.ai/v1/models",
    },
}


def get_token_path(provider: LLMProviderType) -> Path:
    """Get the file path for storing the provider's token."""
    config = get_config()
    token_file = PROVIDER_CONFIG[provider]["token_file"]
    return config.ollaforge_dir / token_file


def get_env_var_name(provider: LLMProviderType) -> str:
    """Get the environment variable name for the provider."""
    return PROVIDER_CONFIG[provider]["env_var"]


def get_stored_token(provider: LLMProviderType) -> str | None:
    """
    Get the stored token for a provider.
    Priority: Environment variable > stored token file
    """
    # 1. Check environment variable first
    env_var = get_env_var_name(provider)
    env_token = os.environ.get(env_var)
    if env_token:
        return env_token.strip()

    # 2. Check stored token file
    token_path = get_token_path(provider)
    if token_path.exists():
        try:
            token = token_path.read_text().strip()
            if token:
                return token
        except Exception as e:
            logger.error(f"Error reading token file for {provider.value}: {e}")

    return None


def save_token(provider: LLMProviderType, token: str) -> bool:
    """Save the token to the provider's token file."""
    try:
        token_path = get_token_path(provider)

        # Ensure parent directory exists
        token_path.parent.mkdir(parents=True, exist_ok=True)

        # Write token with restricted permissions (owner read/write only)
        token_path.write_text(token)
        token_path.chmod(0o600)

        logger.info(f"Token saved for {provider.value} to {token_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving token for {provider.value}: {e}")
        return False


async def validate_openai_token(token: str) -> bool:
    """
    Validate an OpenAI API key by calling the models endpoint.
    This endpoint is free and does not consume any quota.
    """
    try:
        async with httpx.AsyncClient(timeout=VALIDATION_TIMEOUT) as client:
            response = await client.get(
                PROVIDER_CONFIG[LLMProviderType.OPENAI]["api_url"],
                headers={"Authorization": f"Bearer {token}"},
            )
            return response.status_code == 200
    except httpx.TimeoutException:
        logger.warning("OpenAI API validation timed out")
        return False
    except Exception as e:
        logger.error(f"Error validating OpenAI token: {e}")
        return False


async def validate_anthropic_token(token: str) -> bool:
    """
    Validate an Anthropic API key by calling the models endpoint.
    This endpoint is free and does not consume any quota.
    """
    try:
        async with httpx.AsyncClient(timeout=VALIDATION_TIMEOUT) as client:
            response = await client.get(
                PROVIDER_CONFIG[LLMProviderType.ANTHROPIC]["api_url"],
                headers={
                    "x-api-key": token,
                    "anthropic-version": "2023-06-01",
                },
            )
            return response.status_code == 200
    except httpx.TimeoutException:
        logger.warning("Anthropic API validation timed out")
        return False
    except Exception as e:
        logger.error(f"Error validating Anthropic token: {e}")
        return False


async def validate_mistral_token(token: str) -> bool:
    """
    Validate a Mistral API key by calling the models endpoint.
    This endpoint is free and does not consume any quota.
    """
    try:
        async with httpx.AsyncClient(timeout=VALIDATION_TIMEOUT) as client:
            response = await client.get(
                PROVIDER_CONFIG[LLMProviderType.MISTRAL]["api_url"],
                headers={"Authorization": f"Bearer {token}"},
            )
            return response.status_code == 200
    except httpx.TimeoutException:
        logger.warning("Mistral API validation timed out")
        return False
    except Exception as e:
        logger.error(f"Error validating Mistral token: {e}")
        return False


async def validate_token(provider: LLMProviderType, token: str) -> bool:
    """Validate a token for the specified provider."""
    validators = {
        LLMProviderType.OPENAI: validate_openai_token,
        LLMProviderType.ANTHROPIC: validate_anthropic_token,
        LLMProviderType.MISTRAL: validate_mistral_token,
    }

    validator = validators.get(provider)
    if not validator:
        logger.error(f"Unknown provider: {provider}")
        return False

    return await validator(token)


@router.get("/status", response_model=LLMProvidersStatusResponse)
async def get_llm_providers_status() -> LLMProvidersStatusResponse:
    """
    Get the status of all LLM providers.
    Returns whether each provider has a configured token and whether it's valid.
    """
    providers_status: list[LLMProviderStatus] = []

    for provider in LLMProviderType:
        token = get_stored_token(provider)
        configured = token is not None

        # Only validate if token is configured
        valid = False
        if configured:
            valid = await validate_token(provider, token)
            if valid:
                # Set environment variable if token is valid
                env_var = get_env_var_name(provider)
                os.environ[env_var] = token
                logger.debug(f"Set {env_var} environment variable")

        providers_status.append(
            LLMProviderStatus(
                provider=provider,
                valid=valid,
                configured=configured,
            )
        )

    return LLMProvidersStatusResponse(providers=providers_status)


@router.post("/login", response_model=LLMProviderLoginResponse)
async def login_llm_provider(request: LLMProviderLoginRequest) -> LLMProviderLoginResponse:
    """
    Save and validate a token for an LLM provider.
    The token is stored in ~/.ollaforge/<provider>_token and validated via the provider's API.
    """
    provider = request.provider
    token = request.token.strip()

    # Basic token validation (non-empty)
    if not token:
        logger.warning(f"Empty token provided for {provider.value}")
        return LLMProviderLoginResponse(
            success=False,
            provider=provider,
            error_code=ErrorCode.LLM_PROVIDER_INVALID_TOKEN.value,
        )

    try:
        # Validate token with provider API
        is_valid = await validate_token(provider, token)

        if not is_valid:
            logger.warning(f"Token validation failed for {provider.value}")
            return LLMProviderLoginResponse(
                success=False,
                provider=provider,
                error_code=ErrorCode.LLM_PROVIDER_AUTH_FAILED.value,
            )

        # Token is valid, save it
        if not save_token(provider, token):
            logger.error(f"Failed to save token for {provider.value}")
            return LLMProviderLoginResponse(
                success=False,
                provider=provider,
                error_code=ErrorCode.LLM_PROVIDER_SAVE_FAILED.value,
            )

        # Update environment variable
        env_var = get_env_var_name(provider)
        os.environ[env_var] = token
        logger.info(f"{env_var} environment variable updated")

        logger.info(f"Token saved successfully for {provider.value}")
        return LLMProviderLoginResponse(
            success=True,
            provider=provider,
            error_code=None,
        )

    except httpx.TimeoutException:
        logger.error(f"Timeout validating token for {provider.value}")
        return LLMProviderLoginResponse(
            success=False,
            provider=provider,
            error_code=ErrorCode.LLM_PROVIDER_API_UNREACHABLE.value,
        )
    except Exception as e:
        logger.error(f"Error during login for {provider.value}: {e}")
        return LLMProviderLoginResponse(
            success=False,
            provider=provider,
            error_code=ErrorCode.LLM_PROVIDER_AUTH_FAILED.value,
        )
