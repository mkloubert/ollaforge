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

import json
import os
import re
from pathlib import Path

import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile, status

from error_codes import ErrorCode
from models.data_file import (
    DataFileContentResponse,
    DataFileInfo,
    DataFileRow,
    SaveGeneratedDataRequest,
    SaveGeneratedDataResponse,
    UploadDataFileResponse,
    format_file_size,
)
from utils.project_utils import get_project_data_dir, validate_project_exists

router = APIRouter(prefix="/api/projects", tags=["data-files"])

ALLOWED_EXTENSIONS = {".jsonl"}
CHUNK_SIZE = 64 * 1024  # 64 KB chunks for streaming
MAX_PREVIEW_ROWS = 100  # Maximum rows to return for preview


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other issues.
    """
    # Remove path separators and null bytes
    filename = os.path.basename(filename)
    filename = filename.replace("\x00", "")

    # Remove or replace problematic characters
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # Ensure it's not empty
    if not filename or filename.startswith("."):
        filename = "data" + filename

    return filename


def generate_unique_filename(data_dir: Path, original_filename: str) -> str:
    """
    Generate a unique filename if a file with the same name already exists.
    Appends _1, _2, etc. before the extension.
    """
    sanitized = sanitize_filename(original_filename)
    target_path = data_dir / sanitized

    if not target_path.exists():
        return sanitized

    # Split name and extension
    name_part = target_path.stem
    extension = target_path.suffix

    counter = 1
    while True:
        new_filename = f"{name_part}_{counter}{extension}"
        new_path = data_dir / new_filename
        if not new_path.exists():
            return new_filename
        counter += 1


@router.get(
    "/{slug}/data",
    response_model=list[DataFileInfo],
    summary="List data files",
    description="Returns a list of all JSONL data files in the project's data directory.",
)
async def list_data_files(slug: str) -> list[DataFileInfo]:
    """Get all data files for a project."""
    validate_project_exists(slug)
    data_dir = get_project_data_dir(slug)

    if not data_dir.exists():
        return []

    files: list[DataFileInfo] = []

    try:
        for entry in data_dir.iterdir():
            if not entry.is_file():
                continue

            if entry.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue

            size = entry.stat().st_size
            files.append(
                DataFileInfo(
                    filename=entry.name,
                    size=size,
                    size_formatted=format_file_size(size),
                )
            )

        # Sort alphabetically by filename (case-insensitive)
        files.sort(key=lambda f: f.filename.lower())

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.DATA_FILE_READ_FAILED},
        )

    return files


@router.post(
    "/{slug}/data",
    response_model=UploadDataFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a data file",
    description="Upload a JSONL file to the project's data directory using streaming.",
)
async def upload_data_file(slug: str, file: UploadFile) -> UploadDataFileResponse:
    """Upload a data file to a project using streaming to save memory."""
    validate_project_exists(slug)

    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_FILE_INVALID_TYPE},
        )

    # Check extension
    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_FILE_INVALID_TYPE},
        )

    data_dir = get_project_data_dir(slug)

    try:
        # Create data directory if it doesn't exist
        data_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename (never overwrite)
        final_filename = generate_unique_filename(data_dir, file.filename)
        target_path = data_dir / final_filename

        # Stream the file to disk in chunks
        total_size = 0
        async with aiofiles.open(target_path, "wb") as out_file:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                await out_file.write(chunk)
                total_size += len(chunk)

        return UploadDataFileResponse(
            filename=final_filename,
            size=total_size,
            size_formatted=format_file_size(total_size),
        )

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.DATA_FILE_UPLOAD_FAILED},
        )


@router.delete(
    "/{slug}/data/{filename}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a data file",
    description="Delete a data file from the project's data directory.",
)
async def delete_data_file(slug: str, filename: str) -> None:
    """Delete a data file from a project."""
    validate_project_exists(slug)

    # Sanitize filename to prevent path traversal
    safe_filename = sanitize_filename(filename)
    data_dir = get_project_data_dir(slug)
    file_path = data_dir / safe_filename

    # Check if file exists
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.DATA_FILE_NOT_FOUND},
        )

    # Verify it's within the data directory (prevent path traversal)
    try:
        file_path.resolve().relative_to(data_dir.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.DATA_FILE_NOT_FOUND},
        )

    try:
        file_path.unlink()
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.DATA_FILE_DELETE_FAILED},
        )


@router.get(
    "/{slug}/data/{filename}",
    response_model=DataFileContentResponse,
    summary="Get data file content",
    description="Returns the content of a JSONL data file as parsed JSON rows.",
)
async def get_data_file_content(slug: str, filename: str) -> DataFileContentResponse:
    """Get the content of a data file."""
    validate_project_exists(slug)

    # Sanitize filename to prevent path traversal
    safe_filename = sanitize_filename(filename)
    data_dir = get_project_data_dir(slug)
    file_path = data_dir / safe_filename

    # Check if file exists
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.DATA_FILE_NOT_FOUND},
        )

    # Verify it's within the data directory (prevent path traversal)
    try:
        file_path.resolve().relative_to(data_dir.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": ErrorCode.DATA_FILE_NOT_FOUND},
        )

    def validate_row(parsed: dict) -> str | None:
        """
        Validate that a row has the required schema.
        Returns error code if invalid, None if valid.
        Expected schema: {"instruction": string, "output": string}
        """
        # Check required fields
        if "instruction" not in parsed:
            return "MISSING_INSTRUCTION"
        if "output" not in parsed:
            return "MISSING_OUTPUT"

        # Check field types
        if not isinstance(parsed["instruction"], str):
            return "INVALID_INSTRUCTION_TYPE"
        if not isinstance(parsed["output"], str):
            return "INVALID_OUTPUT_TYPE"

        return None

    try:
        rows: list[DataFileRow] = []
        total_rows = 0
        truncated = False
        line_number = 0

        async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
            async for line in f:
                line_number += 1
                raw_line = line.rstrip("\n\r")

                if not raw_line.strip():
                    continue

                total_rows += 1

                if len(rows) < MAX_PREVIEW_ROWS:
                    is_valid = False
                    data = None
                    error = None

                    try:
                        parsed = json.loads(raw_line)
                        if isinstance(parsed, dict):
                            error = validate_row(parsed)
                            if error is None:
                                is_valid = True
                                data = parsed
                            else:
                                data = parsed
                        else:
                            error = "NOT_OBJECT"
                    except json.JSONDecodeError:
                        error = "INVALID_JSON"

                    rows.append(
                        DataFileRow(
                            line_number=line_number,
                            is_valid=is_valid,
                            error=error,
                            data=data,
                            raw=raw_line,
                            raw_length=len(raw_line),
                        )
                    )
                else:
                    truncated = True

        return DataFileContentResponse(
            filename=safe_filename,
            rows=rows,
            total_rows=total_rows,
            truncated=truncated,
        )

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.DATA_FILE_READ_FAILED},
        )


def validate_generated_filename(filename: str) -> str | None:
    """
    Validate and sanitize filename for generated data.
    Only allows alphanumeric characters, hyphens, and underscores.

    Returns sanitized filename or None if invalid.
    """
    if not filename:
        return None

    # Remove any extension if provided
    if filename.endswith(".jsonl"):
        filename = filename[:-6]

    # Only allow alphanumeric, hyphen, underscore
    if not re.match(r"^[a-zA-Z0-9_-]+$", filename):
        return None

    return filename


def generate_unique_jsonl_filename(data_dir: Path, base_filename: str) -> str:
    """
    Generate a unique JSONL filename.
    If file exists, appends -1, -2, etc. until unique.
    """
    filename = f"{base_filename}.jsonl"
    target_path = data_dir / filename

    if not target_path.exists():
        return filename

    counter = 1
    while True:
        filename = f"{base_filename}-{counter}.jsonl"
        target_path = data_dir / filename
        if not target_path.exists():
            return filename
        counter += 1


@router.post(
    "/{slug}/data/save-generated",
    response_model=SaveGeneratedDataResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save generated training data",
    description="Save generated training data as a JSONL file in the project's data directory.",
)
async def save_generated_data(
    slug: str, request: SaveGeneratedDataRequest
) -> SaveGeneratedDataResponse:
    """Save generated training data as JSONL file."""
    validate_project_exists(slug)

    # Validate filename
    safe_filename = validate_generated_filename(request.filename)
    if not safe_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.SAVE_INVALID_FILENAME.value},
        )

    data_dir = get_project_data_dir(slug)

    try:
        # Create data directory if it doesn't exist
        data_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        final_filename = generate_unique_jsonl_filename(data_dir, safe_filename)
        target_path = data_dir / final_filename

        # Write JSONL file
        async with aiofiles.open(target_path, "w", encoding="utf-8") as f:
            for row in request.rows:
                json_line = json.dumps(
                    {"instruction": row.instruction, "output": row.output},
                    ensure_ascii=False,
                )
                await f.write(json_line + "\n")

        return SaveGeneratedDataResponse(
            filename=final_filename,
            rows_saved=len(request.rows),
        )

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.SAVE_FAILED.value},
        )
