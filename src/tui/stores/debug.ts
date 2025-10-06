/**
 * Debug utilities for monitoring state updates and detecting loops
 */
import React from 'react';

// Global state update tracker
const updateTracker = new Map<string, {
  count: number;
  lastUpdate: number;
  stackTraces: string[];
}>();

// Track state updates
export const trackStateUpdate = (store: string, action: string, data?: any) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const key = `${store}:${action}`;
  const now = Date.now();
  const stack = new Error().stack?.split('\n').slice(3, 8).join('\n') || '';
  
  if (!updateTracker.has(key)) {
    updateTracker.set(key, {
      count: 0,
      lastUpdate: now,
      stackTraces: []
    });
  }
  
  const tracker = updateTracker.get(key)!;
  tracker.count++;
  tracker.lastUpdate = now;
  tracker.stackTraces.push(stack);
  
  // Keep only last 5 stack traces
  if (tracker.stackTraces.length > 5) {
    tracker.stackTraces.shift();
  }
  
  // Detect potential loops
  if (tracker.count > 10 && (now - tracker.lastUpdate) < 1000) {
    console.warn(`[StateTracker] Potential infinite loop detected in ${store}:${action}`, {
      count: tracker.count,
      timeWindow: now - tracker.lastUpdate,
      recentStacks: tracker.stackTraces.slice(-3)
    });
  }
  
  // Log update
  console.debug(`[StateTracker] ${store}:${action}`, {
    count: tracker.count,
    data,
    time: now
  });
};

// Get update statistics
export const getUpdateStats = () => {
  const stats: Record<string, any> = {};
  
  updateTracker.forEach((tracker, key) => {
    const [store = '', action = ''] = key.split(':');
    if (store && !stats[store]) {
      stats[store] = {};
    }
    if (store && action) {
      stats[store][action] = {
        count: tracker.count,
        lastUpdate: tracker.lastUpdate
      };
    }
  });
  
  return stats;
};

// Reset tracking
export const resetTracking = () => {
  updateTracker.clear();
};

// Detect update loops between stores
export const detectLoops = () => {
  const now = Date.now();
  const suspicious: Array<{
    store: string;
    action: string;
    count: number;
    timeWindow: number;
  }> = [];
  
  updateTracker.forEach((tracker, key) => {
    if (tracker.count > 5 && (now - tracker.lastUpdate) < 500) {
      const [store = '', action = ''] = key.split(':');
      suspicious.push({
        store,
        action,
        count: tracker.count,
        timeWindow: now - tracker.lastUpdate
      });
    }
  });
  
  return suspicious;
};

// Hook for React components to track renders
export const useRenderTracker = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const renderCount = React.useRef(0);
  const lastRender = React.useRef(Date.now());
  
  React.useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLast = now - lastRender.current;
    
    if (renderCount.current > 10 && timeSinceLast < 1000) {
      console.warn(`[RenderTracker] Potential infinite render in ${componentName}`, {
        renderCount: renderCount.current,
        timeSinceLast,
        stack: new Error().stack?.split('\n').slice(3, 6).join('\n')
      });
    }
    
    console.debug(`[RenderTracker] ${componentName} rendered`, {
      count: renderCount.current,
      timeSinceLast
    });
    
    lastRender.current = now;
  });
  
  return renderCount.current;
};