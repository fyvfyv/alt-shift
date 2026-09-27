import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { copy } from '../../copy';
import { SignatureField } from './SignatureField';

const meta = {
  component: SignatureField,
  args: { name: '', onChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignatureField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Named: Story = { args: { name: 'Alex Morgan' } };

export const Editing: Story = {
  args: { name: 'Alex Morgan' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: copy.signature.change }));
  },
};
