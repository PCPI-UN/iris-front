'use client';

import { useEffect, useState } from 'react';
import { Info, CircleAlert, CircleX, CircleCheck } from 'lucide-react';

const icons = {
  info: <Info className="size-6 text-blue-500" aria-hidden="true" />,
  success: <CircleCheck className="size-6 text-green-500" aria-hidden="true" />,
  warning: (
    <CircleAlert className="size-6 text-yellow-500" aria-hidden="true" />
  ),
  error: <CircleX className="size-6 text-red-500" aria-hidden="true" />,
};

export type NotificationProps = {
  notification: {
    id: string;
    type: keyof typeof icons;
    title: string;
    message?: string;
  };
  onDismiss: (id: string) => void;
};

export const Notification = ({
  notification: { id, type, title, message },
  onDismiss,
}: NotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Duración de la animación
  };

  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50); // Pequeño delay para activar la animación

    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className="flex w-full flex-col items-center space-y-4 sm:items-end z-[100]">
      <div 
        className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10 transition-all duration-300 ease-out ${
          isExiting 
            ? 'opacity-0 translate-x-full scale-95' 
            : isEntering 
            ? 'opacity-0 translate-x-full scale-95'
            : 'opacity-100 translate-x-0 scale-100'
        }`}
        style={{
          background: 'rgba(18, 18, 28, 0.4)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="p-4" role="alert" aria-label={title}>
          <div className="flex items-start">
            <div className="shrink-0">{icons[type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
            </div>
            <div className="ml-4 flex shrink-0">
              <button
                className="inline-flex rounded-md bg-transparent text-muted-foreground hover:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                onClick={handleDismiss}
              >
                <span className="sr-only">Close</span>
                <CircleX className="size-5 cursor-pointer" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
