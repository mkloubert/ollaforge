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

import { useCallback, useEffect, useRef } from "react";
import { AlertCircle, FolderOpen, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { DataFilePreviewDialog } from "@/components/data-file-preview-dialog";
import { AdvancedConfigTab, BasicConfigTab, TrainingStatusPanel } from "@/components/project-detail";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataFiles } from "@/hooks/useDataFiles";
import { useFileManagement } from "@/hooks/useFileManagement";
import { useModels } from "@/hooks/useModels";
import { useOllama } from "@/hooks/useOllama";
import { useProject } from "@/hooks/useProject";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { useTraining } from "@/hooks/useTraining";
import { updateProject } from "@/lib/projects";
import type { TrainingStatus } from "@/types";

const ACTIVE_STATUSES: TrainingStatus[] = [
  "starting",
  "loading_data",
  "loading_model",
  "training",
  "exporting",
  "converting",
];

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Data hooks
  const { project, isLoading, error, notFound, refetch } = useProject(slug);
  const { models, isLoading: modelsLoading } = useModels();
  const { files, isLoading: filesLoading, isUploading, upload, remove } = useDataFiles(slug);
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
    isRunning: isRunningInOllama,
    checkExists: checkOllamaExists,
    run: runInOllama,
  } = useOllama(slug);

  // Configuration hook
  const config = useProjectConfig({ project, slug, models });

  // File management hook
  const fileManagement = useFileManagement({ remove, trainingFileStatuses });

  // Derived state
  const isTrainingActive = ACTIVE_STATUSES.includes(trainingStatus);
  const canStartTraining =
    config.effectiveSelectedModel !== "" && files.length > 0 && !isTrainingActive && !isStarting;

  // Training handlers
  const handleStartTraining = useCallback(async () => {
    if (!canStartTraining || !project || !slug) return;

    try {
      await updateProject(slug, {
        name: project.name,
        description: project.description,
        model: config.effectiveSelectedModel,
        target_name: config.effectiveTargetName || null,
      });
    } catch {
      // Continue with training even if save fails
    }

    await startTraining({
      model_name: config.effectiveSelectedModel,
      data_files: files.map((f) => f.filename),
    });
  }, [canStartTraining, startTraining, config.effectiveSelectedModel, config.effectiveTargetName, files, project, slug]);

  const handleCancelTraining = useCallback(async () => {
    await cancelTraining();
  }, [cancelTraining]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  // Error state
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

  // Not found state
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(400px,520px)_1fr] gap-6">
          {/* Left Side - Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("project.configuration")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="basic" className="flex-1">
                    {t("project.tabs.basic")}
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1">
                    {t("project.tabs.advanced")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4">
                  <BasicConfigTab
                    models={config.combinedModels}
                    selectedModel={config.effectiveSelectedModel}
                    onModelChange={config.handleModelChange}
                    modelsLoading={modelsLoading}
                    targetName={config.effectiveTargetName}
                    onTargetNameChange={config.handleTargetNameChange}
                    targetNamePlaceholder={config.defaultTargetName}
                    files={files}
                    filesLoading={filesLoading}
                    isUploading={isUploading}
                    fileStatusMap={fileManagement.fileStatusMap}
                    fileErrorCounts={fileManagement.fileErrorCounts}
                    onUpload={upload}
                    onDelete={fileManagement.handleDelete}
                    onPreview={fileManagement.handlePreview}
                    isTrainingActive={isTrainingActive}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="mt-4">
                  <AdvancedConfigTab
                    isHelpPanelOpen={config.isHelpPanelOpen}
                    onHelpPanelOpenChange={config.setIsHelpPanelOpen}
                    docLinks={config.docLinks}
                    isPresetsOpen={config.isPresetsOpen}
                    onPresetsOpenChange={config.setIsPresetsOpen}
                    selectedModel={config.effectiveSelectedModel}
                    availableModels={models}
                    onApplyPreset={config.handleApplyPreset}
                    onModelSelect={config.handleModelChange}
                    isTrainingParamsOpen={config.isTrainingParamsOpen}
                    onTrainingParamsOpenChange={config.setIsTrainingParamsOpen}
                    trainingConfig={config.effectiveTrainingConfig}
                    onTrainingConfigChange={config.handleTrainingConfigChange}
                    onResetTrainingConfig={config.handleResetTrainingConfig}
                    isLoraParamsOpen={config.isLoraParamsOpen}
                    onLoraParamsOpenChange={config.setIsLoraParamsOpen}
                    loraConfig={config.effectiveLoraConfig}
                    onLoraConfigChange={config.handleLoraConfigChange}
                    onResetLoraConfig={config.handleResetLoraConfig}
                    isQuantizationParamsOpen={config.isQuantizationParamsOpen}
                    onQuantizationParamsOpenChange={config.setIsQuantizationParamsOpen}
                    quantizationConfig={config.effectiveQuantizationConfig}
                    onQuantizationConfigChange={config.handleQuantizationConfigChange}
                    onResetQuantizationConfig={config.handleResetQuantizationConfig}
                    isModelfileParamsOpen={config.isModelfileParamsOpen}
                    onModelfileParamsOpenChange={config.setIsModelfileParamsOpen}
                    modelfileConfig={config.effectiveModelfileConfig}
                    onModelfileConfigChange={config.handleModelfileConfigChange}
                    onResetModelfileConfig={config.handleResetModelfileConfig}
                    validationErrors={config.validationErrors}
                    disabled={isTrainingActive}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right Side - Status */}
          <TrainingStatusPanel
            trainingStatus={trainingStatus}
            trainingProgress={trainingProgress}
            isTrainingActive={isTrainingActive}
            isStarting={isStarting}
            canStartTraining={canStartTraining}
            tasks={tasks}
            hasModel={config.effectiveSelectedModel !== ""}
            hasFiles={files.length > 0}
            ollamaModelExists={ollamaModelExists}
            isRunningInOllama={isRunningInOllama}
            onStart={handleStartTraining}
            onCancel={handleCancelTraining}
            onRunInOllama={handleRunInOllama}
          />
        </div>
      </div>

      {/* Data File Preview Dialog */}
      <DataFilePreviewDialog
        projectSlug={slug || ""}
        filename={fileManagement.previewFile}
        open={fileManagement.previewFile !== null}
        onOpenChange={(open) => !open && fileManagement.handleClosePreview()}
        onErrorCountChange={fileManagement.handleFileErrorCountChange}
      />
    </div>
  );
}
