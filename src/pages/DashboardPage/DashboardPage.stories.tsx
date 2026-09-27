import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleLetters } from '../../../.storybook/storyData';
import { DashboardPage } from './DashboardPage';

const meta = {
  component: DashboardPage,
  parameters: { layout: 'fullscreen', chrome: true },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// A first visit: what the product does, the example that needs no typing, where letters are kept.
export const Empty: Story = {};

export const ThreeLetters: Story = { parameters: { letters: sampleLetters(3) } };

export const GoalReached: Story = { parameters: { letters: sampleLetters(6) } };
