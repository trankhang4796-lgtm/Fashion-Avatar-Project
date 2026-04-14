"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  featureName: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  // If an error happens in a child, update state to show the fallback UI
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // Log the error for debugging
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.featureName}:`, error, errorInfo);
  }

  public render() {
    // If there's an error, show a safe fallback message instead of crashing
    if (this.state.hasError) {
      return (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          ⚠️ The {this.props.featureName} feature is currently unavailable.
        </div>
      );
    }

    // Otherwise, render the component normally
    return this.props.children;
  }
}