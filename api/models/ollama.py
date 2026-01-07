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


class OllamaModel(BaseModel):
    """A model available in Ollama."""

    name: str = Field(..., description="Model name")
    size: str | None = Field(default=None, description="Model size (e.g., '4.1 GB')")
    modified_at: str | None = Field(default=None, description="Last modified timestamp")


class OllamaModelsResponse(BaseModel):
    """Response containing list of Ollama models."""

    models: list[OllamaModel] = Field(default_factory=list, description="List of available models")


class OllamaCreateRequest(BaseModel):
    """Request to create a model in Ollama."""

    target_name: str | None = Field(
        default=None,
        description="Custom name for the model in Ollama. If not provided, uses project's target_name or default."
    )


class OllamaCreateResponse(BaseModel):
    """Response after creating a model in Ollama."""

    success: bool = Field(..., description="Whether the model was created successfully")
    model_name: str = Field(..., description="Name of the created model in Ollama")


class OllamaRunRequest(BaseModel):
    """Request to run a model in Ollama."""

    model_name: str = Field(..., description="Name of the model to run in Ollama")


class OllamaRunResponse(BaseModel):
    """Response after launching model in terminal."""

    success: bool = Field(..., description="Whether the terminal was opened successfully")
    model_name: str = Field(..., description="Name of the model being run")


class OllamaModelExistsResponse(BaseModel):
    """Response checking if a model exists in Ollama."""

    exists: bool = Field(..., description="Whether the model exists in Ollama")
    model_name: str = Field(..., description="Name of the model checked")
