import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Developers, DevelopersLegacy } from '@/features/developers';

const createStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
};

if (typeof window !== 'undefined') {
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    });
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('IRIS-V3-EVT-01 §3.2.3 - Vista de Contribuidores (S1-08)', () => {
  it('renderiza la nueva vista Developers conservando métricas, versiones, roles y todos los contribuidores', () => {
    render(<Developers />);

    expect(
      screen.getByRole('heading', { name: /IRIS.*Equipo de Desarrollo/i }),
    ).toBeInTheDocument();

    // Verifica que las 2 cohortes (v2.0 y v1.0) estén presentes por defecto
    expect(
      screen.getByRole('heading', { name: /Generación Actual & Consolidación/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Generación Fundacional/i }),
    ).toBeInTheDocument();

    // Verifica que integrantes de v2.0 y v1.0 se muestren con sus roles y handles de GitHub
    expect(screen.getByText('Judith Isabel Pérez Conde')).toBeInTheDocument();
    expect(screen.getByText('@Judithpc23')).toBeInTheDocument();
    expect(screen.getByText('Juan Andrés Povea Fernandez')).toBeInTheDocument();
    expect(screen.getByText('@J-Povea21')).toBeInTheDocument();
  });

  it('permite filtrar por versión, rol y búsqueda instantánea sin perder funcionalidad', async () => {
    const user = userEvent.setup();
    render(<Developers />);

    // Filtrar por versión v2.0
    const v2Button = screen.getByRole('button', { name: /^v2\.0/i });
    await user.click(v2Button);

    expect(screen.getByText('Judith Isabel Pérez Conde')).toBeInTheDocument();
    expect(screen.queryByText('Juan Andrés Povea Fernandez')).not.toBeInTheDocument();

    // Filtrar por rol DevOps dentro de v2.0
    const devopsButton = screen.getByRole('button', { name: 'DevOps (1)' });
    await user.click(devopsButton);

    expect(screen.getByText('Camilo Andrés De la Rosa Movilla')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Judith Isabel Pérez Conde')).not.toBeInTheDocument();
    });

    // Volver a Todas las versiones y Todos los roles y probar el buscador
    await user.click(screen.getByRole('button', { name: /^Todas/i }));
    await user.click(screen.getByRole('button', { name: /^Todos/i }));

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, rol o @github/i);
    await user.type(searchInput, 'djromerom');

    expect(screen.getAllByText('Daniel José Romero Martínez').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.queryByText('Camilo Andrés De la Rosa Movilla')).not.toBeInTheDocument();
    });
  });

  it('abre la Ficha de Contribuidor (Inspector de Cohorte) al seleccionar una tarjeta y muestra su trayectoria', async () => {
    const user = userEvent.setup();
    render(<Developers />);

    const card = screen.getAllByRole('button', {
      name: /Ver ficha técnica de Daniel José Romero Martínez/i,
    })[0];
    await user.click(card);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Ficha de Contribuidor/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Trayectoria por versión \(2\)/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/github\.com\/djromerom/i)).toBeInTheDocument();
  });

  it('mantiene intacta la vista anterior bajo DevelopersLegacy', () => {
    render(<DevelopersLegacy />);

    expect(
      screen.getByRole('heading', { name: /IRIS.*Equipo de Desarrollo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Judith Isabel Pérez Conde')).toBeInTheDocument();
  });
});
