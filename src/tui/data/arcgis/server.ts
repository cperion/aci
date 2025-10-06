import type { Node, NodeKind } from '../types';

/**
 * Generic fetch wrapper for ArcGIS REST endpoints
 */
export async function fetchJson(url: string, opts?: { signal?: AbortSignal; headers?: Record<string, string> }): Promise<any> {
  const separator = url.includes('?') ? '&' : '?';
  const jsonUrl = `${url}${separator}f=json`;
  
  const response = await fetch(jsonUrl, {
    signal: opts?.signal,
    headers: {
      'Accept': 'application/json',
      ...opts?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || `ArcGIS Error: ${data.error.code}`);
  }

  return data;
}

/**
 * Create a node with common properties
 */
function createNode(
  kind: NodeKind,
  name: string,
  url: string,
  meta?: Record<string, unknown>,
  childrenKind?: NodeKind
): Node {
  return {
    id: url,
    kind,
    name,
    url,
    meta,
    childrenKind,
    childrenLoaded: false,
  };
}

/**
 * List ArcGIS Server root (folders and services)
 */
export async function listServerRoot(host: string): Promise<Node[]> {
  const rootUrl = host.endsWith('/rest/services') ? host : `${host}/rest/services`;
  const data = await fetchJson(rootUrl);

  const nodes: Node[] = [];

  // Add folders
  if (data.folders && Array.isArray(data.folders)) {
    for (const folder of data.folders) {
      const folderUrl = `${rootUrl}/${folder}`;
      nodes.push(createNode('serverFolder', folder, folderUrl, {}, 'serverService'));
    }
  }

  // Add services
  if (data.services && Array.isArray(data.services)) {
    for (const service of data.services) {
      const [serviceName, serviceType] = service.name.split('.');
      const serviceUrl = `${rootUrl}/${service.name}`;
      nodes.push(createNode(
        'serverService',
        serviceName,
        serviceUrl,
        { type: serviceType },
        serviceType === 'MapServer' ? 'serverLayer' : 'serverTable'
      ));
    }
  }

  return nodes;
}

/**
 * List services in a Server folder
 */
export async function listServerFolder(url: string): Promise<Node[]> {
  const data = await fetchJson(url);

  const nodes: Node[] = [];

  if (data.services && Array.isArray(data.services)) {
    for (const service of data.services) {
      const [serviceName, serviceType] = service.name.split('.');
      const serviceUrl = `${url}/${service.name}`;
      nodes.push(createNode(
        'serverService',
        serviceName,
        serviceUrl,
        { type: serviceType },
        serviceType === 'MapServer' ? 'serverLayer' : 'serverTable'
      ));
    }
  }

  return nodes;
}

/**
 * List layers and tables in a service
 */
export async function listServiceChildren(url: string): Promise<Node[]> {
  const data = await fetchJson(url);

  const nodes: Node[] = [];

  // Add layers
  if (data.layers && Array.isArray(data.layers)) {
    for (const layer of data.layers) {
      const layerUrl = `${url}/${layer.id}`;
      nodes.push(createNode(
        'serverLayer',
        layer.name || `Layer ${layer.id}`,
        layerUrl,
        { 
          id: layer.id,
          geometryType: layer.geometryType,
          type: layer.type
        },
        'serverOperation'
      ));
    }
  }

  // Add tables
  if (data.tables && Array.isArray(data.tables)) {
    for (const table of data.tables) {
      const tableUrl = `${url}/${table.id}`;
      nodes.push(createNode(
        'serverTable',
        table.name || `Table ${table.id}`,
        tableUrl,
        { 
          id: table.id,
          type: table.type
        },
        'serverOperation'
      ));
    }
  }

  return nodes;
}

/**
 * List operations for a layer or table
 */
export async function listLayerOperations(url: string): Promise<Node[]> {
  const operations = [
    { name: 'query', description: 'Query features' },
    { name: 'queryRelatedRecords', description: 'Query related records' },
    { name: 'statistics', description: 'Calculate statistics' },
    { name: 'metadata', description: 'Get metadata' },
  ];

  return operations.map(op => 
    createNode(
      'serverOperation',
      op.name,
      `${url}/${op.name}`,
      { description: op.description }
    )
  );
}

export { createNode };