import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleLetters } from '../../../.storybook/storyData';
import { GeneratorPage } from './GeneratorPage';

// Generate Now streams a recorded letter from a fake port; `generationDelayMs` sets its pace.
const meta = {
  component: GeneratorPage,
  parameters: { layout: 'fullscreen', route: '/new' },
} satisfies Meta<typeof GeneratorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SlowStream: Story = { parameters: { generationDelayMs: 200 } };

export const OneLetterFromGoal: Story = { parameters: { letters: sampleLetters(4) } };
