'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { paths } from '@/config/paths';
import { RegisterForm } from '@/features/auth/components/register-form';

const RegisterPage = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  const [chooseTeam, setChooseTeam] = useState(false);

  return (
    <RegisterForm
      onSuccess={() =>
        router.replace(
          `${redirectTo ? `${decodeURIComponent(redirectTo)}` : paths.app.dashboard.getHref()}`,
        )
      }
      chooseTeam={chooseTeam}
      setChooseTeam={() => setChooseTeam(!chooseTeam)}
    />
  );
};

export default RegisterPage;
