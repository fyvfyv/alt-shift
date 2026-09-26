import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import { EmptyPanel } from '../components/EmptyPanel/EmptyPanel';
import { PageShell } from '../components/PageShell/PageShell';
import { copy } from '../copy';

type State = { crashed: boolean };

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    // A full reload, not client-side navigation: in-memory state may be what broke.
    return (
      <PageShell header={false}>
        <EmptyPanel
          text={copy.crash.text}
          action={
            <Button to="/" reloadDocument size="md">
              {copy.crash.action}
            </Button>
          }
        />
      </PageShell>
    );
  }
}
