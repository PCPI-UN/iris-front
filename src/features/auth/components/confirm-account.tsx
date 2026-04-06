"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { paths } from "@/config/paths";
import { api } from "@/lib/api-client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

type ConfirmState = "loading" | "success" | "invalid" | "error";

const cardMotion = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

export const ConfirmAccountForm = () => {
  const [state, setState] = useState<ConfirmState>("loading");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const confirmAccount = useCallback(async () => {
    if (!token) {
      setState("invalid");
      return;
    }

    setState("loading");

    try {
      await api.post("/auth/activate", { token });
      setState("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";

      if (
        message.includes("invalid") ||
        message.includes("expired") ||
        message.includes("token")
      ) {
        setState("invalid");
      } else {
        setState("error");
      }
    }
  }, [token]);

  useEffect(() => {
    void confirmAccount();
  }, [confirmAccount]);

  const goToLogin = () => router.push(paths.auth.login.getHref());

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div
            key="loading"
            {...cardMotion}
            className="relative z-10 space-y-5 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Spinner size="lg" />
            </div>

            <Chip variant="flat" className="mx-auto">
              Verificando enlace
            </Chip>

            <div>
              <p className="text-lg font-semibold text-foreground">
                Estamos confirmando tu cuenta
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Esto tardará solo unos segundos.
              </p>
            </div>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            key="success"
            {...cardMotion}
            className="relative z-10 space-y-5 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-600/30 bg-green-400/15 shadow-[0_0_40px_rgba(34,197,94,0.25)]">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <Chip variant="flat" className="mx-auto">
              Cuenta activada
            </Chip>

            <div>
              <p className="text-lg font-semibold text-foreground">
                Todo listo, ya puedes ingresar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu correo fue verificado correctamente.
              </p>
            </div>

            <Button className="w-full" onClick={goToLogin}>
              <Sparkles className="h-4 w-4" />
              Ir a iniciar sesión
            </Button>
          </motion.div>
        )}

        {state === "invalid" && (
          <motion.div
            key="invalid"
            {...cardMotion}
            className="relative z-10 space-y-5 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/15 shadow-[0_0_40px_rgba(245,158,11,0.25)]">
              <ShieldAlert className="h-8 w-8 text-amber-300" />
            </div>

            <Chip variant="flat" className="mx-auto">
              Enlace no válido
            </Chip>

            <div>
              <p className="text-lg font-semibold text-foreground">
                Este enlace ya no está disponible
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Puede haber expirado o ya fue utilizado. Solicita uno nuevo.
              </p>
            </div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            {...cardMotion}
            className="relative z-10 space-y-5 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-rose-300/30 bg-rose-400/15 shadow-[0_0_40px_rgba(244,63,94,0.25)]">
              <AlertTriangle className="h-8 w-8 text-rose-300" />
            </div>

            <Chip variant="flat" className="mx-auto">
              Error temporal
            </Chip>

            <div>
              <p className="text-lg font-semibold text-foreground">
                No pudimos completar la confirmación
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tuvimos un problema de conexión. Inténtalo nuevamente en unos
                minutos.
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => void confirmAccount()}>
                Reintentar
              </Button>
              <Button className="w-full" variant="bordered" onClick={goToLogin}>
                Ir a iniciar sesión
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
