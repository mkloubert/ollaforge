# OllaForge

A web application that simplifies training LLMs with your own data for use in Ollama.

## Features

- **Project Management**: Create, edit, and delete training projects
- **Training Data**: Upload JSONL files with instruction/output pairs
- **Model Training**: Fine-tune LLMs using LoRA with automatic GGUF conversion
- **Ollama Integration**: Create and run trained models directly in Ollama
- **Hugging Face Integration**: Login to access gated models
- **Multi-language Support**: English and German UI
- **Theme Support**: Light, dark, and system theme modes
- **Cross-platform**: Windows, macOS, Linux, BSD
- **Automatic Setup**: Dependencies and llama.cpp installed automatically

## Prerequisites

- **Git** (automatically installed if missing)
- **Python 3.10** or newer
- **Node.js 20+** and **npm** (automatically installed if missing)
- **Ollama** (for model deployment)
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

## Usage

1. **Create a Project**: Click "New Project" on the home page
2. **Select a Model**: Choose a base model from Hugging Face (login required for gated models)
3. **Upload Training Data**: Add JSONL files with `instruction` and `output` fields
4. **Start Training**: Click the rocket button to begin training
5. **Create in Ollama**: After training, click the package button to register the model
6. **Run in Ollama**: Click the play button to chat with your model

### Training Data Format

Upload JSONL files where each line is a JSON object:

```json
{"instruction": "What is the capital of France?", "output": "The capital of France is Paris."}
{"instruction": "Translate 'Hello' to German", "output": "Hallo"}
```

## Default Ports

| Service | Default Port |
| ------- | ------------ |
| UI      | 5979         |
| API     | 23979        |

If a default port is in use, the application automatically finds an available port.

## API Endpoints

### Health

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | /api/healthz | Health check status |

### Projects

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| GET    | /api/projects        | List all projects |
| POST   | /api/projects        | Create a project  |
| PUT    | /api/projects/{slug} | Update a project  |
| DELETE | /api/projects/{slug} | Delete a project  |

### Data Files

| Method | Endpoint                                   | Description        |
| ------ | ------------------------------------------ | ------------------ |
| GET    | /api/projects/{slug}/data-files            | List data files    |
| POST   | /api/projects/{slug}/data-files            | Upload a data file |
| DELETE | /api/projects/{slug}/data-files/{filename} | Delete a data file |
| GET    | /api/projects/{slug}/data-files/{filename} | Get file content   |

### Training

| Method | Endpoint                             | Description         |
| ------ | ------------------------------------ | ------------------- |
| GET    | /api/projects/{slug}/training        | Get training status |
| POST   | /api/projects/{slug}/training        | Start training      |
| POST   | /api/projects/{slug}/training/cancel | Cancel training     |

### Models

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| GET    | /api/models | List available HF models |

### Hugging Face

| Method | Endpoint                | Description      |
| ------ | ----------------------- | ---------------- |
| GET    | /api/huggingface/status | Get login status |
| POST   | /api/huggingface/login  | Login with token |

### Ollama

| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| GET    | /api/ollama/models                 | List Ollama models     |
| GET    | /api/projects/{slug}/ollama/exists | Check if model exists  |
| POST   | /api/projects/{slug}/ollama/create | Create model in Ollama |
| POST   | /api/projects/{slug}/ollama/run    | Run model in terminal  |

## Configuration

### Command-Line Arguments

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
- Uses the URL from `OLLAFORGE_LLAMA_URL` environment variable
- Installs Python dependencies from llama.cpp's `requirements.txt`
- If cloning or dependency installation fails, the application will not start

## Project Structure

```
/workspace
├── .llama.cpp/          # llama.cpp repository (auto-cloned)
├── api/                 # FastAPI backend
│   ├── main.py          # Main application with CORS
│   ├── config.py        # Configuration management
│   ├── error_codes.py   # Error code definitions
│   ├── models/          # Pydantic models
│   ├── routers/         # API route handlers
│   └── services/        # Business logic services
├── ui/                  # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── i18n/        # Internationalization
│   │   ├── lib/         # API client functions
│   │   ├── pages/       # Page components
│   │   └── types/       # TypeScript types
│   └── package.json
├── run.py               # Central start script
├── run.sh               # Shell script for Unix systems
├── run.ps1              # PowerShell script (cross-platform)
├── run.cmd              # Windows command script
└── requirements.txt     # Python dependencies
```

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
