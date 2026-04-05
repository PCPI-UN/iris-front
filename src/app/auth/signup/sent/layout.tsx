import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Correo enviado - Iris",
  description: "Te enviamos un correo para confirmar tu cuenta en Iris",
};

export default function SignupSentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
