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

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Circle,
  FileText,
  FolderOpen,
  Home,
  Loader2,
  Play,
  SkipForward,
  Square,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useDataFiles } from "@/hooks/useDataFiles";
import { useModels } from "@/hooks/useModels";
import { useProject } from "@/hooks/useProject";
import { useTraining } from "@/hooks/useTraining";
import type { TaskStatus, TrainingStatus, TrainingTask } from "@/types";

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

function TaskItem({ task, t }: { task: TrainingTask; t: (key: string) => string }) {
  const showProgress = task.status === "in_progress" && task.progress > 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <TaskStatusIcon status={task.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
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
    error: trainingError,
    start: startTraining,
    cancel: cancelTraining,
    clearError,
  } = useTraining(slug);

  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select model if only one exists and user hasn't made a selection
  const effectiveSelectedModel = useMemo(() => {
    if (selectedModel !== "") return selectedModel;
    if (models.length === 1) return models[0].name;
    return "";
  }, [selectedModel, models]);

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
    },
    [remove]
  );

  const handleStartTraining = useCallback(async () => {
    if (!canStartTraining) return;

    await startTraining({
      model_name: effectiveSelectedModel,
      data_files: files.map((f) => f.filename),
    });
  }, [canStartTraining, startTraining, effectiveSelectedModel, files]);

  const handleCancelTraining = useCallback(async () => {
    await cancelTraining();
  }, [cancelTraining]);

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

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project.backToProjects")}
            </Button>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Configuration */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("project.configuration")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Model Selection */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="model-select">
                    {t("project.selectModel")}
                  </Label>
                  <Select
                    value={effectiveSelectedModel}
                    onValueChange={setSelectedModel}
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
                      {models.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <div className="flex flex-col gap-2">
                      {files.map((file) => (
                        <div
                          key={file.filename}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.size_formatted}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDelete(file.filename)}
                            disabled={isTrainingActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Status */}
          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {t("project.status")}
                  </CardTitle>
                  {/* Create/Cancel Button */}
                  {isTrainingActive || isStarting ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelTraining}
                      disabled={isStarting}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {t("training.cancelButton")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleStartTraining}
                      disabled={!canStartTraining}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t("training.startButton")}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 flex-1">
                {/* Status Display */}
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

                  {/* Validation Messages */}
                  {!isTrainingActive && trainingStatus === "idle" && !effectiveSelectedModel && (
                    <p className="text-sm text-muted-foreground">
                      {t("training.noModel")}
                    </p>
                  )}
                  {!isTrainingActive && trainingStatus === "idle" && effectiveSelectedModel && files.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("training.noDataFiles")}
                    </p>
                  )}
                </div>

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
    </div>
  );
}
