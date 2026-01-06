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


class DataFileInfo(BaseModel):
    """Information about a data file in a project."""

    filename: str = Field(..., description="The name of the file")
    size: int = Field(..., description="File size in bytes")
    size_formatted: str = Field(..., description="Human-readable file size (e.g. '1.5 MB')")


class UploadDataFileResponse(BaseModel):
    """Response after uploading a data file."""

    filename: str = Field(..., description="The final filename (may differ from original if renamed)")
    size: int = Field(..., description="File size in bytes")
    size_formatted: str = Field(..., description="Human-readable file size")


class DataFileRow(BaseModel):
    """A single row from a JSONL file."""

    line_number: int = Field(..., description="The line number in the file (1-based)")
    is_valid: bool = Field(..., description="Whether the row has valid JSON and schema")
    error: str | None = Field(None, description="Validation error code if invalid")
    data: dict | None = Field(None, description="The parsed JSON data (if valid)")
    raw: str = Field(..., description="The raw line content")
    raw_length: int = Field(..., description="Length of the raw content in characters")


class DataFileContentResponse(BaseModel):
    """Response containing the content of a data file."""

    filename: str = Field(..., description="The name of the file")
    rows: list[DataFileRow] = Field(..., description="The rows from the JSONL file")
    total_rows: int = Field(..., description="Total number of rows in the file")
    truncated: bool = Field(..., description="Whether the result was truncated")


def format_file_size(size_bytes: int) -> str:
    """
    Format file size to human-readable string.

    Examples:
        100 -> "100 B"
        1024 -> "1 KB"
        1536 -> "1.5 KB"
        1048576 -> "1 MB"
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"

    for unit in ["KB", "MB", "GB", "TB"]:
        size_bytes /= 1024.0
        if size_bytes < 1024:
            if size_bytes == int(size_bytes):
                return f"{int(size_bytes)} {unit}"
            return f"{size_bytes:.1f} {unit}"

    return f"{size_bytes:.1f} PB"
