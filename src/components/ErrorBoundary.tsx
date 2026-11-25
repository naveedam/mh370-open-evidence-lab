import { Component, type ReactNode } from 'react'

/** Keeps a crash in one module from blanking the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  componentDidCatch(error: Error) {
    console.error('Module error', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="p-8 text-xs text-slate-400">
        <div className="mb-1 text-sm text-slate-200">This module failed to load</div>
        <div className="mono text-slate-500">{this.state.error.message}</div>
        <p className="mt-2">Other modules are unaffected — use the sidebar to continue.</p>
      </div>
    )
  }
}
