import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressDots } from './ProgressDots';

const meta = {
  component: ProgressDots,
  args: { count: 2, total: 5 },
  argTypes: { count: { control: { type: 'range', min: 0, max: 5 } } },
} satisfies Meta<typeof ProgressDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dots: Story = {};

export const Bars: Story = {
  args: { variant: 'bars' },
  decorators: [
    (Story) => (
      <div style={{ width: 336 }}>
        <Story />
      </div>
    ),
  ],
};
