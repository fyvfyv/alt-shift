import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Run } from '@services/generation/types';
import { sampleText } from '@stories/storyData';
import { RunCard } from './RunCard';

function runIn(state: Run['state']): Run {
  return {
    id: 'story-run',
    key: 'story-run',
    createdAt: Date.UTC(2026, 8, 27),
    request: { jobTitle: 'Product Manager', company: 'Stripe', skills: 'Roadmaps', details: '' },
    state,
  };
}

const meta = {
  component: RunCard,
  args: { run: runIn({ status: 'queued' }), onRemove: fn(), onRetry: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 413, paddingTop: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RunCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Queued: Story = {};

export const Starting: Story = { args: { run: runIn({ status: 'loading' }) } };

export const Writing: Story = {
  args: { run: runIn({ status: 'streaming', text: sampleText.slice(0, 900) }) },
};

export const Cut: Story = {
  args: {
    run: runIn({ status: 'error', error: { kind: 'stream-cut' }, text: sampleText.slice(0, 700) }),
  },
};

export const Failed: Story = {
  args: { run: runIn({ status: 'error', error: { kind: 'upstream' } }) },
};

export const RateLimited: Story = {
  args: {
    run: runIn({ status: 'error', error: { kind: 'rate-limit', retryAt: Date.now() + 30_000 } }),
  },
};
