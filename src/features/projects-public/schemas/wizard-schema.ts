import { z } from 'zod'

export const participantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  studentCode: z.string().optional(),
})

export const projectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(255, 'El nombre no puede exceder 255 caracteres'),
  description: z.string().max(3000, 'La descripción no puede exceder 3000 caracteres').optional(),
  courseId: z.number().min(1, 'Debe seleccionar un curso'),
})

export const documentsSchema = z.object({
  poster: z
    .instanceof(File, { message: 'Debe subir un poster' })
    .refine(file => file.size <= 4 * 1024 * 1024, 'El archivo debe ser menor a 4MB')
    .refine(
      file => ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'Solo se permiten PDF, JPG o PNG'
    ),
  additionalDocuments: z
    .array(
      z
        .instanceof(File)
        .refine(file => file.size <= 4 * 1024 * 1024, 'Cada archivo debe ser menor a 4MB')
    )
    .default([]),
})

export const wizardSchema = z.object({
  participants: z.array(participantSchema).min(1, 'Debe agregar al menos un participante'),
  project: projectSchema,
  documents: documentsSchema,
}).refine(
  (data) => {
    const posterSize = data.documents?.poster?.size || 0;
    const additionalSize = Array.isArray(data.documents?.additionalDocuments)
      ? data.documents.additionalDocuments.reduce((acc, file) => acc + (file?.size || 0), 0)
      : 0;
    const totalSize = posterSize + additionalSize;
    return totalSize <= 25 * 1024 * 1024;
  },
  {
    message: 'El tamaño total de los archivos no debe superar 25MB',
    path: ['documents'],
  }
)

export type ParticipantData = z.infer<typeof participantSchema>
export type ProjectData = z.infer<typeof projectSchema>
export type DocumentsData = z.infer<typeof documentsSchema>
export type WizardData = z.infer<typeof wizardSchema>
