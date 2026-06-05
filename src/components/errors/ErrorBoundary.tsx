"use client";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }

  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: "2rem", background: "#FEF2F2", borderRadius: "var(--radius-lg)", border: "1px solid #FECACA", textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: "var(--danger)", marginBottom: "0.5rem" }}>Something went wrong</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Please refresh the page or contact support if the problem persists.</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ padding: "0.5rem 1rem", background: "var(--midnight)", color: "white", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
