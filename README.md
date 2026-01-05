# OllaForge

A web application that simplifies training LLMs with your own data for use in Ollama.

## Features

- Health check endpoint to monitor API status
- Modern React UI with real-time status display
- Cross-platform support (Windows, macOS, Linux, BSD)
- Automatic port detection and CORS configuration
- Automatic Node.js LTS version detection and installation

## Prerequisites

- **Python 3.13** or newer
- **Node.js 20+** and **npm** (automatically installed if missing)
- **PowerShell 7+** (optional, for run.ps1)

## Project Structure

```
/workspace
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
└── requirements.txt     # Python dependencies
```

## Quick Start

### Using Shell Script (macOS, Linux, BSD)

```bash
./run.sh
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

## Automatic Node.js Installation

The setup scripts (`run.sh` and `run.ps1`) automatically detect and install the latest Node.js LTS version if Node.js is not found or the installed version is too old.

- Fetches the latest LTS version from `https://nodejs.org/download/release/index.json`
- Downloads and installs Node.js to the local `.node` directory
- Falls back to a known stable version if the API is unreachable
- No system-wide installation required

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

| Variable           | Description             | Default |
| ------------------ | ----------------------- | ------- |
| OLLAFORGE_UI_PORT  | Port for the UI server  | 5979    |
| OLLAFORGE_API_PORT | Port for the API server | 23979   |

#### UI (Vite)

| Variable     | Description     | Default                |
| ------------ | --------------- | ---------------------- |
| VITE_API_URL | Backend API URL | http://localhost:23979 |

#### Backend (FastAPI)

| Variable               | Description                            | Default                                     |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| OLLAFORGE_CORS_ORIGINS | Allowed CORS origins (comma-separated) | http://localhost:5979,http://127.0.0.1:5979 |

## Development

### Backend

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
