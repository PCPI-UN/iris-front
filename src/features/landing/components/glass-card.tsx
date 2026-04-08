import type React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'yellow' | 'none';
  style?: React.CSSProperties;
}

export function GlassCard({ children, className, glow = 'none', style }: GlassCardProps) {
  return (
    <div
      style={style}
      className={cn(
        'glass-effect rounded-xl p-6 transition-all duration-300 hover:glass-effect-strong',
        glow !== 'none' && `glow-${glow}`,
        className
      )}
    >
      {children}
    </div>
  );
}
