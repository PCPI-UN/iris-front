"use client";

import type {
  ProjectImportExecuteResponse,
  ProjectImportPreviewResponse,
  ProjectImportTotals,
} from "../../types/project-import";

import { AlertTriangle, ArrowLeft, Download, FileDown } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { getFailedEffectLabel } from "../../api/create-project-admin";
import {
  downloadProjectImportTemplate,
  useExecuteProjectImport,
  usePreviewProjectImport,
} from "../../api/project-imports";
import {
  getProjectImportErrorMessage,
  MAX_PROJECT_IMPORT_FILE_SIZE_BYTES,
  MAX_PROJECT_IMPORT_ROWS,
  OUTCOME_META,
  parseProjectImportExecuteError,
} from "../../utils/project-import-helpers";

import { ProjectImportRowsTable } from "./project-import-rows-table";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { paths } from "@/config/paths";
import { useEvent } from "@/features/events/api/get-event";
import { ExcelDropzone } from "@/features/imports/components/excel-dropzone";
import { ImportStepper } from "@/features/imports/components/import-stepper";
import {
  buildCsv,
  parseValidEventId,
  triggerBlobDownload,
  validateExcelFile,
} from "@/features/imports/utils/excel-file";

const STEPS = [
  { number: 1, title: "Plantilla y archivo" },
  { number: 2, title: "Vista previa" },
  { number: 3, title: "Resumen" },
];

const ErrorBox = ({ children }: { children: React.ReactNode }) => (
  <p
    className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300"
    role="alert"
  >
    {children}
  </p>
);

