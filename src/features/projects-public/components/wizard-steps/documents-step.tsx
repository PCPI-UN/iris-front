"use client"

import type React from "react"
import { useRef } from "react"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import { Upload, FileText, X, ImageIcon } from "lucide-react"
import { DocumentsData } from "../project-wizard"

type DocumentsStepProps = {
  documents: DocumentsData
  onUpdate: (documents: DocumentsData) => void
}

export function DocumentsStep({ documents, onUpdate }: DocumentsStepProps) {
  const posterInputRef = useRef<HTMLInputElement>(null)
  const additionalInputRef = useRef<HTMLInputElement>(null)

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpdate({ ...documents, poster: file })
    }
  }

  const handleAdditionalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onUpdate({
      ...documents,
      additionalDocuments: [...documents.additionalDocuments, ...files],
    })
  }

  const removePoster = () => {
    onUpdate({ ...documents, poster: null })
    if (posterInputRef.current) {
      posterInputRef.current.value = ""
    }
  }

  const removeAdditionalDocument = (index: number) => {
    const newDocs = documents.additionalDocuments.filter((_, i) => i !== index)
    onUpdate({ ...documents, additionalDocuments: newDocs })
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="space-y-6">
      {/* Poster Upload */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Póster del Proyecto *</label>
        <p className="text-sm text-default-500">
          Suba el póster de su proyecto en formato PDF, PNG o JPG.<br />
          <span className="font-semibold text-danger">Máximo 4MB por archivo y 25MB en total entre todos los archivos.</span>
        </p>
        {!documents.poster ? (
          <div
            onClick={() => posterInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-default-300 bg-default-50 p-8 transition-colors hover:border-primary hover:bg-default-100"
          >
            <Upload className="mb-3 h-10 w-10 text-default-400" />
            <p className="text-sm font-medium">Haga clic para subir el póster</p>
            <p className="text-xs text-default-400">o arrastre y suelte aquí</p>
            <input
              ref={posterInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handlePosterUpload}
              className="hidden"
            />
          </div>
        ) : (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(documents.poster.name)}
                  <div>
                    <p className="font-medium">{documents.poster.name}</p>
                    <p className="text-sm text-default-500">{(documents.poster.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button isIconOnly variant="light" color="danger" onPress={removePoster}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Additional Documents */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Documentos Adicionales (Opcional)</label>
        <p className="text-sm text-default-500">
          Puede subir documentos adicionales como PDF, Word, imágenes o archivos de texto.<br />
          <span className="font-semibold text-danger">Máximo 4MB por archivo y 25MB en total entre todos los archivos.</span>
        </p>
        <Button
          variant="bordered"
          onPress={() => additionalInputRef.current?.click()}
          startContent={<Upload className="h-4 w-4" />}
          className="w-full"
        >
          Agregar Documentos
        </Button>
        <input
          ref={additionalInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleAdditionalUpload}
          className="hidden"
        />

        {documents.additionalDocuments.length > 0 && (
          <div className="space-y-2">
            {documents.additionalDocuments.map((file, index) => (
              <Card key={index}>
                <CardBody>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-default-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button isIconOnly variant="light" color="danger" onPress={() => removeAdditionalDocument(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
