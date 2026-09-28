import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleLetters } from '@stories/storyData';
import { GeneratorPage } from './GeneratorPage';

const meta = {
  component: GeneratorPage,
  parameters: { layout: 'fullscreen', route: '/new', chrome: true },
} satisfies Meta<typeof GeneratorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SlowStream: Story = { parameters: { generationDelayMs: 200 } };

export const OneLetterFromGoal: Story = { parameters: { letters: sampleLetters(4) } };

export const GoalReached: Story = { parameters: { letters: sampleLetters(5) } };
