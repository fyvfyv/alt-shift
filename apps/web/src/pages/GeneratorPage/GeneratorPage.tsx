import { useRef } from 'react';
import { GeneratorForm } from './components/GeneratorForm/GeneratorForm';
import { GoalFooter } from './components/GoalFooter/GoalFooter';
import { LetterPreview } from './components/LetterPreview/LetterPreview';
import { StatusLine } from './components/StatusLine/StatusLine';
import styles from './GeneratorPage.module.css';
import { GeneratorSessionProvider } from './session/GeneratorSessionProvider';

export function GeneratorPage() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <GeneratorSessionProvider>
      <div className={styles.body}>
        <GeneratorForm ref={formRef} />
        <LetterPreview formRef={formRef} />
      </div>
      <StatusLine />
      <GoalFooter />
    </GeneratorSessionProvider>
  );
}
