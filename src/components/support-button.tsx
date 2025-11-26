'use client';

import { MessageCircle } from 'lucide-react';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const SupportButton = () => {
  const handleDiscordClick = () => {
    window.open('https://discord.gg/AaHvrBJ5t7', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipPrimitive.Provider delayDuration={0}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <button
              onClick={handleDiscordClick}
              className="h-10 w-10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_4px_20px_oklch(0.75_0.15_195_/_0.3),_0_0_30px_oklch(0.75_0.15_195_/_0.15)] transition-all duration-300 backdrop-blur-md bg-gradient-to-br from-[oklch(0.75_0.15_195_/_0.2)] to-[oklch(0.75_0.15_195_/_0.1)] border border-[oklch(0.75_0.15_195_/_0.4)] hover:border-[oklch(0.75_0.15_195_/_0.6)] hover:from-[oklch(0.75_0.15_195_/_0.3)] hover:to-[oklch(0.75_0.15_195_/_0.15)] flex items-center justify-center cursor-pointer"
            >
              <MessageCircle className="h-5 w-5 text-[oklch(0.75_0.15_195)]" />
            </button>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="left"
              sideOffset={10}
              className="z-[60] rounded-lg px-2 py-2 text-sm font-light text-white backdrop-blur-md bg-gradient-to-br from-[oklch(0.75_0.15_195_/_0.2)] to-[oklch(0.75_0.15_195_/_0.1)] border border-[oklch(0.75_0.15_195_/_0.4)] shadow-md animate-in fade-in-0 zoom-in-95 duration-200 relative"
            >
              Canal de soporte
              
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </div>
  );
};
