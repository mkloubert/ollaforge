# OllaForge

A web application that simplifies training LLMs with your own data for use in Ollama.

## Features

- **Project Management**: Create, edit, and delete training projects
- **Training Data**: Upload JSONL files with instruction/output pairs
- **AI Training Data Generation**: Generate training data from text files using OpenAI, Anthropic, or Mistral
- **Model Training**: Fine-tune LLMs using QLoRA with automatic GGUF conversion
- **10 Pre-configured Models**: Curated selection of chat-compatible instruct models
- **8 Training Presets**: Quick-start configurations for different use cases
- **Advanced Configuration**: Customize training, LoRA, and quantization parameters
- **Ollama Integration**: Create and run trained models directly in Ollama
- **Hugging Face Integration**: Login to access gated models
- **LLM Provider Integration**: Configure API keys for OpenAI, Anthropic (Claude), and Mistral
- **Multi-language Support**: 17 languages (English, German, Spanish, French, Portuguese, Ukrainian, Chinese, Japanese, Korean, Arabic, Hindi, Italian, Dutch, Polish, Greek, Turkish, Hebrew)
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

### Generate Training Data from Sources

OllaForge can automatically generate training data from your existing documents using LLM APIs. This feature requires at least one LLM provider (OpenAI, Anthropic, or Mistral) to be configured.

1. **Configure an LLM Provider**: Click the provider buttons in the header and enter your API key
2. **Open the Generator**: In your project, click "Generate from Sources" button
3. **Add Data Sources**: Upload text files (.txt, .md, .html, .json, .csv, .xml) or paste text directly
4. **Select Provider and Model**: Choose which LLM to use for generation
5. **Generate**: Click "Generate" to create instruction/output pairs from your sources
6. **Edit Results**: Review and edit the generated data in the table
7. **Save**: Enter a filename and save as a JSONL file

The generated training data is based only on information in your source documents. The LLM extracts facts and creates diverse question-answer pairs in the same language as the source text.

### Supported Base Models

OllaForge includes 10 pre-configured instruct models that are chat-compatible after fine-tuning:

| Model                                  | Size                 | License    | Best For                         |
| -------------------------------------- | -------------------- | ---------- | -------------------------------- |
| `bigscience/bloomz-560m`               | 560M                 | RAIL       | Multilingual (46 languages)      |
| `HuggingFaceTB/SmolLM2-1.7B-Instruct`  | 1.7B                 | Apache 2.0 | Edge/mobile, low resources       |
| `TinyLlama/TinyLlama-1.1B-Chat-v1.0`   | 1.1B                 | Apache 2.0 | Ultra-lightweight, quick tests   |
| `Qwen/Qwen2.5-3B-Instruct`             | 3B                   | Apache 2.0 | Balanced size and capability     |
| `microsoft/Phi-3-mini-4k-instruct`     | 3.8B                 | MIT        | Reasoning, compact but powerful  |
| `mistralai/Mistral-7B-Instruct-v0.3`   | 7B                   | Apache 2.0 | General-purpose, strong baseline |
| `tiiuae/falcon-7b-instruct`            | 7B                   | Apache 2.0 | Chat, QA, text generation        |
| `Qwen/Qwen2.5-7B-Instruct`             | 7B                   | Apache 2.0 | Multilingual, long context       |
| `Qwen/Qwen2.5-14B-Instruct`            | 14B                  | Apache 2.0 | Complex tasks, highest quality   |
| `mistralai/Mixtral-8x7B-Instruct-v0.1` | 46.7B (12.9B active) | Apache 2.0 | MoE, large model performance     |

All models are instruction-tuned, ensuring trained models can be used for chat applications.

### Training Presets

The Advanced Settings tab includes 8 training presets for quick configuration:

