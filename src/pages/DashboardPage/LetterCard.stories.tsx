import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleLetters } from '../../../.storybook/storyData';
import { LetterCard } from './LetterCard';

const [short, , long] = sampleLetters(3);

const meta = {
  component: LetterCard,
  args: { letter: short, onDelete: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 413 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LetterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Short: Story = {};

export const Long: Story = { args: { letter: long } };
