// @ts-nocheck
/**
 * ErrorBoundary component
 * Catches and handles errors gracefully with user-friendly display
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../primitives/index.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error for debugging
    console.error('TUI ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box justifyContent="center" alignItems="center" height="100%" padding={2}>
          <Panel title="Error Occurred" padding="md">
            <Box flexDirection="column" gap={1}>
              <Text color="red" bold>
                Something went wrong in the ACI TUI
              </Text>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box flexDirection="column" gap={1}>
                  <Text bold color="yellow">Error Details:</Text>
                  <Text color="red">{this.state.error.message}</Text>
                  
                  {this.state.errorInfo && (
                    <>
                      <Text bold color="yellow">Component Stack:</Text>
                      <Text color="gray" wrap="wrap">
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </Box>
              )}
              
              <Box flexDirection="column" gap={1}>
                <Text bold>What to do:</Text>
                <Text>• Press Ctrl+C to exit</Text>
                <Text>• Try restarting the application</Text>
                <Text>• Check your authentication status</Text>
                {process.env.NODE_ENV === 'development' && (
                  <Text>• See console for detailed error information</Text>
                )}
              </Box>
            </Box>
          </Panel>
        </Box>
      );
    }

    return this.props.children;
  }
}
