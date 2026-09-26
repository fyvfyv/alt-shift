import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleLetters } from '../../../.storybook/storyData';
import { AppHeader } from './AppHeader';

// The count comes from the letter store, seeded through the `letters` parameter.
const meta = {
  component: AppHeader,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoLetters: Story = {};

export const InProgress: Story = { parameters: { letters: sampleLetters(3) } };

export const GoalReached: Story = { parameters: { letters: sampleLetters(5) } };
