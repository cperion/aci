import React from 'react';

// Import all view components
import { HomeView } from '../components/views/HomeView.js';
import { LoginView } from '../components/views/LoginView.js';
import { ServicesView } from '../components/views/ServicesView.js';
import { UsersView } from '../components/views/UsersView.js';
import { GroupsView } from '../components/views/GroupsView.js';
import { ItemsView } from '../components/views/ItemsView.js';
import { AdminView } from '../components/views/AdminView.js';
import { InsightsView } from '../components/views/InsightsView.js';
import { AnalyticsView } from '../components/views/AnalyticsView.js';
import { DatastoresView } from '../components/views/DatastoresView.js';
import { ThemePreview } from '../components/ThemePreview.js';
import { 
  ServiceDetailView, 
  UserDetailView, 
  GroupDetailView, 
  ItemDetailView 
} from '../components/views/DetailViews.js';

export type ViewComponent = React.ComponentType<any>;
export type ViewId = string;

/**
 * Unified view registry that eliminates the switch-case pattern.
 * Adding a new view now only requires registering it here.
 */
class ViewRegistry {
  private static instance: ViewRegistry;
  private registry = new Map<ViewId, ViewComponent>();

  private constructor() {
    // Auto-register all known views
    this.registerDefaultViews();
  }

  static getInstance(): ViewRegistry {
    if (!ViewRegistry.instance) {
      ViewRegistry.instance = new ViewRegistry();
    }
    return ViewRegistry.instance;
  }


  private registerDefaultViews() {
    // Core views
    this.register('home', HomeView);
    this.register('login', LoginView);
    
    // Portal views
    this.register('services', ServicesView);
    this.register('users', UsersView);
    this.register('groups', GroupsView);
    this.register('items', ItemsView);
    
    // Admin views
    this.register('admin', AdminView);
    this.register('insights', InsightsView);
    this.register('analytics', AnalyticsView);
    this.register('datastores', DatastoresView);
    
    // Special views
    this.register('theme-preview', ThemePreview);
    
    // Detail views (comprehensive components)
    this.register('service-detail', ServiceDetailView);
    this.register('user-detail', UserDetailView);
    this.register('group-detail', GroupDetailView);
    this.register('item-detail', ItemDetailView);
  }

  /**
   * Register a new view component
   */
  register(viewId: ViewId, component: ViewComponent): void {
    this.registry.set(viewId, component);
  }

  /**
   * Get a view component by ID
   */
  getView(viewId: ViewId): ViewComponent {
    return this.registry.get(viewId) || HomeView;
  }

  /**
   * Check if a view is registered
   */
  hasView(viewId: ViewId): boolean {
    return this.registry.has(viewId);
  }

  /**
   * Get all registered view IDs
   */
  getAllViewIds(): ViewId[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Unregister a view (useful for testing or dynamic views)
   */
  unregister(viewId: ViewId): boolean {
    return this.registry.delete(viewId);
  }
}

// Export singleton instance
export const viewRegistry = ViewRegistry.getInstance();

// Convenience functions for external use
export const registerView = (viewId: ViewId, component: ViewComponent) => 
  viewRegistry.register(viewId, component);

export const getView = (viewId: ViewId) => 
  viewRegistry.getView(viewId);

export const hasView = (viewId: ViewId) => 
  viewRegistry.hasView(viewId);

export const getAllViewIds = () => 
  viewRegistry.getAllViewIds();