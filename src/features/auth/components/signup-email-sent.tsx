"use client";

import { MailCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { paths } from "@/config/paths";

export const SignupEmailSent = () => {
  return (
    <div className="relative space-y-5 text-center">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/15 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        <MailCheck className="h-8 w-8 text-cyan-300" />
      </div>

      <Chip variant="flat" className="mx-auto">
        Correo enviado
      </Chip>

      <div className="relative z-10">
        <p className="text-lg font-semibold text-foreground">
          Te enviamos un correo electrónico
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirma tu cuenta desde ese correo para continuar en Iris.
        </p>
      </div>

      <div className="relative z-10 space-y-2">
        <Button
          className="w-full"
          onClick={() => {
            window.location.href = paths.auth.login.getHref();
          }}
        >
          <Sparkles className="h-4 w-4" />
          Ir a iniciar sesion
        </Button>
        <Button
          className="w-full"
          variant="bordered"
          onClick={() => {
            window.location.href = paths.auth.signup.getHref();
          }}
        >
          Volver al registro
        </Button>
      </div>
      <div className="relative z-10">
        <p className="mt-1 text-sm text-gray-500">
          Si no lo encuentras, revisa tu bandeja de spam o contáctanos para ayudarte.
        </p>
      </div>
    </div>
  );
};
