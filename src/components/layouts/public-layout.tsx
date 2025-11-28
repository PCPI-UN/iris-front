'use client';

import { Navbar } from '@/components/layouts/navbar';
import { SupportButton } from '@/components/support-button';
import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

export function PublicLayout({ children, showNavLinks = true, showLoginButton = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar showNavLinks={showNavLinks} showLoginButton={showLoginButton} />
      <main className="pt-24">
        {children}
      </main>
      <SupportButton />
    </div>
  );
}
