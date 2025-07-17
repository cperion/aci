import React, { Component, type ReactNode } from 'react';
import { Box, Text } from 'ink';
import { Alert } from '@inkjs/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    const componentName = this.props.name ? ` in ${this.props.name}` : '';
    console.error(`TUI Error${componentName}:`, error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const componentInfo = this.props.name ? ` in ${this.props.name}` : '';
      return (
        <Box flexDirection="column" gap={1}>
          <Alert variant="error" title="Application Error">
            An unexpected error occurred{componentInfo} in the TUI interface.
          </Alert>
          {this.state.error && (
            <Box flexDirection="column" gap={1}>
              <Text bold color="red">Error Details:</Text>
              <Text dimColor>{this.state.error.message}</Text>
              <Text dimColor>Press Ctrl+C to exit and restart the application</Text>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}