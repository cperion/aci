import { useCallback } from 'react';
import { OptimisticUIService, withOptimisticUpdate } from '../services/optimistic-ui.js';
import { useNotifications } from '../components/NotificationSystem.js';

export function useOptimisticOperations() {
  const optimisticUI = OptimisticUIService.getInstance();
  const notifications = useNotifications();

  /**
   * Execute an optimistic delete operation
   */
  const optimisticDelete = useCallback(async <T>(
    items: T[],
    getItemId: (item: T) => string,
    getItemName: (item: T) => string,
    removeFromList: (ids: string[]) => void,
    restoreToList: (items: T[]) => void,
    deleteApi: (ids: string[]) => Promise<any>
  ) => {
    const itemIds = items.map(getItemId);
    const operationId = `delete_${itemIds.join('_')}_${Date.now()}`;
    
    return withOptimisticUpdate(
      operationId,
      // Optimistic action: remove from UI immediately
      () => {
        removeFromList(itemIds);
        const itemNames = items.map(getItemName).join(', ');
        notifications.showSuccess(
          'Deleting...',
          `Removing ${items.length === 1 ? itemNames : `${items.length} items`}`,
          2000
        );
      },
      // Rollback action: restore items
      () => {
        restoreToList(items);
      },
      // API call
      () => deleteApi(itemIds),
      // Resource and type
      'items',
      'delete'
    );
  }, [notifications]);

  /**
   * Execute an optimistic update operation
   */
  const optimisticUpdate = useCallback(async <T>(
    item: T,
    getItemId: (item: T) => string,
    getItemName: (item: T) => string,
    updatedData: Partial<T>,
    updateInList: (id: string, data: Partial<T>) => void,
    rollbackInList: (id: string, originalData: T) => void,
    updateApi: (id: string, data: Partial<T>) => Promise<any>
  ) => {
    const itemId = getItemId(item);
    const operationId = `update_${itemId}_${Date.now()}`;
    
    return withOptimisticUpdate(
      operationId,
      // Optimistic action: update UI immediately
      () => {
        updateInList(itemId, updatedData);
        notifications.showSuccess(
          'Updating...',
          `Updating ${getItemName(item)}`,
          2000
        );
      },
      // Rollback action: restore original data
      () => {
        rollbackInList(itemId, item);
      },
      // API call
      () => updateApi(itemId, updatedData),
      // Resource and type
      'items',
      'update'
    );
  }, [notifications]);

  /**
   * Execute an optimistic create operation
   */
  const optimisticCreate = useCallback(async <T>(
    newItem: T,
    getItemId: (item: T) => string,
    getItemName: (item: T) => string,
    addToList: (item: T) => void,
    removeFromList: (id: string) => void,
    createApi: (data: T) => Promise<any>
  ) => {
    // Use crypto.randomUUID if available, fallback to secure generation
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? 
      `temp_${crypto.randomUUID()}` : 
      `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Safely add temp ID to item without unsafe type assertion
    const itemWithTempId = Object.hasOwnProperty.call(newItem, 'id') ? 
      { ...newItem, id: tempId } as T :
      newItem;
    
    const operationId = `create_${tempId}`;
    
    return withOptimisticUpdate(
      operationId,
      // Optimistic action: add to UI immediately
      () => {
        addToList(itemWithTempId);
        notifications.showSuccess(
          'Creating...',
          `Creating ${getItemName(newItem)}`,
          2000
        );
      },
      // Rollback action: remove temp item
      () => {
        removeFromList(tempId);
      },
      // API call
      () => createApi(newItem),
      // Resource and type
      'items',
      'create'
    );
  }, [notifications]);

  /**
   * Execute an optimistic restart operation
   */
  const optimisticRestart = useCallback(async <T>(
    items: T[],
    getItemId: (item: T) => string,
    getItemName: (item: T) => string,
    updateStatus: (ids: string[], status: string) => void,
    restoreStatus: (items: Array<{ id: string; originalStatus: string }>) => void,
    restartApi: (ids: string[]) => Promise<any>
  ) => {
    const itemIds = items.map(getItemId);
    
    // Safely extract status without unsafe type assertion
    const originalStatuses = items.map(item => {
      const id = getItemId(item);
      let originalStatus = 'unknown';
      
      // Safe status extraction
      if (item && typeof item === 'object' && 'status' in item) {
        const status = (item as any).status;
        if (typeof status === 'string') {
          originalStatus = status;
        }
      }
      
      return { id, originalStatus };
    });
    
    const operationId = `restart_${itemIds.join('_')}_${Date.now()}`;
    
    return withOptimisticUpdate(
      operationId,
      // Optimistic action: update status immediately
      () => {
        updateStatus(itemIds, 'restarting');
        const itemNames = items.map(getItemName).join(', ');
        notifications.showSuccess(
          'Restarting...',
          `Restarting ${items.length === 1 ? itemNames : `${items.length} items`}`,
          2000
        );
      },
      // Rollback action: restore original statuses
      () => {
        restoreStatus(originalStatuses);
      },
      // API call
      () => restartApi(itemIds),
      // Resource and type
      'items',
      'update'
    );
  }, [notifications]);

  /**
   * Check if any operations are pending
   */
  const isPending = useCallback((resource?: string): boolean => {
    if (resource) {
      return optimisticUI.getPendingOperations(resource).length > 0;
    }
    return false;
  }, [optimisticUI]);

  /**
   * Get pending operations for a resource
   */
  const getPendingOperations = useCallback((resource: string) => {
    return optimisticUI.getPendingOperations(resource);
  }, [optimisticUI]);

  return {
    optimisticDelete,
    optimisticUpdate,
    optimisticCreate,
    optimisticRestart,
    isPending,
    getPendingOperations
  };
}