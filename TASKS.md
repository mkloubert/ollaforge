# Tasks for Current Milestone: Ollama Modelfile & Extended Parameters

This milestone adds Ollama Modelfile parameters and additional training/inference configuration based on the analysis in `/workspace/PARAMETER.md`.

**Status: Milestone completed**

## Goal

- Add Ollama Modelfile parameters (temperature, top_p, system prompt, stop sequences)
- Add additional training parameters (weight_decay, lr_scheduler_type, seed, bf16)
- Add advanced LoRA features (use_rslora, use_dora, bias)
- Add additional inference parameters (top_k, repeat_penalty, mirostat)
- Extend quantization options (bnb_4bit_compute_dtype)

## Implementation Patterns (from existing code)

### Backend Pattern
- **Models**: Pydantic models with `Field()` validators, all fields `| None` with defaults
- **Router**: Parse functions, camelCase keys in project.json (`modelfileConfig`), `model_dump(exclude_none=True)`
- **Service**: Default constants at top, `get_effective_*_config()` methods, logging of applied values

### Frontend Pattern
- **Types**: Interfaces with `?: type | null` fields
- **i18n**: Nested structure under `advancedConfig.*Params` with label + help for each field
- **State**: `[configOverride, setConfigOverride]`, `effectiveConfig` via `useMemo`, `handleConfigChange` with auto-save
- **UI**: Collapsible sections, Label + HelpCircle tooltip + Input/Select/Switch, disabled during training

---

## Phase 1: Backend - Ollama Modelfile Configuration ✅

**Goal:** Extend the project model to support Ollama Modelfile parameters.

- [x] Extend `/workspace/api/models/project.py`:

  - [x] Add `ModelfileConfig` model (following existing pattern):
    ```python
    class ModelfileConfig(BaseModel):
        temperature: float | None = Field(None, ge=0.0, le=2.0, description="...")
        top_p: float | None = Field(None, ge=0.0, le=1.0, description="...")
        top_k: int | None = Field(None, ge=1, le=100, description="...")
        stop: list[str] | None = Field(None, description="...")
        system: str | None = Field(None, max_length=2000, description="...")
        repeat_penalty: float | None = Field(None, ge=1.0, le=2.0, description="...")
        repeat_last_n: int | None = Field(None, ge=0, le=512, description="...")
        num_ctx: int | None = Field(None, description="...")
    ```
  - [x] Add `modelfile_config: ModelfileConfig | None` to `ProjectInfo`
  - [x] Add `modelfile_config: ModelfileConfig | None` to `UpdateProjectRequest`
  - [x] Add `modelfile_config: ModelfileConfig | None` to `UpdateProjectResponse`

- [x] Update `/workspace/api/routers/projects.py`:
  - [x] Add `parse_modelfile_config()` function (following existing pattern)
  - [x] Read `modelfileConfig` from project.json in `get_all_projects()`
  - [x] Write `modelfileConfig` to project.json in `update_project()`

- [x] Update `/workspace/api/services/training_service.py`:
  - [x] Add default constants:
    ```python
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_TOP_P = 0.9
    DEFAULT_TOP_K = 40
    DEFAULT_STOP = ["### Question:"]
    DEFAULT_SYSTEM = "You are a helpful assistant."
    DEFAULT_REPEAT_PENALTY = 1.1
    DEFAULT_REPEAT_LAST_N = 64
    DEFAULT_NUM_CTX = 2048
    ```
  - [x] Add `modelfile_config` parameter to `TrainingJob.__init__()`
  - [x] Add `get_effective_modelfile_config()` method to `TrainingJob`
  - [x] Update `_create_modelfile()` to use `get_effective_modelfile_config()`
  - [x] Log applied modelfile config values

- [x] Update `/workspace/api/routers/training.py`:
  - [x] Load `modelfile_config` from project in `start_training()`
  - [x] Pass `modelfile_config` to `training_manager.start_training()`

---

## Phase 2: UI - Ollama Modelfile Section ✅

**Goal:** Add Ollama Modelfile configuration controls in the Advanced tab.

