/**
 * Error Display Components for TUI
 * Provides toast notifications and modal displays for errors
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
// For now, using simplified error handling
type ErrorSeverity = 'critical' | 'operation' | 'message';
type ErrorCategory = 'gis' | 'network' | 'user' | 'auth' | 'system';

interface AppError {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  details: string;
  retryAction?: () => void;
  contextData?: Record<string, any>;
  helpLink?: string;
}

// Simplified error handler for now
const useErrorHandler = () => {
  const [errors, setErrors] = React.useState<AppError[]>([]);
  
  return {
    getActiveErrors: () => errors.filter(e => e.severity !== 'critical'),
    getCriticalErrors: () => errors.filter(e => e.severity === 'critical'),
    dismissError: (id: string) => setErrors(prev => prev.filter(e => e.id !== id)),
    acknowledgeError: (id: string) => setErrors(prev => prev.filter(e => e.id !== id))
  };
};

// Color mapping for error categories
const ERROR_CATEGORY_COLORS: Record<ErrorCategory, string> = {
  gis: 'blue',
  network: 'yellow', 
  user: 'cyan',
  auth: 'red',
  system: 'magenta'
};

// Icon mapping for error severities
const SEVERITY_ICONS: Record<ErrorSeverity, string> = {
  critical: '🚨',
  operation: '⚠️',
  message: 'ℹ️'
};

/**
 * Error Toast Notifications - Bottom overlay for non-critical errors
 */
