import type { Meta, StoryObj } from '@storybook/react-vite';
import { copy } from '../../copy';
import { Button } from '../Button/Button';
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

export const OneLetter: Story = { args: { count: 1 } };

export const TwoLetters: Story = { args: { count: 2 } };

export const ThreeLetters: Story = { args: { count: 3 } };

export const FourLetters: Story = { args: { count: 4 } };
