import type { Meta, StoryObj } from '@storybook/react-vite';
import { copy } from '../../copy';
import { Button } from '../Button/Button';
import { EmptyPanel } from './EmptyPanel';

const meta = {
  component: EmptyPanel,
  parameters: { layout: 'padded' },
  args: {
    text: copy.dashboard.empty,
    action: (
      <Button to="/new" size="md" iconLeading="plus">
        {copy.createNew}
      </Button>
    ),
  },
} satisfies Meta<typeof EmptyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHeadingAndNote: Story = {
  args: {
    heading: copy.dashboard.pitch,
    note: copy.dashboard.trust,
    action: (
      <Button variant="secondary" size="md" to="/new" state={{ prefill: copy.example.request }}>
        {copy.example.label}
      </Button>
    ),
  },
};
