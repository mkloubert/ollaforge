# OllaForge

A web application that simplifies training LLMs with your own data for use in Ollama.

## Features

- Health check endpoint to monitor API status
- Modern React UI with real-time status display
- Cross-platform support (Windows, macOS, Linux, BSD)
- Automatic port detection and CORS configuration
- Automatic dependency installation (Git, Node.js)
- Automatic llama.cpp setup and integration

## Prerequisites

- **Git** (automatically installed if missing)
- **Python 3.13** or newer
- **Node.js 20+** and **npm** (automatically installed if missing)
- **PowerShell 7+** (optional, for run.ps1)

## Quick Start

### Using Shell Script (macOS, Linux, BSD)

```bash
./run.sh
```

### Using Windows Command Script (Windows)

```batch
run.cmd
```

### Using PowerShell (Windows, macOS, Linux)

```powershell
./run.ps1
```

### Manual Start

1. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Install UI dependencies:

   ```bash
   cd ui && npm install && cd ..
   ```

4. Run the application:
   ```bash
   python run.py
   ```

## Default Ports

| Service | Default Port |
| ------- | ------------ |
| UI      | 5979         |
| API     | 23979        |

If a default port is in use, the application automatically finds an available port.

## Automatic Dependency Installation

The setup scripts (`run.sh`, `run.ps1`, and `run.cmd`) automatically detect and install missing dependencies.

### Git

If Git is not installed, the scripts will offer to install it using the system package manager:

- Windows: winget, Chocolatey, or Scoop
- macOS: Homebrew or MacPorts
- Linux: apt, dnf, pacman, zypper, apk, or emerge (depending on distribution)

### Node.js

If Node.js is not found or the installed version is too old:

- Fetches the latest LTS version from `https://nodejs.org/download/release/index.json`
- Downloads and installs Node.js to the local `.node` directory
- Falls back to a known stable version if the API is unreachable
- No system-wide installation required

### llama.cpp

On startup, `run.py` automatically checks for llama.cpp:

- If `.llama.cpp` directory does not exist, it clones the repository (shallow clone, HEAD only)
- Uses the URL from `OLLAFORGE_LLAMA_URL` environment variable (defaults to https://github.com/ggml-org/llama.cpp)
- Installs Python dependencies from llama.cpp's `requirements.txt`
- If cloning or dependency installation fails, the application will not start

## API Endpoints

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | /api/healthz | Health check status |

## Configuration

### Command-Line Arguments

The `run.py` script supports the following arguments:

| Argument     | Description                              |
| ------------ | ---------------------------------------- |
| `--api-port` | Specify a custom port for the API server |
| `--no-open`  | Do not open the browser automatically    |
| `--ui-port`  | Specify a custom port for the UI server  |

Example:

```bash
python run.py --no-open --ui-port 8080 --api-port 8081
```

### Environment Variables

#### Root (run.py)

| Variable            | Description                 | Default                               |
| ------------------- | --------------------------- | ------------------------------------- |
| OLLAFORGE_UI_PORT   | Port for the UI server      | 5979                                  |
| OLLAFORGE_API_PORT  | Port for the API server     | 23979                                 |
| OLLAFORGE_LLAMA_URL | URL to clone llama.cpp from | https://github.com/ggml-org/llama.cpp |

#### UI (Vite)

| Variable     | Description     | Default                |
| ------------ | --------------- | ---------------------- |
| VITE_API_URL | Backend API URL | http://localhost:23979 |

#### Backend (FastAPI)

| Variable               | Description                            | Default                                     |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| OLLAFORGE_CORS_ORIGINS | Allowed CORS origins (comma-separated) | http://localhost:5979,http://127.0.0.1:5979 |

## Development

## Project Structure

```
/workspace
├── .llama.cpp/          # llama.cpp repository (auto-cloned)
├── api/                 # FastAPI backend
│   ├── main.py          # Main application with CORS
│   └── routers/         # API route handlers
│       └── health.py    # Health check endpoint
├── ui/                  # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and API client
│   └── package.json
├── run.py               # Central start script
├── run.sh               # Shell script for Unix systems
├── run.ps1              # PowerShell script (cross-platform)
├── run.cmd              # Windows command script
└── requirements.txt     # Python dependencies
```

#### Backend

The backend uses FastAPI with uvicorn. During development, it runs with auto-reload enabled.

```bash
cd api
uvicorn main:app --reload --port 23979
```

### Frontend

The frontend uses Vite with React 19 and TypeScript.

```bash
cd ui
npm run dev -- --port 5979
```

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

See [LICENSE](LICENSE) for details.

## Author

Marcel Joachim Kloubert (marcel@kloubert.dev)
