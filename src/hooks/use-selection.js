/**
 * Selection Hook
 * Simple multi-item selection state management
 * Replaces complex context with local component state
 */

import { useState, useCallback } from 'react';

export function useSelection(initialSelected = []) {
  const [selected, setSelected] = useState(initialSelected);
  
  // Toggle single item selection
  const toggle = useCallback((id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);
  
  // Select single item (clear others)
  const selectSingle = useCallback((id) => {
    setSelected([id]);
  }, []);
  
  // Add multiple items to selection
  const selectMultiple = useCallback((ids) => {
    setSelected(prev => {
      const newSet = new Set([...prev, ...ids]);
      return Array.from(newSet);
    });
  }, []);
  
  // Remove items from selection
  const deselect = useCallback((ids) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    setSelected(prev => prev.filter(id => !idsArray.includes(id)));
  }, []);
  
  // Select all from provided list
  const selectAll = useCallback((allIds) => {
    setSelected(allIds);
  }, []);
  
  // Clear all selections
  const clearAll = useCallback(() => {
    setSelected([]);
  }, []);
  
  // Check if item is selected
  const isSelected = useCallback((id) => {
    return selected.includes(id);
  }, [selected]);
  
  // Get selected items filtered by a list
  const getSelectedFrom = useCallback((items, getId = (item) => item.id) => {
    return items.filter(item => selected.includes(getId(item)));
  }, [selected]);
  
  // Check if any items are selected
  const hasSelection = useCallback(() => {
    return selected.length > 0;
  }, [selected]);
  
  // Get selection count
  const getCount = useCallback(() => {
    return selected.length;
  }, [selected]);
  
  // Check if all items from a list are selected
  const areAllSelected = useCallback((allIds) => {
    return allIds.length > 0 && allIds.every(id => selected.includes(id));
  }, [selected]);
  
  // Check if some (but not all) items from a list are selected
  const areSomeSelected = useCallback((allIds) => {
    return allIds.some(id => selected.includes(id)) && !areAllSelected(allIds);
  }, [selected, areAllSelected]);
  
  return {
    // Current state
    selected,
    
    // Selection actions
    toggle,
    selectSingle,
    selectMultiple,
    deselect,
    selectAll,
    clearAll,
    
    // Query methods
    isSelected,
    hasSelection,
    getCount,
    getSelectedFrom,
    areAllSelected,
    areSomeSelected
  };
}