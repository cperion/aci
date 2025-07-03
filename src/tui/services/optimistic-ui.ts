/**
 * Optimistic UI service for instant feedback during API operations
 */

export interface OptimisticOperation<T = any> {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: T;
  timestamp: number;
  rollback?: () => void;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export class OptimisticUIService {
  private static instance: OptimisticUIService;
  private operations = new Map<string, OptimisticOperation>();
  private notifications: NotificationMessage[] = [];
  private notificationCallbacks = new Set<(notifications: NotificationMessage[]) => void>();
  private notificationTimers = new Map<string, NodeJS.Timeout>();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Auto-cleanup stale operations and notifications every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  static getInstance(): OptimisticUIService {
    if (!OptimisticUIService.instance) {
      OptimisticUIService.instance = new OptimisticUIService();
    }
    return OptimisticUIService.instance;
  }

  /**
   * Start an optimistic operation
   */
  startOperation<T>(
    id: string,
    type: OptimisticOperation['type'],
    resource: string,
    data: T,
    rollback?: () => void
  ): void {
    const operation: OptimisticOperation<T> = {
      id,
      type,
      resource,
      data,
      timestamp: Date.now(),
      rollback
    };

    this.operations.set(id, operation);
  }

  /**
   * Complete an optimistic operation successfully
   */
  completeOperation(id: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      this.operations.delete(id);
      
      // Show success notification
      this.showNotification({
        type: 'success',
        title: 'Success',
        message: `${operation.type} operation completed`,
        duration: 3000
      });
    }
  }

  /**
   * Fail an optimistic operation and rollback
   */
  failOperation(id: string, error: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      // Execute rollback if available
      if (operation.rollback) {
        operation.rollback();
      }

      this.operations.delete(id);
      
      // Show error notification
      this.showNotification({
        type: 'error',
        title: 'Operation Failed',
        message: `${operation.type} failed: ${error}`,
        duration: 5000
      });
    }
  }

  /**
   * Check if an operation is pending
   */
  isPending(id: string): boolean {
    return this.operations.has(id);
  }

  /**
   * Get all pending operations for a resource
   */
  getPendingOperations(resource: string): OptimisticOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.resource === resource);
  }

  /**
   * Show a notification
   */
  showNotification(notification: Omit<NotificationMessage, 'id' | 'timestamp'>): string {
    // Use crypto.randomUUID if available, fallback to secure random generation
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? 
      `notification_${crypto.randomUUID()}` : 
      `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
    const fullNotification: NotificationMessage = {
      id,
      timestamp: Date.now(),
      duration: 4000,
      ...notification
    };

    // Prevent memory exhaustion - limit to 20 notifications max
    if (this.notifications.length >= 20) {
      const oldest = this.notifications.shift();
      if (oldest && this.notificationTimers.has(oldest.id)) {
        clearTimeout(this.notificationTimers.get(oldest.id)!);
        this.notificationTimers.delete(oldest.id);
      }
    }

    this.notifications.push(fullNotification);
    this.notifyCallbacks();

    // Auto-remove after duration with proper cleanup
    if (fullNotification.duration) {
      const timer = setTimeout(() => {
        this.removeNotification(id);
      }, fullNotification.duration);
      
      this.notificationTimers.set(id, timer);
    }

    return id;
  }

  /**
   * Remove a notification
   */
  removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index >= 0) {
      this.notifications.splice(index, 1);
      
      // Clean up associated timer
      if (this.notificationTimers.has(id)) {
        clearTimeout(this.notificationTimers.get(id)!);
        this.notificationTimers.delete(id);
      }
      
      this.notifyCallbacks();
    }
  }

  /**
   * Get all current notifications
   */
  getNotifications(): NotificationMessage[] {
    return [...this.notifications];
  }

  /**
   * Subscribe to notification changes
   */
  onNotificationsChange(callback: (notifications: NotificationMessage[]) => void): () => void {
    this.notificationCallbacks.add(callback);
    
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    // Clear all timers first
    for (const timer of this.notificationTimers.values()) {
      clearTimeout(timer);
    }
    this.notificationTimers.clear();
    
    this.notifications = [];
    this.notifyCallbacks();
  }

  private notifyCallbacks(): void {
    const notifications = this.getNotifications();
    this.notificationCallbacks.forEach(callback => {
      try {
        // Use setTimeout to prevent blocking and allow React to handle unmounts
        setTimeout(() => {
          try {
            callback(notifications);
          } catch (error) {
            // Silently handle errors from unmounted components
            if (error.message?.includes('unmounted') || error.message?.includes('disposed')) {
              return;
            }
            console.error('Error in notification callback:', error);
          }
        }, 0);
      } catch (error) {
        console.error('Error scheduling notification callback:', error);
      }
    });
  }

  /**
   * Cleanup expired operations (older than 30 seconds)
   */
  cleanup(): void {
    const thirtySecondsAgo = Date.now() - 30000;
    
    for (const [id, operation] of this.operations.entries()) {
      if (operation.timestamp < thirtySecondsAgo) {
        console.warn(`Cleaning up stale operation: ${id}`);
        this.operations.delete(id);
      }
    }

    // Remove old notifications and their timers
    const fiveMinutesAgo = Date.now() - 300000;
    const expiredNotifications = this.notifications.filter(n => n.timestamp <= fiveMinutesAgo);
    
    expiredNotifications.forEach(notification => {
      if (this.notificationTimers.has(notification.id)) {
        clearTimeout(this.notificationTimers.get(notification.id)!);
        this.notificationTimers.delete(notification.id);
      }
    });
    
    this.notifications = this.notifications.filter(n => n.timestamp > fiveMinutesAgo);
  }

  /**
   * Dispose of the service and clean up all resources
   */
  dispose(): void {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clear all notification timers
    for (const timer of this.notificationTimers.values()) {
      clearTimeout(timer);
    }
    this.notificationTimers.clear();

    // Clear all data
    this.operations.clear();
    this.notifications = [];
    this.notificationCallbacks.clear();
  }
}

/**
 * Helper function for service operations with optimistic updates
 */
export async function withOptimisticUpdate<T>(
  operationId: string,
  optimisticAction: () => void,
  rollbackAction: () => void,
  apiCall: () => Promise<T>,
  resource: string = 'unknown',
  type: OptimisticOperation['type'] = 'update'
): Promise<T> {
  const optimisticUI = OptimisticUIService.getInstance();

  // Start optimistic operation
  optimisticUI.startOperation(operationId, type, resource, null, rollbackAction);
  
  try {
    // Execute optimistic UI change immediately
    optimisticAction();
    
    // Execute API call in background
    const result = await apiCall();
    
    // Complete successfully
    optimisticUI.completeOperation(operationId);
    
    return result;
  } catch (error) {
    // Fail and rollback
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    optimisticUI.failOperation(operationId, errorMessage);
    
    throw error;
  }
}