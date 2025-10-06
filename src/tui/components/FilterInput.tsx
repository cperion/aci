import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../design/theme';

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Filter...',
}) => {
  const theme = useTheme();
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<string>(value);

  // Handle keyboard input when active
  useInput((input, key) => {
    if (!isActive) return;

    if (key.escape) {
      setIsActive(false);
      onCancel();
      return;
    }

    if (key.return) {
      setIsActive(false);
      onSubmit();
      return;
    }

    if (key.backspace || key.delete) {
      const newValue = inputRef.current.slice(0, -1);
      inputRef.current = newValue;
      onChange(newValue);
      return;
    }

    if (key.ctrl && input === 'c') {
      setIsActive(false);
      onCancel();
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newValue = inputRef.current + input;
      inputRef.current = newValue;
      onChange(newValue);
    }
  }, { isActive: true });

  // Sync external value changes
  useEffect(() => {
    inputRef.current = value;
  }, [value]);

  // Activate on mount
  useEffect(() => {
    setIsActive(true);
  }, []);

  return (
    <Box flexDirection="row" alignItems="center">
      <Text color={theme.accent}>/</Text>
      <Text color={theme.text}> </Text>
      <Text color={theme.text}>
        {value || <Text color={theme.textMuted}>{placeholder}</Text>}
      </Text>
      {isActive && (
        <Text backgroundColor={theme.text} color={theme.bg}>
          {' '}
        </Text>
      )}
    </Box>
  );
};