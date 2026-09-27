import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleLetters } from '../../../.storybook/storyData';
import { copy } from '../../copy';
import { LetterCard } from './LetterCard';

const [short, , long] = sampleLetters(3);

// The card takes its width from the dashboard grid; stories set it directly.
type CardParameters = { width?: number };

const meta = {
  component: LetterCard,
  args: { letter: short, onDelete: fn() },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: (parameters as CardParameters).width ?? 413 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LetterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Short: Story = {};

export const Long: Story = { args: { letter: long } };

export const Signed: Story = { args: { letter: long, signature: 'Jane Doe' } };

// Read more opens the whole letter in a dialog over the page; the card stays as it was.
export const Reading: Story = {
  args: { letter: long },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: copy.letter.readMore }));
  },
};

// A 375px phone: Delete and Copy still share one row, so the preview keeps its height.
export const Phone: Story = { args: { letter: long }, parameters: { width: 343 } };

// A 320px phone: the two actions no longer fit one row, and the preview gives up a line.
export const SmallPhone: Story = { args: { letter: long }, parameters: { width: 288 } };
