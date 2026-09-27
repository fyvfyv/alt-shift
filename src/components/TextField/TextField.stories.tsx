import type { Meta, StoryObj } from '@storybook/react-vite';
import { LIMITS } from '../../../shared/generation';
import { copy } from '../../copy';
import { TextField } from './TextField';

const { jobTitle } = copy.generator.fields;

const meta = {
  component: TextField,
  args: { label: jobTitle.label, placeholder: jobTitle.placeholder },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = { args: { defaultValue: 'Product Manager' } };

export const Focused: Story = {
  args: { defaultValue: 'Product Manager' },
  play: ({ canvas }) => canvas.getByRole('textbox').focus(),
};

export const WithError: Story = {
  args: {
    defaultValue: 'Product Manager'.repeat(21),
    error: copy.generator.fieldTooLong(LIMITS.singleLine),
  },
};

export const HiddenLabel: Story = {
  args: { label: copy.signature.label, placeholder: copy.signature.label, hideLabel: true },
};
