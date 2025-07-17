/**
 * Error Boundary Component
 * React error boundary with audit logging and user-friendly recovery
 * Replaces complex context-based error handling
 */

import React from 'react';
import { Box, Text } from 'ink';
import { DatabaseService } from '../services/database-service.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to show error UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error to audit system
    DatabaseService.logError(
      'component_error',
      'default',
      error,
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.name || 'unknown',
        timestamp: Date.now(),
        stack: error.stack
      }
    );
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId
    });
    
    // Optional error reporting callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleReload = () => {
    // Reset error state to retry component rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleExit = () => {
    // Exit application if provided
    if (this.props.onExit) {
      this.props.onExit();
    } else {
      process.exit(1);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const { showDetails = false, theme = {} } = this.props;
      
      return (
        <Box flexDirection="column" padding={1} borderStyle="double" borderColor="red">
          <Box marginBottom={1}>
            <Text color="red" bold>🚨 Application Error</Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text>Something went wrong in the {this.props.name || 'application'}.</Text>
          </Box>
          
          {error && (
            <Box marginBottom={1}>
              <Text color="yellow">Error: {error.message}</Text>
            </Box>
          )}
          
          {errorId && (
            <Box marginBottom={1}>
              <Text color="gray">Error ID: {errorId}</Text>
            </Box>
          )}
          
          {showDetails && error && (
            <Box marginBottom={1} flexDirection="column">
              <Text color="gray">Details:</Text>
              <Text color="gray">{error.stack}</Text>
            </Box>
          )}
          
          <Box marginBottom={1}>
            <Text color="cyan">Actions:</Text>
          </Box>
          
          <Box flexDirection="column">
            <Text>
              <Text color="green">[R]</Text> Reload component
            </Text>
            <Text>
              <Text color="red">[Q]</Text> Quit application
            </Text>
            {!showDetails && (
              <Text>
                <Text color="yellow">[D]</Text> Show details
              </Text>
            )}
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Simplified Error Boundary for basic error catching
 */
export function SimpleErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
      
      // Log to database
      DatabaseService.logError('simple_error', 'default', error);
    };
    
    // Add error event listener
    process.on('uncaughtException', handleError);
    process.on('unhandledRejection', handleError);
    
    return () => {
      process.removeListener('uncaughtException', handleError);
      process.removeListener('unhandledRejection', handleError);
    };
  }, []);
  
  if (hasError) {
    if (fallback) {
      return fallback(error, () => setHasError(false));
    }
    
    return (
      <Box padding={1}>
        <Text color="red">Error: {error?.message || 'Unknown error occurred'}</Text>
      </Box>
    );
  }
  
  return children;
}

/**
 * Error Boundary with keyboard handling
 */
export function InteractiveErrorBoundary({ children, ...props }) {
  const boundaryRef = React.useRef();
  
  const handleKeyPress = React.useCallback((input, key) => {
    if (!boundaryRef.current?.state.hasError) return false;
    
    switch (input.toLowerCase()) {
      case 'r':
        boundaryRef.current.handleReload();
        return true;
      case 'q':
        boundaryRef.current.handleExit();
        return true;
      case 'd':
        // Toggle details view
        boundaryRef.current.setState(prev => ({ 
          ...prev, 
          showDetails: !prev.showDetails 
        }));
        return true;
      default:
        return false;
    }
  }, []);
  
  // Register keyboard handler when error is shown
  React.useEffect(() => {
    if (boundaryRef.current?.state.hasError) {
      // This would integrate with the keyboard manager
      // For now, just using a simple input handler
      const handleInput = (str, key) => handleKeyPress(str, key);
      
      if (process.stdin.isTTY) {
        process.stdin.on('data', handleInput);
        return () => process.stdin.removeListener('data', handleInput);
      }
    }
  }, [handleKeyPress]);
  
  return (
    <ErrorBoundary ref={boundaryRef} {...props}>
      {children}
    </ErrorBoundary>
  );
}