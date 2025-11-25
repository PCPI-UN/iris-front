import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Input } from '../input';
import { Select, SelectItem } from '../select';
import { Switch } from '../switch';
import { Textarea } from '../textarea';

import { Form } from './form';

const meta: Meta<typeof Form> = {
  component: Form,
  title: 'UI/Form',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    const [formData, setFormData] = useState({});

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          setFormData(data);
          alert(JSON.stringify(data, null, 2));
        }}
        className="max-w-md space-y-4"
      >
        <Input label="Name" name="name" placeholder="Enter your name" />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
        />
        <Textarea
          label="Message"
          name="message"
          placeholder="Enter your message"
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Submit
          </button>
          <button type="reset" className="px-4 py-2 bg-gray-300 text-gray-700 rounded">
            Reset
          </button>
        </div>
      </Form>
    );
  },
};

export const WithSelect: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          setSubmitted(true);
          // ...existing code...
        }}
        className="max-w-md space-y-4"
      >
        <Input label="Name" name="name" placeholder="Enter your name" />
        <Select label="Country" name="country" placeholder="Select a country">
          <SelectItem key="us">United States</SelectItem>
          <SelectItem key="uk">United Kingdom</SelectItem>
          <SelectItem key="ca">Canada</SelectItem>
          <SelectItem key="au">Australia</SelectItem>
        </Select>
        <Input
          label="Age"
          name="age"
          type="number"
          placeholder="Enter your age"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Submit
        </button>
        {submitted && <p className="text-green-600">Form submitted successfully!</p>}
      </Form>
    );
  },
};

export const WithSwitch: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          // ...existing code...
        }}
        className="max-w-md space-y-4"
      >
        <Input label="Email" name="email" type="email" placeholder="Enter your email" />
        <div>
          <Switch name="newsletter" defaultSelected>
            Subscribe to newsletter
          </Switch>
        </div>
        <div>
          <Switch name="notifications">
            Enable notifications
          </Switch>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Submit
        </button>
      </Form>
    );
  },
};

export const WithValidation: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          alert('Form validated and submitted!');
        }}
        validationBehavior="native"
        className="max-w-md space-y-4"
      >
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          isRequired
          description="We'll never share your email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          isRequired
          description="Must be at least 8 characters"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Submit
        </button>
      </Form>
    );
  },
};

export const WithValidationErrors: Story = {
  render: () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    return (
      <Form
        validationErrors={errors}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
          
          if (!email) {
            setErrors({ email: 'Email is required' });
          } else if (!email.includes('@')) {
            setErrors({ email: 'Please enter a valid email' });
          } else {
            setErrors({});
            alert('Form submitted!');
          }
        }}
        className="max-w-md space-y-4"
      >
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          errorMessage={errors.email}
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Submit
        </button>
      </Form>
    );
  },
};
