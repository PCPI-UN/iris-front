import * as React from 'react';

import { rtlRender, screen, userEvent } from '@/testing/test-utils';

import { Switch } from '../switch';

describe('Switch', () => {
  it('should render switch correctly', () => {
    rtlRender(<Switch data-testid="switch">Enable notifications</Switch>);

    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('should render with label', () => {
    rtlRender(<Switch>Enable notifications</Switch>);

    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('should toggle when clicked', async () => {
    const user = userEvent.setup();
    rtlRender(<Switch>Enable notifications</Switch>);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();

    await user.click(switchElement);
    expect(switchElement).toBeChecked();
  });

  it('should be checked when defaultSelected is true', () => {
    rtlRender(<Switch defaultSelected>Enable notifications</Switch>);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('should be disabled when isDisabled is true', () => {
    rtlRender(<Switch isDisabled>Disabled switch</Switch>);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('should be readonly when isReadOnly is true', async () => {
    const user = userEvent.setup();
    rtlRender(<Switch isReadOnly defaultSelected>Readonly switch</Switch>);

    // HeroUI marks it with aria-readonly, not the readonly attribute
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-readonly', 'true');

    await user.click(switchElement);
    expect(switchElement).toBeChecked();
  });

  it('should handle controlled state', async () => {
    const user = userEvent.setup();
    const TestControlledSwitch = () => {
      const [isSelected, setIsSelected] = React.useState(false);

      return (
        <Switch isSelected={isSelected} onValueChange={setIsSelected}>
          Controlled switch
        </Switch>
      );
    };

    rtlRender(<TestControlledSwitch />);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();

    await user.click(switchElement);
    expect(switchElement).toBeChecked();
  });
});
