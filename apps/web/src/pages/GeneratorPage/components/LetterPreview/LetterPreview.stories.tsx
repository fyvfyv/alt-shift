import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { useQueue } from '@hooks/useGenerationQueue';
import { useLetterStoreApi } from '@hooks/useLetterStore';
import { useProfileStoreApi } from '@hooks/useProfile';
import type { PreviewState, Run } from '@services/generation/types';
import { StorageError } from '@services/letters/repository';
import { sampleText } from '@stories/storyData';
import { GeneratorSession } from '../../session/GeneratorSession';
import { GeneratorSessionContext } from '../../session/GeneratorSessionProvider';
import { LetterPreview } from './LetterPreview';

// The page behind the preview, written straight into its stores.
type PreviewSeed = {
  // The state of the run on screen; none shows the empty panel.
  preview?: PreviewState;
  savedLetter?: string;
  // The company in the form; the page's title follows it.
  company?: string;
  // The title of the letter written last; it shows as kept once the form names another job.
  shownTitle?: string;
  // Edited since the run, so the next press writes a new letter instead of Try Again.
  edited?: boolean;
  // Companies of the letters being written ahead of this one.
  elsewhere?: string[];
  name?: string;
  storageFailed?: boolean;
};

const ID = 'story';
const jobTitle = 'Product manager';

function runOf(id: string, company: string, state: PreviewState): Run {
  const request = { jobTitle, company, skills: 'Roadmaps', details: '' };
  return { id, key: id, createdAt: Date.now(), request, state };
}

// Seeded before anything subscribes, so the first render already shows the state asked for.
function SeededSession({ seed, children }: { seed: PreviewSeed; children: ReactNode }) {
  const queue = useQueue();
  const letters = useLetterStoreApi();
  const profile = useProfileStoreApi();
  const [session] = useState(() => {
    const { preview, savedLetter, company = 'Apple', elsewhere = [] } = seed;
    const ahead = elsewhere.map((at, i) => runOf(`elsewhere-${i}`, at, { status: 'loading' }));
    queue.store.setState({ runs: preview ? [...ahead, runOf(ID, company, preview)] : ahead });
    letters.setState({
      letters: savedLetter
        ? [{ id: ID, createdAt: Date.now(), jobTitle, company, text: savedLetter }]
        : [],
      lastStorageError: seed.storageFailed ? new StorageError('quota') : null,
    });
    profile.setState({ skills: 'Roadmaps', details: '', name: seed.name ?? '' });
    const seeded = new GeneratorSession({ queue, letters, profile }, undefined);
    seeded.store.setState({
      job: { jobTitle, company },
      visit: {
        candidateId: seed.edited ? null : ID,
        runId: ID,
        beforeRun: null,
        shownTitle: seed.shownTitle,
      },
    });
    return seeded;
  });
  return <GeneratorSessionContext value={session}>{children}</GeneratorSessionContext>;
}

type SeedParameters = { seed?: PreviewSeed };

const meta = {
  component: LetterPreview,
  args: { formRef: { current: null } },
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) => (
      <SeededSession seed={(parameters as SeedParameters).seed ?? {}}>
        <div style={{ width: 656, minHeight: 720, display: 'grid' }}>
          <Story />
        </div>
      </SeededSession>
    ),
  ],
} satisfies Meta<typeof LetterPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WhileAnotherLetterIsWritten: Story = {
  parameters: { seed: { elsewhere: ['Stripe'] } },
};

export const Queued: Story = {
  parameters: { seed: { preview: { status: 'queued' }, elsewhere: ['Stripe'] } },
};

export const QueuedOverTheLetterShown: Story = {
  parameters: {
    seed: {
      preview: { status: 'queued', previous: sampleText },
      company: 'Figma',
      shownTitle: 'Product manager, Apple',
      elsewhere: ['Stripe'],
    },
  },
};

export const Loading: Story = { parameters: { seed: { preview: { status: 'loading' } } } };

export const Streaming: Story = {
  parameters: { seed: { preview: { status: 'streaming', text: sampleText.slice(0, 400) } } },
};

export const Completed: Story = {
  parameters: { seed: { preview: { status: 'completed', text: sampleText } } },
};

export const Signed: Story = {
  parameters: {
    seed: { preview: { status: 'completed', text: sampleText }, name: 'Alex Morgan' },
  },
};

export const SavedWhileTypingTheNextCompany: Story = {
  parameters: {
    seed: {
      preview: { status: 'completed', text: sampleText },
      company: '',
      shownTitle: 'Product manager, Apple',
      edited: true,
    },
  },
};

export const CompletedButNotSaved: Story = {
  parameters: {
    seed: { preview: { status: 'completed', text: sampleText }, storageFailed: true },
  },
};

export const RateLimited: Story = {
  parameters: {
    seed: {
      preview: { status: 'error', error: { kind: 'rate-limit', retryAt: Date.now() + 24_000 } },
    },
  },
};

export const RateLimitOver: Story = {
  parameters: {
    seed: { preview: { status: 'error', error: { kind: 'rate-limit', retryAt: 0 } } },
  },
};

export const KeptAfterRateLimit: Story = {
  parameters: {
    seed: {
      preview: {
        status: 'error',
        error: { kind: 'rate-limit', retryAt: Date.now() + 12_000 },
        text: sampleText,
      },
    },
  },
};

export const KeptForAnotherJob: Story = {
  parameters: {
    seed: {
      preview: { status: 'error', error: { kind: 'upstream' }, text: sampleText },
      shownTitle: 'Product Designer, Lumen Health',
    },
  },
};

export const UpstreamError: Story = {
  parameters: { seed: { preview: { status: 'error', error: { kind: 'upstream' } } } },
};

export const Offline: Story = {
  parameters: { seed: { preview: { status: 'error', error: { kind: 'network' } } } },
};

const streamCut: PreviewState = {
  status: 'error',
  error: { kind: 'stream-cut' },
  text: sampleText.slice(0, 600),
};

export const StreamCut: Story = { parameters: { seed: { preview: streamCut } } };

export const StreamCutPreviousKept: Story = {
  parameters: { seed: { preview: streamCut, savedLetter: sampleText } },
};

export const StreamCutAfterEdit: Story = {
  parameters: { seed: { preview: streamCut, edited: true } },
};
