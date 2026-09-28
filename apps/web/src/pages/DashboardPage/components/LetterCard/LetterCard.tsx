import { useId, useRef } from 'react';
import { Button } from '@components/Button/Button';
import { CopyButton } from '@components/CopyButton/CopyButton';
import { LetterBody } from '@components/LetterBody/LetterBody';
import { copy } from '@copy';
import { withSignature } from '@services/letters/model';
import { Card, CardBody, CardChip, CardFooter } from '../Card/Card';
import { useCardRefs } from '../LetterGrid/useCardRefs';
import { LetterReader } from '../LetterReader/LetterReader';
import { ReadMore } from './ReadMore';
import type { LetterCardProps } from './types';
import { useClipped } from './useClipped';
import { useReader } from './useReader';

export function LetterCard({ letter, signature = '', onDelete, status }: LetterCardProps) {
  const { firstButton, copyButton } = useCardRefs(letter.id);
  const chipId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const clipped = useClipped(bodyRef);
  const reader = useReader(openerRef);
  const text = withSignature(letter.text, signature);
  const title = copy.letter.title(letter.jobTitle, letter.company);

  return (
    <Card label={title} chipId={status ? chipId : undefined} writing={status?.writing}>
      {status && (
        <CardChip id={chipId} live={status.writing}>
          {status.label}
        </CardChip>
      )}
      <CardBody ref={bodyRef}>
        <LetterBody text={text} spacing="compact" />
      </CardBody>
      {clipped && <ReadMore ref={openerRef} onClick={reader.open} />}
      <CardFooter>
        <Button ref={firstButton} variant="tertiary" iconLeading="trash-01" onClick={onDelete}>
          {copy.letter.delete}
        </Button>
        <CopyButton ref={copyButton} text={text} />
      </CardFooter>
      {reader.reading && <LetterReader title={title} text={text} onClose={reader.close} />}
    </Card>
  );
}
