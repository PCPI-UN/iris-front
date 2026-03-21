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
    <div className="min-h-screen bg-transparent">
      <Navbar showNavLinks={showNavLinks} showLoginButton={showLoginButton} />
      <main className="relative z-10" style={{ paddingTop: '73px' }}>
        {children}
      </main>
      <SupportButton />
    </div>
  );
}
