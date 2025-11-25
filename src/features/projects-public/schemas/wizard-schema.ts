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
    .refine(file => file.size <= 25 * 1024 * 1024, 'El archivo debe ser menor a 25MB')
    .refine(
      file => ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'Solo se permiten PDF, JPG o PNG'
    ),
  additionalDocuments: z
    .array(
      z
        .instanceof(File)
        .refine(file => file.size <= 25 * 1024 * 1024, 'El archivo debe ser menor a 25MB')
    )
    .default([]),
})

export const wizardSchema = z.object({
  participants: z.array(participantSchema).min(1, 'Debe agregar al menos un participante'),
  project: projectSchema,
  documents: documentsSchema,
})

export type ParticipantData = z.infer<typeof participantSchema>
export type ProjectData = z.infer<typeof projectSchema>
export type DocumentsData = z.infer<typeof documentsSchema>
export type WizardData = z.infer<typeof wizardSchema>
