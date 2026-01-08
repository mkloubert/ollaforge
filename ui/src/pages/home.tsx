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

import { useState } from "react";
import { AlertCircle, ExternalLink, FolderOpen, Home, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjects } from "@/hooks/useProjects";
import { openProjectFolder } from "@/lib/projects";
import type { Project } from "@/types";

export function HomePage() {
  const { t } = useTranslation();
  const { projects, isLoading, error, refetch } = useProjects();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setProjectToEdit(null);
    refetch();
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    project: Project
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenFolderClick = async (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await openProjectFolder(project.slug);
    } catch {
      // Silently ignore errors - the folder might not open on headless systems
    }
  };

  const handleDeleteSuccess = () => {
    setProjectToDelete(null);
    refetch();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Home className="h-4 w-4" />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("nav.projects")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">{t("projects.createNew")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("projects.createNew")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : projects.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>{t("projects.empty")}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.slug} to={`/projects/${project.slug}`}>
                <Card className="group h-full transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        {project.name}
                      </span>
                      <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleOpenFolderClick(e, project)}
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">{t("projects.openFolder")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("projects.openFolder")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleEditClick(e, project)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">{t("common.edit")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.edit")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteClick(e, project)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("common.delete")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.delete")}</TooltipContent>
                        </Tooltip>
                      </span>
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
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditProjectDialog
        project={projectToEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      <DeleteProjectDialog
        project={projectToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
