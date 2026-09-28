import { Component } from 'react';
import { CrashPanel } from './CrashPanel';
import type { AppErrorBoundaryProps, AppErrorBoundaryState } from './types';

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { crashed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { crashed: true };
  }

  componentDidUpdate(previous: AppErrorBoundaryProps) {
    if (this.state.crashed && previous.resetKey !== this.props.resetKey) {
      this.setState({ crashed: false });
    }
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return <CrashPanel />;
  }
}
