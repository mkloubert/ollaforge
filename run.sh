#!/bin/sh
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

set -e

# =============================================================================
# Configuration
# =============================================================================

REQUIRED_PYTHON_MAJOR=3
REQUIRED_PYTHON_MINOR=13
REQUIRED_NODE_MAJOR=20
FALLBACK_NODE_VERSION="20.18.1"
NODE_RELEASE_INDEX_URL="https://nodejs.org/download/release/index.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"
NODE_DIR="$SCRIPT_DIR/.node"
NODE_VERSION=""

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    printf "[INFO] %s\n" "$1"
}

log_error() {
    printf "[ERROR] %s\n" "$1" >&2
}

log_success() {
    printf "[SUCCESS] %s\n" "$1"
}

log_warn() {
    printf "[WARN] %s\n" "$1"
}

ask_yes_no() {
    prompt="$1"
    default="$2"

    if [ "$default" = "y" ]; then
        prompt_suffix="[Y/n]"
    else
        prompt_suffix="[y/N]"
    fi

    printf "%s %s " "$prompt" "$prompt_suffix"
    read -r answer

    case "$answer" in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        [Nn]|[Nn][Oo])
            return 1
            ;;
        "")
            if [ "$default" = "y" ]; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            return 1
            ;;
    esac
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# Node.js LTS Version Detection
# =============================================================================

fetch_latest_lts_version() {
    log_info "Fetching latest Node.js LTS version from API..."

    local json_content=""

    # Try to fetch the JSON using curl or wget
    if command_exists curl; then
        json_content=$(curl -fsSL --connect-timeout 10 "$NODE_RELEASE_INDEX_URL" 2>/dev/null)
    elif command_exists wget; then
        json_content=$(wget -qO- --timeout=10 "$NODE_RELEASE_INDEX_URL" 2>/dev/null)
    else
        log_warn "Neither curl nor wget available for fetching Node.js version info."
        return 1
    fi

    if [ -z "$json_content" ]; then
        log_warn "Failed to fetch Node.js release index."
        return 1
    fi

    # Parse JSON to find the first entry where "lts" is not false
    # The JSON format is: [{"version":"v25.2.1","lts":false,...},{"version":"v24.12.0","lts":"Krypton",...},...]
    # We need to find the first entry where lts is a string (not false)
    #
    # Strategy:
    # 1. Split JSON objects into separate lines using sed
    # 2. Find the first line where lts has a string value (starts with uppercase letter)
    # 3. Extract the version number from that line

    local lts_version=""
    lts_version=$(echo "$json_content" | sed 's/},{/}\n{/g' | grep '"lts":"[A-Z]' | head -1 | sed 's/.*"version":"v\([^"]*\)".*/\1/')

    if [ -n "$lts_version" ]; then
        log_success "Found latest Node.js LTS version: $lts_version"
        NODE_VERSION="$lts_version"
        return 0
    else
        log_warn "Could not parse LTS version from API response."
        return 1
    fi
}

determine_node_version() {
    # Try to fetch the latest LTS version from the API
    if fetch_latest_lts_version; then
        return 0
    fi

    # Fallback to hardcoded version
    log_warn "Using fallback Node.js version: $FALLBACK_NODE_VERSION"
    NODE_VERSION="$FALLBACK_NODE_VERSION"
}

# =============================================================================
# OS Detection
# =============================================================================

detect_os() {
    log_info "Detecting operating system..."
    OS_TYPE=""
    case "$(uname -s)" in
        Linux*)
            OS_TYPE="linux"
            ;;
        Darwin*)
            OS_TYPE="darwin"
            ;;
        FreeBSD*)
            OS_TYPE="freebsd"
            ;;
        NetBSD*)
            OS_TYPE="netbsd"
            ;;
        OpenBSD*)
            OS_TYPE="openbsd"
            ;;
        DragonFly*)
            OS_TYPE="dragonfly"
            ;;
        *)
            log_error "Unsupported operating system: $(uname -s)"
            exit 1
            ;;
    esac
    log_info "Detected OS: $OS_TYPE"
}

# =============================================================================
# Architecture Detection
# =============================================================================

