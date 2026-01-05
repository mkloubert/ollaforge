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

"""
Central start script for OllaForge.
Starts both the UI (Vite dev server) and the Backend (FastAPI/Uvicorn).
"""

import argparse
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

# Default ports
DEFAULT_UI_PORT = 5979
DEFAULT_API_PORT = 23979

# Port range limits
MIN_PORT = 1024
MAX_PORT = 65535

# Required Node.js version
REQUIRED_NODE_MAJOR = 20

# Project paths
PROJECT_ROOT = Path(__file__).parent.resolve()
UI_DIR = PROJECT_ROOT / "ui"
API_DIR = PROJECT_ROOT / "api"
NODE_DIR = PROJECT_ROOT / ".node"


def is_port_available(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a port is available for binding."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind((host, port))
            return True
    except OSError:
        return False


def find_available_port(default_port: int, host: str = "127.0.0.1") -> int | None:
    """
    Find an available port starting from the default port.

    Algorithm:
    1. Try the default port first
    2. If unavailable, increment from default_port+1 to 65535
    3. If still not found, try from 1024 to default_port-1
    4. Return None if no port is available
    """
    # Try the default port first
    if is_port_available(default_port, host):
        return default_port

    # Try ports from default_port+1 to MAX_PORT
    for port in range(default_port + 1, MAX_PORT + 1):
        if is_port_available(port, host):
            return port

    # Try ports from MIN_PORT to default_port-1
    for port in range(MIN_PORT, default_port):
        if is_port_available(port, host):
            return port

    return None


def get_local_node_path() -> Path | None:
    """Get path to local Node.js installation in .node directory."""
    if sys.platform == "win32":
        node_exe = NODE_DIR / "node.exe"
    else:
        node_exe = NODE_DIR / "bin" / "node"

    if node_exe.exists() and node_exe.is_file():
        return node_exe
    return None


def get_global_node_path() -> Path | None:
    """Get path to global Node.js installation."""
    node_cmd = "node.exe" if sys.platform == "win32" else "node"
    node_path = shutil.which(node_cmd)
    if node_path:
        return Path(node_path)
    return None


def get_node_version(node_path: Path) -> tuple[int, int, int] | None:
    """Get Node.js version as tuple (major, minor, patch)."""
    try:
        result = subprocess.run(
            [str(node_path), "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            version_str = result.stdout.strip().lstrip("v")
            parts = version_str.split(".")
            if len(parts) >= 3:
                return (int(parts[0]), int(parts[1]), int(parts[2]))
    except (subprocess.TimeoutExpired, ValueError, OSError):
        pass
    return None


def find_suitable_node() -> tuple[Path | None, Path | None]:
    """
    Find a suitable Node.js installation.

    Returns:
        Tuple of (node_path, npm_path) or (None, None) if not found.
    """
    # First check local .node directory
    local_node = get_local_node_path()
    if local_node:
        version = get_node_version(local_node)
        if version and version[0] >= REQUIRED_NODE_MAJOR:
            print(f"[SETUP] Found local Node.js v{version[0]}.{version[1]}.{version[2]} at {local_node}")
            if sys.platform == "win32":
                npm_path = NODE_DIR / "npm.cmd"
            else:
                npm_path = NODE_DIR / "bin" / "npm"
            if npm_path.exists():
                return (local_node, npm_path)

    # Then check global node
    global_node = get_global_node_path()
    if global_node:
        version = get_node_version(global_node)
        if version and version[0] >= REQUIRED_NODE_MAJOR:
            print(f"[SETUP] Found global Node.js v{version[0]}.{version[1]}.{version[2]} at {global_node}")
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            npm_path = shutil.which(npm_cmd)
            if npm_path:
                return (global_node, Path(npm_path))

    return (None, None)


def start_backend(port: int, ui_origin: str) -> subprocess.Popen:
    """Start the FastAPI backend with uvicorn."""
    env = os.environ.copy()
    env["OLLAFORGE_CORS_ORIGINS"] = ui_origin

    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--reload",
    ]

    print(f"[API] Starting backend on http://127.0.0.1:{port}")

    return subprocess.Popen(
        cmd,
        cwd=API_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )


def start_ui(port: int, api_url: str, npm_path: Path) -> subprocess.Popen:
    """Start the Vite dev server for the UI."""
    env = os.environ.copy()
    env["VITE_API_URL"] = api_url

    cmd = [
        str(npm_path),
        "run",
        "dev",
        "--",
        "--port",
        str(port),
        "--host",
        "127.0.0.1",
    ]

    print(f"[UI] Starting frontend on http://127.0.0.1:{port}")

    return subprocess.Popen(
        cmd,
        cwd=UI_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )


def stream_output(process: subprocess.Popen, prefix: str) -> None:
    """Stream process output to stdout with a prefix."""
    if process.stdout:
        for line in iter(process.stdout.readline, b""):
            if line:
                print(f"{prefix} {line.decode('utf-8', errors='replace')}", end="")


def wait_for_server(url: str, timeout: int = 30, interval: float = 0.5) -> bool:
    """
    Wait for a server to become available.

    Args:
        url: The URL to check
        timeout: Maximum time to wait in seconds
        interval: Time between checks in seconds

    Returns:
        True if server is available, False if timeout reached
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urlopen(url, timeout=2):
                return True
        except (URLError, OSError):
            time.sleep(interval)
    return False


def open_browser(url: str) -> None:
    """Open the default browser with the given URL."""
    try:
        webbrowser.open(url)
        print(f"[BROWSER] Opened {url} in default browser")
    except Exception as e:
        print(f"[BROWSER] Could not open browser automatically: {e}")
        print(f"[BROWSER] Please open {url} manually")


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Start OllaForge (UI and API servers)"
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Do not open the browser automatically after startup",
    )
    parser.add_argument(
        "--ui-port",
        type=int,
        default=None,
        help=f"Port for the UI server (env: OLLAFORGE_UI_PORT, default: {DEFAULT_UI_PORT})",
    )
    parser.add_argument(
        "--api-port",
        type=int,
        default=None,
        help=f"Port for the API server (env: OLLAFORGE_API_PORT, default: {DEFAULT_API_PORT})",
    )
    return parser.parse_args()


def get_port(
    arg_value: int | None,
    env_var: str,
    default: int,
) -> tuple[int, bool]:
    """
    Get port from argument, environment variable, or default.

    Returns:
        Tuple of (port, is_fixed) where is_fixed is True if port was explicitly set.
    """
    # CLI argument has highest priority
    if arg_value is not None:
        return (arg_value, True)

    # Then environment variable
    env_value = os.environ.get(env_var)
    if env_value:
        try:
            return (int(env_value), True)
        except ValueError:
            print(f"[WARN] Invalid {env_var} value '{env_value}', using default")

    # Fall back to default
    return (default, False)


def main() -> int:
    """Main entry point."""
    args = parse_args()

    print("=" * 60)
    print("OllaForge - Starting services...")
    print("=" * 60)
    print()

    # Check for Node.js first
    print("[SETUP] Checking Node.js installation...")
    node_path, npm_path = find_suitable_node()

    if not node_path or not npm_path:
        print(f"[ERROR] Node.js {REQUIRED_NODE_MAJOR}+ is required but not found.")
        print("[ERROR] Please run run.sh (Unix) or run.ps1 (Windows) to install Node.js.")
        print("[ERROR] Alternatively, install Node.js manually from https://nodejs.org/")
        return 1

    # Determine ports from args, env vars, or defaults
    print("[SETUP] Checking port availability...")

    requested_api_port, api_port_fixed = get_port(
        args.api_port, "OLLAFORGE_API_PORT", DEFAULT_API_PORT
    )
    requested_ui_port, ui_port_fixed = get_port(
        args.ui_port, "OLLAFORGE_UI_PORT", DEFAULT_UI_PORT
    )

    # Check API port
    if api_port_fixed:
        # User explicitly requested this port
        if not is_port_available(requested_api_port):
            print(f"[ERROR] Requested API port {requested_api_port} is not available.")
            print("[ERROR] Please free up the port or choose a different one.")
            return 1
        api_port = requested_api_port
    else:
        # Find an available port starting from the default
        api_port = find_available_port(requested_api_port)
        if api_port is None:
            print("[ERROR] Could not find an available port for the API server.")
            print("[ERROR] Please free up a port and try again.")
            return 1
        if api_port != requested_api_port:
            print(f"[SETUP] Default API port {requested_api_port} is in use, using {api_port}")

    # Check UI port
    if ui_port_fixed:
        # User explicitly requested this port
        if not is_port_available(requested_ui_port):
            print(f"[ERROR] Requested UI port {requested_ui_port} is not available.")
            print("[ERROR] Please free up the port or choose a different one.")
            return 1
        ui_port = requested_ui_port
    else:
        # Find an available port starting from the default
        ui_port = find_available_port(requested_ui_port)
        if ui_port is None:
            print("[ERROR] Could not find an available port for the UI server.")
            print("[ERROR] Please free up a port and try again.")
            return 1
        if ui_port != requested_ui_port:
            print(f"[SETUP] Default UI port {requested_ui_port} is in use, using {ui_port}")

    # Build URLs
    api_url = f"http://127.0.0.1:{api_port}"
    ui_url = f"http://127.0.0.1:{ui_port}"

    print()
    print(f"[SETUP] API URL: {api_url}")
    print(f"[SETUP] UI URL:  {ui_url}")
    print()

    # Start processes
    api_process: subprocess.Popen | None = None
    ui_process: subprocess.Popen | None = None

    def cleanup(signum: int | None = None, frame=None) -> None:
        """Clean up processes on shutdown."""
        print()
        print("[SHUTDOWN] Stopping services...")

        if ui_process and ui_process.poll() is None:
            print("[SHUTDOWN] Stopping UI server...")
            ui_process.terminate()
            try:
                ui_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                ui_process.kill()

        if api_process and api_process.poll() is None:
            print("[SHUTDOWN] Stopping API server...")
            api_process.terminate()
            try:
                api_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                api_process.kill()

        print("[SHUTDOWN] All services stopped.")

    # Register signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        # Start backend first
        api_process = start_backend(api_port, ui_url)

        # Start UI
        ui_process = start_ui(ui_port, api_url, npm_path)

        print()
        print("=" * 60)
        print(f"OllaForge is running!")
        print(f"Open your browser at: {ui_url}")
        print("Press Ctrl+C to stop.")
        print("=" * 60)
        print()

        # Stream output from both processes
        api_thread = threading.Thread(
            target=stream_output, args=(api_process, "[API]"), daemon=True
        )
        ui_thread = threading.Thread(
            target=stream_output, args=(ui_process, "[UI]"), daemon=True
        )

        api_thread.start()
        ui_thread.start()

        # Wait for servers to be ready and open browser
        print("[SETUP] Waiting for servers to start...")

        api_health_url = f"{api_url}/api/healthz"
        if wait_for_server(api_health_url, timeout=30):
            print("[SETUP] API server is ready")
        else:
            print("[WARN] API server did not respond in time, continuing anyway...")

        if wait_for_server(ui_url, timeout=30):
            print("[SETUP] UI server is ready")
            if not args.no_open:
                open_browser(ui_url)
        else:
            print("[WARN] UI server did not respond in time")
            if not args.no_open:
                print(f"[WARN] Please open {ui_url} manually once the server is ready")

        # Wait for processes to complete or be interrupted
        while True:
            api_status = api_process.poll()
            ui_status = ui_process.poll()

            if api_status is not None:
                print(f"[ERROR] API server exited with code {api_status}")
                cleanup()
                return 1

            if ui_status is not None:
                print(f"[ERROR] UI server exited with code {ui_status}")
                cleanup()
                return 1

            # Small sleep to prevent busy waiting
            time.sleep(0.5)

    except KeyboardInterrupt:
        cleanup()
        return 0
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        cleanup()
        return 1


if __name__ == "__main__":
    sys.exit(main())
