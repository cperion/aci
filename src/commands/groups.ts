import { getSession } from '../session.js';
import { formatGroup, formatGroupsTable } from '../utils/output.js';
import { findGroups, getGroup, createGroup } from '../core/portal.js';
import { handlePortalError } from '../utils/portal-utils.js';

export async function findGroupsCommand(query: string, options: any): Promise<void> {
  try {
    const results = await findGroups({
      query,
      limit: options.limit ? parseInt(options.limit) : undefined
    });
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatGroupSearchResults(results);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'search groups', options);
  }
}

export async function createGroupCommand(title: string, options: any): Promise<void> {
  try {
    const result = await createGroup({
      title,
      access: options.access,
      description: options.description
    });
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const groupId = result.group?.id || result.groupId;
      console.log(`\u2022 ${title} (${options.access || 'private'})`);
      console.log(`  id: ${groupId}`);
      console.log(`  url: ${(await getSession())?.portal}/home/group.html?id=${groupId}`);
      console.log(`  \u2713 Created successfully`);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'create group', options);
  }
}

export async function getGroupCommand(groupId: string, options: any): Promise<void> {
  try {
    const group = await getGroup(groupId);
    
    if (options.json) {
      console.log(JSON.stringify(group, null, 2));
    } else {
      formatGroupDetails(group);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'get group details', options);
  }
}

function formatGroupSearchResults(results: any): void {
  console.log(`\u2500 Groups (${results.results.length} of ${results.total})\n`);
  
  if (results.results.length > 3) {
    console.log(formatGroupsTable(results.results));
  } else {
    results.results.forEach((group: any) => {
      console.log(formatGroup(group));
    });
  }
}

function formatGroupDetails(group: any): void {
  console.log(formatGroup(group));
  
  // Additional details
  console.log(`  created: ${group.created ? new Date(group.created).toLocaleDateString() : 'unknown'} | modified: ${group.modified ? new Date(group.modified).toLocaleDateString() : 'unknown'}`);
  console.log(`  owner: ${group.owner} | membership: ${group.membershipAccess || 'not-set'}`);
  
  if (group.thumbnail) {
    console.log(`  thumbnail: ${group.thumbnail}`);
  }
}