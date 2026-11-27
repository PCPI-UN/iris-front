import { EyeOff } from "lucide-react";

/** Takes the place of grades that stay hidden until the results are published */
export const HiddenNotice = ({
  message = "La nota se muestra cuando se publiquen los resultados del evento.",
}: {
  message?: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <EyeOff
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-slate-400"
    />
    <p className="text-sm text-slate-300">{message}</p>
  </div>
);
