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

from enum import Enum

from pydantic import BaseModel, Field


class LLMProviderType(str, Enum):
    """Supported LLM provider types."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    MISTRAL = "mistral"


class LLMProviderStatus(BaseModel):
    """Status of a single LLM provider."""

    provider: LLMProviderType = Field(..., description="The LLM provider type")
    valid: bool = Field(..., description="Whether the token is valid and API is accessible")
    configured: bool = Field(..., description="Whether a token is configured for this provider")


class LLMProvidersStatusResponse(BaseModel):
    """Response containing status for all LLM providers."""

    providers: list[LLMProviderStatus] = Field(
        ..., description="List of status for each LLM provider"
    )


class LLMProviderLoginRequest(BaseModel):
    """Request body for LLM provider login."""

    provider: LLMProviderType = Field(..., description="The LLM provider to login to")
    token: str = Field(
        ...,
        min_length=1,
        description="The API key/token for the provider",
    )


class LLMProviderLoginResponse(BaseModel):
    """Response for LLM provider login attempt."""

    success: bool = Field(..., description="Whether the login was successful")
    provider: LLMProviderType = Field(..., description="The LLM provider that was logged into")
    error_code: str | None = Field(None, description="Error code if login failed")