- [x] Update `/workspace/ui/src/types/project.ts`:
  - [x] Add `ModelfileConfig` interface:
    ```typescript
    export interface ModelfileConfig {
      temperature?: number | null;
      top_p?: number | null;
      top_k?: number | null;
      stop?: string[] | null;
      system?: string | null;
      repeat_penalty?: number | null;
      repeat_last_n?: number | null;
      num_ctx?: number | null;
    }
    ```
  - [x] Add `modelfile_config?: ModelfileConfig | null` to `Project`, `UpdateProjectRequest`, `UpdateProjectResponse`

- [x] Update `/workspace/ui/src/pages/project-detail.tsx`:
  - [x] Add state: `[modelfileConfigOverride, setModelfileConfigOverride] = useState<ModelfileConfig | null>(null)`
  - [x] Add state: `[isModelfileParamsOpen, setIsModelfileParamsOpen] = useState(false)`
  - [x] Add `effectiveModelfileConfig` useMemo
  - [x] Add `handleModelfileConfigChange` callback (following existing pattern)
  - [x] Add `handleResetModelfileConfig` callback
  - [x] Create collapsible section "Ollama Modelfile" with:
    - [x] `temperature` - Input type="number" step="0.1" min="0" max="2"
    - [x] `top_p` - Input type="number" step="0.05" min="0" max="1"
    - [x] `top_k` - Input type="number" min="1" max="100"
    - [x] `system` - Textarea with placeholder
    - [x] `stop` - Tag input with add/remove buttons
    - [x] `repeat_penalty` - Input type="number" step="0.05" min="1" max="2"
    - [x] `repeat_last_n` - Input type="number" min="0" max="512"
    - [x] `num_ctx` - Select with options: 2048, 4096, 8192, 16384

- [x] Update translations:
  - [x] Add `modelfileParams` section to `/workspace/ui/src/i18n/types.ts`
  - [x] Add English translations to `/workspace/ui/src/i18n/locales/en.ts`
  - [x] Add German translations to `/workspace/ui/src/i18n/locales/de.ts`

---

## Phase 3: Backend - Extended Training Parameters ✅

**Goal:** Add additional training parameters to the project model.

- [x] Extend `TrainingConfig` in `/workspace/api/models/project.py`:
  - [x] `weight_decay: float | None = Field(None, ge=0.0, le=0.2, description="...")`
  - [x] `max_grad_norm: float | None = Field(None, ge=0.1, le=2.0, description="...")`
  - [x] `lr_scheduler_type: str | None = Field(None, max_length=30, description="...")`
  - [x] `neftune_noise_alpha: float | None = Field(None, ge=0, le=20, description="...")`
  - [x] `seed: int | None = Field(None, ge=0, description="...")`
  - [x] `bf16: bool | None = Field(None, description="...")`
  - [x] `logging_steps: int | None = Field(None, ge=1, le=1000, description="...")`
  - [x] `save_strategy: str | None = Field(None, max_length=10, description="...")`

- [x] Update `/workspace/api/services/training_service.py`:
  - [x] Add default constants:
    ```python
    DEFAULT_WEIGHT_DECAY = 0.01
    DEFAULT_MAX_GRAD_NORM = 1.0
    DEFAULT_LR_SCHEDULER_TYPE = "linear"
    DEFAULT_SEED = 42
    DEFAULT_LOGGING_STEPS_CUDA = 10
    DEFAULT_LOGGING_STEPS_CPU = 5
    DEFAULT_SAVE_STRATEGY = "epoch"
    ```
  - [x] Update `get_effective_training_config()` to include new parameters
  - [x] Update `_train()` to apply:
    - [x] `weight_decay` in TrainingArguments
    - [x] `max_grad_norm` in TrainingArguments
    - [x] `lr_scheduler_type` in TrainingArguments
    - [x] `neftune_noise_alpha` in TrainingArguments (only when set/non-zero)
    - [x] `seed` in TrainingArguments
    - [x] `bf16` in TrainingArguments (mutually exclusive with fp16)
    - [x] `logging_steps` in TrainingArguments
    - [x] `save_strategy` in TrainingArguments

---

## Phase 4: UI - Extended Training Parameters ✅

**Goal:** Add extended training parameter controls in the Advanced tab.

