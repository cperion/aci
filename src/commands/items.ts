import { getSession } from '../session.js';
import { formatItem, formatItemsTable } from '../utils/output.js';

export async function findItemsCommand(query: string, options: any): Promise<void> {
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

    if (options.type) {
      searchOptions.q += ` AND type:"${options.type}"`;
    }

    if (options.owner) {
      searchOptions.q += ` AND owner:${options.owner}`;
    }

    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to search items
    const url = `${sharingRestUrl}/search`;
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
      formatItemSearchResults(results);
    }
  } catch (error: any) {
    console.error(`Failed to search items: ${error.message}`);
    process.exit(1);
  }
}

export async function getItemCommand(itemId: string, options: any): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.error('Not authenticated. Please run: aci login');
      process.exit(1);
    }
    
    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to get item details
    const url = `${sharingRestUrl}/content/items/${itemId}`;
    const params = new URLSearchParams({
      f: 'json',
      token: session.token
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const item = await response.json();
    
    if (options.json) {
      console.log(JSON.stringify(item, null, 2));
    } else {
      formatItemDetails(item);
    }
  } catch (error: any) {
    console.error(`Failed to get item details: ${error.message}`);
    process.exit(1);
  }
}

export async function shareItemCommand(itemId: string, options: any): Promise<void> {
  try {
    const session = await getSession();
    if (!session) {
      console.error('Not authenticated. Please run: aci login');
      process.exit(1);
    }
    
    if (!options.groups && !options.org && !options.public) {
      console.error('Must specify sharing target: --groups, --org, or --public');
      process.exit(1);
    }

    const shareOptions: any = {
      id: itemId,
      authentication: session
    };

    if (options.groups) {
      const groupIds = options.groups.split(',').map((id: string) => id.trim());
      shareOptions.groups = groupIds;
    }

    if (options.org) {
      shareOptions.org = true;
    }

    if (options.public) {
      shareOptions.everyone = true;
    }

    // Build the sharing REST URL from the session portal
    const sharingRestUrl = `${session.portal}/portal/sharing/rest`;
    
    // Direct REST API call to share item
    const url = `${sharingRestUrl}/content/users/${session.username}/items/${itemId}/share`;
    const formData = new URLSearchParams({
      f: 'json',
      token: session.token
    });

    if (shareOptions.groups) {
      formData.append('groups', shareOptions.groups.join(','));
    }
    if (shareOptions.org) {
      formData.append('org', 'true');
    }
    if (shareOptions.everyone) {
      formData.append('everyone', 'true');
    }

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
      const sharing = [];
      if (options.groups) sharing.push(`groups: ${options.groups}`);
      if (options.org) sharing.push('organization');
      if (options.public) sharing.push('public');
      
      console.log(`\u2022 ${itemId}`);
      console.log(`  sharing: ${sharing.join(' \u2261 ')}`);
      console.log(`  \u2713 Updated successfully`);
    }
  } catch (error: any) {
    console.error(`Failed to share item: ${error.message}`);
    process.exit(1);
  }
}

function formatItemSearchResults(results: any): void {
  console.log(`\u2500 Items (${results.results.length} of ${results.total})\n`);
  
  if (results.results.length > 3) {
    console.log(formatItemsTable(results.results));
  } else {
    results.results.forEach((item: any) => {
      console.log(formatItem(item));
    });
  }
}

function formatItemDetails(item: any): void {
  console.log(formatItem(item));
  
  // Additional details
  console.log(`  created: ${item.created ? new Date(item.created).toLocaleDateString() : 'unknown'} | modified: ${item.modified ? new Date(item.modified).toLocaleDateString() : 'unknown'}`);
  console.log(`  access: ${item.access || 'private'}`);
  
  if (item.url) {
    console.log(`  service-url: ${item.url}`);
  }
  
  if (item.thumbnail) {
    console.log(`  thumbnail: ${item.thumbnail}`);
  }
  
  if (item.description) {
    console.log(`  \u2500 Description`);
    console.log(`    ${item.description}`);
  }
}