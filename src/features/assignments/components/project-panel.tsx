"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/features/landing/components/glass-card";

type ProjectJuror = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export const ProjectPanel = ({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) => {
  const jurors: ProjectJuror[] = project?.jurors ?? project?.jurorAssignments ?? [];

    return (
        <GlassCard className="flex flex-col h-full" style={{backgroundColor:"#dd82ff20"}}>
            {/* Header */}
            <div className="p-4">
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {jurors.length} jurado{jurors.length === 1 ? "" : "s"} asignado{jurors.length === 1 ? "" : "s"}
                </p>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
                <section>
                    <h3>Descripción</h3>
                    <p>{ project.description }</p>
                </section>
                <section className="space-y-3 pt-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Jurados asignados
                  </h3>

                  {jurors.length > 0 ? (
                    <div className="space-y-2">
                      {jurors.map((juror, index) => {
                        const fullName = `${juror.firstName ?? ""} ${juror.lastName ?? ""}`.trim();

                        return (
                          <div
                            key={juror.id ?? `${juror.email ?? "juror"}-${index}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-sm font-medium">
                              {fullName || juror.email || "Jurado sin nombre"}
                            </p>
                            {juror.email && (
                              <p className="text-xs text-muted-foreground">
                                {juror.email}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este proyecto no tiene jurados asignados.
                    </p>
                  )}
                </section>
            </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-2">
            <Button variant="light" onPress={onClose} className="w-full">
            Cerrar
            </Button>
        </div>
        </GlassCard>
  );
};