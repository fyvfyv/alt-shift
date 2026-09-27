import { Component, type ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import { EmptyPanel } from '../components/EmptyPanel/EmptyPanel';
import { copy } from '../copy';

type Props = {
  children: ReactNode;
  // The header's links still work after a crash: a new location gives the next page a fresh try.
  resetKey?: string;
};

type State = { crashed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidUpdate(previous: Props) {
    if (this.state.crashed && previous.resetKey !== this.props.resetKey) {
      this.setState({ crashed: false });
    }
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    // A full reload, not client-side navigation: in-memory state may be what broke.
    return (
      <EmptyPanel
        text={copy.crash.text}
        action={
          <Button to="/" reloadDocument size="md">
            {copy.crash.action}
          </Button>
        }
      />
    );
  }
}
