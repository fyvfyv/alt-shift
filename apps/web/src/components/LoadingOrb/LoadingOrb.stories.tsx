import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingOrb } from './LoadingOrb';

const meta = {
  component: LoadingOrb,
} satisfies Meta<typeof LoadingOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Breathing: Story = {};

export const Exiting: Story = { args: { exiting: true } };