detect_arch() {
    ARCH_TYPE=""
    case "$(uname -m)" in
        x86_64|amd64)
            ARCH_TYPE="x64"
            ;;
        aarch64|arm64)
            ARCH_TYPE="arm64"
            ;;
        armv7l)
            ARCH_TYPE="armv7l"
            ;;
        *)
            log_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac
    log_info "Detected architecture: $ARCH_TYPE"
}

# =============================================================================
# Node.js Check and Installation
# =============================================================================

get_node_cmd() {
    # First check local .node directory
    if [ -d "$NODE_DIR" ] && [ -x "$NODE_DIR/bin/node" ]; then
        echo "$NODE_DIR/bin/node"
        return 0
    fi

    # Then check global node
    for cmd in node nodejs; do
        if command_exists "$cmd"; then
            echo "$cmd"
            return 0
        fi
    done

    echo ""
}

check_node_version() {
    local node_cmd="$1"

    if [ -z "$node_cmd" ]; then
        return 1
    fi

    # Get version number
    version_output=$($node_cmd --version 2>&1)
    version_number=$(echo "$version_output" | sed 's/v//')
    major=$(echo "$version_number" | cut -d. -f1)

    log_info "Found Node.js v$version_number ($node_cmd)"

    if [ "$major" -ge "$REQUIRED_NODE_MAJOR" ]; then
        return 0
    else
        log_warn "Node.js $REQUIRED_NODE_MAJOR+ is required."
        log_warn "Found: Node.js v$version_number"
        return 1
    fi
}

get_node_download_url() {
    local base_url="https://nodejs.org/dist/v${NODE_VERSION}"

    case "$OS_TYPE" in
        linux)
            echo "${base_url}/node-v${NODE_VERSION}-linux-${ARCH_TYPE}.tar.xz"
            ;;
        darwin)
            echo "${base_url}/node-v${NODE_VERSION}-darwin-${ARCH_TYPE}.tar.gz"
            ;;
        freebsd)
            echo "${base_url}/node-v${NODE_VERSION}-linux-${ARCH_TYPE}.tar.xz"
            ;;
        *)
            log_error "No Node.js download available for OS: $OS_TYPE"
            exit 1
            ;;
    esac
}

download_node() {
    log_info "Downloading Node.js v${NODE_VERSION}..."

    local download_url
    download_url=$(get_node_download_url)

    local temp_dir
    temp_dir=$(mktemp -d)

    local archive_name
    archive_name=$(basename "$download_url")

    log_info "Download URL: $download_url"

    # Download the archive
    if command_exists curl; then
        curl -fsSL "$download_url" -o "$temp_dir/$archive_name"
    elif command_exists wget; then
        wget -q "$download_url" -O "$temp_dir/$archive_name"
    else
        log_error "Neither curl nor wget is available. Please install one of them."
        rm -rf "$temp_dir"
        exit 1
    fi

    # Create .node directory
    mkdir -p "$NODE_DIR"

    # Extract based on archive type
    log_info "Extracting Node.js to $NODE_DIR..."
    case "$archive_name" in
        *.tar.xz)
            tar -xJf "$temp_dir/$archive_name" -C "$NODE_DIR" --strip-components=1
            ;;
        *.tar.gz)
            tar -xzf "$temp_dir/$archive_name" -C "$NODE_DIR" --strip-components=1
            ;;
        *)
            log_error "Unknown archive format: $archive_name"
            rm -rf "$temp_dir"
            exit 1
            ;;
    esac

    # Cleanup
    rm -rf "$temp_dir"

    log_success "Node.js v${NODE_VERSION} installed to $NODE_DIR"
}

ensure_node() {
    log_info "Checking Node.js installation..."

    local node_cmd
    node_cmd=$(get_node_cmd)

    if [ -n "$node_cmd" ] && check_node_version "$node_cmd"; then
        log_success "Node.js version check passed."
        return 0
    fi

    # Node not found or version too old
    log_warn "Node.js $REQUIRED_NODE_MAJOR+ is required but not found or version too old."
    echo ""

    # Determine the Node.js version to install (fetch from API or use fallback)
    determine_node_version

    if ! ask_yes_no "Would you like to download and install Node.js v${NODE_VERSION} to .node directory?" "y"; then
        log_error "Node.js installation declined. Cannot continue without Node.js."
        exit 1
    fi

    detect_arch
    download_node

    # Verify installation
    node_cmd="$NODE_DIR/bin/node"
    if ! check_node_version "$node_cmd"; then
        log_error "Node.js installation failed."
        exit 1
    fi
}

