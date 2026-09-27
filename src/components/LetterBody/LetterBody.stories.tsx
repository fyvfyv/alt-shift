import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleText } from '../../../.storybook/storyData';
import { LetterBody } from './LetterBody';

const meta = {
  component: LetterBody,
  parameters: { layout: 'padded' },
  args: { text: sampleText, spacing: 'comfortable' },
  decorators: [
    (Story) => (
      <div style={{ width: 608 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LetterBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comfortable: Story = {};

export const Compact: Story = { args: { spacing: 'compact' } };
