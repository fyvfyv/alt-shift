import { Button } from '@components/Button/Button';
import type { ButtonProps } from '@components/Button/types';
import { copy } from '@copy';
import { useCanGenerate } from '../../hooks/useCanGenerate';
import { useCta } from '../../hooks/useCta';
import type { CtaKind } from '../../session/types';

// Queued is inert with nothing sent yet, so it gets no spinner; the rest follow the form's rules.
const looks = {
  queued: { 'aria-disabled': true, children: copy.queue.label },
  generating: { loading: true, children: copy.generator.generating },
  tryAgain: { variant: 'secondary', iconLeading: 'repeat-03', children: copy.generator.tryAgain },
  generate: { children: copy.generator.generate },
} satisfies Record<CtaKind, Partial<ButtonProps>>;

// aria-disabled, never disabled: presses must reach Generate, and a disabled button drops focus.
export function GenerateButton() {
  const cta = useCta();
  const { canGenerate } = useCanGenerate();
  const inert = cta !== 'generating' && !canGenerate ? true : undefined;
  return (
    <Button
      type="submit"
      fullWidth
      aria-keyshortcuts="Control+Enter Meta+Enter"
      aria-disabled={inert}
      {...looks[cta]}
    />
  );
}