- [x] Update `/workspace/ui/src/types/project.ts`:
  - [x] Extend `TrainingConfig` interface with:
    ```typescript
    weight_decay?: number | null;
    max_grad_norm?: number | null;
    lr_scheduler_type?: string | null;
    neftune_noise_alpha?: number | null;
    seed?: number | null;
    bf16?: boolean | null;
    logging_steps?: number | null;
    save_strategy?: string | null;
    ```

- [x] Extend Training Parameters section in `/workspace/ui/src/pages/project-detail.tsx`:
  - [x] `weight_decay` - Input type="number" step="0.01" min="0" max="0.2"
  - [x] `max_grad_norm` - Input type="number" step="0.1" min="0.1" max="2"
  - [x] `lr_scheduler_type` - Select: linear, cosine, constant, polynomial
  - [x] `neftune_noise_alpha` - Input type="number" step="1" min="0" max="20" (0=disabled)
  - [x] `seed` - Input type="number" min="0" placeholder="42"
  - [x] `bf16` - Switch (with note about GPU compatibility)
  - [x] `logging_steps` - Input type="number" min="1" max="1000"
  - [x] `save_strategy` - Select: no, epoch, steps

- [x] Update translations:
  - [x] Extend `trainingParams` in `/workspace/ui/src/i18n/types.ts`
  - [x] Add English translations to `/workspace/ui/src/i18n/locales/en.ts`
  - [x] Add German translations to `/workspace/ui/src/i18n/locales/de.ts`

---

## Phase 5: Backend - Advanced LoRA Features ✅

**Goal:** Add advanced LoRA configuration options.

- [x] Extend `ProjectLoraConfig` in `/workspace/api/models/project.py`:
  - [x] `bias: str | None = Field(None, max_length=10, description="...")`
  - [x] `use_rslora: bool | None = Field(None, description="...")`
  - [x] `use_dora: bool | None = Field(None, description="...")`
  - [x] `modules_to_save: list[str] | None = Field(None, description="...")`

- [x] Update `/workspace/api/services/training_service.py`:
  - [x] Add default constants:
    ```python
    DEFAULT_LORA_BIAS = "none"
    DEFAULT_USE_RSLORA = False
    DEFAULT_USE_DORA = False
    ```
  - [x] Update `get_effective_lora_config()` to include new parameters
  - [x] Update `_setup_lora()` to apply:
    - [x] `bias` parameter in LoraConfig
    - [x] `use_rslora` parameter in LoraConfig
    - [x] `use_dora` parameter in LoraConfig
    - [x] `modules_to_save` parameter in LoraConfig

---

## Phase 6: UI - Advanced LoRA Features ✅

**Goal:** Add advanced LoRA configuration controls.

- [x] Update `/workspace/ui/src/types/project.ts`:
  - [x] Extend `LoraConfig` interface with:
    ```typescript
    bias?: string | null;
    use_rslora?: boolean | null;
    use_dora?: boolean | null;
    modules_to_save?: string[] | null;
    ```

- [x] Extend LoRA Configuration section in `/workspace/ui/src/pages/project-detail.tsx`:
  - [x] `bias` - Select: none (default), lora_only, all
  - [x] `use_rslora` - Switch with tooltip (recommended for Rank >= 64)
  - [x] `use_dora` - Switch with tooltip (experimental)
  - [x] `modules_to_save` - Checkboxes: lm_head, embed_tokens

- [x] Update translations:
  - [x] Extend `loraParams` in `/workspace/ui/src/i18n/types.ts`
  - [x] Add English translations to `/workspace/ui/src/i18n/locales/en.ts`
  - [x] Add German translations to `/workspace/ui/src/i18n/locales/de.ts`

---

## Phase 7: Backend - Extended Quantization Options ✅

**Goal:** Add compute dtype option to quantization config.

- [x] Extend `QuantizationConfig` in `/workspace/api/models/project.py`:
  - [x] `bnb_4bit_compute_dtype: str | None = Field(None, max_length=10, description="...")`

- [x] Update `/workspace/api/services/training_service.py`:
  - [x] Add default constant: `DEFAULT_BNB_4BIT_COMPUTE_DTYPE = "float16"`
  - [x] Update `get_effective_quantization_config()` to include compute_dtype
  - [x] Update `_load_model()` to apply compute_dtype:
    ```python
    dtype_map = {"float16": torch.float16, "bfloat16": torch.bfloat16, "float32": torch.float32}
    compute_dtype = dtype_map.get(quant_cfg["bnb_4bit_compute_dtype"], torch.float16)
    ```

