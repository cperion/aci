/**
 * TUI Data Adapters - Bridge between TuiCommandService and Miller Columns Node models
 * Wraps service calls and maps CommandResult data into Node[] structures
 */

import { TuiCommandService } from '../../services/tui-command-service.js';
import type { Node } from '../data/types.js';
import { useUiStore } from '../state/ui.js';
import { getAdminSession, getSession, getPortalUrl } from '../../session.js';

// Initialize service instance
const commandService = new TuiCommandService();

/**
 * Helper to push error notices through the UI store
 */
function pushError(message: string): void {
  useUiStore.getState().pushNotice({
    level: 'error',
    text: message
  });
}

/**
 * Map server services to nodes
 */
export async function listServerRoot(): Promise<Node[]> {
  try {
    // Use listServices to get available services
    const res = await commandService.listServices();
    
    if (!res.success) {
      pushError(res.error || 'Failed to list server services');
      return [];
    }

    const services = res.data || [];

    // Compute server REST base URL
    let serverRestBase: string | null = null;
    try {
      const adminSession = await getAdminSession();
      if (adminSession?.serverAdminUrl) {
        serverRestBase = adminSession.serverAdminUrl.replace('/admin', '/rest/services');
      }
    } catch {}
    if (!serverRestBase) {
      const userSession = await getSession();
      if (userSession?.portal) {
        try {
          const origin = new URL(userSession.portal).origin;
          serverRestBase = `${origin}/arcgis/rest/services`;
        } catch {}
      }
    }
    if (!serverRestBase) {
      try {
        const portal = getPortalUrl();
        const origin = new URL(portal).origin;
        serverRestBase = `${origin}/arcgis/rest/services`;
      } catch {
        pushError('Unable to derive server REST base URL');
        return [];
      }
    }

    return services.map((service: any) => {
      const serviceName = service.name || service.folderName || 'Unknown';
      const serviceType = service.type || 'MapServer';
      const cleanName = serviceName.replace(/(MapServer|FeatureServer|ImageServer)$/i, '');
      const restPath = `${serviceName}.${serviceType}`;
      return {
        id: `${serverRestBase}/${restPath}`,
        kind: 'serverService' as const,
        name: cleanName,
        url: `${serverRestBase}/${restPath}`,
        meta: { 
          type: serviceType,
          description: service.description,
          status: service.status
        },
        childrenKind: serviceType === 'MapServer' ? 'serverLayer' : 'serverTable'
      };
    });
  } catch (error) {
    pushError(`Failed to load server services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List children of a service (layers and tables)
 */
export async function listServiceChildren(serviceUrl: string): Promise<Node[]> {
  try {
    const res = await commandService.inspectService(serviceUrl);
    
    if (!res.success) {
      pushError(res.error || 'Failed to inspect service');
      return [];
    }

    const serviceInfo = res.data;
    const nodes: Node[] = [];

    // Map layers
    if (serviceInfo.layers && Array.isArray(serviceInfo.layers)) {
      serviceInfo.layers.forEach((layer: any) => {
        nodes.push({
          id: `${serviceUrl}/${layer.id}`,
          kind: 'serverLayer' as const,
          name: layer.name || `Layer ${layer.id}`,
          url: `${serviceUrl}/${layer.id}`,
          meta: {
            id: layer.id,
            type: layer.type || 'Feature Layer',
            geometryType: layer.geometryType,
            description: layer.description,
            minScale: layer.minScale,
            maxScale: layer.maxScale
          },
          childrenKind: 'serverOperation'
        });
      });
    }

    // Map tables
    if (serviceInfo.tables && Array.isArray(serviceInfo.tables)) {
      serviceInfo.tables.forEach((table: any) => {
        nodes.push({
          id: `${serviceUrl}/${table.id}`,
          kind: 'serverTable' as const,
          name: table.name || `Table ${table.id}`,
          url: `${serviceUrl}/${table.id}`,
          meta: {
            id: table.id,
            type: table.type || 'Table',
            description: table.description
          },
          childrenKind: 'serverOperation'
        });
      });
    }

    return nodes;
  } catch (error) {
    pushError(`Failed to load service children: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List static operations for server layers/tables
 */
export function listLayerOperations(url: string): Promise<Node[]> {
  const operations = [
    { name: 'Query', id: 'query' },
    { name: 'Query Related Records', id: 'queryRelatedRecords' },
    { name: 'Statistics', id: 'statistics' },
    { name: 'Metadata', id: 'metadata' }
  ];

  const nodes: Node[] = operations.map(op => ({
    id: `${url}/${op.id}`,
    kind: 'serverOperation' as const,
    name: op.name,
    url: `${url}/${op.id}`,
    meta: { operation: op.id }
  }));

  return Promise.resolve(nodes);
}

/**
 * List portal root entries
 */
export async function listPortalRoot(): Promise<Node[]> {
  try {
    let portalBase = getPortalUrl();
    const session = await getSession();
    if (session?.portal) portalBase = session.portal;

    return [
      {
        id: `${portalBase}/community/users`,
        kind: 'portalUsers' as const,
        name: 'Users',
        url: `${portalBase}/community/users`,
        meta: { description: 'Portal users' },
        childrenKind: 'portalUser'
      },
      {
        id: `${portalBase}/community/groups`,
        kind: 'portalGroups' as const,
        name: 'Groups',
        url: `${portalBase}/community/groups`,
        meta: { description: 'Portal groups' },
        childrenKind: 'portalGroup'
      },
      {
        id: `${portalBase}/content/items`,
        kind: 'portalItems' as const,
        name: 'Items',
        url: `${portalBase}/content/items`,
        meta: { description: 'Portal content items' },
        childrenKind: 'portalItem'
      }
    ];
  } catch (error) {
    pushError(`Failed to load portal root: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List portal users
 */
export async function listPortalUsers(): Promise<Node[]> {
  try {
    let portalBase = getPortalUrl();
    const session = await getSession();
    if (session?.portal) portalBase = session.portal;

    const res = await commandService.searchUsers('*', { limit: 100 });
    
    if (!res.success) {
      pushError(res.error || 'Failed to search users');
      return [];
    }

    const users = res.data?.results || [];
    
    return users.map((user: any) => ({
      id: `${portalBase}/content/users/${user.username}`,
      kind: 'portalUser' as const,
      name: user.username || user.name || 'Unknown User',
      url: `${portalBase}/content/users/${user.username}`,
      meta: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        created: user.created
      },
      childrenKind: 'portalItems'
    }));
  } catch (error) {
    pushError(`Failed to load portal users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List portal groups
 */
export async function listPortalGroups(): Promise<Node[]> {
  try {
    let portalBase = getPortalUrl();
    const session = await getSession();
    if (session?.portal) portalBase = session.portal;

    const res = await commandService.searchGroups('*', { limit: 100 });
    
    if (!res.success) {
      pushError(res.error || 'Failed to search groups');
      return [];
    }

    const groups = res.data?.results || [];
    
    return groups.map((group: any) => ({
      id: `${portalBase}/community/groups/${group.id}`,
      kind: 'portalGroup' as const,
      name: group.title || group.name || 'Unknown Group',
      url: `${portalBase}/community/groups/${group.id}`,
      meta: {
        id: group.id,
        description: group.description,
        owner: group.owner,
        created: group.created,
        access: group.access,
        memberCount: group.memberCount
      }
    }));
  } catch (error) {
    pushError(`Failed to load portal groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List portal items
 */
export async function listPortalItems(): Promise<Node[]> {
  try {
    let portalBase = getPortalUrl();
    const session = await getSession();
    if (session?.portal) portalBase = session.portal;

    const res = await commandService.searchItems('*', { limit: 100 });
    
    if (!res.success) {
      pushError(res.error || 'Failed to search items');
      return [];
    }

    const items = res.data?.results || [];
    
    return items.map((item: any) => ({
      id: `${portalBase}/content/items/${item.id}`,
      kind: 'portalItem' as const,
      name: item.title || item.name || 'Unknown Item',
      url: `${portalBase}/content/items/${item.id}`,
      meta: {
        id: item.id,
        type: item.type,
        typeKeywords: item.typeKeywords,
        description: item.description,
        owner: item.owner,
        created: item.created,
        modified: item.modified,
        access: item.access,
        size: item.size
      },
      childrenKind: 'portalOperation'
    }));
  } catch (error) {
    pushError(`Failed to load portal items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * List static operations for portal items
 */
export function listPortalItemOperations(idOrUrl: string): Promise<Node[]> {
  const operations = [
    { name: 'Data', id: 'data' },
    { name: 'Resources', id: 'resources' },
    { name: 'Related Items', id: 'relatedItems' },
    { name: 'Info', id: 'info' }
  ];

  const nodes: Node[] = operations.map(op => ({
    id: `${idOrUrl}/${op.id}`,
    kind: 'portalOperation' as const,
    name: op.name,
    url: `${idOrUrl}/${op.id}`,
    meta: { operation: op.id }
  }));

  return Promise.resolve(nodes);
}

/**
 * Export the command service instance for direct access if needed
 */
export { commandService };
