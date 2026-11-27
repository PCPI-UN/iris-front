"use client";

import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { MutableRefObject, useState } from "react";

import { formatBytes, XLSX_MIME_TYPE } from "../utils/excel-file";

import { Button } from "@/components/ui/button";

type ExcelDropzoneProps = {
  inputRef: MutableRefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  isDisabled: boolean;
  /** e.g. "Extensión permitida: .xlsx (máximo 10 MB)" */
  hint: string;
  /** Accessible name of the hidden file input */
  inputLabel: string;
  onSelect: (file: File | null | undefined) => void;
  onClear: () => void;
};

/** Drag & drop area for the Excel of an import, with the chosen file below */
export const ExcelDropzone = ({
  inputRef,
  selectedFile,
  isDisabled,
  hint,
  inputLabel,
  onSelect,
  onClear,
}: ExcelDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-white/15 bg-white/[0.02] hover:border-white/30"
        }`}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDisabled) setIsDragging(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (isDisabled) return;
          onSelect(e.dataTransfer.files?.[0]);
        }}
      >
        <Upload className="mb-3 h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Arrastra aquí tu archivo Excel o selecciónalo desde tu equipo
        </p>
        <p className="mt-1 text-xs text-default-400">{hint}</p>

        <input
          ref={inputRef}
          accept={`.xlsx,${XLSX_MIME_TYPE}`}
          aria-label={inputLabel}
          className="sr-only"
          disabled={isDisabled}
          type="file"
          onChange={(e) => onSelect(e.target.files?.[0])}
        />

        <Button
          className="mt-4"
          isDisabled={isDisabled}
          size="sm"
          variant="bordered"
          onPress={() => inputRef.current?.click()}
        >
          Seleccionar archivo .xlsx
        </Button>
      </div>

      {selectedFile && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-default-400">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            color="danger"
            isDisabled={isDisabled}
            size="sm"
            startContent={<Trash2 className="h-4 w-4" />}
            variant="light"
            onPress={onClear}
          >
            Quitar archivo
          </Button>
        </div>
      )}
    </>
  );
};
