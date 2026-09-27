import { Component, createRef, type ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import { EmptyPanel } from '../components/EmptyPanel/EmptyPanel';
import { PageTitle } from '../components/PageTitle/PageTitle';
import { copy } from '../copy';

type Props = {
  children: ReactNode;
  // The header's links still work after a crash: a new location gives the next page a fresh try.
  resetKey?: string;
};

type State = { crashed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };
  private heading = createRef<HTMLHeadingElement>();
  // A fresh try that crashes again commits over the panel already on screen, so only this flag
  // tells it apart from a plain re-render of that panel.
  private retrying = false;

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidMount() {
    if (this.state.crashed) this.announceCrash();
  }

  componentDidUpdate(previous: Props, previousState: State) {
    if (!this.state.crashed) {
      this.retrying = false;
    } else if (!previousState.crashed || this.retrying) {
      this.retrying = false;
      this.announceCrash();
    } else if (previous.resetKey !== this.props.resetKey) {
      this.retrying = true;
      this.setState({ crashed: false });
    }
  }

  // The crashed page took its h1, its document title and often the focused element with it, so
  // the panel arrives like a page: its own title, and focus on its heading.
  private announceCrash() {
    document.title = copy.documentTitle(copy.crash.title);
    this.heading.current?.focus();
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    // A full reload, not client-side navigation: in-memory state may be what broke.
    return (
      <>
        <PageTitle ref={this.heading} size="lg">
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
