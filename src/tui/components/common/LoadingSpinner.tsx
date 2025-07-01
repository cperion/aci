import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';

interface LoadingSpinnerProps {
  label?: string;
  description?: string;
}

export function LoadingSpinner({ label = "Loading...", description }: LoadingSpinnerProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Spinner label={label} />
      {description && (
        <Text dimColor>{description}</Text>
      )}
    </Box>
  );
}