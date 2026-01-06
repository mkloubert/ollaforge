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

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Code, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDataFileContent } from "@/lib/dataFiles";
import type { DataFileContentResponse, DataFileRow } from "@/types";

interface DataFilePreviewDialogProps {
  projectSlug: string;
  filename: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onErrorCountChange?: (filename: string, errorCount: number) => void;
}

interface RawContentDialogProps {
  row: DataFileRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RawContentDialog({ row, open, onOpenChange }: RawContentDialogProps) {
  const { t } = useTranslation();

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {t("dataFiles.rawContentTitle", { line: row.line_number })}
          </DialogTitle>
          <DialogDescription>
            {t("dataFiles.rawContentLength", { count: row.raw_length })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0 bg-muted rounded-md p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap break-all">
            {row.raw}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DataFilePreviewDialog({
  projectSlug,
  filename,
  open,
  onOpenChange,
  onErrorCountChange,
}: DataFilePreviewDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataFileContentResponse | null>(null);
  const [rawContentRow, setRawContentRow] = useState<DataFileRow | null>(null);

  const loadContent = useCallback(async () => {
    if (!filename || !projectSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await fetchDataFileContent(projectSlug, filename);
      setData(content);

      // Report error count to parent
      if (onErrorCountChange) {
        const errorCount = content.rows.filter((row) => !row.is_valid).length;
        onErrorCountChange(filename, errorCount);
      }
    } catch {
      setError(t("dataFiles.previewError"));
    } finally {
      setIsLoading(false);
    }
  }, [filename, projectSlug, t, onErrorCountChange]);

  useEffect(() => {
    if (open && filename) {
      loadContent();
    } else {
      setData(null);
      setError(null);
      setRawContentRow(null);
    }
  }, [open, filename, loadContent]);

  // Extract column headers from valid rows
  const columns = useMemo(() => {
    if (!data || data.rows.length === 0) return [];

    // Collect all unique keys from all valid rows
    const allKeys = new Set<string>();
    for (const row of data.rows) {
      if (row.is_valid && row.data) {
        for (const key of Object.keys(row.data)) {
          allKeys.add(key);
        }
      }
    }

    return Array.from(allKeys);
  }, [data]);

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  };

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[90vw] w-full lg:max-w-6xl xl:max-w-7xl max-h-[85vh] flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {filename}
            </DialogTitle>
            <DialogDescription>
              {data && (
                <>
                  {t("dataFiles.previewRowCount", { count: data.total_rows })}
                  {data.truncated && (
                    <span className="text-amber-500 ml-2">
                      ({t("dataFiles.previewTruncated", { count: data.rows.length })})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto min-h-0">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && data && data.rows.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                {t("dataFiles.previewEmpty")}
              </div>
            )}

            {!isLoading && !error && data && data.rows.length > 0 && (
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className={col === "output" ? "w-2/3" : ""}
                      >
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow
                      key={row.line_number}
                      className={!row.is_valid ? "bg-destructive/10" : ""}
                    >
                      <TableCell className="text-center text-muted-foreground font-mono text-xs align-top">
                        {row.line_number}
                      </TableCell>
                      {row.is_valid && row.data ? (
                        columns.map((col) => (
                          <TableCell key={col} className="align-top">
                            <div className="line-clamp-3 whitespace-pre-wrap break-words">
                              {formatCellValue(row.data?.[col])}
                            </div>
                          </TableCell>
                        ))
                      ) : (
                        <TableCell colSpan={columns.length} className="align-top">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span className="text-sm font-medium">
                                {row.error
                                  ? t(`dataFiles.validationErrors.${row.error}` as never)
                                  : t("dataFiles.invalidRow")}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRawContentRow(row)}
                              className="shrink-0"
                            >
                              <Code className="h-3 w-3 mr-1" />
                              {t("dataFiles.showRawContent", { size: formatSize(row.raw_length) })}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RawContentDialog
        row={rawContentRow}
        open={rawContentRow !== null}
        onOpenChange={(isOpen) => !isOpen && setRawContentRow(null)}
      />
    </>
  );
}
