/**
 * Universal Search Engine - Core search infrastructure with prefetching
 * Implements fzf-like fuzzy matching with smart prefetching optimizations
 */

import { TuiCommandService } from '../../services/tui-command-service.js';
import type { CommandResult } from '../../types/command-result.js';

export type SearchableType = 'users' | 'groups' | 'items' | 'services' | 'admin';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: SearchableType;
  score: number;
  metadata: Record<string, any>;
  source: any; // Original data object
}

export interface SearchOptions {
  types?: SearchableType[];
  limit?: number;
  prefetch?: boolean;
  fuzzyThreshold?: number;
}

interface PrefetchEntry {
  type: SearchableType;
  data: any[];
  timestamp: number;
  accessCount: number;
}

export class SearchEngine {
  private commandService: TuiCommandService;
  private prefetchCache = new Map<SearchableType, PrefetchEntry>();
  private readonly PREFETCH_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly FUZZY_THRESHOLD = 0.3;
  
  constructor(commandService: TuiCommandService) {
    this.commandService = commandService;
  }

  /**
   * Universal search across all data types
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      types = ['users', 'groups', 'items', 'services'],
      limit = 50,
      fuzzyThreshold = this.FUZZY_THRESHOLD
    } = options;

    // Start prefetching missing data types
    this.startPrefetching(types);

    const allResults: SearchResult[] = [];
    
    // Search each type
    for (const type of types) {
      try {
        const results = await this.searchType(type, query, fuzzyThreshold);
        allResults.push(...results);
      } catch (error) {
        console.warn(`Search failed for type ${type}:`, error);
      }
    }

    // Sort by relevance score and limit
    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search within a specific data type
   */
  private async searchType(type: SearchableType, query: string, threshold: number): Promise<SearchResult[]> {
    const data = await this.getData(type);
    if (!data || data.length === 0) return [];

    const results: SearchResult[] = [];
    
    for (const item of data) {
      const searchableText = this.extractSearchableText(type, item);
      const score = this.fuzzyMatch(query.toLowerCase(), searchableText.toLowerCase());
      
      if (score >= threshold) {
        results.push({
          id: this.getId(type, item),
          title: this.getTitle(type, item),
          subtitle: this.getSubtitle(type, item),
          type,
          score,
          metadata: this.getMetadata(type, item),
          source: item
        });
      }
    }

    return results;
  }

  /**
   * Get data for a type (from cache or API)
   */
  private async getData(type: SearchableType): Promise<any[]> {
    const cached = this.prefetchCache.get(type);
    
    // Return cached data if valid
    if (cached && this.isCacheValid(cached)) {
      cached.accessCount++;
      return cached.data;
    }

    // Fetch fresh data
    return this.fetchData(type);
  }

