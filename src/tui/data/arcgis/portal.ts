import type { Node, NodeKind } from '../types';
import { fetchJson, createNode } from './server';

/**
 * List ArcGIS Portal root entry points
 */
export async function listPortalRoot(host: string): Promise<Node[]> {
  const rootUrl = host.endsWith('/sharing/rest') ? host : `${host}/sharing/rest`;
  
  const nodes: Node[] = [
    createNode('portalUsers', 'Users', `${rootUrl}/users`, {}, 'portalUser'),
    createNode('portalGroups', 'Groups', `${rootUrl}/groups`, {}, 'portalGroup'),
    createNode('portalItems', 'Items', `${rootUrl}/content/items`, {}, 'portalItem'),
  ];

  return nodes;
}

/**
 * List portal users
 */
export async function listPortalUsers(host: string): Promise<Node[]> {
  const rootUrl = host.endsWith('/sharing/rest') ? host : `${host}/sharing/rest`;
  const usersUrl = `${rootUrl}/users`;
  
  const data = await fetchJson(usersUrl);
  const nodes: Node[] = [];

  if (data.users && Array.isArray(data.users)) {
    for (const user of data.users) {
      const userUrl = `${usersUrl}/${user.username}`;
      nodes.push(createNode(
        'portalUser',
        user.username,
        userUrl,
        { 
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        'portalItems'
      ));
    }
  }

  return nodes;
}

/**
 * List items owned by a user
 */
export async function listPortalUserItems(url: string): Promise<Node[]> {
  const data = await fetchJson(url);
  const nodes: Node[] = [];

  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      const itemUrl = `${url}/items/${item.id}`;
      nodes.push(createNode(
        'portalItem',
        item.title || item.id,
        itemUrl,
        { 
          id: item.id,
          type: item.type,
          owner: item.owner,
          modified: item.modified
        },
        'portalOperation'
      ));
    }
  }

  return nodes;
}

/**
 * List portal groups
 */
export async function listPortalGroups(host: string): Promise<Node[]> {
  const rootUrl = host.endsWith('/sharing/rest') ? host : `${host}/sharing/rest`;
  const groupsUrl = `${rootUrl}/groups`;
  
  const data = await fetchJson(groupsUrl);
  const nodes: Node[] = [];

  if (data.groups && Array.isArray(data.groups)) {
    for (const group of data.groups) {
      const groupUrl = `${groupsUrl}/${group.id}`;
      nodes.push(createNode(
        'portalGroup',
        group.title || group.id,
        groupUrl,
        { 
          id: group.id,
          owner: group.owner,
          description: group.description
        }
      ));
    }
  }

  return nodes;
}

/**
 * List portal items
 */
export async function listPortalItems(host: string): Promise<Node[]> {
  const rootUrl = host.endsWith('/sharing/rest') ? host : `${host}/sharing/rest`;
  const itemsUrl = `${rootUrl}/content/items`;
  
  const data = await fetchJson(itemsUrl);
  const nodes: Node[] = [];

  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      const itemUrl = `${itemsUrl}/${item.id}`;
      nodes.push(createNode(
        'portalItem',
        item.title || item.id,
        itemUrl,
        { 
          id: item.id,
          type: item.type,
          owner: item.owner,
          modified: item.modified
        },
        'portalOperation'
      ));
    }
  }

  return nodes;
}

/**
 * List operations for a portal item
 */
export async function listPortalItemOperations(idOrUrl: string): Promise<Node[]> {
  // If it's just an ID, construct the URL
  const url = idOrUrl.startsWith('http') ? idOrUrl : `https://portal.arcgis.com/sharing/rest/content/items/${idOrUrl}`;
  
  const operations = [
    { name: 'data', description: 'Get item data' },
    { name: 'resources', description: 'Get item resources' },
    { name: 'relatedItems', description: 'Get related items' },
    { name: 'info', description: 'Get item info' },
  ];

  return operations.map(op => 
    createNode(
      'portalOperation',
      op.name,
      `${url}/${op.name}`,
      { description: op.description }
    )
  );
}