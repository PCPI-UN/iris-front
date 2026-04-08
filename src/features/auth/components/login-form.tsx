'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import { User } from '@/types/api';
import { useLogin, loginInputSchema } from '@/lib/auth';

type LoginFormProps = {
  onSuccess: (user?: User) => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const login = useLogin({
    onSuccess,
  });

  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  const handleMicrosoftLogin = () => {
    const params = new URLSearchParams();

    // Allow only relative paths to avoid forwarding open redirects.
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      params.set('redirect', `redirect:${redirectTo}`);
    }

    const query = params.toString();
    const loginUrl = query
      ? `/api/auth/login/microsoft?${query}`
      : '/api/auth/login/microsoft';

    window.location.replace(loginUrl);
  };

  return (
    <div className="space-y-4">
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          setErrorMessage('');
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          const values = await loginInputSchema.parseAsync(data);
          try {
            await login.mutateAsync(values);
          } catch (error: any) {
            const message = error?.message || 'Error al iniciar sesión';
            if (message.toLowerCase().includes('invalid username or password')) {
              setErrorMessage('Correo o contraseña incorrectos');
            } else if (message.toLowerCase().includes('unauthorized')) {
              setErrorMessage('Credenciales inválidas');
            } else {
              setErrorMessage(message);
            }
          }
        }}
      >
        <Input
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          isRequired
        />
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          label="Contraseña"
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

        <Button
          isLoading={login.isPending}
          type="submit"
          className="w-full mt-2"
        >
          Iniciar sesión
        </Button>
        {errorMessage && (
          <div className="text-sm text-red-500 text-center mt-2">
            {errorMessage}
          </div>
        )}
        <div className="w-full flex items-center justify-center">
          <NextLink
            href={paths.auth.forgot_password.getHref(redirectTo)}
            className="text-sm font-medium text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </NextLink>
        </div>
      </Form>

      <div className="w-full flex items-center justify-center mb-2 mt-2">
        <a
          className="text-sm font-medium text-gray-400 text-center"
        >
          Si eres usuario Uninorte, puedes:
        </a>
      </div>

      <Button
        className="w-full mb-4"
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

        <div className="w-full flex items-center justify-center mt-4">
        <div className="text-sm">
          ¿Eres nuevo?
          <NextLink
            href={paths.auth.signup.getHref(redirectTo)}
            className="font-medium text-primary hover:underline ml-1"
          >
            Crea tu cuenta
          </NextLink>
        </div>
      </div>
    </div>

    
  );
};
