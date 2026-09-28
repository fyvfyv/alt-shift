import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { copy } from '@copy';
import { sampleLetters } from '@stories/storyData';
import { LetterCard } from './LetterCard';

const [short, , long] = sampleLetters(3);

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

export const Reading: Story = {
  args: { letter: long },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: copy.letter.readMore }));
  },
};

export const Phone: Story = { args: { letter: long }, parameters: { width: 343 } };

export const SmallPhone: Story = { args: { letter: long }, parameters: { width: 288 } };
