'use client';
// Signup form component used in the registration page
import { useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import { useRegister, registerInputSchema } from '@/lib/auth';

type RegisterFormProps = {
  onSuccess: () => void;
};

export const RegisterForm = ({
  onSuccess,
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const registering = useRegister({ onSuccess });
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  // User can login with Microsoft instead of signing up manually.
  const handleMicrosoftLogin = () => {
    const params = new URLSearchParams();

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
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          const values = await registerInputSchema.parseAsync(data);
          await registering.mutateAsync(values);
        }}
      >
            <Input
              name="firstName"
              type="text"
              label="Nombre"
              isRequired
            />
            <Input
              name="lastName"
              type="text"
              label="Apellido"
              isRequired
            />
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
                isLoading={registering.isPending}
                type="submit"
                className="w-full mt-2"
              >
                Registrarse
              </Button>
            
      </Form>

            <div className="w-full flex items-center justify-center mb-2 mt-2">
        <a className="text-sm font-medium text-gray-400 text-center">
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
          
            <div className="mt-4 flex items-center justify-center">
        <div className="text-sm">
          ¿Ya tienes cuenta?
          <NextLink
            href={paths.auth.login.getHref(redirectTo)}
            className="font-medium text-primary hover:underline ml-1"
          >
            Inicia sesión
          </NextLink>
        </div>
      </div>

    </div>
  );
};