| Preset           | Description                                   | Recommended For            |
| ---------------- | --------------------------------------------- | -------------------------- |
| **Balanced**     | Good balance of speed and quality             | All models                 |
| **Chat**         | Optimized for conversational AI               | Mistral, Qwen, SmolLM      |
| **Code**         | Optimized for programming and code completion | Qwen, Mistral, Phi         |
| **Fast**         | Quick training for rapid experimentation      | SmolLM, TinyLlama, BLOOMZ  |
| **High Quality** | Maximum quality at cost of training time      | Qwen-14B, Mixtral, Mistral |
| **Low Memory**   | Minimized VRAM for limited hardware           | SmolLM, TinyLlama, BLOOMZ  |
| **Multilingual** | Optimized for multilingual models             | Qwen, BLOOMZ               |
| **Reasoning**    | Optimized for logical reasoning and math      | Phi, Qwen                  |

Each preset configures training parameters, LoRA settings, and quantization options. Presets show which models they work best with.

### Advanced Configuration

The Advanced tab in the project settings allows customization of training parameters:

#### Training Parameters

| Parameter             | Description                       | Default (GPU)    | Default (CPU) |
| --------------------- | --------------------------------- | ---------------- | ------------- |
| Epochs                | Number of training passes         | 3                | 3             |
| Batch Size            | Samples per training step         | 4                | 1             |
| Gradient Accumulation | Steps to accumulate gradients     | 4                | 4             |
| Learning Rate         | Step size for weight updates      | 2e-4             | 3e-4          |
| Warmup Ratio          | Fraction for learning rate warmup | 0.1              | 0.03          |
| Max Token Length      | Maximum sequence length           | 512              | 512           |
| FP16                  | Half precision training           | true             | false         |
| Optimizer             | Weight update algorithm           | paged_adamw_8bit | adamw_torch   |
| Weight Decay          | L2 regularization                 | 0.01             | 0.01          |
| Max Gradient Norm     | Gradient clipping threshold       | 1.0              | 1.0           |
| LR Scheduler          | Learning rate schedule            | linear           | linear        |
| NEFTune Noise Alpha   | Embedding noise (0=disabled)      | 0                | 0             |
| Seed                  | Random seed for reproducibility   | 42               | 42            |
| BF16                  | BFloat16 precision (Ampere+ GPUs) | false            | false         |
| Logging Steps         | Log metrics every N steps         | 10               | 5             |
| Save Strategy         | Checkpoint save strategy          | epoch            | epoch         |

#### LoRA Parameters

| Parameter       | Description                           | Default                                |
| --------------- | ------------------------------------- | -------------------------------------- |
| Rank (r)        | Dimension of low-rank matrices        | 32                                     |
| Alpha           | Scaling factor for LoRA weights       | 64                                     |
| Dropout         | Dropout probability                   | 0.05                                   |
| Target Modules  | Model layers to apply LoRA            | q, k, v, o, gate, up, down projections |
| Bias            | Bias training mode                    | none                                   |
| Use RSLoRA      | Rank-Stabilized LoRA (r >= 64)        | false                                  |
| Use DoRA        | Weight-Decomposed LoRA (experimental) | false                                  |
| Modules to Save | Additional modules to train fully     | none                                   |

#### Quantization Parameters (GPU only)

| Parameter           | Description                     | Default |
| ------------------- | ------------------------------- | ------- |
| Load in 4-bit       | Use 4-bit precision for loading | true    |
| Quantization Type   | 4-bit quantization algorithm    | NF4     |
| Double Quantization | Apply secondary quantization    | true    |
| Compute Dtype       | Dtype for computations          | float16 |
| Output Quantization | Format for final GGUF model     | Q8_0    |

#### Ollama Modelfile Parameters

| Parameter      | Description                           | Default                        |
| -------------- | ------------------------------------- | ------------------------------ |
| Temperature    | Randomness in output (0-2)            | 0.7                            |
| Top P          | Nucleus sampling threshold (0-1)      | 0.9                            |
| Top K          | Limit to K most likely tokens (1-100) | 40                             |
| System Prompt  | Model behavior instructions           | "You are a helpful assistant." |
| Stop Sequences | Sequences that end generation         | ["### Question:"]              |
| Repeat Penalty | Penalty for token repetition (1-2)    | 1.1                            |
| Repeat Last N  | Tokens to check for repetition        | 64                             |
| Context Size   | Context window size                   | 2048                           |

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

