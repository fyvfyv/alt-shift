import type { Meta, StoryObj } from '@storybook/react-vite';
import { StorageNote } from './StorageNote';

const meta = {
  component: StorageNote,
  args: { failed: true },
  decorators: [
    (Story) => (
      <div style={{ width: 413 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StorageNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AlignedEnd: Story = { args: { align: 'end' } };
