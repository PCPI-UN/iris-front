import { rtlRender, screen, userEvent } from '@/testing/test-utils';

import { Select, SelectItem } from '../select';

describe('Select', () => {
  it('should render select correctly', () => {
    rtlRender(
      <Select placeholder="Select an option" data-testid="select">
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    const select = screen.getByTestId('select');
    expect(select).toBeInTheDocument();
  });

  it('should render with label', () => {
    rtlRender(
      <Select label="Choose an option" placeholder="Select an option">
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    // HeroUI also labels its hidden native select, so the visible label is the one in the label slot
    expect(
      screen.getByText('Choose an option', { selector: '[data-slot="label"]' }),
    ).toBeInTheDocument();
  });

  it('should render with description', () => {
    rtlRender(
      <Select
        label="Choose an option"
        placeholder="Select an option"
        description="This is a description"
      >
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    rtlRender(
      <Select
        label="Choose an option"
        placeholder="Select an option"
        isInvalid
        errorMessage="Please select an option"
      >
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
  });

  it('should be disabled when isDisabled is true', () => {
    rtlRender(
      <Select label="Choose an option" placeholder="Select an option" isDisabled>
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    // HeroUI renders a button as the trigger and a hidden native select for forms
    const trigger = screen.getByRole('button', { name: /choose an option/i });
    expect(trigger).toHaveAttribute('data-disabled', 'true');
    expect(document.querySelector('select')).toBeDisabled();
  });

  it('should be required when isRequired is true', () => {
    rtlRender(
      <Select label="Choose an option" placeholder="Select an option" isRequired>
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    expect(document.querySelector('select')).toBeRequired();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    rtlRender(
      <Select placeholder="Select an option">
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
      </Select>
    );
    
    await user.click(screen.getByRole('button', { name: /select an option/i }));

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Option 1', 'Option 2']);
  });

  it('should support multiple selection', async () => {
    const user = userEvent.setup();
    rtlRender(
      <Select
        label="Choose options"
        selectionMode="multiple"
        placeholder="Select multiple options"
      >
        <SelectItem key="option1">Option 1</SelectItem>
        <SelectItem key="option2">Option 2</SelectItem>
        <SelectItem key="option3">Option 3</SelectItem>
      </Select>
    );
    
    await user.click(screen.getByRole('button', { name: /choose options/i }));

    expect(await screen.findByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual([
      'Option 1',
      'Option 2',
      'Option 3',
    ]);
  });
});