export const ErrorToaster: React.FC = () => {
  const { getActiveErrors, dismissError, acknowledgeError } = useErrorHandler();
  const activeErrors = getActiveErrors().filter(e => e.severity !== 'critical');

  useInput((input, key) => {
    if (key.escape && activeErrors.length > 0) {
      dismissError(activeErrors[0]!.id);
    }
    if (input === 'a' && activeErrors.length > 0) {
      acknowledgeError(activeErrors[0]!.id);
    }
  });

  if (activeErrors.length === 0) return null;

  return (
    <Box 
      flexDirection="column"
      width={100}
    >
      {activeErrors.slice(0, 3).map(error => ( // Show max 3 toasts
        <ErrorToast 
          key={error.id} 
          error={error} 
          onDismiss={dismissError}
          onAcknowledge={acknowledgeError}
        />
      ))}
      {activeErrors.length > 3 && (
        <Box borderStyle="round" borderColor="gray" padding={1}>
          <Text color="gray">
            ... and {activeErrors.length - 3} more errors (ESC to dismiss, 'a' to acknowledge)
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Individual Error Toast Item
 */
const ErrorToast: React.FC<{
  error: AppError;
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
}> = ({ error, onDismiss, onAcknowledge }) => {
  const { severity, category, title, details } = error;
  const icon = SEVERITY_ICONS[severity];
  const color = ERROR_CATEGORY_COLORS[category];
  
  return (
    <Box 
      borderStyle="round" 
      borderColor={color}
      padding={1}
      marginBottom={1}
    >
      <Box flexDirection="column" width="100%">
        <Box>
          <Text bold color={color}>
            {icon} {title}
          </Text>
        </Box>
        
        <Box marginTop={1}>
          <Text>{details}</Text>
        </Box>
        
        <Box marginTop={1} flexDirection="row">
          {error.retryAction && (
            <ErrorButton 
              label="Retry [r]" 
              color={color}
              onPress={() => {
                onAcknowledge(error.id);
                error.retryAction?.();
              }}
            />
          )}
          
          <ErrorButton 
            label="Acknowledge [a]" 
            color="green"
            onPress={() => onAcknowledge(error.id)}
          />
          
          <ErrorButton 
            label="Dismiss [ESC]" 
            color="gray"
            onPress={() => onDismiss(error.id)}
          />
        </Box>
        
        {error.contextData && (
          <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
            <ContextData data={error.contextData} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Critical Error Modal - Full screen overlay for critical errors
 */
export const ErrorModal: React.FC = () => {
  const { getCriticalErrors, acknowledgeError, dismissError } = useErrorHandler();
  const criticalErrors = getCriticalErrors();
  
  useInput((input, key) => {
    if (criticalErrors.length > 0) {
      const error = criticalErrors[0]!;
      if (key.escape) {
        acknowledgeError(error.id);
      }
      if (input === 'r' && error.retryAction) {
        acknowledgeError(error.id);
        error.retryAction();
      }
    }
  });

  if (criticalErrors.length === 0) return null;
  
  const error = criticalErrors[0]!; // Show first critical error
  
  return (
    <Box 
      flexGrow={1}
    >
      <Box 
        flexGrow={1} 
        flexDirection="column" 
        borderStyle="double" 
        borderColor="red"
        padding={2}
        margin={2}
      >
        <Box paddingX={2}>
          <Text color="white" bold>
            🚨 CRITICAL ERROR: {error.title}
          </Text>
        </Box>
        
        <Box marginY={2} flexDirection="column">
          <Text>{error.details}</Text>
          
          {error.helpLink && (
            <Box marginTop={1}>
              <Text color="cyan">Help: {error.helpLink}</Text>
            </Box>
          )}
        </Box>
        
        {error.contextData && (
          <Box 
            flexDirection="column" 
            borderStyle="single" 
            borderColor="white" 
            padding={1}
            marginY={1}
          >
            <Text bold color="white">Debug Information:</Text>
            <ContextData data={error.contextData} />
          </Box>
        )}
        
        <Box marginTop={2} flexDirection="row">
          {error.retryAction && (
            <ErrorButton 
              label="Retry [r]" 
              color="green"
              onPress={() => {
                acknowledgeError(error.id);
                error.retryAction?.();
              }}
            />
          )}
          
          <ErrorButton 
            label="Continue [ESC]" 
            color="yellow"
            onPress={() => acknowledgeError(error.id)}
          />
          
          {error.helpLink && (
            <ErrorButton 
              label="View Documentation [d]" 
              color="cyan"
              onPress={() => {
                // Could open help in external browser or show inline help
                console.log(`Help: ${error.helpLink}`);
              }}
            />
          )}
        </Box>
        
        {criticalErrors.length > 1 && (
          <Box marginTop={2}>
            <Text color="red">
              Warning: {criticalErrors.length - 1} additional critical errors pending
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Reusable Error Button Component
 */
const ErrorButton: React.FC<{
  label: string;
  color: string;
  onPress: () => void;
}> = ({ label, color, onPress }) => (
  <Box 
    marginRight={2}
    paddingX={1}
    borderStyle="round"
    borderColor={color}
  >
    <Text color={color} bold>
      {label}
    </Text>
  </Box>
);

/**
 * Context Data Display Component
 */
const ContextData: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <Box flexDirection="column">
    {Object.entries(data).slice(0, 8).map(([key, value]) => ( // Limit to 8 entries
      <Box key={key}>
        <Text color="cyan" bold>{key}:</Text>
        <Text> {String(value).substring(0, 60)}</Text>
      </Box>
    ))}
    {Object.keys(data).length > 8 && (
      <Text color="gray">... and {Object.keys(data).length - 8} more fields</Text>
    )}
  </Box>
);

/**
 * Error Status Indicator for Header/StatusBar
 */
export const ErrorIndicator: React.FC = () => {
  const { getActiveErrors, getCriticalErrors } = useErrorHandler();
  const activeErrors = getActiveErrors();
  const criticalErrors = getCriticalErrors();
  
  if (criticalErrors.length > 0) {
    return (
      <Box>
        <Text color="red" bold>🚨 {criticalErrors.length} CRITICAL</Text>
      </Box>
    );
  }
  
  if (activeErrors.length > 0) {
    return (
      <Box>
        <Text color="yellow">⚠️ {activeErrors.length} errors</Text>
      </Box>
    );
  }
  
  return null;
};