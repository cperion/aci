import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

interface Hint {
  id: string;
  view: string;
  title: string;
  message: string;
  showOnce?: boolean;
}

interface SimpleOnboardingProps {
  currentView: string;
  hasUserInteracted: boolean;
}

const HINTS: Hint[] = [
  {
    id: 'welcome',
    view: 'home',
    title: 'Welcome to ACI!',
    message: 'Use j/k or arrow keys to navigate. Press ? for help anytime.',
    showOnce: true
  },
  {
    id: 'services-actions',
    view: 'services',
    title: 'Service Actions',
    message: 'Press d to delete, r to restart, i to inspect. Try it!',
  },
  {
    id: 'selection-hint',
    view: '*',
    title: 'Selection Mode',
    message: 'Press Space to select items. Selected items enable bulk actions!',
    showOnce: true
  },
  {
    id: 'help-reminder',
    view: '*',
    title: 'Need Help?',
    message: 'Press ? to see all available shortcuts and commands.',
  }
];

export function SimpleOnboarding({ currentView, hasUserInteracted }: SimpleOnboardingProps) {
  const { colors } = useTheme();
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('dismissedHints') || '[]'))
  );
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);

  const dismissHint = (id: string) => {
    const newSet = new Set([...dismissedHints, id]);
    setDismissedHints(newSet);
    localStorage.setItem('dismissedHints', JSON.stringify([...newSet]));
    setCurrentHint(null);
  };

  // Show hint logic
  useEffect(() => {
    // Don't show hints if user is actively using the interface
    if (hasUserInteracted && currentHint) return;

    const availableHints = HINTS.filter(hint => 
      (hint.view === currentView || hint.view === '*') &&
      (!hint.showOnce || !dismissedHints.has(hint.id)) &&
      !dismissedHints.has(hint.id)
    );

    if (availableHints.length > 0 && !currentHint) {
      // Show first available hint after a short delay
      const timer = setTimeout(() => {
        setCurrentHint(availableHints[0]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentView, dismissedHints, hasUserInteracted, currentHint]);

  // Handle input to dismiss hint
  useInput((input, key) => {
    if (currentHint && (key.escape || input === ' ' || key.return)) {
      dismissHint(currentHint.id);
    }
  });

  if (!currentHint) return null;

  return (
    <Box
      position="absolute"
      bottom={3}
      left={2}
      width={50}
      backgroundColor={colors.backgroundSecondary}
      borderStyle="round"
      borderColor={colors.highlights}
      flexDirection="column"
      padding={1}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color={colors.highlights}>
          💡 {currentHint.title}
        </Text>
        <Text color={colors.metadata} dimColor>
          Tip
        </Text>
      </Box>

      {/* Message */}
      <Box marginBottom={1}>
        <Text color={colors.primaryText}>
          {currentHint.message}
        </Text>
      </Box>

      {/* Footer */}
      <Box justifyContent="space-between">
        <Text color={colors.metadata} dimColor>
          Press Space, Enter, or Esc to dismiss
        </Text>
        {currentHint.showOnce && (
          <Text color={colors.metadata} dimColor>
            Show once
          </Text>
        )}
      </Box>
    </Box>
  );
}

/**
 * Simplified onboarding hook
 */
export function useSimpleOnboarding() {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const trackInteraction = () => {
    setHasUserInteracted(true);
    // Reset after 5 seconds of no interaction
    setTimeout(() => setHasUserInteracted(false), 5000);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('dismissedHints');
  };

  return {
    hasUserInteracted,
    trackInteraction,
    resetOnboarding
  };
}