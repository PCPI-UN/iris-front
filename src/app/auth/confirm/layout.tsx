import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Confirmar cuenta - Iris",
  description: "Confirma tu cuenta en Iris",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
