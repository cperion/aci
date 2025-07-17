/**
 * Notification Hook
 * Simple notification state management without complex service layers
 * Handles notification queuing, auto-dismiss, and type-based styling
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef(new Map());
  
  // Add notification with auto-dismiss
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      timestamp: Date.now(),
      persistent: duration === 0 // Duration 0 means persistent
    };
    
    setNotifications(prev => {
      // Limit to max 5 concurrent notifications
      const filtered = prev.slice(-4);
      return [...filtered, notification];
    });
    
    // Auto-dismiss if not persistent
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, duration);
      
      timeoutRefs.current.set(id, timeoutId);
    }
    
    return id;
  }, []);
  
  // Convenience methods for different types
  const showSuccess = useCallback((message, duration = 3000) => {
    return showNotification(message, 'success', duration);
  }, [showNotification]);
  
  const showError = useCallback((message, duration = 5000) => {
    return showNotification(message, 'error', duration);
  }, [showNotification]);
  
  const showWarning = useCallback((message, duration = 4000) => {
    return showNotification(message, 'warning', duration);
  }, [showNotification]);
  
  const showInfo = useCallback((message, duration = 3000) => {
    return showNotification(message, 'info', duration);
  }, [showNotification]);
  
  // Dismiss specific notification
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);
  
  // Clear all notifications
  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    
    setNotifications([]);
  }, []);
  
  // Clear notifications by type
  const clearByType = useCallback((type) => {
    setNotifications(prev => {
      const toRemove = prev.filter(n => n.type === type);
      
      // Clear timeouts for removed notifications
      toRemove.forEach(notification => {
        const timeoutId = timeoutRefs.current.get(notification.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutRefs.current.delete(notification.id);
        }
      });
      
      return prev.filter(n => n.type !== type);
    });
  }, []);
  
  // Get notifications by type
  const getByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);
  
  // Check if any errors exist
  const hasErrors = useCallback(() => {
    return notifications.some(n => n.type === 'error');
  }, [notifications]);
  
  // Get latest notification
  const getLatest = useCallback(() => {
    return notifications[notifications.length - 1] || null;
  }, [notifications]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);
  
  return {
    // Current state
    notifications,
    
    // Show methods
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Dismiss methods
    dismissNotification,
    removeNotification: dismissNotification, // Alias for compatibility
    clearAll,
    clearByType,
    
    // Query methods
    getByType,
    hasErrors,
    getLatest,
    count: notifications.length
  };
}