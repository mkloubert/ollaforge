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
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TrainingRow {
  id: string;
  instruction: string;
  output: string;
}

interface GeneratedDataTableProps {
  rows: TrainingRow[];
  onRowsChange: (rows: TrainingRow[]) => void;
  disabled?: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function isRowValid(row: TrainingRow): boolean {
  return row.instruction.trim() !== "" && row.output.trim() !== "";
}

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function EditableCell({
  value,
  onChange,
  isValid,
  disabled = false,
  placeholder,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
    }
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  }, [editValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      }
    },
    [value, handleBlur]
  );

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none text-sm"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`
        min-h-[40px] p-2 rounded cursor-pointer text-sm whitespace-pre-wrap
        hover:bg-muted/50 transition-colors
        ${!isValid ? "border border-destructive bg-destructive/5" : ""}
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      {value || (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </div>
  );
}

export function GeneratedDataTable({
  rows,
  onRowsChange,
  disabled = false,
}: GeneratedDataTableProps) {
  const { t } = useTranslation();

  const validationStats = useMemo(() => {
    const valid = rows.filter(isRowValid).length;
    return { valid, total: rows.length };
  }, [rows]);

  const handleInstructionChange = useCallback(
    (id: string, instruction: string) => {
      onRowsChange(
        rows.map((row) => (row.id === id ? { ...row, instruction } : row))
      );
    },
    [rows, onRowsChange]
  );

  const handleOutputChange = useCallback(
    (id: string, output: string) => {
      onRowsChange(
        rows.map((row) => (row.id === id ? { ...row, output } : row))
      );
    },
    [rows, onRowsChange]
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      onRowsChange(rows.filter((row) => row.id !== id));
    },
    [rows, onRowsChange]
  );

  const handleAddRow = useCallback(() => {
    const newRow: TrainingRow = {
      id: generateId(),
      instruction: "",
      output: "",
    };
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
        <p className="text-sm text-muted-foreground">
          {t("generateFromSources.results.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Validation Stats */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("generateFromSources.results.validRows", {
            valid: validationStats.valid,
            total: validationStats.total,
          })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("generateFromSources.results.addRow")}
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 border rounded-md overflow-auto">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead className="w-[45%]">
                  {t("generateFromSources.results.instruction")}
                </TableHead>
                <TableHead className="w-[45%]">
                  {t("generateFromSources.results.output")}
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const instructionValid = row.instruction.trim() !== "";
                const outputValid = row.output.trim() !== "";

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-center text-muted-foreground font-mono text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="align-top p-2">
                      <EditableCell
                        value={row.instruction}
                        onChange={(value) =>
                          handleInstructionChange(row.id, value)
                        }
                        isValid={instructionValid}
                        disabled={disabled}
                        placeholder={t("generateFromSources.results.instruction")}
                      />
                    </TableCell>
                    <TableCell className="align-top p-2">
                      <EditableCell
                        value={row.output}
                        onChange={(value) => handleOutputChange(row.id, value)}
                        isValid={outputValid}
                        disabled={disabled}
                        placeholder={t("generateFromSources.results.output")}
                      />
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteRow(row.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("generateFromSources.results.deleteRow")}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}
