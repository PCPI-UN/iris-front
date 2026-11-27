"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";
import { paths } from "@/config/paths";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useDisclosure } from "@/hooks/use-disclosure";

import {
  downloadJurorImportTemplate,
  triggerBlobDownload,
  useExecuteJurorImport,
  usePreviewJurorImport,
} from "../../api/juror-imports";
import type {
  JurorImportExecuteResponse,
  JurorImportPreviewResponse,
} from "../../types/juror-import";
import {
  buildSummaryCsv,
  formatBytes,
  getPreviewErrorMessage,
  getTemplateDownloadErrorMessage,
  parseExecuteError,
  parseValidEventId,
  validateExcelFile,
} from "../../utils/juror-import-helpers";
import { ExcelDropzone } from "@/features/imports/components/excel-dropzone";
import { ImportStepper } from "@/features/imports/components/import-stepper";

import { JurorImportMetrics } from "./juror-import-metrics";
import { JurorImportRowsTable } from "./juror-import-rows-table";

type WizardStep = 1 | 2 | 3;

export const JurorImportView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNotification } = useNotifications();
  const confirmModal = useDisclosure();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const executeLockRef = useRef(false);

  const initialEventId = useMemo(
    () => parseValidEventId(searchParams?.get("event")),
    [searchParams],
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId ? String(initialEventId) : "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const [fileValidationError, setFileValidationError] = useState<string | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] =
    useState<JurorImportPreviewResponse | null>(null);
  const [revalidatedBanner, setRevalidatedBanner] = useState<string | null>(
    null,
  );

  const [invitedErrorState, setInvitedErrorState] = useState<{
    message: string;
    invitedJurors: string[];
  } | null>(null);
  const [genericExecuteError, setGenericExecuteError] = useState<string | null>(
    null,
  );
  const [executeResult, setExecuteResult] =
    useState<JurorImportExecuteResponse | null>(null);

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data || [];

  const previewMutation = usePreviewJurorImport();
  const executeMutation = useExecuteJurorImport();

  const isPreviewLoading = previewMutation.isPending;
  const isExecuting = executeMutation.isPending;

  useEffect(() => {
    if (initialEventId && !selectedEventId) {
      setSelectedEventId(String(initialEventId));
    }
  }, [initialEventId, selectedEventId]);

  const numericEventId = parseValidEventId(selectedEventId);
  const selectedEvent = useMemo(
    () => events.find((ev) => Number(ev.id) === numericEventId),
    [events, numericEventId],
  );

  const activeStep: WizardStep = executeResult
    ? 3
    : previewData || invitedErrorState
      ? 2
      : 1;

  const resetAnalysisState = () => {
    setPreviewData(null);
    setPreviewError(null);
    setRevalidatedBanner(null);
    setInvitedErrorState(null);
    setGenericExecuteError(null);
    setExecuteResult(null);
  };

  const handleEventChange = (nextEventId: string) => {
    if (isExecuting || isPreviewLoading) return;
    setSelectedEventId(nextEventId);
    setTemplateError(null);
    // Clear previous preview/execution because the validation belongs to the previous event
    resetAnalysisState();
  };

  const handleFileSelection = async (file: File | null | undefined) => {
    if (isExecuting || isPreviewLoading) return;
    setFileValidationError(null);
    resetAnalysisState();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = await validateExcelFile(file);
    if (validationError) {
      setSelectedFile(null);
      setFileValidationError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleClearFile = () => {
    if (isExecuting || isPreviewLoading) return;
    setSelectedFile(null);
    setFileValidationError(null);
    resetAnalysisState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    if (!numericEventId || isDownloadingTemplate) return;
    setTemplateError(null);
    setIsDownloadingTemplate(true);
    try {
      const downloadedName = await downloadJurorImportTemplate({
        eventId: numericEventId,
      });
      addNotification({
        type: "success",
        title: "Plantilla descargada",
        message: `Se descargó el archivo ${downloadedName}.`,
      });
    } catch (error) {
      setTemplateError(getTemplateDownloadErrorMessage(error));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleRequestPreview = async () => {
    if (!numericEventId || !selectedFile || isPreviewLoading || isExecuting) {
      return;
    }
    setPreviewError(null);
    setRevalidatedBanner(null);
    setInvitedErrorState(null);
    setGenericExecuteError(null);
    setExecuteResult(null);

    try {
      const preview = await previewMutation.mutateAsync({
        eventId: numericEventId,
        file: selectedFile,
      });
      setPreviewData(preview);
    } catch (error) {
      setPreviewError(getPreviewErrorMessage(error));
    }
  };

  const runExecute = async () => {
    if (
      !numericEventId ||
      !selectedFile ||
      executeLockRef.current ||
      executeMutation.isPending
    ) {
      return;
    }

    executeLockRef.current = true;
    setGenericExecuteError(null);
    setRevalidatedBanner(null);

    try {
      const result = await executeMutation.mutateAsync({
        eventId: numericEventId,
        file: selectedFile,
      });
      confirmModal.onClose();
      setInvitedErrorState(null);
      setExecuteResult(result);

      if (result.totals.errors === 0) {
        addNotification({
          type: "success",
          title: "Asignación completada",
          message: `Se realizaron ${result.totals.assigned} asignación(es) correctamente.`,
        });
      } else {
        addNotification({
          type: "warning",
          title: "Asignación completada con observaciones",
          message: `Asignadas: ${result.totals.assigned}. Con error: ${result.totals.errors}.`,
        });
      }
    } catch (error) {
      confirmModal.onClose();
      const parsed = parseExecuteError(error);

      if (parsed.kind === "preview") {
        // 400 Case 1: { message, preview } — re-render updated preview & block invalid confirm
        setPreviewData(parsed.preview);
        setInvitedErrorState(null);
        setRevalidatedBanner(parsed.message);
      } else if (parsed.kind === "invitedJurors") {
        // 400 Case 2: { message, invitedJurors } — invitations sent, no assignments created; safe retry
        setInvitedErrorState({
          message: parsed.message,
          invitedJurors: parsed.invitedJurors,
        });
      } else {
        setGenericExecuteError(parsed.message);
      }
    } finally {
      executeLockRef.current = false;
    }
  };

  const handleDownloadCsvSummary = () => {
    if (!executeResult) return;
    const csv = buildSummaryCsv(executeResult.rows, "execute");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerBlobDownload(
      blob,
      `resumen_asignacion_jurados_evento_${numericEventId ?? "iris"}.csv`,
    );
  };

  const handleStartOver = () => {
    if (isExecuting || isPreviewLoading) return;
    setSelectedFile(null);
    setFileValidationError(null);
    resetAnalysisState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canConfirmPreview = Boolean(
    previewData &&
      previewData.canConfirm &&
      previewData.totals.errors === 0 &&
      previewData.totals.assigned > 0 &&
      !isExecuting,
  );

  const steps = [
    { number: 1, title: "Plantilla y archivo" },
    { number: 2, title: "Vista previa y confirmación" },
    { number: 3, title: "Resumen de resultados" },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera y navegación */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            size="sm"
            variant="light"
            isDisabled={isExecuting}
            startContent={<ArrowLeft className="h-4 w-4" />}
            onPress={() => router.push(paths.app.assignments.getHref())}
            className="mb-2 -ml-2 text-default-400 hover:text-foreground"
          >
            Volver a asignaciones
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Importación masiva de jurados (Excel)
          </h1>
          <p className="mt-1 text-sm text-default-400">
            Descarga la plantilla oficial del evento, valida las asignaciones en
            vista previa y confirma la operación antes de enviar invitaciones.
          </p>
        </div>

        <Chip
          color="primary"
          variant="flat"
          startContent={<ShieldCheck className="h-3.5 w-3.5" />}
          className="self-start sm:self-center"
        >
          Validación segura en servidor
        </Chip>
      </div>

      {/* Stepper */}
      <ImportStepper steps={steps} activeStep={activeStep} />

      {/* PASO 1: Evento, plantilla y carga (si no estamos en resumen final) */}
      {!executeResult && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Columna izquierda: Evento y Plantilla */}
          <Card
            className="glass-card border border-white/10 lg:col-span-5"
            shadow="none"
          >
            <CardHeader className="flex flex-col items-start gap-1 pb-2">
              <h2 className="text-base font-semibold text-foreground">
                1. Selecciona el evento y descarga la plantilla
              </h2>
              <p className="text-xs text-default-400">
                La plantilla incluye la estructura y los proyectos aprobados del
                evento seleccionado.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Evento activo"
                placeholder="Selecciona un evento"
                selectedKeys={selectedEventId ? [selectedEventId] : []}
                onSelectionChange={(keys) => {
                  const first = Array.from(keys)[0];
                  handleEventChange(first ? String(first) : "");
                }}
                isLoading={eventsQuery.isLoading}
                isDisabled={isExecuting || isPreviewLoading}
                isRequired
              >
                {events.length > 0 ? (
                  events.map((ev) => (
                    <SelectItem key={String(ev.id)}>{ev.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-events" isDisabled>
                    No hay eventos activos disponibles
                  </SelectItem>
                )}
              </Select>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Plantilla oficial del evento
                    </p>
                    <p className="text-xs text-default-400">
                      Diligencia las ranuras de jurados con los correos
                      institucionales sin alterar las columnas obligatorias.
                    </p>
                  </div>
                </div>

                <Button
                  color="primary"
                  variant="flat"
                  className="w-full"
                  isDisabled={!numericEventId || isDownloadingTemplate || isExecuting}
                  isLoading={isDownloadingTemplate}
                  startContent={
                    !isDownloadingTemplate && <Download className="h-4 w-4" />
                  }
                  onPress={handleDownloadTemplate}
                >
                  {isDownloadingTemplate
                    ? "Generando plantilla..."
                    : "Descargar plantilla (.xlsx)"}
                </Button>

                {templateError && (
                  <p className="text-xs text-rose-400" role="alert">
                    {templateError}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Columna derecha: Carga de archivo */}
          <Card
            className="glass-card border border-white/10 lg:col-span-7"
            shadow="none"
          >
            <CardHeader className="flex flex-col items-start gap-1 pb-2">
              <h2 className="text-base font-semibold text-foreground">
                2. Carga el archivo Excel diligenciado
              </h2>
              <p className="text-xs text-default-400">
                Solo se admiten libros Excel válidos (.xlsx) de hasta 10 MB.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <ExcelDropzone
                inputRef={fileInputRef}
                selectedFile={selectedFile}
                isDisabled={isExecuting || isPreviewLoading}
                hint="Extensión permitida: .xlsx (máximo 10 MB)"
                inputLabel="Seleccionar archivo Excel de jurados"
                onSelect={(file) => void handleFileSelection(file)}
                onClear={handleClearFile}
              />

              {fileValidationError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{fileValidationError}</span>
                </div>
              )}

              {previewError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  color="primary"
                  isDisabled={
                    !numericEventId ||
                    !selectedFile ||
                    isPreviewLoading ||
                    isExecuting
                  }
                  isLoading={isPreviewLoading}
                  onPress={handleRequestPreview}
                >
                  {isPreviewLoading
                    ? "Validando archivo..."
                    : previewData
                      ? "Volver a validar archivo"
                      : "Generar vista previa"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* CASO ESPECIAL 400: { message, invitedJurors } */}
      {invitedErrorState && !executeResult && (
        <Card
          className="glass-card border border-amber-500/40 bg-amber-500/10"
          shadow="none"
          role="alert"
        >
          <CardBody className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-amber-200">
                  Validación final rechazada tras enviar invitaciones
                </h2>
                <p className="text-sm text-amber-100/90">
                  {invitedErrorState.message}
                </p>
                <p className="text-xs text-amber-200/80">
                  No se asignó ningún proyecto en esta ejecución. Puedes volver a
                  ejecutar este mismo archivo de forma segura: no se repetirán
                  invitaciones ni se duplicarán asignaciones.
                </p>
              </div>
            </div>

            {invitedErrorState.invitedJurors.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-black/20 p-3.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Correos ya invitados ({invitedErrorState.invitedJurors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {invitedErrorState.invitedJurors.map((email) => (
                    <Chip
                      key={email}
                      size="sm"
                      variant="flat"
                      color="warning"
                      startContent={<MailCheck className="h-3.5 w-3.5" />}
                    >
                      {email}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="bordered"
                isDisabled={isExecuting}
                onPress={() => setInvitedErrorState(null)}
              >
                Volver a vista previa
              </Button>
              <Button
                color="warning"
                isLoading={isExecuting}
                isDisabled={isExecuting || !selectedFile || !numericEventId}
                startContent={!isExecuting && <RefreshCw className="h-4 w-4" />}
                onPress={runExecute}
              >
                {isExecuting ? "Reintentando ejecución..." : "Reintentar ejecución"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PASO 2: VISTA PREVIA */}
      {previewData && !executeResult && (
        <Card className="glass-card border border-white/10" shadow="none">
          <CardHeader className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Vista previa de la asignación
                {selectedEvent ? ` — ${selectedEvent.name}` : ""}
              </h2>
              <p className="text-xs text-default-400">
                Revisa cada fila detectada antes de confirmar. Ninguna
                asignación ni invitación se ha ejecutado todavía.
              </p>
            </div>
          </CardHeader>

          <CardBody className="space-y-6 p-5">
            {/* Banner cuando /execute devolvió 400 { message, preview } */}
            {revalidatedBanner && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
              >
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <p className="font-semibold">
                    No fue posible confirmar la asignación
                  </p>
                  <p className="mt-0.5 text-xs text-rose-200/90">
                    {revalidatedBanner}
                  </p>
                </div>
              </div>
            )}

            {genericExecuteError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
              >
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <span>{genericExecuteError}</span>
              </div>
            )}

            <JurorImportMetrics totals={previewData.totals} mode="preview" />

            {/* Mensajes de estado de la validación */}
            {previewData.totals.errors > 0 ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
              >
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Se detectaron {previewData.totals.errors} error(es) en el
                    archivo
                  </p>
                  <p className="text-xs text-rose-200/85">
                    No puedes confirmar la importación mientras existan errores.
                    Corrige los registros marcados en rojo en tu Excel y vuelve a
                    cargar el archivo.
                  </p>
                </div>
              </div>
            ) : !previewData.canConfirm || previewData.totals.assigned === 0 ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-100">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="font-semibold">
                    No hay asignaciones nuevas por confirmar
                  </p>
                  <p className="mt-0.5 text-xs text-sky-200/85">
                    Todos los registros válidos del archivo ya se encuentran
                    asignados o no requieren acción.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold">
                      Archivo listo para confirmar ({previewData.totals.assigned}{" "}
                      asignación(es))
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-200/85">
                      Al confirmar, se ejecutarán las asignaciones y se enviarán
                      las invitaciones necesarias.
                    </p>
                  </div>
                </div>

                {previewData.totals.warnings > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                      <p className="font-semibold">
                        {previewData.totals.warnings} aviso(s) informativo(s)
                        (no bloqueantes)
                      </p>
                      <p className="mt-0.5 text-xs text-amber-200/85">
                        Los avisos (como coincidencia de tutor en un proyecto) no
                        impiden continuar, pero te recomendamos revisarlos en la
                        tabla antes de confirmar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <JurorImportRowsTable rows={previewData.rows} mode="preview" />

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="bordered"
                isDisabled={isExecuting || isPreviewLoading}
                onPress={handleClearFile}
              >
                Cargar otro archivo
              </Button>

              <Button
                color="primary"
                isDisabled={!canConfirmPreview}
                isLoading={isExecuting}
                onPress={confirmModal.onOpen}
              >
                {isExecuting
                  ? "Ejecutando y enviando invitaciones..."
                  : "Confirmar y ejecutar asignación"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PASO 3: RESUMEN FINAL DE EJECUCIÓN */}
      {executeResult && (
        <Card className="glass-card border border-white/10" shadow="none">
          <CardHeader className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Resumen de la asignación ejecutada
                {selectedEvent ? ` — ${selectedEvent.name}` : ""}
              </h2>
              <p className="text-xs text-default-400">
                Detalle final de filas procesadas, asignaciones creadas e
                invitaciones gestionadas.
              </p>
            </div>
            <Button
              size="sm"
              variant="bordered"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleDownloadCsvSummary}
            >
              Descargar resumen (CSV)
            </Button>
          </CardHeader>

          <CardBody className="space-y-6 p-5">
            {executeResult.totals.errors === 0 ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold">
                    Importación finalizada sin errores
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-200/85">
                    Se asignaron {executeResult.totals.assigned} registro(s), se
                    omitieron {executeResult.totals.skipped} ya existente(s), se
                    enviaron {executeResult.totals.invitationsSent}{" "}
                    invitación(es) y se reutilizaron{" "}
                    {executeResult.totals.invitationsReused}.
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-semibold">
                    Importación finalizada con {executeResult.totals.errors}{" "}
                    error(es)
                  </p>
                  <p className="mt-0.5 text-xs text-amber-200/85">
                    Las filas válidas se asignaron normalmente (
                    {executeResult.totals.assigned}). Filtra por «Errores» en la
                    tabla para revisar las filas que no pudieron asignarse.
                  </p>
                </div>
              </div>
            )}

            <JurorImportMetrics totals={executeResult.totals} mode="execute" />

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-default-400 space-y-1">
              <p>
                <strong className="text-default-200">
                  Invitaciones enviadas:
                </strong>{" "}
                correos de invitación enviados en esta ejecución (los jurados
                nuevos quedan asignados de inmediato y deben aceptar la
                invitación para evaluar).
              </p>
              <p>
                <strong className="text-default-200">
                  Invitaciones reutilizadas:
                </strong>{" "}
                jurados que ya tenían una invitación pendiente al evento; no se
                les envió un correo nuevo.
              </p>
            </div>

            <JurorImportRowsTable rows={executeResult.rows} mode="execute" />

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="bordered" onPress={handleStartOver}>
                Realizar otra importación
              </Button>
              <Button
                color="primary"
                onPress={() => router.push(paths.app.assignments.getHref())}
              >
                Ir a asignaciones
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de Confirmación Explícita */}
      <Modal
        isOpen={confirmModal.isOpen}
        onOpenChange={(open) => {
          if (!isExecuting && !open) {
            confirmModal.onClose();
          }
        }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar asignación masiva de jurados
              </ModalHeader>
              <ModalBody className="space-y-3 text-sm text-default-300">
                <p>
                  Estás a punto de ejecutar la importación para el evento{" "}
                  <strong className="text-foreground">
                    {selectedEvent?.name ?? `#${numericEventId}`}
                  </strong>{" "}
                  con el archivo{" "}
                  <strong className="text-foreground">
                    {selectedFile?.name}
                  </strong>
                  .
                </p>

                {previewData && (
                  <ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs">
                    <li>
                      • Asignaciones a registrar:{" "}
                      <strong className="text-emerald-300">
                        {previewData.totals.assigned}
                      </strong>
                    </li>
                    <li>
                      • Filas ya asignadas (se omitirán):{" "}
                      <strong>{previewData.totals.skipped}</strong>
                    </li>
                    <li>
                      • Invitaciones por enviar:{" "}
                      <strong className="text-cyan-300">
                        {previewData.totals.invitationsSent}
                      </strong>
                    </li>
                    <li>
                      • Invitaciones pendientes reutilizadas:{" "}
                      <strong>{previewData.totals.invitationsReused}</strong>
                    </li>
                  </ul>
                )}

                <p className="text-xs text-amber-300">
                  Esta operación enviará correos electrónicos de invitación a los
                  jurados que aún no estén en el evento. El servidor volverá a
                  validar el archivo antes de guardar.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  color="danger"
                  isDisabled={isExecuting}
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={isExecuting}
                  isDisabled={isExecuting}
                  onPress={runExecute}
                >
                  {isExecuting
                    ? "Ejecutando y enviando invitaciones..."
                    : "Confirmar y ejecutar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

