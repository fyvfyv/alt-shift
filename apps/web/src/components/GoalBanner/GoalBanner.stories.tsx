import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { GoalBanner } from './GoalBanner';

const meta = {
  component: GoalBanner,
  parameters: { layout: 'padded' },
  args: {
    count: 0,
    action: (
      <Button to="/new" iconLeading="plus">
        {copy.createNew}
      </Button>
    ),
  },
  argTypes: { count: { control: { type: 'range', min: 0, max: 5 } } },
} satisfies Meta<typeof GoalBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoLetters: Story = {};

export const AlmostThere: Story = { args: { count: 4 } };

export const Reached: Story = {
  args: {
    count: 5,
    reachedAction: (
      <Button to="/new" iconLeading="plus">
        {copy.createNew}
      </Button>
    ),
  },
};
