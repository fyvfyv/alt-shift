import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressCounter } from './ProgressCounter';

const meta = {
  component: ProgressCounter,
  args: { count: 0 },
  argTypes: { count: { control: { type: 'range', min: 0, max: 6 } } },
} satisfies Meta<typeof ProgressCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const InProgress: Story = { args: { count: 3 } };

export const GoalReached: Story = { args: { count: 5 } };

export const AllCounts: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {[0, 1, 2, 3, 4, 5, 6].map((count) => (
        <ProgressCounter key={count} count={count} />
      ))}
    </div>
  ),
};
