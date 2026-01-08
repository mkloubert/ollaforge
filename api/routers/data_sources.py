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

"""Router for data source operations for JSONL generation."""

import logging
import mimetypes
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, status

from constants.llm_models import get_model_by_id
from error_codes import ErrorCode
from models.data_source import (
    ChunkedDataResponse,
    ChunkInfo,
    DataSource,
    DataSourceResponse,
    DataSourceType,
    GenerateTrainingDataRequest,
    GenerateTrainingDataResponse,
    TextDataSourceRequest,
    TrainingDataRow,
)
from models.llm_provider import LLMProviderType
from services.llm_generation_service import get_generator
from utils.project_utils import validate_project_exists

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["data-sources"])

# Allowed file extensions for data sources
ALLOWED_EXTENSIONS = {".txt", ".md", ".html", ".json", ".csv", ".xml"}

# Maximum file size (10 MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Chunk size for reading files
CHUNK_SIZE = 64 * 1024  # 64 KB

# Reserved tokens for output and system prompt
RESERVED_OUTPUT_TOKENS = 8000
RESERVED_SYSTEM_TOKENS = 500

# Try to import tiktoken for accurate token counting
try:
    import tiktoken

    _tiktoken_available = True
    logger.info("tiktoken available for accurate token counting")
except ImportError:
    _tiktoken_available = False
    logger.warning("tiktoken not available, using fallback token estimation")


def estimate_tokens(text: str, model: str = "gpt-4o") -> int:
    """
    Estimate the number of tokens in a text.

    Uses tiktoken for accurate counting if available,
    otherwise falls back to a character-based estimate.

    Args:
        text: The text to count tokens for.
        model: The model to use for token counting (default: gpt-4o).

    Returns:
        Estimated number of tokens.
    """
    if not text:
        return 0

    if _tiktoken_available:
        try:
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        except Exception as e:
            logger.warning(f"tiktoken encoding failed: {e}, using fallback")

    # Fallback: approximately 4 characters per token
    return max(1, len(text) // 4)


def generate_source_id() -> str:
    """Generate a unique ID for a data source."""
    return str(uuid.uuid4())


def get_content_preview(content: str, max_length: int = 200) -> str:
    """Get a preview of the content, truncated if necessary."""
    if len(content) <= max_length:
        return content
    return content[:max_length] + "..."


def split_into_chunks(
    sources: list[DataSource],
    max_tokens: int,
) -> list[ChunkInfo]:
    """
    Split data sources into chunks that fit within the token limit.

    Args:
        sources: List of data sources to split.
        max_tokens: Maximum tokens per chunk (context_window - reserved tokens).

    Returns:
        List of ChunkInfo objects containing chunked content.
    """
    if not sources:
        return []

    # Calculate effective max tokens (leave room for output and system prompt)
    effective_max = max_tokens - RESERVED_OUTPUT_TOKENS - RESERVED_SYSTEM_TOKENS

    if effective_max <= 0:
        logger.warning(f"max_tokens ({max_tokens}) too small after reservations")
        effective_max = max_tokens // 2  # Use half as fallback

    chunks: list[ChunkInfo] = []
    current_content = ""
    current_tokens = 0
    current_source_ids: list[str] = []

    for source in sources:
        source_tokens = source.estimated_tokens

        # If a single source is larger than the limit, we need to split it
        if source_tokens > effective_max:
            # First, flush current chunk if it has content
            if current_content:
                chunks.append(
                    ChunkInfo(
                        index=len(chunks),
                        content=current_content.strip(),
                        estimated_tokens=current_tokens,
                        source_ids=current_source_ids.copy(),
                    )
                )
                current_content = ""
                current_tokens = 0
                current_source_ids = []

            # Split the large source into multiple chunks
            content = source.content
            content_len = len(content)
            # Estimate chars per chunk based on token ratio
            chars_per_token = content_len / source_tokens if source_tokens > 0 else 4
            chars_per_chunk = int(effective_max * chars_per_token * 0.9)  # 90% safety margin

            pos = 0
            while pos < content_len:
                chunk_text = content[pos : pos + chars_per_chunk]
                chunk_tokens = estimate_tokens(chunk_text)

                chunks.append(
                    ChunkInfo(
                        index=len(chunks),
                        content=chunk_text.strip(),
                        estimated_tokens=chunk_tokens,
                        source_ids=[source.id],
                    )
                )
                pos += chars_per_chunk

        # If adding this source would exceed the limit, start a new chunk
        elif current_tokens + source_tokens > effective_max:
            if current_content:
                chunks.append(
                    ChunkInfo(
                        index=len(chunks),
                        content=current_content.strip(),
                        estimated_tokens=current_tokens,
                        source_ids=current_source_ids.copy(),
                    )
                )

            current_content = source.content + "\n\n"
            current_tokens = source_tokens
            current_source_ids = [source.id]

        else:
            # Add to current chunk
            current_content += source.content + "\n\n"
            current_tokens += source_tokens
            current_source_ids.append(source.id)

    # Don't forget the last chunk
    if current_content:
        chunks.append(
            ChunkInfo(
                index=len(chunks),
                content=current_content.strip(),
                estimated_tokens=current_tokens,
                source_ids=current_source_ids.copy(),
            )
        )

    return chunks


@router.post(
    "/{slug}/data-sources/upload",
    response_model=DataSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file as data source",
    description="Upload a text file to use as a data source for JSONL generation.",
)
async def upload_data_source(slug: str, file: UploadFile) -> DataSourceResponse:
    """Upload a file as a data source for JSONL generation."""
    validate_project_exists(slug)

    # Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_SOURCE_INVALID_TYPE.value},
        )

    # Check extension
    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_SOURCE_INVALID_TYPE.value},
        )

    # Read file content
    try:
        content_bytes = b""
        total_size = 0

        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            total_size += len(chunk)

            # Check file size limit
            if total_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error_code": ErrorCode.DATA_SOURCE_TOO_LARGE.value},
                )

            content_bytes += chunk

        # Decode content as UTF-8
        try:
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            # Try with latin-1 as fallback
            try:
                content = content_bytes.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error_code": ErrorCode.DATA_SOURCE_INVALID_TYPE.value},
                )

        # Check for empty content
        if not content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error_code": ErrorCode.DATA_SOURCE_EMPTY.value},
            )

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(file.filename)

        # Generate ID and estimate tokens
        source_id = generate_source_id()
        estimated_tokens = estimate_tokens(content)

        return DataSourceResponse(
            id=source_id,
            type=DataSourceType.FILE,
            filename=file.filename,
            mime_type=mime_type,
            estimated_tokens=estimated_tokens,
            content_preview=get_content_preview(content),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": ErrorCode.DATA_SOURCE_INVALID_TYPE.value},
        )


