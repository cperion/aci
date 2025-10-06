import { useEffect } from 'react';
import { DatabaseService } from '../../services/database-service.js';
import { useNavigationStore } from '../stores/index.js';
// Removed useSelection import - tracking will be handled by individual components

/**
 * Hook to automatically track recent items based on user navigation and selections
 */
export function useRecentTracking() {
  const currentView = useNavigationStore(state => state.currentView);

  // With the new selection pattern, recent tracking will be handled 
  // by individual components when they perform actions on selected items
  // This hook now only tracks view navigation
  useEffect(() => {
    // Track view navigation
    if (currentView?.id && currentView.id !== 'home') {
      DatabaseService.addRecentItem({
        id: currentView.id,
        type: 'view',
        name: currentView.title || currentView.id,
        viewId: currentView.id,
        metadata: {
          navigatedAt: Date.now(),
          viewContext: 'navigation'
        }
      });
    }
  }, [currentView?.id, currentView?.title]);

  // Track view navigation for important administrative actions
  useEffect(() => {
    // Track when user navigates to analytics or insights (important admin activity)
    if (currentView?.id === 'analytics' || currentView?.id === 'insights') {
      DatabaseService.addRecentItem({
        id: `view-${currentView.id}`,
        type: 'item', // Using 'item' as a generic type for views
        name: currentView.id === 'analytics' ? 'Analytics Dashboard' : 'Enterprise Insights',
        viewId: currentView.id,
        metadata: {
          type: 'view-access',
          accessedAt: Date.now()
        }
      });
    }
  }, [currentView?.id]);
}