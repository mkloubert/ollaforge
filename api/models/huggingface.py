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

from pydantic import BaseModel, Field


class HuggingFaceStatusResponse(BaseModel):
    """Response for Hugging Face login status check."""

    logged_in: bool = Field(..., description="Whether the user is logged in to Hugging Face")
    username: str | None = Field(None, description="The Hugging Face username if logged in")


class HuggingFaceLoginRequest(BaseModel):
    """Request body for Hugging Face login."""

    token: str = Field(
        ...,
        min_length=1,
        description="The Hugging Face access token",
    )


class HuggingFaceLoginResponse(BaseModel):
    """Response for Hugging Face login attempt."""

    success: bool = Field(..., description="Whether the login was successful")
    username: str | None = Field(None, description="The Hugging Face username if login succeeded")
    error_code: str | None = Field(None, description="Error code if login failed")
