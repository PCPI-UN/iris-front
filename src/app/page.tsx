'use client';

import { useEffect } from 'react';
import { LandingPage } from '@/features/landing';
import { SupportButton } from '@/components/support-button';
import '@/features/landing/index.css';

const HomePage = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Remover estilos de HeroUI del body para la landing
    const style = document.createElement('style');
    style.id = 'landing-override';
    style.textContent = `
      body {
        background-color: var(--background) !important;
        color: var(--foreground) !important;
      }
      .landing-page * {
        /* Resetear estilos de HeroUI */
        --heroui-primary: var(--primary) !important;
        --heroui-secondary: var(--secondary) !important;
        --heroui-foreground: var(--foreground) !important;
        --heroui-background: var(--background) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const styleElement = document.getElementById('landing-override');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <>
      <LandingPage />
      <SupportButton />
    </>
  );
};

export default HomePage;