| Method | Endpoint                           | Description                 |
| ------ | ---------------------------------- | --------------------------- |
| GET    | /api/projects                      | List all projects           |
| POST   | /api/projects                      | Create a project            |
| PUT    | /api/projects/{slug}               | Update a project            |
| DELETE | /api/projects/{slug}               | Delete a project            |
| POST   | /api/projects/{slug}/open-folder   | Open project in file manager |

### Data Files

| Method | Endpoint                                    | Description                      |
| ------ | ------------------------------------------- | -------------------------------- |
| GET    | /api/projects/{slug}/data                   | List data files                  |
| POST   | /api/projects/{slug}/data                   | Upload a data file               |
| DELETE | /api/projects/{slug}/data/{filename}        | Delete a data file               |
| GET    | /api/projects/{slug}/data/{filename}        | Get file content                 |
| POST   | /api/projects/{slug}/generate-training-data | Generate training data using LLM |
| POST   | /api/projects/{slug}/data/save-generated    | Save generated data as JSONL     |

### Training

| Method | Endpoint                              | Description              |
| ------ | ------------------------------------- | ------------------------ |
| GET    | /api/projects/{slug}/train/status     | Get training status      |
| POST   | /api/projects/{slug}/train            | Start training           |
| POST   | /api/projects/{slug}/train/cancel     | Cancel training          |
| WS     | /api/projects/{slug}/train/ws         | Real-time training updates |

### Models

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| GET    | /api/models | List available HF models |

### Presets

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| GET    | /api/presets      | List training presets |
| GET    | /api/presets/{id} | Get a specific preset |

### Hugging Face

| Method | Endpoint                | Description      |
| ------ | ----------------------- | ---------------- |
| GET    | /api/huggingface/status | Get login status |
| POST   | /api/huggingface/login  | Login with token |

### LLM Providers

| Method | Endpoint                          | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/llm-providers/status         | Get status of all providers  |
| POST   | /api/llm-providers/login          | Save and validate an API key |
| GET    | /api/llm-providers/models         | List all available LLM models |
| GET    | /api/llm-providers/models/{provider} | List models for a provider |

Supported providers: `openai`, `anthropic`, `mistral`

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
| OLLAFORGE_API_PORT  | Port for the API server     | 23979                                 |
| OLLAFORGE_LLAMA_URL | URL to clone llama.cpp from | https://github.com/ggml-org/llama.cpp |
| OLLAFORGE_UI_PORT   | Port for the UI server      | 5979                                  |

#### UI (Vite)

| Variable                   | Description                     | Default                                                         |
| -------------------------- | ------------------------------- | --------------------------------------------------------------- |
| VITE_API_URL               | Backend API URL                 | http://localhost:23979                                          |
| VITE_DOC_LINK_HUGGINGFACE  | Hugging Face docs link          | https://huggingface.co/docs/transformers                        |
| VITE_DOC_LINK_LORA         | LoRA documentation link         | https://huggingface.co/docs/peft/main/en/conceptual_guides/lora |
| VITE_DOC_LINK_QLORA        | QLoRA paper link                | https://arxiv.org/abs/2305.14314                                |
| VITE_DOC_LINK_TRANSFORMERS | Training documentation link     | https://huggingface.co/docs/transformers/training               |
| VITE_HF_TOKEN_URL          | Hugging Face token settings URL | https://huggingface.co/settings/tokens                          |

#### Backend (FastAPI)

| Variable               | Description                            | Default                                     |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| OLLAFORGE_CORS_ORIGINS | Allowed CORS origins (comma-separated) | http://localhost:5979,http://127.0.0.1:5979 |
| HF_TOKEN               | Hugging Face token                     | -                                           |
| OPENAI_API_KEY         | OpenAI API key                         | -                                           |
| ANTHROPIC_API_KEY      | Anthropic (Claude) API key             | -                                           |
| MISTRAL_API_KEY        | Mistral API key                        | -                                           |

API keys can also be configured via the UI and are stored in `~/.ollaforge/`.

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
│   ├── constants/       # Static data (presets, defaults)
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
