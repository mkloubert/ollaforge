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

"""Data source models for JSONL generation from external sources."""

from enum import Enum

from pydantic import BaseModel, Field


class DataSourceType(str, Enum):
    """Type of data source."""

    FILE = "file"
    TEXT = "text"


class TargetLanguage(str, Enum):
    """Target language for generated output."""

    AUTO = "auto"
    EN = "en"
    DE = "de"
    ES = "es"
    FR = "fr"
    PT = "pt"
    UK = "uk"
    ZH = "zh"
    JA = "ja"
    KO = "ko"
    AR = "ar"
    HI = "hi"
    IT = "it"
    NL = "nl"
    PL = "pl"
    EL = "el"
    TR = "tr"
    HE = "he"


class DataSource(BaseModel):
    """A data source for JSONL generation."""

    id: str = Field(..., description="Unique identifier for the data source")
    type: DataSourceType = Field(..., description="Type of data source (file or text)")
    content: str = Field(..., description="The text content of the data source")
    filename: str | None = Field(None, description="Original filename (for file sources)")
    mime_type: str | None = Field(None, description="MIME type of the file (for file sources)")
    estimated_tokens: int = Field(..., description="Estimated number of tokens in the content")


class DataSourceList(BaseModel):
    """List of data sources."""

    sources: list[DataSource] = Field(default_factory=list, description="List of data sources")
    total_tokens: int = Field(0, description="Total estimated tokens across all sources")


class TextDataSourceRequest(BaseModel):
    """Request body for adding a text data source."""

    content: str = Field(..., min_length=1, description="The text content to add as a data source")


class DataSourceResponse(BaseModel):
    """Response after adding a data source."""

    id: str = Field(..., description="Unique identifier for the data source")
    type: DataSourceType = Field(..., description="Type of data source")
    filename: str | None = Field(None, description="Original filename (for file sources)")
    mime_type: str | None = Field(None, description="MIME type (for file sources)")
    estimated_tokens: int = Field(..., description="Estimated number of tokens")
    content_preview: str = Field(..., description="First 200 characters of the content")


class ChunkInfo(BaseModel):
    """Information about a content chunk for LLM processing."""

    index: int = Field(..., description="Index of the chunk (0-based)")
    content: str = Field(..., description="The chunk content")
    estimated_tokens: int = Field(..., description="Estimated tokens in this chunk")
    source_ids: list[str] = Field(..., description="IDs of sources included in this chunk")


class ChunkedDataResponse(BaseModel):
    """Response containing chunked data for LLM processing."""

    chunks: list[ChunkInfo] = Field(..., description="List of content chunks")
    total_chunks: int = Field(..., description="Total number of chunks")
    total_tokens: int = Field(..., description="Total estimated tokens across all chunks")


class TrainingDataRow(BaseModel):
    """A single row of training data."""

    instruction: str = Field(..., description="The instruction/question")
    output: str = Field(..., description="The expected output/answer")


class GenerateTrainingDataRequest(BaseModel):
    """Request to generate training data from sources."""

    provider: str = Field(..., description="The LLM provider to use (openai, anthropic, mistral)")
    model_id: str = Field(..., description="The model ID to use")
    sources: list[DataSource] = Field(..., description="List of data sources to process")
    target_language: TargetLanguage = Field(
        default=TargetLanguage.AUTO,
        description="Target language for generated output (auto = same as input)",
    )


class GenerateTrainingDataResponse(BaseModel):
    """Response containing generated training data."""

    items: list[TrainingDataRow] = Field(..., description="Generated training data items")
    chunks_processed: int = Field(..., description="Number of chunks processed")
    total_items: int = Field(..., description="Total number of items generated")
