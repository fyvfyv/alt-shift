import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleLetters } from '@stories/storyData';
import { DashboardPage } from './DashboardPage';

const meta = {
  component: DashboardPage,
  parameters: { layout: 'fullscreen', chrome: true },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const ThreeLetters: Story = { parameters: { letters: sampleLetters(3) } };

export const GoalReached: Story = { parameters: { letters: sampleLetters(6) } };

export const WhileWriting: Story = {
  parameters: {
    letters: sampleLetters(2),
    generationDelayMs: 150,
    queued: [
      { jobTitle: 'Product Manager', company: 'Stripe', skills: 'Roadmaps', details: '' },
      { jobTitle: 'Product Manager', company: 'Linear', skills: 'Roadmaps', details: '' },
    ],
  },
};
