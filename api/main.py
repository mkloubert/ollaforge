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

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import init_config, get_config
from routers.health import router as health_router
from routers.projects import router as projects_router
from startup import run_startup_tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown tasks."""
    # Startup
    run_startup_tasks()
    config = get_config()
    print(f"OllaForge directory: {config.ollaforge_dir}")
    print(f"Projects directory: {config.projects_dir}")
    yield
    # Shutdown (nothing to do currently)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="OllaForge API",
        description="API for OllaForge - Training LLMs with your own data",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Configure CORS
    # Support both localhost and 127.0.0.1 to avoid CORS issues
    cors_origins_env = os.environ.get("OLLAFORGE_CORS_ORIGINS", "")
    if cors_origins_env:
        allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        # Default origins for development
        allowed_origins = [
            "http://localhost:5979",
            "http://127.0.0.1:5979",
        ]

    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health_router)
    application.include_router(projects_router)

    return application


# Initialize config with empty args for module import (uvicorn direct import)
# Will be overridden when run.py is used with CLI args
import argparse
init_config(argparse.Namespace(projects=None, host="0.0.0.0", port=23979))

app = create_app()
