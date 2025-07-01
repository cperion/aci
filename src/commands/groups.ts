import { getSession } from '../session.js';
import { formatGroup, formatGroupsTable } from '../utils/output.js';

export async function findGroupsCommand(query: string, options: any): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.error('Not authenticated. Please run: aci login');
      process.exit(1);
    }
    
    const searchOptions = {
      q: query,
      num: parseInt(options.limit || '10'),
      authentication: session
    };

    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to search groups
    const url = `${sharingRestUrl}/community/groups`;
    const params = new URLSearchParams({
      q: searchOptions.q,
      num: searchOptions.num.toString(),
      f: 'json',
      token: session.token
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const results = await response.json();
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatGroupSearchResults(results);
    }
  } catch (error: any) {
    console.error(`Failed to search groups: ${error.message}`);
    process.exit(1);
  }
}

export async function createGroupCommand(title: string, options: any): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.error('Not authenticated. Please run: aci login');
      process.exit(1);
    }
    
    const groupOptions = {
      group: {
        title,
        access: options.access || 'private',
        description: options.description || `Group created by ACI on ${new Date().toISOString()}`
      },
      authentication: session
    };

    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to create group
    const url = `${sharingRestUrl}/community/createGroup`;
    const formData = new URLSearchParams({
      title: groupOptions.group.title,
      access: groupOptions.group.access,
      description: groupOptions.group.description,
      f: 'json',
      token: session.token
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const groupId = result.group?.id || result.groupId;
      console.log(`\u2022 ${title} (${options.access || 'private'})`);
      console.log(`  id: ${groupId}`);
      console.log(`  url: ${session.portal}/home/group.html?id=${groupId}`);
      console.log(`  \u2713 Created successfully`);
    }
  } catch (error: any) {
    console.error(`Failed to create group: ${error.message}`);
    process.exit(1);
  }
}

export async function getGroupCommand(groupId: string, options: any): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.error('Not authenticated. Please run: aci login');
      process.exit(1);
    }
    
    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to get group details
    const url = `${sharingRestUrl}/community/groups/${groupId}`;
    const params = new URLSearchParams({
      f: 'json',
      token: session.token
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const group = await response.json();
    
    if (options.json) {
      console.log(JSON.stringify(group, null, 2));
    } else {
      formatGroupDetails(group);
    }
  } catch (error: any) {
    console.error(`Failed to get group details: ${error.message}`);
    process.exit(1);
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