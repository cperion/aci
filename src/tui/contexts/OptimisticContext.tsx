import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface OptimisticContextValue {
  notifications: Notification[];
  showNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  performOptimistic: <T>(
    optimisticAction: () => void,
    apiCall: () => Promise<T>,
    rollback: () => void,
    successMessage?: string,
    errorMessage?: string
  ) => Promise<T>;
}

const OptimisticContext = createContext<OptimisticContextValue | null>(null);

export function OptimisticProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: Notification['type'], message: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = { id, type, message };
    
    setNotifications(prev => [...prev.slice(-4), notification]); // Keep max 5 notifications
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const performOptimistic = useCallback(async function<T>(
    optimisticAction: () => void,
    apiCall: () => Promise<T>,
    rollback: () => void,
    successMessage = 'Operation completed',
    errorMessage = 'Operation failed'
  ): Promise<T> {
    // 1. Execute optimistic action immediately
    optimisticAction();
    
    try {
      // 2. Execute API call in background
      const result = await apiCall();
      
      // 3. Show success notification
      showNotification('success', successMessage);
      
      return result;
    } catch (error) {
      // 4. Rollback on failure
      rollback();
      
      // 5. Show error notification
      const message = error instanceof Error ? error.message : errorMessage;
      showNotification('error', message);
      
      throw error;
    }
  }, [showNotification]);

  const value: OptimisticContextValue = {
    notifications,
    showNotification,
    removeNotification,
    performOptimistic
  };

  return (
    <OptimisticContext.Provider value={value}>
      {children}
    </OptimisticContext.Provider>
  );
}

export function useOptimistic() {
  const context = useContext(OptimisticContext);
  if (!context) {
    throw new Error('useOptimistic must be used within OptimisticProvider');
  }
  return context;
}

/**
 * Simplified hook for common optimistic operations
 */
export function useSimpleOptimistic<T>() {
  const { performOptimistic } = useOptimistic();

  const deleteItems = useCallback(async (
    items: T[],
    getId: (item: T) => string,
    getName: (item: T) => string,
    currentList: T[],
    setList: (items: T[]) => void,
    deleteApi: (ids: string[]) => Promise<any>
  ) => {
    const ids = items.map(getId);
    const names = items.map(getName).join(', ');
    const backup = [...currentList];
    
    return performOptimistic(
      () => setList(currentList.filter(item => !ids.includes(getId(item)))),
      () => deleteApi(ids),
      () => setList(backup),
      `Deleted ${items.length === 1 ? names : `${items.length} items`}`,
      `Failed to delete ${items.length === 1 ? names : 'items'}`
    );
  }, [performOptimistic]);

  const updateItems = useCallback(async (
    items: T[],
    getId: (item: T) => string,
    getName: (item: T) => string,
    updates: Partial<T>,
    currentList: T[],
    setList: (items: T[]) => void,
    updateApi: (ids: string[], updates: Partial<T>) => Promise<any>
  ) => {
    const ids = items.map(getId);
    const names = items.map(getName).join(', ');
    const backup = [...currentList];
    
    return performOptimistic(
      () => setList(currentList.map(item => 
        ids.includes(getId(item)) ? { ...item, ...updates } : item
      )),
      () => updateApi(ids, updates),
      () => setList(backup),
      `Updated ${items.length === 1 ? names : `${items.length} items`}`,
      `Failed to update ${items.length === 1 ? names : 'items'}`
    );
  }, [performOptimistic]);

  return {
    deleteItems,
    updateItems
  };
}