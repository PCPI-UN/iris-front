import { createUser } from '@/testing/data-generators';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';
import { vi } from 'vitest';

import { RegisterForm } from '../register-form';

test('should register new user and call onSuccess cb which should navigate the user to the app', async () => {
  const newUser = createUser({});

  const onSuccess = vi.fn();

  await renderApp(
    <RegisterForm
      onSuccess={onSuccess}
    />,
    { user: null },
  );

  await userEvent.type(screen.getByLabelText(/nombre/i), newUser.firstName);
  await userEvent.type(screen.getByLabelText(/apellido/i), newUser.lastName);
  await userEvent.type(screen.getByLabelText(/correo electrónico/i), newUser.email);
  await userEvent.type(screen.getByLabelText(/contraseña/i), newUser.password);

  await userEvent.click(screen.getByRole('button', { name: /registrarse/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});
