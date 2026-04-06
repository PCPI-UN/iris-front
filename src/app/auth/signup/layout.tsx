import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Registro - Iris',
  description: 'Crea tu cuenta en Iris',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
