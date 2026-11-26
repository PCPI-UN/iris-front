import * as React from 'react';

import { rtlRender, screen, userEvent } from '@/testing/test-utils';

import { Form } from '../form';

describe('Form', () => {
  it('should render form correctly', () => {
    rtlRender(
      <Form data-testid="form" onSubmit={(e) => e.preventDefault()}>
        <button type="submit">Submit</button>
      </Form>
    );

    const form = screen.getByTestId('form');
    expect(form).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    rtlRender(
      <Form onSubmit={handleSubmit} data-testid="form">
        <button type="submit">Submit</button>
      </Form>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should handle form reset', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();

    rtlRender(
      <Form onReset={handleReset} data-testid="form">
        <input name="test" defaultValue="test value" />
        <button type="reset">Reset</button>
      </Form>
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(handleReset).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    rtlRender(
      <Form
        onSubmit={(e) => e.preventDefault()}
        className="custom-class"
        data-testid="form"
      >
        Content
      </Form>
    );

    const form = screen.getByTestId('form');
    expect(form).toHaveClass('custom-class');
  });

  it('should support native validation', async () => {
    const user = userEvent.setup();

    rtlRender(
      <Form
        onSubmit={(e) => e.preventDefault()}
        validationBehavior="native"
        data-testid="form"
      >
        <input name="email" type="email" aria-label="Email" required />
        <button type="submit">Submit</button>
      </Form>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    const input = screen.getByRole('textbox', { name: /email/i });
    expect(input).toBeInvalid();
  });
});