# =============================================================================
# Linux Distribution Detection
# =============================================================================

detect_linux_distro() {
    LINUX_DISTRO=""
    LINUX_DISTRO_ID=""

    if [ -f /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        LINUX_DISTRO_ID="${ID:-}"
        LINUX_DISTRO="${ID_LIKE:-$LINUX_DISTRO_ID}"
    elif [ -f /etc/debian_version ]; then
        LINUX_DISTRO_ID="debian"
        LINUX_DISTRO="debian"
    elif [ -f /etc/fedora-release ]; then
        LINUX_DISTRO_ID="fedora"
        LINUX_DISTRO="fedora"
    elif [ -f /etc/redhat-release ]; then
        LINUX_DISTRO_ID="rhel"
        LINUX_DISTRO="rhel fedora"
    elif [ -f /etc/arch-release ]; then
        LINUX_DISTRO_ID="arch"
        LINUX_DISTRO="arch"
    elif [ -f /etc/alpine-release ]; then
        LINUX_DISTRO_ID="alpine"
        LINUX_DISTRO="alpine"
    elif [ -f /etc/gentoo-release ]; then
        LINUX_DISTRO_ID="gentoo"
        LINUX_DISTRO="gentoo"
    fi

    log_info "Detected Linux distribution: ${LINUX_DISTRO_ID:-unknown}"
}

# =============================================================================
# Package Manager Detection
# =============================================================================

detect_package_manager() {
    log_info "Detecting package manager..."
    PKG_MGR=""
    PYTHON_PKG=""

    case "$OS_TYPE" in
        linux)
            detect_linux_distro
            case "$LINUX_DISTRO_ID" in
                debian|ubuntu|linuxmint|pop|elementary|kali|raspbian)
                    if command_exists apt-get; then
                        PKG_MGR="apt"
                        PYTHON_PKG="python3"
                    fi
                    ;;
                fedora|rhel|centos|rocky|almalinux)
                    if command_exists dnf; then
                        PKG_MGR="dnf"
                        PYTHON_PKG="python3"
                    fi
                    ;;
                arch|manjaro|endeavouros)
                    if command_exists pacman; then
                        PKG_MGR="pacman"
                        PYTHON_PKG="python"
                    fi
                    ;;
                opensuse|opensuse-leap|opensuse-tumbleweed)
                    if command_exists zypper; then
                        PKG_MGR="zypper"
                        PYTHON_PKG="python3"
                    fi
                    ;;
                alpine)
                    if command_exists apk; then
                        PKG_MGR="apk"
                        PYTHON_PKG="python3"
                    fi
                    ;;
                gentoo)
                    if command_exists emerge; then
                        PKG_MGR="emerge"
                        PYTHON_PKG="dev-lang/python"
                    fi
                    ;;
            esac

            # Fallback detection by available commands
            if [ -z "$PKG_MGR" ]; then
                if command_exists apt-get; then
                    PKG_MGR="apt"
                    PYTHON_PKG="python3"
                elif command_exists dnf; then
                    PKG_MGR="dnf"
                    PYTHON_PKG="python3"
                elif command_exists pacman; then
                    PKG_MGR="pacman"
                    PYTHON_PKG="python"
                elif command_exists zypper; then
                    PKG_MGR="zypper"
                    PYTHON_PKG="python3"
                elif command_exists apk; then
                    PKG_MGR="apk"
                    PYTHON_PKG="python3"
                elif command_exists emerge; then
                    PKG_MGR="emerge"
                    PYTHON_PKG="dev-lang/python"
                fi
            fi
            ;;
        darwin)
            if command_exists brew; then
                PKG_MGR="brew"
                PYTHON_PKG="python@3.13"
            elif command_exists port; then
                PKG_MGR="port"
                PYTHON_PKG="python313"
            fi
            ;;
        freebsd|netbsd|openbsd|dragonfly)
            if command_exists pkg; then
                PKG_MGR="pkg"
                PYTHON_PKG="python3"
            fi
            ;;
    esac

    if [ -z "$PKG_MGR" ]; then
        log_warn "No supported package manager found."
        log_warn "Please install Python $REQUIRED_PYTHON_MAJOR.$REQUIRED_PYTHON_MINOR or newer manually."
    else
        log_info "Detected package manager: $PKG_MGR"
    fi
}

