"use client"

import { Card, CardBody, CardHeader } from "@heroui/react"
import { Chip } from "@heroui/react"
import { Users, FileText, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { WizardData } from "../project-wizard"
import { useCourse } from "@/features/courses/api/get-course"

type ReviewStepProps = {
  data: WizardData
  eventType: "Competition" | "Exposition"
}

export function ReviewStep({ data, eventType }: ReviewStepProps) {

  const courseQuery = useCourse({ courseId: data.project.courseId })

  const course = courseQuery.data?.data

  return (
    <div className="space-y-6">
      {/* Participants Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Participantes</h3>
            <Chip size="sm" color="primary" variant="flat">
              {data.participants.length}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {data.participants.map((participant) => (
              <div key={participant.id} className="rounded-lg border border-default-200 bg-default-50 p-4">
                <div className="space-y-2">
                  <p className="font-medium text-base">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="text-sm text-default-500">{participant.email}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {participant.studentCode && (
                      <div>
                        <p className="text-xs font-medium text-default-500 uppercase">Código</p>
                        <p className="text-sm text-foreground">{participant.studentCode}</p>
                      </div>
                    )}
                    {eventType === "Competition" && participant.semester && (
                      <div>
                        <p className="text-xs font-medium text-default-500 uppercase">Semestre</p>
                        <p className="text-sm text-foreground">{participant.semester}</p>
                      </div>
                    )}
                    {eventType === "Competition" && participant.career && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-default-500 uppercase">Carrera</p>
                        <p className="text-sm text-foreground">{participant.career}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Project Details Review (Only for Exposition) */}
      {eventType === "Exposition" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Detalles del Proyecto</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-default-500">Nombre</p>
                <p className="mt-1">{data.project.name || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Descripción</p>
                <p className="mt-1 text-pretty leading-relaxed">{data.project.description || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Curso</p>
                <p className="mt-1">{course?.code || "No especificado"}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Documents Review (Only for Exposition) */}
      {eventType === "Exposition" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Documentos</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-default-500">Póster</p>
                {data.documents.poster ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-default-200 bg-default-50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm">{data.documents.poster.name}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-danger">No se ha subido el póster</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Documentos Adicionales</p>
                {data.documents.additionalDocuments.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {data.documents.additionalDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg border border-default-200 bg-default-50 p-3"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-default-500">No hay documentos adicionales</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Importante:</strong> Verifique que toda la información sea correcta antes de enviar. Asegúrese de que todos los datos de los participantes estén completos y precisos.
        </p>
      </div>
    </div>
  )
}
