"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardBody } from '@/components/ui/card';
import { Plus, Trash2 } from "lucide-react";
import { Participant } from "../project-wizard";
import { z } from "zod";
import { SEMESTER_OPTIONS, CAREER_OPTIONS, getCareerLabel, getSemesterLabel } from "./constants-carrers-semesters";
import { useUser } from "@/lib/auth";

type ParticipantsStepProps = {
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  eventType: "Competition" | "Exposition";
};

export function ParticipantsStep({
  participants,
  onUpdate,
  eventType,
}: ParticipantsStepProps) {
  const user = useUser();
  const [currentParticipant, setCurrentParticipant] = useState<
    Omit<Participant, "id">
  >({
    firstName: "",
    lastName: "",
    email: "",
    studentCode: "",
    semester: "",
    career: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill with current user data
  useEffect(() => {
    if (user.data?.firstName || user.data?.lastName || user.data?.email) {
      setCurrentParticipant((prev) => ({
        ...prev,
        firstName: user.data?.firstName || prev.firstName,
        lastName: user.data?.lastName || prev.lastName,
        email: user.data?.email || prev.email,
      }));
    }
  }, [user.data?.firstName, user.data?.lastName, user.data?.email]);

  const validateParticipant = () => {
    const newErrors: Record<string, string> = {};

    if (!currentParticipant.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!currentParticipant.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!currentParticipant.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      try {
        z.string().email().parse(currentParticipant.email);
      } catch {
        newErrors.email = "El email no es válido";
      }
      // Validar que el email no esté repetido
      if (participants.some((p) => p.email === currentParticipant.email)) {
        newErrors.email = "Este email ya está registrado";
      }
    }

    if (!currentParticipant.studentCode.trim()) {
      newErrors.studentCode = "El código estudiantil es requerido";
    } else if (!/^\d+$/.test(currentParticipant.studentCode)) {
      newErrors.studentCode = "El código debe contener solo números";
    } else if (currentParticipant.studentCode.length < 9) {
      newErrors.studentCode = "El código debe tener mínimo 9 dígitos";
    } else if (participants.some((p) => p.studentCode === currentParticipant.studentCode)) {
      newErrors.studentCode = "Este código estudiantil ya está registrado";
    }

    // Para Competition: semester y career son obligatorios
    // Para Exposition: semester y career son opcionales
    if (eventType === "Competition") {
      if (!currentParticipant.semester.trim()) {
        newErrors.semester = "El semestre es requerido";
      }

      if (!currentParticipant.career.trim()) {
        newErrors.career = "La carrera es requerida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addParticipant = () => {
    if (validateParticipant()) {
      const newParticipant: Participant = {
        ...currentParticipant,
        id: Date.now().toString(),
      };
      onUpdate([...participants, newParticipant]);

      setCurrentParticipant({
        firstName: "",
        lastName: "",
        email: "",
        studentCode: "",
        semester: "",
        career: "",
      });
      
      setErrors({});
    }
  };

  const removeParticipant = (id: string) => {
    onUpdate(participants.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add Participant Form */}
      <div className="space-y-4 rounded-lg border border-default-200 bg-default-50 p-6">
        <h3 className="text-lg font-semibold">Agregar Participante</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Primer Nombre"
            placeholder="Juan"
            value={currentParticipant.firstName}
            onValueChange={(value) => {
              setCurrentParticipant({
                ...currentParticipant,
                firstName: value,
              });
              if (errors.firstName) setErrors({ ...errors, firstName: "" });
            }}
            isRequired
            isInvalid={!!errors.firstName}
            errorMessage={errors.firstName}
          />
          <Input
            label="Apellido"
            placeholder="Pérez"
            value={currentParticipant.lastName}
            onValueChange={(value) => {
              setCurrentParticipant({ ...currentParticipant, lastName: value });
              if (errors.lastName) setErrors({ ...errors, lastName: "" });
            }}
            isRequired
            isInvalid={!!errors.lastName}
            errorMessage={errors.lastName}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="juanperez@universidad.edu.co"
            value={currentParticipant.email}
            onValueChange={(value) => {
              setCurrentParticipant({ ...currentParticipant, email: value });
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            isRequired
            isInvalid={!!errors.email}
            errorMessage={errors.email}
          />
          <Input
            label="Código Estudiantil"
            placeholder="200123456"
            value={currentParticipant.studentCode}
            onValueChange={(value) => {
              setCurrentParticipant({
                ...currentParticipant,
                studentCode: value,
              });
              if (errors.studentCode) setErrors({ ...errors, studentCode: "" });
            }}
            isRequired
            isInvalid={!!errors.studentCode}
            errorMessage={errors.studentCode}
          />
          <Select
            label="Carrera"
            placeholder="Seleccionar carrera"
            selectedKeys={currentParticipant.career ? [currentParticipant.career] : []}
            onSelectionChange={(value) => {
              const selectedValue = Array.from(value as Set<string>)[0] || "";
              setCurrentParticipant({
                ...currentParticipant,
                career: selectedValue,
              });
              if (errors.career) setErrors({ ...errors, career: "" });
            }}
            isRequired={eventType === "Competition"}
            isInvalid={!!errors.career}
            errorMessage={errors.career}
          >
            {CAREER_OPTIONS.map((option) => (
              <SelectItem key={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            label="Semestre"
            placeholder="Seleccionar semestre"
            selectedKeys={currentParticipant.semester ? [currentParticipant.semester] : []}
            onSelectionChange={(value) => {
              const selectedValue = Array.from(value as Set<string>)[0] || "";
              setCurrentParticipant({
                ...currentParticipant,
                semester: selectedValue,
              });
              if (errors.semester) setErrors({ ...errors, semester: "" });
            }}
            isRequired={eventType === "Competition"}
            isInvalid={!!errors.semester}
            errorMessage={errors.semester}
          >
            {SEMESTER_OPTIONS.map((option) => (
              <SelectItem key={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          
        </div>

        <Button
          color="primary"
          onPress={addParticipant}
          startContent={<Plus className="h-4 w-4" />}
        >
          Agregar Participante
        </Button>
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Participantes ({participants.length})
          </h3>
          {participants.map((participant) => (
            <Card key={participant.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <p className="text-sm text-default-500">
                      {participant.email}
                    </p>
                    {participant.studentCode && (
                      <p className="text-sm text-default-500">
                        {participant.studentCode}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {participant.career && (
                        <p className="text-sm text-default-500">
                          {getCareerLabel(participant.career)}
                        </p>
                      )}
                      {participant.semester && (
                        <p className="text-sm text-default-500">
                          {getSemesterLabel(participant.semester)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    onPress={() => removeParticipant(participant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {participants.length === 0 && (
        <div className="rounded-lg border border-dashed border-default-300 bg-default-50 p-8 text-center">
          <p className="text-default-500">
            No hay participantes agregados. Agregue al menos un participante
            para continuar.
          </p>
        </div>
      )}
    </div>
  );
}
