"use client";

import { Card, CardBody } from "@/components/ui/card";

export type ImportStep = { number: number; title: string };

type ImportStepperProps = {
  steps: ImportStep[];
  activeStep: number;
};

/** Steps of an Excel import (template and file, preview, summary) */
export const ImportStepper = ({ steps, activeStep }: ImportStepperProps) => (
  <Card className="glass-card border border-white/10" shadow="none">
    <CardBody className="p-4">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const isCurrent = activeStep === step.number;
          const isCompleted = activeStep > step.number;

          return (
            <li
              key={step.number}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                isCurrent
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-default-400"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-default-300"
                }`}
              >
                {isCompleted ? "✓" : step.number}
              </span>
              <span className="text-sm font-medium">{step.title}</span>
            </li>
          );
        })}
      </ol>
    </CardBody>
  </Card>
);
