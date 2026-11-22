"use client";

import { useState } from "react";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";

// Simple schema for forgot password (email only)
const forgotPasswordSchema = z.object({
	email: z.string().min(1, "Requerido").email("Correo electrónico inválido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm = () => {
	const { addNotification } = useNotifications();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	return (
		<div className="space-y-4">
			<Form
				onSubmit={async (e) => {
					e.preventDefault();
					setIsSubmitting(true);
					try {
						const form = e.target as HTMLFormElement;
						const formData = new FormData(form);
						const raw = Object.fromEntries(formData) as Record<string, any>;
						const values = await forgotPasswordSchema.parseAsync(raw);

						// Simulación de petición al backend
						await new Promise((r) => setTimeout(r, 700));

						setSubmitted(true);
						addNotification({
							type: "success",
							title: "Correo enviado",
							message: `Se envió un enlace a ${values.email}`,
						});
					} catch (error: any) {
						addNotification({
							type: "error",
							title: "Error",
							message: error?.message || "Verifica el correo ingresado",
						});
					} finally {
						setIsSubmitting(false);
					}
				}}
			>
				<Input
					name="email"
					type="email"
					label="Correo"
					placeholder="tu@correo.com"
					isRequired
				/>
				<Button
					type="submit"
					className="w-full"
					isLoading={isSubmitting}
					disabled={isSubmitting}
				>
					Enviar enlace
				</Button>
			</Form>
			{submitted && (
				<div className="text-xs text-center text-green-600">
					Si el correo existe se habrá enviado un enlace de recuperación.
				</div>
			)}
		</div>
	);
};

export default ForgotPasswordForm;
