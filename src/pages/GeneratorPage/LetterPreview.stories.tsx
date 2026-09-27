import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleText } from '../../../.storybook/storyData';
import { LetterPreview } from './LetterPreview';

const meta = {
  component: LetterPreview,
  parameters: { layout: 'padded' },
  args: {
    state: { status: 'empty' },
    company: 'Apple',
    retryCountdown: 0,
    retryDisabled: false,
    onRetry: fn(),
    storageFailed: false,
    name: '',
    onNameChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 656, height: 720, display: 'grid' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LetterPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

// The caption under the orb appears after 2 s and changes at 8 s.
export const Loading: Story = { args: { state: { status: 'loading' } } };

export const Streaming: Story = {
  args: { state: { status: 'streaming', text: sampleText.slice(0, 400) } },
};

export const Completed: Story = { args: { state: { status: 'completed', text: sampleText } } };

export const Signed: Story = {
  args: { state: { status: 'completed', text: sampleText }, name: 'Alex Morgan' },
};

export const CompletedButNotSaved: Story = {
  args: { state: { status: 'completed', text: sampleText }, storageFailed: true },
};

export const RateLimited: Story = {
  args: {
    state: { status: 'error', error: { kind: 'rate-limit', retryAfterSeconds: 24 } },
    retryCountdown: 24,
    retryDisabled: true,
  },
};

export const RateLimitOver: Story = {
  args: { state: { status: 'error', error: { kind: 'rate-limit', retryAfterSeconds: 24 } } },
};

export const UpstreamError: Story = {
  args: { state: { status: 'error', error: { kind: 'upstream' } } },
};

export const Offline: Story = {
  args: { state: { status: 'error', error: { kind: 'network' } }, retryDisabled: true },
};

export const StreamCut: Story = {
  args: {
    state: { status: 'error', error: { kind: 'stream-cut' }, text: sampleText.slice(0, 600) },
  },
};
