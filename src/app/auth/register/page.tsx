"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { paths } from "@/config/paths";
import { RegisterForm } from "@/features/auth/components/register-form";

const RegisterPage = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo");

  const [chooseTeam, setChooseTeam] = useState(false);

  return (
    <RegisterForm
      onSuccess={() => {
        // Usar window.location.href en lugar de router.replace
        // para forzar una recarga completa y asegurar que las cookies
        // se envíen correctamente en producción
        const targetUrl = redirectTo
          ? decodeURIComponent(redirectTo)
          : paths.app.dashboard.getHref();
        window.location.href = targetUrl;
      }}
      chooseTeam={chooseTeam}
      setChooseTeam={() => setChooseTeam(!chooseTeam)}
    />
  );
};

export default RegisterPage;