  /**
   * Fetch data from API and cache it
   */
  private async fetchData(type: SearchableType): Promise<any[]> {
    try {
      let result: CommandResult<any>;
      
      switch (type) {
        case 'users':
          result = await this.commandService.searchUsers('*', { limit: 200 });
          break;
        case 'groups':
          result = await this.commandService.searchGroups('*', { limit: 200 });
          break;
        case 'items':
          result = await this.commandService.searchItems('*', { limit: 200 });
          break;
        case 'services':
          result = await this.commandService.searchServices('*', { limit: 200 });
          break;
        case 'admin':
          result = await this.commandService.listServices();
          break;
        default:
          return [];
      }

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : 
                    result.data.results || [result.data];
        
        // Cache the data
        this.cacheData(type, data);
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch ${type}:`, error);
    }
    
    return [];
  }

  /**
   * Cache data with access tracking
   */
  private cacheData(type: SearchableType, data: any[]): void {
    // Implement LRU eviction if cache is full
    if (this.prefetchCache.size >= 5) {
      const oldestEntry = Array.from(this.prefetchCache.entries())
        .sort(([,a], [,b]) => a.accessCount - b.accessCount)[0];
      if (oldestEntry) {
        this.prefetchCache.delete(oldestEntry[0]);
      }
    }

    this.prefetchCache.set(type, {
      type,
      data: data.slice(0, this.MAX_CACHE_SIZE),
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * Start background prefetching for requested types
   */
  private async startPrefetching(types: SearchableType[]): Promise<void> {
    const missingTypes = types.filter(type => {
      const cached = this.prefetchCache.get(type);
      return !cached || !this.isCacheValid(cached);
    });

    // Prefetch missing types in background
    for (const type of missingTypes.slice(0, 3)) { // Limit concurrent prefetches
      setTimeout(() => this.fetchData(type), 10); // Small delay to not block UI
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(entry: PrefetchEntry): boolean {
    return Date.now() - entry.timestamp < this.PREFETCH_TTL;
  }

  /**
   * Fuzzy matching algorithm (simplified fzf-like scoring)
   */
  private fuzzyMatch(needle: string, haystack: string): number {
    if (!needle) return 1.0;
    if (!haystack) return 0.0;
    
    // Exact match gets highest score
    if (haystack.includes(needle)) {
      const exactPosition = haystack.indexOf(needle);
      return 0.9 + (0.1 * (1 - exactPosition / haystack.length));
    }

    // Character-by-character fuzzy matching
    let score = 0;
    let needleIndex = 0;
    let consecutiveMatches = 0;
    
    for (let i = 0; i < haystack.length && needleIndex < needle.length; i++) {
      if (haystack[i] === needle[needleIndex]) {
        score += 1 + consecutiveMatches * 0.1; // Bonus for consecutive matches
        consecutiveMatches++;
        needleIndex++;
      } else {
        consecutiveMatches = 0;
      }
    }

    // Normalize by needle length
    const coverage = needleIndex / needle.length;
    const density = score / haystack.length;
    
    return coverage * 0.7 + density * 0.3;
  }

  /**
   * Extract searchable text from different data types
   */
  private extractSearchableText(type: SearchableType, item: any): string {
    switch (type) {
      case 'users':
        return [item.username, item.fullName, item.email, item.role].filter(Boolean).join(' ');
      case 'groups':
        return [item.title, item.description, item.owner, ...(item.tags || [])].filter(Boolean).join(' ');
      case 'items':
        return [item.title, item.type, item.owner, item.description, ...(item.tags || [])].filter(Boolean).join(' ');
      case 'services':
        return [item.serviceName, item.type, item.url, item.description].filter(Boolean).join(' ');
      case 'admin':
        return [item.name, item.type, item.folder, item.status].filter(Boolean).join(' ');
      default:
        return String(item.title || item.name || item.id || '');
    }
  }

  /**
   * Get unique ID for different data types
   */
  private getId(type: SearchableType, item: any): string {
    switch (type) {
      case 'users':
        return item.username;
      case 'groups':
      case 'items':
        return item.id;
      case 'services':
        return item.url || item.serviceName;
      case 'admin':
        return item.name;
      default:
        return item.id || item.name || String(Math.random());
    }
  }

  /**
   * Get display title for different data types
   */
  private getTitle(type: SearchableType, item: any): string {
    switch (type) {
      case 'users':
        return item.fullName || item.username;
      case 'groups':
      case 'items':
        return item.title;
      case 'services':
        return item.serviceName;
      case 'admin':
        return item.name;
      default:
        return item.title || item.name || 'Unknown';
    }
  }

  /**
   * Get subtitle for different data types
   */
  private getSubtitle(type: SearchableType, item: any): string {
    switch (type) {
      case 'users':
        return `${item.role} • ${item.email}`;
      case 'groups':
        return `${item.memberCount || 0} members • ${item.access}`;
      case 'items':
        return `${item.type} • ${item.owner}`;
      case 'services':
        return `${item.type} • ${item.status || 'Available'}`;
      case 'admin':
        return `${item.type} • ${item.status}`;
      default:
        return '';
    }
  }

  /**
   * Get metadata for different data types
   */
  private getMetadata(type: SearchableType, item: any): Record<string, any> {
    return {
      type,
      originalItem: item,
      searchable: this.extractSearchableText(type, item)
    };
  }

  /**
   * Clear cache (useful for logout or refresh)
   */
  clearCache(): void {
    this.prefetchCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): Record<SearchableType, { size: number; age: number; hits: number }> {
    const stats: any = {};
    
    for (const [type, entry] of this.prefetchCache.entries()) {
      stats[type] = {
        size: entry.data.length,
        age: Date.now() - entry.timestamp,
        hits: entry.accessCount
      };
    }
    
    return stats;
  }
}