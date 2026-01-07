// OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
// Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  ExternalLink,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Loader2,
  Play,
  Rocket,
  Package,
  RotateCcw,
  SkipForward,
  Sparkles,
  StopCircle,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { DataFilePreviewDialog } from "@/components/data-file-preview-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDataFiles } from "@/hooks/useDataFiles";
import { useModels } from "@/hooks/useModels";
import { useOllama } from "@/hooks/useOllama";
import { useProject } from "@/hooks/useProject";
import { useTraining } from "@/hooks/useTraining";
import { updateProject } from "@/lib/projects";
import type { DataFileStatus, LoraConfig, Model, QuantizationConfig, TaskStatus, TrainingConfig, TrainingStatus, TrainingTask } from "@/types";

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-500" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function TaskItem({ task, t }: { task: TrainingTask; t: (key: string, data?: Record<string, unknown>) => string }) {
  const showProgress = task.status === "in_progress" && task.progress > 0;
  const hasWarnings = task.error_count > 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <TaskStatusIcon status={task.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${task.status === "pending"
                ? "text-muted-foreground"
                : task.status === "failed"
                  ? "text-red-500"
                  : task.status === "skipped"
                    ? "text-muted-foreground"
                    : ""
                }`}
            >
              {t(`training.tasks.${task.task_id}`)}
            </span>
            {hasWarnings && (
              <span
                className="flex items-center gap-1 text-amber-500"
                title={t("training.taskWarnings", { count: task.error_count })}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs">{task.error_count}</span>
              </span>
            )}
          </div>
          {showProgress && (
            <span className="text-xs text-muted-foreground">{task.progress}%</span>
          )}
        </div>
        {showProgress && (
          <Progress value={task.progress} className="h-1 mt-1" />
        )}
      </div>
    </div>
  );
}

function FileStatusIcon({ status }: { status: TaskStatus | undefined }) {
  if (!status) return null;

  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-500 shrink-0" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />;
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
    default:
      return null;
  }
}

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { project, isLoading, error, notFound, refetch } = useProject(slug);
  const { models, isLoading: modelsLoading } = useModels();
  const {
    files,
    isLoading: filesLoading,
    isUploading,
    upload,
    remove,
  } = useDataFiles(slug);
  const {
    status: trainingStatus,
    progress: trainingProgress,
    isStarting,
    tasks,
    fileStatuses: trainingFileStatuses,
    error: trainingError,
    start: startTraining,
    cancel: cancelTraining,
    clearError,
  } = useTraining(slug);
  const {
    modelExists: ollamaModelExists,
    isCreating: isCreatingInOllama,
    isRunning: isRunningInOllama,
    checkExists: checkOllamaExists,
    create: createInOllama,
    run: runInOllama,
  } = useOllama(slug);

  // Local overrides for model and target name (null = use project value)
  const [selectedModelOverride, setSelectedModelOverride] = useState<string | null>(null);
  const [targetNameOverride, setTargetNameOverride] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [fileErrorCounts, setFileErrorCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced config state
  const [trainingConfigOverride, setTrainingConfigOverride] = useState<TrainingConfig | null>(null);
  const [loraConfigOverride, setLoraConfigOverride] = useState<LoraConfig | null>(null);
  const [quantizationConfigOverride, setQuantizationConfigOverride] = useState<QuantizationConfig | null>(null);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(true);
  const [isTrainingParamsOpen, setIsTrainingParamsOpen] = useState(false);
  const [isLoraParamsOpen, setIsLoraParamsOpen] = useState(false);
  const [isQuantizationParamsOpen, setIsQuantizationParamsOpen] = useState(false);

  // Documentation links (configurable via environment variables)
  const docLinks = useMemo(() => ({
    transformers: import.meta.env.VITE_DOC_LINK_TRANSFORMERS || "https://huggingface.co/docs/transformers/training",
    qlora: import.meta.env.VITE_DOC_LINK_QLORA || "https://arxiv.org/abs/2305.14314",
    lora: import.meta.env.VITE_DOC_LINK_LORA || "https://huggingface.co/docs/peft/main/en/conceptual_guides/lora",
    huggingface: import.meta.env.VITE_DOC_LINK_HUGGINGFACE || "https://huggingface.co/docs/transformers",
  }), []);

  // Combined models list: API models + saved project model (if not already in list)
  const combinedModels = useMemo((): Model[] => {
    const savedModel = project?.model;
    if (!savedModel || savedModel.trim() === "") {
      return models;
    }

    // Check if saved model already exists in the list
    const exists = models.some((m) => m.name === savedModel);
    if (exists) {
      return models;
    }

    // Add saved model to the beginning of the list
    return [{ name: savedModel }, ...models];
  }, [models, project]);

  // Effective selected model: local override > project value > auto-select single model
  const effectiveSelectedModel = useMemo(() => {
    if (selectedModelOverride !== null) return selectedModelOverride;
    if (project?.model && project.model.trim() !== "") return project.model;
    if (combinedModels.length === 1) return combinedModels[0].name;
    return "";
  }, [selectedModelOverride, project, combinedModels]);

  // Effective target name: local override > project value
  const effectiveTargetName = useMemo(() => {
    if (targetNameOverride !== null) return targetNameOverride;
    if (project?.target_name && project.target_name.trim() !== "") return project.target_name;
    return "";
  }, [targetNameOverride, project]);

  // Calculate default target name placeholder: <base-model-without-owner>-<project-slug>
  const defaultTargetName = useMemo(() => {
    if (!effectiveSelectedModel || !slug) return "";

    // Extract model name without owner (e.g., "unsloth/llama-3-8b" -> "llama-3-8b")
    const modelName = effectiveSelectedModel.includes("/")
      ? effectiveSelectedModel.split("/").pop() || effectiveSelectedModel
      : effectiveSelectedModel;

    return `${modelName}-${slug}`;
  }, [effectiveSelectedModel, slug]);

  // Create a map from filename to training file status
  const fileStatusMap = useMemo(() => {
    const map = new Map<string, DataFileStatus>();
    for (const fs of trainingFileStatuses) {
      map.set(fs.filename, fs);
    }
    return map;
  }, [trainingFileStatuses]);

  // Effective training config: local override > project value
  const effectiveTrainingConfig = useMemo((): TrainingConfig => {
    const projectConfig = project?.training_config || {};
    const overrideConfig = trainingConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, trainingConfigOverride]);

  // Effective LoRA config: local override > project value
  const effectiveLoraConfig = useMemo((): LoraConfig => {
    const projectConfig = project?.lora_config || {};
    const overrideConfig = loraConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, loraConfigOverride]);

  // Effective Quantization config: local override > project value
  const effectiveQuantizationConfig = useMemo((): QuantizationConfig => {
    const projectConfig = project?.quantization_config || {};
    const overrideConfig = quantizationConfigOverride || {};
    return { ...projectConfig, ...overrideConfig };
  }, [project, quantizationConfigOverride]);

  // Handle training config change and persist to project
  const handleTrainingConfigChange = useCallback(
    async <K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) => {
      const newConfig = { ...effectiveTrainingConfig, [key]: value };
      setTrainingConfigOverride(newConfig);

      // Persist to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: newConfig,
            lora_config: project.lora_config,
            quantization_config: project.quantization_config,
          });
        } catch {
          // Silent fail - config is still set locally
        }
      }
    },
    [effectiveTrainingConfig, effectiveSelectedModel, effectiveTargetName, project, slug]
  );

  // Handle LoRA config change and persist to project
  const handleLoraConfigChange = useCallback(
    async <K extends keyof LoraConfig>(key: K, value: LoraConfig[K]) => {
      const newConfig = { ...effectiveLoraConfig, [key]: value };
      setLoraConfigOverride(newConfig);

      // Persist to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: project.training_config,
            lora_config: newConfig,
            quantization_config: project.quantization_config,
          });
        } catch {
          // Silent fail - config is still set locally
        }
      }
    },
    [effectiveLoraConfig, effectiveSelectedModel, effectiveTargetName, project, slug]
  );

  // Handle Quantization config change and persist to project
  const handleQuantizationConfigChange = useCallback(
    async <K extends keyof QuantizationConfig>(key: K, value: QuantizationConfig[K]) => {
      const newConfig = { ...effectiveQuantizationConfig, [key]: value };
      setQuantizationConfigOverride(newConfig);

      // Persist to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: effectiveTargetName || null,
            training_config: project.training_config,
            lora_config: project.lora_config,
            quantization_config: newConfig,
          });
        } catch {
          // Silent fail - config is still set locally
        }
      }
    },
    [effectiveQuantizationConfig, effectiveSelectedModel, effectiveTargetName, project, slug]
  );

  // Reset Training config to defaults
  const handleResetTrainingConfig = useCallback(async () => {
    setTrainingConfigOverride({});

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: {},
          lora_config: project.lora_config,
          quantization_config: project.quantization_config,
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  // Reset LoRA config to defaults
  const handleResetLoraConfig = useCallback(async () => {
    setLoraConfigOverride({});

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: project.training_config,
          lora_config: {},
          quantization_config: project.quantization_config,
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  // Reset Quantization config to defaults
  const handleResetQuantizationConfig = useCallback(async () => {
    setQuantizationConfigOverride({});

    if (project && slug) {
      try {
        await updateProject(slug, {
          name: project.name,
          description: project.description,
          model: effectiveSelectedModel || null,
          target_name: effectiveTargetName || null,
          training_config: project.training_config,
          lora_config: project.lora_config,
          quantization_config: {},
        });
      } catch {
        // Silent fail
      }
    }
  }, [effectiveSelectedModel, effectiveTargetName, project, slug]);

  // Handle model selection change and persist to project
  const handleModelChange = useCallback(
    async (value: string) => {
      setSelectedModelOverride(value);

      // Persist model selection to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: value,
            target_name: effectiveTargetName || null,
          });
        } catch {
          // Silent fail - model is still selected locally
        }
      }
    },
    [project, slug, effectiveTargetName]
  );

  // Handle target name change and persist to project
  const handleTargetNameChange = useCallback(
    async (value: string) => {
      setTargetNameOverride(value);

      // Persist target name to project
      if (project && slug) {
        try {
          await updateProject(slug, {
            name: project.name,
            description: project.description,
            model: effectiveSelectedModel || null,
            target_name: value || null,
          });
        } catch {
          // Silent fail - target name is still set locally
        }
      }
    },
    [project, slug, effectiveSelectedModel]
  );

  const ACTIVE_STATUSES: TrainingStatus[] = [
    "starting",
    "loading_data",
    "loading_model",
    "training",
    "exporting",
    "converting",
  ];

  const isTrainingActive = ACTIVE_STATUSES.includes(trainingStatus);
  const canStartTraining =
    effectiveSelectedModel !== "" && files.length > 0 && !isTrainingActive && !isStarting;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        if (file.name.endsWith(".jsonl")) {
          await upload(file);
        }
      }
    },
    [upload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      for (const file of Array.from(selectedFiles)) {
        if (file.name.endsWith(".jsonl")) {
          await upload(file);
        }
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDelete = useCallback(
    async (filename: string) => {
      await remove(filename);
      // Clear error count for deleted file
      setFileErrorCounts((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
    },
    [remove]
  );

  const handleFileErrorCountChange = useCallback(
    (filename: string, errorCount: number) => {
      setFileErrorCounts((prev) => ({
        ...prev,
        [filename]: errorCount,
      }));
    },
    []
  );

  const handleStartTraining = useCallback(async () => {
    if (!canStartTraining || !project || !slug) return;

    // Save current model before starting training
    try {
      await updateProject(slug, {
        name: project.name,
        description: project.description,
        model: effectiveSelectedModel,
        target_name: effectiveTargetName || null,
      });
    } catch {
      // Continue with training even if save fails
    }

    await startTraining({
      model_name: effectiveSelectedModel,
      data_files: files.map((f) => f.filename),
    });
  }, [canStartTraining, startTraining, effectiveSelectedModel, effectiveTargetName, files, project, slug]);

  const handleCancelTraining = useCallback(async () => {
    await cancelTraining();
  }, [cancelTraining]);

  const handleCreateInOllama = useCallback(async () => {
    const success = await createInOllama();
    if (success) {
      await checkOllamaExists();
    }
  }, [createInOllama, checkOllamaExists]);

  const handleRunInOllama = useCallback(async () => {
    await runInOllama();
  }, [runInOllama]);

  // Check Ollama status after successful training
  const prevTrainingStatusRef = useRef(trainingStatus);
  useEffect(() => {
    if (prevTrainingStatusRef.current !== trainingStatus) {
      if (trainingStatus === "completed") {
        checkOllamaExists();
      }
      prevTrainingStatusRef.current = trainingStatus;
    }
  }, [trainingStatus, checkOllamaExists]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t("common.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{t("errors.ERR_PROJECT_1002")}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              {t("project.backToProjects")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Error Dialog */}
      <AlertDialog open={!!trainingError && trainingStatus === "failed"} onOpenChange={(open) => !open && clearError()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t("training.errorTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(`errors.${trainingError}`, { defaultValue: t("errors.unknown") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={clearError}>
              {t("common.ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">{t("nav.projects")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

        </div>

        {/* Project Title Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              {project.name}
            </CardTitle>
            <CardDescription className="flex flex-col">
              <span className="font-mono text-xs text-muted-foreground/70 truncate">
                {project.path}
              </span>
              {project.description && (
                <span className="mt-2 line-clamp-2">{project.description}</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content - Left/Right Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(380px,480px)_1fr] gap-6">
          {/* Left Side - Configuration */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("project.configuration")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="basic" className="flex-1">
                      {t("project.tabs.basic")}
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1">
                      {t("project.tabs.advanced")}
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Tab */}
                  <TabsContent value="basic" className="flex flex-col gap-6 mt-4">
                    {/* Model Selection */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="model-select">
                        {t("project.selectModel")}
                      </Label>
                      <Select
                        value={effectiveSelectedModel}
                        onValueChange={handleModelChange}
                        disabled={modelsLoading || isTrainingActive}
                      >
                        <SelectTrigger id="model-select" className="w-full">
                          <SelectValue
                            placeholder={
                              modelsLoading
                                ? t("common.loading")
                                : t("project.selectModelPlaceholder")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {combinedModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target Model Name */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="target-name-input">
                        {t("project.targetName")}
                      </Label>
                      <Input
                        id="target-name-input"
                        value={effectiveTargetName}
                        onChange={(e) => handleTargetNameChange(e.target.value)}
                        placeholder={defaultTargetName || t("project.targetNamePlaceholder")}
                        disabled={isTrainingActive}
                      />
                    </div>

                    <Separator />

                    {/* Data Files Section */}
                    <div className="flex flex-col gap-3">
                      <Label>{t("dataFiles.title")}</Label>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jsonl"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      {/* Dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleUploadClick}
                        className={`
                          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                          transition-colors duration-200
                          ${isDragOver
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                          }
                          ${isUploading || isTrainingActive ? "pointer-events-none opacity-50" : ""}
                        `}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Spinner className="h-6 w-6" />
                            <span className="text-sm text-muted-foreground">
                              {t("dataFiles.uploading")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {isDragOver
                                ? t("dataFiles.dropzoneActive")
                                : t("dataFiles.dropzone")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File List */}
                      {filesLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner className="h-5 w-5" />
                        </div>
                      ) : files.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {t("dataFiles.empty")}
                        </p>
                      ) : (
                        <TooltipProvider>
                          <div className="flex flex-col gap-2">
                            {files.map((file) => {
                              const errorCount = fileErrorCounts[file.filename];
                              const hasErrors = errorCount !== undefined && errorCount > 0;
                              const fileStatus = fileStatusMap.get(file.filename);

                              return (
                                <div
                                  key={file.filename}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-70 transition-opacity cursor-pointer"
                                        onClick={() => setPreviewFile(file.filename)}
                                      >
                                        {/* Show status icon during training, otherwise file icon */}
                                        {fileStatus ? (
                                          <FileStatusIcon status={fileStatus.status} />
                                        ) : (
                                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {file.filename}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {file.size_formatted}
                                          </p>
                                        </div>
                                      </button>
                                    </TooltipTrigger>
                                    {fileStatus && (
                                      <TooltipContent>
                                        {t(`dataFiles.fileStatus.${fileStatus.status}`, {
                                          loaded: fileStatus.rows_loaded,
                                          skipped: fileStatus.rows_skipped,
                                        })}
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Validation error warning (only when not in training) */}
                                    {hasErrors && !fileStatus && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="p-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {t("dataFiles.errorCount", { count: errorCount })}
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDelete(file.filename)}
                                      disabled={isTrainingActive}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="flex flex-col gap-4 mt-4">
                    {/* Help Panel */}
                    <Collapsible open={isHelpPanelOpen} onOpenChange={setIsHelpPanelOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between p-3 h-auto">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{t("advancedConfig.helpPanel.title")}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isHelpPanelOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t("advancedConfig.helpPanel.description")}
                          </p>
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t("advancedConfig.helpPanel.learnMore")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={docLinks.transformers}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                {t("advancedConfig.helpPanel.links.transformers")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a
                                href={docLinks.qlora}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                {t("advancedConfig.helpPanel.links.qlora")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a
                                href={docLinks.lora}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                {t("advancedConfig.helpPanel.links.lora")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a
                                href={docLinks.huggingface}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                {t("advancedConfig.helpPanel.links.huggingface")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Training Parameters Section */}
                    <Collapsible open={isTrainingParamsOpen} onOpenChange={setIsTrainingParamsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                          <span className="font-medium">{t("advancedConfig.trainingParams.title")}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isTrainingParamsOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-4">
                        {/* Reset Button */}
                        <div className="flex justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={handleResetTrainingConfig}
                                disabled={isTrainingActive}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {t("advancedConfig.defaults.resetToDefaults")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("advancedConfig.defaults.resetConfirm")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Epochs */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="num-epochs">{t("advancedConfig.trainingParams.numEpochs")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.numEpochsHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="num-epochs"
                            type="number"
                            min={1}
                            max={10}
                            placeholder="3"
                            value={effectiveTrainingConfig.num_train_epochs ?? ""}
                            onChange={(e) => handleTrainingConfigChange("num_train_epochs", e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Batch Size */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="batch-size">{t("advancedConfig.trainingParams.batchSize")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.batchSizeHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="batch-size"
                            type="number"
                            min={1}
                            max={16}
                            placeholder="4 (GPU) / 1 (CPU)"
                            value={effectiveTrainingConfig.per_device_train_batch_size ?? ""}
                            onChange={(e) => handleTrainingConfigChange("per_device_train_batch_size", e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Gradient Accumulation */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="grad-accum">{t("advancedConfig.trainingParams.gradientAccumulation")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.gradientAccumulationHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="grad-accum"
                            type="number"
                            min={1}
                            max={32}
                            placeholder="4"
                            value={effectiveTrainingConfig.gradient_accumulation_steps ?? ""}
                            onChange={(e) => handleTrainingConfigChange("gradient_accumulation_steps", e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Learning Rate */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="learning-rate">{t("advancedConfig.trainingParams.learningRate")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.learningRateHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="learning-rate"
                            type="number"
                            step="0.0001"
                            min={0.000001}
                            max={0.01}
                            placeholder="0.0002 (GPU) / 0.0003 (CPU)"
                            value={effectiveTrainingConfig.learning_rate ?? ""}
                            onChange={(e) => handleTrainingConfigChange("learning_rate", e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Warmup Ratio */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="warmup-ratio">{t("advancedConfig.trainingParams.warmupRatio")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.warmupRatioHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="warmup-ratio"
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            placeholder="0.1 (GPU) / 0.03 (CPU)"
                            value={effectiveTrainingConfig.warmup_ratio ?? ""}
                            onChange={(e) => handleTrainingConfigChange("warmup_ratio", e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Max Token Length */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="max-length">{t("advancedConfig.trainingParams.maxLength")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.maxLengthHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={effectiveTrainingConfig.max_length?.toString() ?? ""}
                            onValueChange={(value) => handleTrainingConfigChange("max_length", value ? parseInt(value) : null)}
                            disabled={isTrainingActive}
                          >
                            <SelectTrigger id="max-length">
                              <SelectValue placeholder="512" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="512">512</SelectItem>
                              <SelectItem value="1024">1024</SelectItem>
                              <SelectItem value="2048">2048</SelectItem>
                              <SelectItem value="4096">4096</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* FP16 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="fp16">{t("advancedConfig.trainingParams.fp16")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.fp16Help")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            id="fp16"
                            checked={effectiveTrainingConfig.fp16 ?? false}
                            onCheckedChange={(checked) => handleTrainingConfigChange("fp16", checked)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Optimizer */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="optimizer">{t("advancedConfig.trainingParams.optimizer")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.trainingParams.optimizerHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={effectiveTrainingConfig.optim ?? ""}
                            onValueChange={(value) => handleTrainingConfigChange("optim", value || null)}
                            disabled={isTrainingActive}
                          >
                            <SelectTrigger id="optimizer">
                              <SelectValue placeholder={t("advancedConfig.trainingParams.optimizers.paged_adamw_8bit")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paged_adamw_8bit">{t("advancedConfig.trainingParams.optimizers.paged_adamw_8bit")}</SelectItem>
                              <SelectItem value="adamw_torch">{t("advancedConfig.trainingParams.optimizers.adamw_torch")}</SelectItem>
                              <SelectItem value="adamw_hf">{t("advancedConfig.trainingParams.optimizers.adamw_hf")}</SelectItem>
                              <SelectItem value="sgd">{t("advancedConfig.trainingParams.optimizers.sgd")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* LoRA Configuration Section */}
                    <Collapsible open={isLoraParamsOpen} onOpenChange={setIsLoraParamsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                          <span className="font-medium">{t("advancedConfig.loraParams.title")}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isLoraParamsOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-4">
                        {/* Reset Button */}
                        <div className="flex justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={handleResetLoraConfig}
                                disabled={isTrainingActive}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {t("advancedConfig.defaults.resetToDefaults")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("advancedConfig.defaults.resetConfirm")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Rank */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="lora-rank">{t("advancedConfig.loraParams.rank")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.loraParams.rankHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="lora-rank"
                            type="number"
                            min={4}
                            max={256}
                            placeholder="32"
                            value={effectiveLoraConfig.r ?? ""}
                            onChange={(e) => handleLoraConfigChange("r", e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Alpha */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="lora-alpha">{t("advancedConfig.loraParams.alpha")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.loraParams.alphaHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="lora-alpha"
                            type="number"
                            min={8}
                            max={512}
                            placeholder="64"
                            value={effectiveLoraConfig.lora_alpha ?? ""}
                            onChange={(e) => handleLoraConfigChange("lora_alpha", e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Dropout */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="lora-dropout">{t("advancedConfig.loraParams.dropout")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.loraParams.dropoutHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="lora-dropout"
                            type="number"
                            step="0.01"
                            min={0}
                            max={0.5}
                            placeholder="0.05"
                            value={effectiveLoraConfig.lora_dropout ?? ""}
                            onChange={(e) => handleLoraConfigChange("lora_dropout", e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Target Modules */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label>{t("advancedConfig.loraParams.targetModules")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.loraParams.targetModulesHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"] as const).map((module) => {
                              const currentModules = effectiveLoraConfig.target_modules ?? ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"];
                              const isChecked = currentModules.includes(module);
                              return (
                                <div key={module} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`module-${module}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newModules = e.target.checked
                                        ? [...currentModules, module]
                                        : currentModules.filter((m) => m !== module);
                                      handleLoraConfigChange("target_modules", newModules.length > 0 ? newModules : null);
                                    }}
                                    disabled={isTrainingActive}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <Label htmlFor={`module-${module}`} className="text-sm font-normal cursor-pointer">
                                    {t(`advancedConfig.loraParams.modules.${module}`)}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Quantization Configuration Section */}
                    <Collapsible open={isQuantizationParamsOpen} onOpenChange={setIsQuantizationParamsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                          <span className="font-medium">{t("advancedConfig.quantizationParams.title")}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isQuantizationParamsOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-4">
                        {/* Reset Button */}
                        <div className="flex justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={handleResetQuantizationConfig}
                                disabled={isTrainingActive}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {t("advancedConfig.defaults.resetToDefaults")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("advancedConfig.defaults.resetConfirm")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* CUDA-only info */}
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {t("advancedConfig.quantizationParams.cudaOnly")}
                        </p>

                        {/* Load in 4-bit */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="load-4bit">{t("advancedConfig.quantizationParams.loadIn4bit")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.quantizationParams.loadIn4bitHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            id="load-4bit"
                            checked={effectiveQuantizationConfig.load_in_4bit ?? true}
                            onCheckedChange={(checked) => handleQuantizationConfigChange("load_in_4bit", checked)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* 4-bit Quantization Type */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quant-type">{t("advancedConfig.quantizationParams.quantType")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.quantizationParams.quantTypeHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={effectiveQuantizationConfig.bnb_4bit_quant_type ?? "nf4"}
                            onValueChange={(value) => handleQuantizationConfigChange("bnb_4bit_quant_type", value)}
                            disabled={isTrainingActive}
                          >
                            <SelectTrigger id="quant-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nf4">{t("advancedConfig.quantizationParams.quantTypes.nf4")}</SelectItem>
                              <SelectItem value="fp4">{t("advancedConfig.quantizationParams.quantTypes.fp4")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Double Quantization */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="double-quant">{t("advancedConfig.quantizationParams.doubleQuant")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.quantizationParams.doubleQuantHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            id="double-quant"
                            checked={effectiveQuantizationConfig.bnb_4bit_use_double_quant ?? true}
                            onCheckedChange={(checked) => handleQuantizationConfigChange("bnb_4bit_use_double_quant", checked)}
                            disabled={isTrainingActive}
                          />
                        </div>

                        {/* Output Quantization */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="output-quant">{t("advancedConfig.quantizationParams.outputQuantization")}</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>{t("advancedConfig.quantizationParams.outputQuantizationHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={effectiveQuantizationConfig.output_quantization ?? "q8_0"}
                            onValueChange={(value) => handleQuantizationConfigChange("output_quantization", value)}
                            disabled={isTrainingActive}
                          >
                            <SelectTrigger id="output-quant">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="f32">{t("advancedConfig.quantizationParams.outputTypes.f32")}</SelectItem>
                              <SelectItem value="f16">{t("advancedConfig.quantizationParams.outputTypes.f16")}</SelectItem>
                              <SelectItem value="bf16">{t("advancedConfig.quantizationParams.outputTypes.bf16")}</SelectItem>
                              <SelectItem value="q8_0">{t("advancedConfig.quantizationParams.outputTypes.q8_0")}</SelectItem>
                              <SelectItem value="auto">{t("advancedConfig.quantizationParams.outputTypes.auto")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Status */}
          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {t("training.title")}
                  </CardTitle>
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      {/* Run in Ollama Button - visible when model exists in Ollama */}
                      {ollamaModelExists && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleRunInOllama}
                              disabled={isRunningInOllama}
                            >
                              {isRunningInOllama ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("ollama.runButton")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Create in Ollama Button - visible after successful training */}
                      {trainingStatus === "completed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleCreateInOllama}
                              disabled={isCreatingInOllama}
                            >
                              {isCreatingInOllama ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("ollama.createButton")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Create/Cancel Button */}
                      {isTrainingActive || isStarting ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={handleCancelTraining}
                              disabled={isStarting}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("training.cancelButton")}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              onClick={handleStartTraining}
                              disabled={!canStartTraining}
                            >
                              <Rocket className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("training.startButton")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 flex-1">
                {/* Idle State - Ready to create */}
                {trainingStatus === "idle" && tasks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {t("training.status.idle")}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      {!effectiveSelectedModel
                        ? t("training.noModel")
                        : files.length === 0
                          ? t("training.noDataFiles")
                          : t("training.readyDescription")}
                    </p>
                  </div>
                )}

                {/* Active Training Status */}
                {(isTrainingActive || tasks.length > 0) && trainingStatus !== "completed" && trainingStatus !== "cancelled" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("training.status." + trainingStatus)}
                      </span>
                      {trainingProgress?.device && (
                        <span className="text-xs text-muted-foreground">
                          {t("training.device")}: {trainingProgress.device.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Overall Progress Bar */}
                    {isTrainingActive && trainingProgress && trainingProgress.total_steps > 0 && (
                      <div className="flex flex-col gap-2">
                        <Progress value={(trainingProgress.current_step / trainingProgress.total_steps) * 100} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {t("training.step", {
                              current: trainingProgress.current_step,
                              total: trainingProgress.total_steps,
                            })}
                          </span>
                          <span>{Math.round((trainingProgress.current_step / trainingProgress.total_steps) * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Success Message */}
                {trainingStatus === "completed" && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-500">{t("training.completed")}</AlertTitle>
                    <AlertDescription className="text-green-600/80">
                      {t("training.completedDescription")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cancelled Message */}
                {trainingStatus === "cancelled" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("training.cancelled")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Task List */}
                {tasks.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col">
                      <Label className="mb-2">{t("training.taskList")}</Label>
                      <div className="flex flex-col divide-y divide-border/50">
                        {tasks.map((task) => (
                          <TaskItem key={task.task_id} task={task} t={t} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Data File Preview Dialog */}
      <DataFilePreviewDialog
        projectSlug={slug || ""}
        filename={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onErrorCountChange={handleFileErrorCountChange}
      />
    </div>
  );
}
