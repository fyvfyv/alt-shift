import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, useState } from 'react';
import { LIMITS } from '../../../shared/generation';
import { copy } from '../../copy';
import { TextArea } from './TextArea';

const { details } = copy.generator.fields;

// TextArea is controlled: the counter needs the value.
function ControlledTextArea({ value, ...props }: ComponentProps<typeof TextArea>) {
  const [current, setCurrent] = useState(value);
  return <TextArea {...props} value={current} onChange={(e) => setCurrent(e.target.value)} />;
}

const meta = {
  component: TextArea,
  render: (args) => <ControlledTextArea {...args} />,
  args: {
    label: details.label,
    placeholder: details.placeholder,
    value: '',
    limit: LIMITS.details,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 656 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { value: 'Seven years shipping B2B products, most recently a payments dashboard.' },
};

export const OverLimit: Story = {
  args: { value: 'I ship products people love. '.repeat(45) },
};
