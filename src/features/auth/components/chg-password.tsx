"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
      .regex(/[a-z]/, "Debe tener al menos una minúscula")
      .regex(/[^a-zA-Z0-9]/, "Debe tener al menos un caracter especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ChangePasswordFormProps = {
  onTokenValidated?: (tokenType: "ACCOUNT_SETUP" | "RESET_PASSWORD") => void;
};

export const ChangePasswordForm = ({
  onTokenValidated,
}: ChangePasswordFormProps = {}) => {
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenType, setTokenType] = useState<
    "ACCOUNT_SETUP" | "RESET_PASSWORD" | null
  >(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();

  // Estados independientes para la visibilidad de cada campo
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = (await api.get(
          `/auth/validate-token?token=${token}`
        )) as {
          valid: boolean;
          tokenType: "ACCOUNT_SETUP" | "RESET_PASSWORD";
        };

        if (response.valid) {
          setIsValidToken(true);
          setTokenType(response.tokenType);
          onTokenValidated?.(response.tokenType);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        setIsValidToken(false);
        addNotification({
          type: "error",
          title: "Token inválido",
          message: "El token ha expirado o no es válido.",
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, addNotification]);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">No se proporcionó un token</p>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="space-y-4 text-center">
        <p>Validando token...</p>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">El token ha expirado o no es válido.</p>
        <Button onClick={() => router.push("/auth/login")} className="w-full">
          Ir al inicio de sesión
        </Button>
      </div>
    );
  }

  const handleMicrosoftLogin = () => {
    window.location.replace(
      `/api/auth/login/microsoft?invitation_token=${token}`
    );
  };

  const isAccountSetup = tokenType === "ACCOUNT_SETUP";
  const isPasswordReset = tokenType === "RESET_PASSWORD";

  const texts = {
    passwordLabel: isAccountSetup ? "Contraseña" : "Nueva contraseña",
    buttonText: isAccountSetup ? "Activar cuenta" : "Cambiar contraseña",
    successTitle: isAccountSetup ? "Cuenta activada" : "Contraseña actualizada",
    successMessage: isAccountSetup
      ? "Tu cuenta ha sido activada exitosamente. Ahora puedes iniciar sesión."
      : "Tu contraseña ha sido actualizada exitosamente.",
    errorTitle: isAccountSetup
      ? "No se pudo activar la cuenta"
      : "No se pudo cambiar la contraseña",
    microsoftText: isAccountSetup
      ? "Si eres usuario Uninorte, también puedes:"
      : "O si eres usuario Uninorte:",
  };

  return (
    <div className="space-y-4">
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          try {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const raw = Object.fromEntries(formData) as Record<string, any>;

            // Aquí Zod validará si las contraseñas coinciden
            const values = await changePasswordSchema.parseAsync(raw);

            // Llamada al endpoint de reset password
            await api.post("/auth/reset-password", {
              token,
              password: values.password,
            });

            addNotification({
              type: "success",
              title: texts.successTitle,
              message: texts.successMessage,
            });

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } catch (error: any) {
            // Manejo de errores específico para Zod y API
            let errorMessage = texts.errorTitle;

            if (error instanceof z.ZodError) {
              // Tomamos el primer mensaje de error de Zod (ej: "Las contraseñas no coinciden")
              errorMessage = error.issues[0].message;
            } else if (error?.message) {
              errorMessage = error.message;
            }

            addNotification({
              type: "error",
              title: "Error",
              message: errorMessage,
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          label={texts.passwordLabel}
          placeholder="••••••••"
          isRequired
          endContent={
            <a
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-default-400 hover:text-default-600" />
              ) : (
                <Eye className="h-4 w-4 text-default-400 hover:text-default-600" />
              )}
            </a>
          }
        />

        <Input
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirmar contraseña"
          placeholder="••••••••"
          isRequired
          endContent={
            <a
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-default-400 hover:text-default-600" />
              ) : (
                <Eye className="h-4 w-4 text-default-400 hover:text-default-600" />
              )}
            </a>
          }
        />

        <div className="text-sm text-muted-foreground space-y-2 px-1">
          <p className="font-medium">La contraseña debe contener:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-400">
            <li>Al menos 8 caracteres</li>
            <li>Al menos una letra mayúscula</li>
            <li>Al menos una letra minúscula</li>
            <li>Al menos un caracter especial (ej. !@#$)</li>
          </ul>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {texts.buttonText}
        </Button>
      </Form>

      {isAccountSetup && (
        <>
          <div className="w-full flex items-center justify-center mb-2 mt-2">
            <a className="text-sm font-medium text-gray-400 text-center">
              {texts.microsoftText}
            </a>
          </div>
          <Button
            className="w-full"
            onClick={handleMicrosoftLogin}
            type="button"
          >
            <img
              src="/microsoft.webp"
              alt="Microsoft Logo"
              className="inline-block w-7 h-7"
            />
            Iniciar sesión con Outlook
          </Button>
        </>
      )}

      {isPasswordReset && (
        <div className="w-full flex items-center justify-center mb-2 mt-2">
          <Button
            className="w-full"
            variant="bordered"
            onClick={() => router.push("/auth/login")}
            type="button"
          >
            Volver al inicio de sesión
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordForm;
