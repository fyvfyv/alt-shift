import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, spyOn } from 'storybook/test';
import { copy } from '../../copy';
import { CopyButton } from './CopyButton';

const meta = {
  component: CopyButton,
  args: { text: 'Dear Apple team,' },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Copied: Story = {
  beforeEach: () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    return () => writeText.mockRestore();
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: copy.letter.copy }));
    await expect(await canvas.findByRole('button', { name: copy.letter.copied })).toBeVisible();
  },
};

export const Failed: Story = {
  beforeEach: () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    );
    return () => writeText.mockRestore();
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: copy.letter.copy }));
    await expect(await canvas.findByRole('button', { name: copy.letter.copyFailed })).toBeVisible();
  },
};
