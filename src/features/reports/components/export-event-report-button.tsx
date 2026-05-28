"use client";

import { useState } from "react";
import { generateEventReport } from "../../../lib/generate-event-report";
import { fetchEventReportData } from "../api/fetch-event-report-data";
import { Button } from "@heroui/button";

// Types

type ExportState = "idle" | "loading" | "success" | "error";

interface ExportEventReportButtonProps {
  eventId: number;
  label?: string;
  onError?: (err: Error) => void;
}

// Component

export function ExportEventReportButton({
  eventId,
  label = "Exportar reporte",
  onError,
}: ExportEventReportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExport() {
    setState("loading");
    setErrorMessage(null);

    try {
      // 1. Fetch report data from the API
      const reportData = await fetchEventReportData(eventId);

      // 2. Generate the Excel file
      const blob = await generateEventReport(reportData);

      // 3. Trigger browser download
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `event-report-${eventId}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setState("success");

      // Reset to idle after 3 s
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrorMessage('No se pudo descargar el reporte');
      setState("error");
      onError?.(error);

      // Reset to idle after 5 s
      setTimeout(() => {
        setState("idle");
        setErrorMessage(null);
      }, 5000);
    }
  }

  const isDisabled = state === "loading" || state === "success";

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <Button
        type="button"
        onClick={handleExport}
        disabled={isDisabled}
        aria-live="polite"
        aria-busy={state === "loading"}
        variant={state === "idle" ? "faded" : "flat"}
        className={["transition-all duration-500",
          // State variants
          state === "idle" &&
            "border text-white bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 hover:bg-white/10 active:bg-cyan-500",
          state === "loading" &&
            "cursor-not-allowed bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 text-white",
          state === "success" &&
            "bg-cyan-400 cursor-default text-white",
          state === "error" &&
            "bg-red-600 text-white hover:bg-red-700",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Icon */}
        {state === "loading" && <SpinnerIcon />}
        {state === "success" && <CheckIcon />}
        {state === "error" && <AlertIcon />}
        {state === "idle" && <DownloadIcon />}

        {/* Label */}
        {state === "idle" && label}
        {state === "loading" && "Generando…"}
        {state === "success" && "¡Descargado!"}
        {state === "error" && "Reintentar"}
      </Button>

      {/* Inline error message */}
      {state === "error" && errorMessage && (
        <p className="max-w-xs text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── Inline SVG icons (zero external dependencies) ────────────────────────────

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}