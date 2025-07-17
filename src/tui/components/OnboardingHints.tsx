import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

// Debounce utility to prevent localStorage race conditions
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface OnboardingHint {
  id: string;
  title: string;
  message: string;
  trigger: 'view-enter' | 'first-selection' | 'idle' | 'manual';
  viewId?: string;
  priority: 'low' | 'medium' | 'high';
  showOnce?: boolean;
  duration?: number;
}

interface OnboardingHintsProps {
  currentView: string;
  userInteractions: {
    hasSelectedItems: boolean;
    hasUsedKeyboard: boolean;
    timeOnView: number;
  };
}

const ONBOARDING_HINTS: OnboardingHint[] = [
  {
    id: 'welcome',
    title: 'Welcome to ACI!',
    message: 'Use j/k or arrow keys to navigate. Press ? for help anytime.',
    trigger: 'view-enter',
    viewId: 'home',
    priority: 'high',
    showOnce: true,
    duration: 5000
  },
  {
    id: 'navigation-basics',
    title: 'Navigation Tip',
    message: 'Use h/j/k/l (vim keys) or arrow keys to move around.',
    trigger: 'view-enter',
    priority: 'medium',
    showOnce: true,
    duration: 4000
  },
  {
    id: 'selection-hint',
    title: 'Selection Mode',
    message: 'Press Space to select items. Selected items enable bulk actions!',
    trigger: 'first-selection',
    priority: 'high',
    showOnce: true,
    duration: 6000
  },
  {
    id: 'services-actions',
    title: 'Service Actions',
    message: 'Press d to delete, r to restart, i to inspect. Try it!',
    trigger: 'view-enter',
    viewId: 'services',
    priority: 'medium',
    duration: 4000
  },
  {
    id: 'search-tip',
    title: 'Quick Search',
    message: 'Press s to search, f for filters. Escape to clear.',
    trigger: 'idle',
    priority: 'low',
    duration: 3000
  },
  {
    id: 'help-reminder',
    title: 'Need Help?',
    message: 'Press ? to see all available shortcuts and commands.',
    trigger: 'idle',
    priority: 'low',
    duration: 4000
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations',
    message: 'Select multiple items with Space, then use D for bulk delete or R for bulk restart.',
    trigger: 'first-selection',
    priority: 'high',
    showOnce: true,
    duration: 7000
  },
  {
    id: 'admin-login',
    title: 'Admin Features',
    message: 'Use admin login to access server management features.',
    trigger: 'view-enter',
    viewId: 'admin',
    priority: 'medium',
    duration: 4000
  },
  {
    id: 'optimistic-ui',
    title: 'Instant Feedback',
    message: 'Actions execute immediately with background processing. Look for notifications!',
    trigger: 'manual',
    priority: 'medium',
    duration: 5000
  }
];

