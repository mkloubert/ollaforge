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


class ErrorCode(str, Enum):
    """Error codes for API responses."""

    # Project errors (1xxx)
    PROJECT_ALREADY_EXISTS = "ERR_PROJECT_1001"
    PROJECT_NOT_FOUND = "ERR_PROJECT_1002"
    PROJECT_INVALID_NAME = "ERR_PROJECT_1003"
    PROJECT_NAME_EMPTY = "ERR_PROJECT_1004"
    PROJECT_CREATION_FAILED = "ERR_PROJECT_1005"
    PROJECT_DELETION_FAILED = "ERR_PROJECT_1006"
    PROJECT_UPDATE_FAILED = "ERR_PROJECT_1007"