const TotalsCards = ({
  totals,
  mode,
}: {
  totals: ProjectImportTotals;
  mode: "preview" | "execute";
}) => {
  const items = [
    { label: "Filas", value: totals.rows, className: "text-foreground" },
    {
      label: mode === "preview" ? "Por crear" : "Creados",
      value: totals.created,
      className: "text-emerald-400",
    },
    { label: "Omitidos", value: totals.skipped, className: "text-default-300" },
    { label: "Errores", value: totals.errors, className: "text-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <p className="text-xs text-default-400">{item.label}</p>
          <p className={`text-2xl font-bold ${item.className}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * /app/projects/import?event=: bulk upload of projects from the event's Excel
 * template. Same flow as the juror upload: template, file, preview (nothing
 * is created) and confirmation with a summary.
 */
export const ProjectImportView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = parseValidEventId(searchParams?.get("event"));
  const eventQuery = useEvent({ eventId: eventId ?? 0 });
  const eventName = eventQuery.data?.data?.name;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [preview, setPreview] = useState<ProjectImportPreviewResponse | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectImportExecuteResponse | null>(
    null,
  );

  const previewMutation = usePreviewProjectImport();
  const executeMutation = useExecuteProjectImport();
  const isBusy = previewMutation.isPending || executeMutation.isPending;
  const activeStep = result ? 3 : preview ? 2 : 1;
  const projectsHref = (state: string) =>
    `${paths.app.projects.getHref()}?event=${eventId}&state=${state}`;

  const resetAnalysis = () => {
    setPreview(null);
    setPreviewError(null);
    setExecuteError(null);
    setResult(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    resetAnalysis();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelection = async (file: File | null | undefined) => {
    resetAnalysis();
    const error = await validateExcelFile(
      file,
      MAX_PROJECT_IMPORT_FILE_SIZE_BYTES,
    );

    setFileError(error);
    setSelectedFile(error ? null : (file ?? null));
    if (error && fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = async () => {
    if (!eventId) return;
    setTemplateError(null);
    setIsDownloadingTemplate(true);
    try {
      await downloadProjectImportTemplate({ eventId });
    } catch (error) {
      setTemplateError(getProjectImportErrorMessage(error));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handlePreview = () => {
    if (!eventId || !selectedFile) return;
    resetAnalysis();
    previewMutation.mutate(
      { eventId, file: selectedFile },
      {
        onSuccess: setPreview,
        onError: (error) =>
          setPreviewError(getProjectImportErrorMessage(error)),
      },
    );
  };

  const handleExecute = () => {
    if (!eventId || !selectedFile || !preview?.canConfirm) return;
    setExecuteError(null);
    executeMutation.mutate(
      { eventId, file: selectedFile },
      {
        onSuccess: setResult,
        onError: (error) => {
          const parsed = parseProjectImportExecuteError(error);

          if (parsed.kind === "preview") setPreview(parsed.preview);
          setExecuteError(parsed.message);
        },
      },
    );
  };

  const handleDownloadSummary = () => {
    if (!result) return;
    const csv = buildCsv(
      ["Fila", "Proyecto", "ID proyecto", "Resultado", "Detalle"],
      result.rows.map((row) => [
        row.rowNumber,
        row.projectName,
        row.projectId ?? "",
        OUTCOME_META[row.outcome].label,
        [...row.messages, ...row.failedEffects.map(getFailedEffectLabel)].join(
          " | ",
        ),
      ]),
    );

    triggerBlobDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `resumen_carga_proyectos_evento_${eventId}.csv`,
    );
  };

  const backButton = (
    <Button
      startContent={<ArrowLeft className="h-4 w-4" />}
      variant="bordered"
      onPress={() =>
        router.push(
          eventId
            ? `${paths.app.projects.getHref()}?event=${eventId}`
            : paths.app.projects.getHref(),
        )
      }
    >
      Volver a proyectos
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Carga masiva de proyectos
          </h1>
          <p className="text-sm text-muted-foreground">
            {eventName ? `Evento: ${eventName}. ` : ""}Cada fila crea un
            proyecto como si lo creara un administrador. Máximo{" "}
            {MAX_PROJECT_IMPORT_ROWS} filas y 2 MB; los documentos se suben
            después desde cada proyecto.
          </p>
        </div>
        {backButton}
      </div>

      {!eventId ? (
        <ErrorBox>
          Selecciona un evento en la lista de proyectos antes de hacer una carga
          masiva.
        </ErrorBox>
      ) : (
        <>
          <ImportStepper activeStep={activeStep} steps={STEPS} />

          {activeStep !== 3 && (
            <Card className="glass-card border border-white/10" shadow="none">
              <CardBody className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      1. Descarga la plantilla del evento
                    </h2>
                    <p className="text-xs text-default-400">
                      Trae las categorías del evento en una lista desplegable,
                      hasta 6 integrantes y 2 correos de tutores por fila.
                    </p>
                  </div>
                  <Button
                    color="primary"
                    isLoading={isDownloadingTemplate}
                    startContent={<Download className="h-4 w-4" />}
                    variant="flat"
                    onPress={() => void handleDownloadTemplate()}
                  >
                    Descargar plantilla
                  </Button>
                </div>
                {templateError && <ErrorBox>{templateError}</ErrorBox>}

                <h2 className="text-base font-semibold text-foreground">
                  2. Sube el archivo diligenciado
                </h2>
                <ExcelDropzone
                  hint="Extensión permitida: .xlsx (máximo 2 MB y 500 filas)"
                  inputLabel="Seleccionar archivo Excel de proyectos"
                  inputRef={fileInputRef}
                  isDisabled={isBusy}
                  selectedFile={selectedFile}
                  onClear={handleClearFile}
                  onSelect={(file) => void handleFileSelection(file)}
                />
                {fileError && <ErrorBox>{fileError}</ErrorBox>}
                {previewError && <ErrorBox>{previewError}</ErrorBox>}

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    isDisabled={!selectedFile || isBusy}
                    isLoading={previewMutation.isPending}
                    onPress={handlePreview}
                  >
                    {preview ? "Volver a validar" : "Validar archivo"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {preview && !result && (
            <Card className="glass-card border border-white/10" shadow="none">
              <CardBody className="space-y-4 p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Vista previa (todavía no se ha creado nada)
                </h2>
                {preview.warnings.length > 0 && (
                  <div
                    className="space-y-1 rounded-lg border border-warning-400/40 bg-warning-400/10 p-3 text-sm text-warning-500"
                    role="alert"
                  >
                    <p className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Avisos del evento
                    </p>
                    <ul className="list-inside list-disc text-foreground/80">
                      {preview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <TotalsCards mode="preview" totals={preview.totals} />
                <ProjectImportRowsTable mode="preview" rows={preview.rows} />
                {executeError && <ErrorBox>{executeError}</ErrorBox>}
                {!preview.canConfirm && (
                  <p className="text-sm text-default-400">
                    {preview.totals.errors > 0
                      ? "Corrige las filas con error en el archivo y vuelve a validarlo para poder confirmar."
                      : preview.totals.created === 0
                        ? "No hay filas nuevas para crear."
                        : "El evento no permite confirmar la carga (revisa los avisos)."}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    color="success"
                    isDisabled={!preview.canConfirm || isBusy}
                    isLoading={executeMutation.isPending}
                    onPress={handleExecute}
                  >
                    Confirmar y crear {preview.totals.created} proyecto(s)
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {result && (
            <Card className="glass-card border border-white/10" shadow="none">
              <CardBody className="space-y-4 p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Resumen de la carga
                </h2>
                <TotalsCards mode="execute" totals={result.totals} />
                <ProjectImportRowsTable mode="execute" rows={result.rows} />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    startContent={<FileDown className="h-4 w-4" />}
                    variant="bordered"
                    onPress={handleDownloadSummary}
                  >
                    Descargar resumen (.csv)
                  </Button>
                  <Button variant="bordered" onPress={handleClearFile}>
                    Hacer otra carga
                  </Button>
                  <Button
                    as={NextLink}
                    href={projectsHref("UNDER_REVIEW")}
                    variant="flat"
                  >
                    Ver proyectos en revisión
                  </Button>
                  <Button
                    as={NextLink}
                    color="primary"
                    href={projectsHref("APPROVED")}
                  >
                    Ver proyectos aprobados
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