export function OnboardingHints({ currentView, userInteractions }: OnboardingHintsProps) {
  const { colors } = useTheme();
  const [currentHint, setCurrentHint] = useState<OnboardingHint | null>(null);
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);

  // Load shown hints from localStorage with validation
  useEffect(() => {
    try {
      // Check if localStorage is available (browser environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('aci-onboarding-hints');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validate that stored data is an array of strings
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          // Further validate that strings match expected hint ID pattern
          const validHints = parsed.filter(hintId => 
            typeof hintId === 'string' && 
            hintId.length > 0 && 
            hintId.length < 100 && 
            /^[a-zA-Z0-9_-]+$/.test(hintId)
          );
          setShownHints(new Set(validHints));
        } else {
          console.warn('Invalid onboarding hints data format, resetting');
          localStorage.removeItem('aci-onboarding-hints');
        }
      }
    }
    } catch (error) {
      console.warn('Could not load onboarding hints state:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('aci-onboarding-hints');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, []);

  // Debounce localStorage operations to prevent race conditions
  const debouncedSaveToStorage = React.useCallback(
    debounce((hints: string[]) => {
      try {
        // Check if localStorage is available (browser environment)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('aci-onboarding-hints', JSON.stringify(hints));
        }
      } catch (error) {
        console.warn('Could not save onboarding hints state:', error);
      }
    }, 500),
    []
  );

  // Save shown hints to localStorage
  const markHintAsShown = React.useCallback((hintId: string) => {
    setShownHints(prev => {
      const newSet = new Set(prev);
      newSet.add(hintId);
      const hintsArray = Array.from(newSet);
      
      // Debounce the localStorage operation
      debouncedSaveToStorage(hintsArray);
      
      return newSet;
    });
  }, [debouncedSaveToStorage]);

  // Handle view changes
  useEffect(() => {
    const viewHints = ONBOARDING_HINTS.filter(hint => 
      hint.trigger === 'view-enter' && 
      (hint.viewId === currentView || !hint.viewId) &&
      (!hint.showOnce || !shownHints.has(hint.id))
    );

    if (viewHints.length > 0) {
      // Show highest priority hint
      const hintToShow = viewHints.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })[0];

      if (hintToShow) {
        showHint(hintToShow);
      }
    }
  }, [currentView, shownHints]);

  // Handle first selection
  useEffect(() => {
    if (userInteractions.hasSelectedItems && !shownHints.has('selection-hint')) {
      const selectionHints = ONBOARDING_HINTS.filter(hint => 
        hint.trigger === 'first-selection' &&
        !shownHints.has(hint.id)
      );

      if (selectionHints.length > 0) {
        const firstHint = selectionHints[0];
        if (firstHint) {
          showHint(firstHint);
        }
      }
    }
  }, [userInteractions.hasSelectedItems, shownHints]);

  // Handle idle state (user hasn't interacted for a while)
  useEffect(() => {
    if (userInteractions.timeOnView > 10000 && !userInteractions.hasUsedKeyboard) {
      const idleHints = ONBOARDING_HINTS.filter(hint => 
        hint.trigger === 'idle' &&
        !shownHints.has(hint.id)
      );

      if (idleHints.length > 0) {
        const randomHint = idleHints[Math.floor(Math.random() * idleHints.length)];
        if (randomHint) {
          showHint(randomHint);
        }
      }
    }
  }, [userInteractions.timeOnView, userInteractions.hasUsedKeyboard, shownHints]);

  const showHint = (hint: OnboardingHint) => {
    setCurrentHint(hint);
    setIsVisible(true);

    if (hint.showOnce) {
      markHintAsShown(hint.id);
    }

    // Auto-hide after duration
    if (hint.duration) {
      setTimeout(() => {
        hideHint();
      }, hint.duration);
    }
  };

  const hideHint = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentHint(null);
    }, 300); // Allow fade out animation
  };

  // Handle input to dismiss hint
  useInput((input, key) => {
    if (isVisible && (key.escape || input === ' ' || key.return)) {
      hideHint();
    }
  });

  if (!isVisible || !currentHint) {
    return null;
  }

  const getBorderColor = (priority: OnboardingHint['priority']) => {
    switch (priority) {
      case 'high': return colors.warnings;
      case 'medium': return colors.highlights;
      case 'low': return colors.features;
      default: return colors.metadata;
    }
  };

  const getIcon = (priority: OnboardingHint['priority']) => {
    switch (priority) {
      case 'high': return '💡';
      case 'medium': return 'ℹ️';
      case 'low': return '💭';
      default: return '•';
    }
  };

  return (
    <Box
      width={60}
      borderStyle="round"
      borderColor={getBorderColor(currentHint.priority)}
      flexDirection="column"
      padding={1}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color={colors.highlights}>
          {getIcon(currentHint.priority)} {currentHint.title}
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
        <Text color={colors.metadata} dimColor>
          Priority: {currentHint.priority}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Hook for managing onboarding state
 */
export function useOnboarding() {
  const [userInteractions, setUserInteractions] = useState({
    hasSelectedItems: false,
    hasUsedKeyboard: false,
    timeOnView: 0,
    keyPressCount: 0
  });

  const [viewStartTime, setViewStartTime] = useState(Date.now());

  const trackSelection = (hasSelection: boolean) => {
    setUserInteractions(prev => ({
      ...prev,
      hasSelectedItems: hasSelection || prev.hasSelectedItems
    }));
  };

  const trackKeyboardUse = () => {
    setUserInteractions(prev => ({
      ...prev,
      hasUsedKeyboard: true,
      keyPressCount: prev.keyPressCount + 1
    }));
  };

  const resetViewTracking = React.useCallback(() => {
    setViewStartTime(Date.now());
    setUserInteractions(prev => ({
      ...prev,
      timeOnView: 0,
      hasSelectedItems: false,
      hasUsedKeyboard: false
    }));
  }, []);

  const updateTimeOnView = () => {
    setUserInteractions(prev => ({
      ...prev,
      timeOnView: Date.now() - viewStartTime
    }));
  };

  // Update time on view every second
  useEffect(() => {
    const interval = setInterval(updateTimeOnView, 1000);
    return () => clearInterval(interval);
  }, [viewStartTime]);

  const getOnboardingProgress = () => {
    const totalHints = ONBOARDING_HINTS.filter(h => h.showOnce).length;
    try {
      const stored = localStorage.getItem('aci-onboarding-hints');
      const shownCount = stored ? JSON.parse(stored).length : 0;
      return Math.round((shownCount / totalHints) * 100);
    } catch {
      return 0;
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem('aci-onboarding-hints');
    } catch (error) {
      console.warn('Could not reset onboarding state:', error);
    }
  };

  return {
    userInteractions,
    trackSelection,
    trackKeyboardUse,
    resetViewTracking,
    getOnboardingProgress,
    resetOnboarding
  };
}