# =============================================================================
# Python Installation
# =============================================================================

install_python() {
    log_info "Installing Python via $PKG_MGR..."

    case "$PKG_MGR" in
        apt)
            sudo apt-get update -qq
            sudo apt-get install -y "$PYTHON_PKG" python3-venv python3-pip
            ;;
        dnf)
            sudo dnf install -y "$PYTHON_PKG" python3-pip
            ;;
        pacman)
            sudo pacman -Sy --noconfirm "$PYTHON_PKG" python-pip
            ;;
        zypper)
            sudo zypper install -y "$PYTHON_PKG" python3-pip
            ;;
        apk)
            sudo apk add "$PYTHON_PKG" py3-pip
            ;;
        emerge)
            sudo emerge "$PYTHON_PKG"
            ;;
        brew)
            brew install "$PYTHON_PKG"
            ;;
        port)
            sudo port install "$PYTHON_PKG"
            ;;
        pkg)
            sudo pkg install -y "$PYTHON_PKG" py3-pip
            ;;
        *)
            log_error "Unknown package manager: $PKG_MGR"
            exit 1
            ;;
    esac

    log_success "Python installed successfully."
}

# =============================================================================
# Python Version Check
# =============================================================================

get_python_cmd() {
    # Try different Python command names
    for cmd in python3.13 python3 python; do
        if command_exists "$cmd"; then
            echo "$cmd"
            return 0
        fi
    done
    echo ""
}

check_python_version() {
    PYTHON_CMD=$(get_python_cmd)

    if [ -z "$PYTHON_CMD" ]; then
        return 1
    fi

    # Get version numbers
    version_output=$($PYTHON_CMD --version 2>&1)
    version_number=$(echo "$version_output" | sed 's/Python //')
    major=$(echo "$version_number" | cut -d. -f1)
    minor=$(echo "$version_number" | cut -d. -f2)

    log_info "Found Python $version_number ($PYTHON_CMD)"

    # Check if version meets requirements
    if [ "$major" -gt "$REQUIRED_PYTHON_MAJOR" ]; then
        return 0
    elif [ "$major" -eq "$REQUIRED_PYTHON_MAJOR" ] && [ "$minor" -ge "$REQUIRED_PYTHON_MINOR" ]; then
        return 0
    else
        log_warn "Python $REQUIRED_PYTHON_MAJOR.$REQUIRED_PYTHON_MINOR or newer is required."
        log_warn "Found: Python $version_number"
        return 1
    fi
}

ensure_python() {
    log_info "Checking Python installation..."

    if check_python_version; then
        log_success "Python version check passed."
        return 0
    fi

    # Python not found or version too old
    if [ -z "$PKG_MGR" ]; then
        log_error "Python $REQUIRED_PYTHON_MAJOR.$REQUIRED_PYTHON_MINOR+ is required but not installed."
        log_error "No package manager detected to install it automatically."
        log_error "Please install Python $REQUIRED_PYTHON_MAJOR.$REQUIRED_PYTHON_MINOR or newer manually."
        exit 1
    fi

    log_warn "Python $REQUIRED_PYTHON_MAJOR.$REQUIRED_PYTHON_MINOR+ is required but not found."
    echo ""
    if ! ask_yes_no "Would you like to install Python using $PKG_MGR?" "y"; then
        log_error "Python installation declined. Cannot continue without Python."
        exit 1
    fi

    install_python

    # Verify installation
    if ! check_python_version; then
        log_error "Python installation failed or version still not sufficient."
        exit 1
    fi
}

# =============================================================================
# Virtual Environment
# =============================================================================