@router.post(
    "/{slug}/data-sources/text",
    response_model=DataSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add text as data source",
    description="Add raw text as a data source for JSONL generation.",
)
async def add_text_data_source(
    slug: str, request: TextDataSourceRequest
) -> DataSourceResponse:
    """Add raw text as a data source for JSONL generation."""
    validate_project_exists(slug)

    content = request.content.strip()

    # Check for empty content
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_SOURCE_EMPTY.value},
        )

    # Check size limit
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.DATA_SOURCE_TOO_LARGE.value},
        )

    # Generate ID and estimate tokens
    source_id = generate_source_id()
    estimated_tokens = estimate_tokens(content)

    return DataSourceResponse(
        id=source_id,
        type=DataSourceType.TEXT,
        filename=None,
        mime_type="text/plain",
        estimated_tokens=estimated_tokens,
        content_preview=get_content_preview(content),
    )


@router.post(
    "/{slug}/data-sources/chunk",
    response_model=ChunkedDataResponse,
    summary="Chunk data sources",
    description="Split data sources into chunks that fit within the model's context window.",
)
async def chunk_data_sources(
    slug: str,
    sources: list[DataSource],
    max_tokens: int = 128000,  # Default to GPT-4o context window
) -> ChunkedDataResponse:
    """Split data sources into chunks for LLM processing."""
    validate_project_exists(slug)

    if not sources:
        return ChunkedDataResponse(
            chunks=[],
            total_chunks=0,
            total_tokens=0,
        )

    chunks = split_into_chunks(sources, max_tokens)
    total_tokens = sum(chunk.estimated_tokens for chunk in chunks)

    return ChunkedDataResponse(
        chunks=chunks,
        total_chunks=len(chunks),
        total_tokens=total_tokens,
    )


@router.post(
    "/{slug}/generate-training-data",
    response_model=GenerateTrainingDataResponse,
    summary="Generate training data from sources",
    description="Use an LLM to generate training data (instruction/output pairs) from data sources.",
)
async def generate_training_data(
    slug: str, request: GenerateTrainingDataRequest
) -> GenerateTrainingDataResponse:
    """Generate training data from sources using an LLM."""
    validate_project_exists(slug)

    # Validate provider
    try:
        provider_type = LLMProviderType(request.provider)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.GENERATION_PROVIDER_NOT_CONFIGURED.value},
        )

    # Validate model
    model = get_model_by_id(provider_type, request.model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.GENERATION_MODEL_NOT_AVAILABLE.value},
        )

    # Check for empty sources
    if not request.sources:
        return GenerateTrainingDataResponse(
            items=[],
            chunks_processed=0,
            total_items=0,
        )

    # Get the generator for the provider
    try:
        generator = get_generator(provider_type)
    except ValueError as e:
        logger.error(f"Failed to get generator: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": ErrorCode.GENERATION_PROVIDER_NOT_CONFIGURED.value},
        )

    # Split sources into chunks based on model context window
    chunks = split_into_chunks(request.sources, model.context_window)

    if not chunks:
        return GenerateTrainingDataResponse(
            items=[],
            chunks_processed=0,
            total_items=0,
        )

    # Process chunks sequentially
    all_items: list[TrainingDataRow] = []
    chunks_processed = 0

    for chunk in chunks:
        try:
            items = await generator.generate(
                chunk.content, request.model_id, request.target_language.value
            )
            for item in items:
                all_items.append(
                    TrainingDataRow(
                        instruction=item.instruction,
                        output=item.output,
                    )
                )
            chunks_processed += 1
        except RuntimeError as e:
            logger.error(f"Generator runtime error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error_code": ErrorCode.GENERATION_LLM_API_ERROR.value},
            )
        except Exception as e:
            error_str = str(e).lower()
            if "rate" in error_str and "limit" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={"error_code": ErrorCode.GENERATION_RATE_LIMIT.value},
                )
            logger.error(f"Generation failed for chunk {chunk.index}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error_code": ErrorCode.GENERATION_LLM_API_ERROR.value},
            )

    return GenerateTrainingDataResponse(
        items=all_items,
        chunks_processed=chunks_processed,
        total_items=len(all_items),
    )
