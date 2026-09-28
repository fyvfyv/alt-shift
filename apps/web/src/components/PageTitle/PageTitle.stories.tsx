import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { PageTitle } from './PageTitle';

const meta = {
  component: PageTitle,
  parameters: { layout: 'padded' },
  args: { children: copy.generator.title },
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = { args: { placeholder: true } };

export const Filled: Story = { args: { children: 'Product Manager, Apple' } };

export const Truncated: Story = {
  args: { children: 'Senior Staff Product Manager, Platform Infrastructure, Apple' },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export const LargeWithAction: Story = {
  args: {
    size: 'lg',
    children: copy.dashboard.title,
    action: (
      <Button to="/new" size="md" iconLeading="plus">
        {copy.createNew}
      </Button>
    ),
  },
};
