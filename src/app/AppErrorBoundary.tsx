import { Component, type ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import { EmptyPanel } from '../components/EmptyPanel/EmptyPanel';
import { PageTitle } from '../components/PageTitle/PageTitle';
import { copy } from '../copy';

type Props = {
  children: ReactNode;
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

  // React mounts the panel afresh on every caught error, a retry that crashes again included,
  // so this ref callback runs once per crash.
  private announceCrash = (heading: HTMLHeadingElement | null) => {
    if (!heading) return;
    document.title = copy.documentTitle(copy.crash.title);
    heading.focus();
  };

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <>
        <PageTitle ref={this.announceCrash} size="lg">
          {copy.crash.title}
        </PageTitle>
        <div role="alert">
          <EmptyPanel
            text={copy.crash.text}
            action={
              <Button to="/" reloadDocument size="md">
                {copy.crash.action}
              </Button>
            }
          />
        </div>
      </>
    );
  }
}
