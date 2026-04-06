'use client';

import { IrisLogo } from './iris-logo';
import { landingContent } from '../content';


export function Footer() {
  return (
    <footer className="relative z-10 px-6 py-12 md:px-12 border-t border-border/30 glass-effect">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          {/* Logo y nombre */}
          <div className="flex items-center gap-3">
            <IrisLogo size={32} />
            <span className="text-2xl font-bold prismatic-text">{landingContent.footer.brand}</span>
          </div>
          
          {/* Descripction */}
          <p className="text-sm text-muted-foreground max-w-md">
            {landingContent.footer.description}
          </p>
        </div>
      </div>
    </footer>
  );
}