ensure_pip_in_venv() {
    # Check if pip is available in the activated venv
    if command_exists pip; then
        return 0
    fi

    log_warn "pip not found in virtual environment. Attempting to install..."

    # Try using ensurepip first
    if python -m ensurepip --upgrade 2>/dev/null; then
        log_success "pip installed via ensurepip."
        return 0
    fi

    # Fallback: download and run get-pip.py
    log_info "Trying to install pip via get-pip.py..."
    local get_pip_url="https://bootstrap.pypa.io/get-pip.py"
    local temp_file
    temp_file=$(mktemp)

    if command_exists curl; then
        curl -fsSL "$get_pip_url" -o "$temp_file"
    elif command_exists wget; then
        wget -q "$get_pip_url" -O "$temp_file"
    else
        log_error "Cannot download get-pip.py: neither curl nor wget available."
        rm -f "$temp_file"
        return 1
    fi

    if python "$temp_file" 2>/dev/null; then
        log_success "pip installed via get-pip.py."
        rm -f "$temp_file"
        return 0
    fi

    rm -f "$temp_file"
    return 1
}

setup_venv() {
    log_info "Setting up Python virtual environment..."

    PYTHON_CMD=$(get_python_cmd)
    local venv_created=false

    if [ -d "$VENV_DIR" ]; then
        log_info "Virtual environment already exists at $VENV_DIR"
    else
        log_info "Creating virtual environment at $VENV_DIR"
        $PYTHON_CMD -m venv "$VENV_DIR"
        venv_created=true
    fi

    # Activate virtual environment
    log_info "Activating virtual environment..."
    # shellcheck disable=SC1091
    . "$VENV_DIR/bin/activate"

    # Ensure pip is available
    if ! ensure_pip_in_venv; then
        if [ "$venv_created" = "false" ]; then
            # Existing venv might be corrupted, try recreating
            log_warn "pip installation failed. Recreating virtual environment..."
            deactivate 2>/dev/null || true
            rm -rf "$VENV_DIR"
            log_info "Creating fresh virtual environment at $VENV_DIR"
            $PYTHON_CMD -m venv "$VENV_DIR"
            . "$VENV_DIR/bin/activate"

            if ! ensure_pip_in_venv; then
                log_error "Failed to ensure pip is available in virtual environment."
                exit 1
            fi
        else
            log_error "Failed to install pip in new virtual environment."
            exit 1
        fi
    fi

    log_success "Virtual environment activated."
}

# =============================================================================
# Dependency Installation
# =============================================================================

install_pip_dependencies() {
    log_info "Installing Python dependencies..."

    if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
        pip install --upgrade pip -q
        pip install -r "$SCRIPT_DIR/requirements.txt" -q
        log_success "Python dependencies installed."
    else
        log_warn "No requirements.txt found, skipping Python dependencies."
    fi
}

get_npm_cmd() {
    # First check local .node directory
    if [ -d "$NODE_DIR" ] && [ -x "$NODE_DIR/bin/npm" ]; then
        echo "$NODE_DIR/bin/npm"
        return 0
    fi

    # Then check global npm
    if command_exists npm; then
        echo "npm"
        return 0
    fi

    echo ""
}

check_npm() {
    NPM_CMD=$(get_npm_cmd)

    if [ -z "$NPM_CMD" ]; then
        log_error "npm is not installed."
        log_error "Please install Node.js and npm before running this script."
        log_error "Visit: https://nodejs.org/"
        exit 1
    fi

    log_info "npm found: $($NPM_CMD --version) ($NPM_CMD)"
}

install_npm_dependencies() {
    log_info "Installing UI dependencies..."

    if [ -d "$SCRIPT_DIR/ui" ] && [ -f "$SCRIPT_DIR/ui/package.json" ]; then
        cd "$SCRIPT_DIR/ui"
        $NPM_CMD install --silent
        cd "$SCRIPT_DIR"
        log_success "UI dependencies installed."
    else
        log_warn "No UI project found, skipping npm dependencies."
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo "============================================================"
    echo "OllaForge - Setup and Run"
    echo "============================================================"
    echo ""

    # Change to script directory
    cd "$SCRIPT_DIR"

    # Phase 1: Detect system
    detect_os
    detect_package_manager

    # Phase 2: Ensure Node.js is installed
    ensure_node

    # Phase 3: Ensure Python is installed
    ensure_python

    # Phase 4: Setup virtual environment
    setup_venv

    # Phase 5: Install dependencies
    install_pip_dependencies
    check_npm
    install_npm_dependencies

    # Phase 6: Run the application
    echo ""
    log_success "Setup complete! Starting OllaForge..."
    echo ""

    python "$SCRIPT_DIR/run.py"
}

main "$@"