---

## Phase 8: UI - Extended Quantization Options ✅

**Goal:** Add compute dtype control to Quantization section.

- [x] Update `/workspace/ui/src/types/project.ts`:
  - [x] Extend `QuantizationConfig` interface with:
    ```typescript
    bnb_4bit_compute_dtype?: string | null;
    ```

- [x] Extend Quantization section in `/workspace/ui/src/pages/project-detail.tsx`:
  - [x] `bnb_4bit_compute_dtype` - Select: float16 (default), bfloat16 (RTX 3000+), float32

- [x] Update translations:
  - [x] Extend `quantizationParams` in `/workspace/ui/src/i18n/types.ts`
  - [x] Add English translations to `/workspace/ui/src/i18n/locales/en.ts`
  - [x] Add German translations to `/workspace/ui/src/i18n/locales/de.ts`

---

## Phase 9: Testing and Polish ✅

**Goal:** Ensure everything works correctly and update documentation.

- [x] Verify backend:
  - [x] All new parameters are correctly saved to project.json
  - [x] Training uses project-specific parameters
  - [x] Ollama modelfile is generated with correct parameters
  - [x] Default values work when no config is set
  - [x] Python compilation passes (`python3 -m py_compile`)

- [x] Verify frontend:
  - [x] TypeScript build passes (`npx tsc --noEmit`)
  - [x] All fields save correctly via auto-save
  - [x] Reset buttons work for all sections
  - [x] Fields are disabled during training

- [x] Verify translations:
  - [x] All translations are complete (EN/DE)
  - [x] No missing translation keys (enforced by TranslationSchema type)

- [x] Update README.md:
  - [x] Add Ollama Modelfile Parameters table
  - [x] Update Training Parameters table with new options
  - [x] Update LoRA Parameters table with new options
  - [x] Update Quantization Parameters table with new option

---

## Summary of New Parameters

### Ollama Modelfile Parameters (Phase 1-2)

| Parameter       | Type     | Default                          | Range/Options                |
| --------------- | -------- | -------------------------------- | ---------------------------- |
| temperature     | float    | 0.7                              | 0.0 - 2.0                    |
| top_p           | float    | 0.9                              | 0.0 - 1.0                    |
| top_k           | int      | 40                               | 1 - 100                      |
| system          | str      | "You are a helpful assistant."   | free text (max 2000)         |
| stop            | list     | ["### Question:"]                | list of strings              |
| repeat_penalty  | float    | 1.1                              | 1.0 - 2.0                    |
| repeat_last_n   | int      | 64                               | 0 - 512                      |
| num_ctx         | int      | 2048                             | 2048, 4096, 8192, 16384      |

### Extended Training Parameters (Phase 3-4)

| Parameter           | Type  | Default        | Range/Options                         |
| ------------------- | ----- | -------------- | ------------------------------------- |
| weight_decay        | float | 0.01           | 0.0 - 0.2                             |
| max_grad_norm       | float | 1.0            | 0.1 - 2.0                             |
| lr_scheduler_type   | str   | "linear"       | linear, cosine, constant, polynomial  |
| neftune_noise_alpha | float | 0 (disabled)   | 0 - 20 (0=disabled)                   |
| seed                | int   | 42             | any positive integer                  |
| bf16                | bool  | false          | true/false (Ampere+ GPUs only)        |
| logging_steps       | int   | 10 (CUDA)      | 1 - 100                               |
| save_strategy       | str   | "epoch"        | no, epoch, steps                      |

### Advanced LoRA Parameters (Phase 5-6)

| Parameter       | Type   | Default | Options/Range              |
| --------------- | ------ | ------- | -------------------------- |
| bias            | str    | "none"  | none, lora_only, all       |
| use_rslora      | bool   | false   | true/false                 |
| use_dora        | bool   | false   | true/false                 |
| modules_to_save | list   | []      | lm_head, embed_tokens      |

### Extended Quantization Parameters (Phase 7-8)

| Parameter              | Type | Default   | Options                     |
| ---------------------- | ---- | --------- | --------------------------- |
| bnb_4bit_compute_dtype | str  | "float16" | float16, bfloat16, float32  |
