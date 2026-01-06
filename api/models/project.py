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


class ProjectInfo(BaseModel):
    """Information about a project."""

    slug: str = Field(..., description="The project slug (directory name)")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )
    model: str | None = Field(
        None, description="The selected base model for training"
    )
    target_name: str | None = Field(
        None, description="The custom name for the final trained model"
    )
    path: str = Field(..., description="Full path to the project directory")


class CreateProjectRequest(BaseModel):
    """Request body for creating a new project."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="The display name for the new project",
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional description for the project",
    )


class CreateProjectResponse(BaseModel):
    """Response body after creating a project."""

    slug: str = Field(..., description="The generated project slug")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )


class UpdateProjectRequest(BaseModel):
    """Request body for updating a project."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="The display name for the project",
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Optional description for the project",
    )
    model: str | None = Field(
        None,
        max_length=200,
        description="The selected base model for training",
    )
    target_name: str | None = Field(
        None,
        max_length=200,
        description="The custom name for the final trained model",
    )


class UpdateProjectResponse(BaseModel):
    """Response body after updating a project."""

    slug: str = Field(..., description="The project slug")
    name: str = Field(..., description="The display name of the project")
    description: str | None = Field(
        None, description="Optional description of the project"
    )
    model: str | None = Field(
        None, description="The selected base model for training"
    )
    target_name: str | None = Field(
        None, description="The custom name for the final trained model"
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    error_code: str = Field(..., description="The error code")
