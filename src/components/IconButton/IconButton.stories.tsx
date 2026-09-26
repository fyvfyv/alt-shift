import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta = {
  component: IconButton,
  args: { icon: 'home-02', 'aria-label': 'Dashboard' },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {};

export const AsLink: Story = { args: { to: '/' } };

export const Disabled: Story = { args: { disabled: true } };
