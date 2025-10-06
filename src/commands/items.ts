import { getSession } from '../session.js';
import { formatItem, formatItemsTable } from '../utils/output.js';
import { findItems, getItem, shareItem } from '../core/portal.js';
import { handlePortalError } from '../utils/portal-utils.js';

export async function findItemsCommand(query: string, options: any): Promise<void> {
  try {
    const results = await findItems({
      query,
      type: options.type,
      owner: options.owner,
      limit: options.limit ? parseInt(options.limit) : undefined
    });
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatItemSearchResults(results);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'search items', options);
  }
}

export async function getItemCommand(itemId: string, options: any): Promise<void> {
  try {
    const item = await getItem(itemId);
    
    if (options.json) {
      console.log(JSON.stringify(item, null, 2));
    } else {
      formatItemDetails(item);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'get item details', options);
  }
}

export async function shareItemCommand(itemId: string, options: any): Promise<void> {
  try {
    if (!options.groups && !options.org && !options.public) {
      console.error('Must specify sharing target: --groups, --org, or --public');
      process.exit(1);
    }

    const shareParams: any = {
      itemId
    };

    if (options.groups) {
      shareParams.groups = options.groups.split(',').map((id: string) => id.trim());
    }
    if (options.org) {
      shareParams.org = true;
    }
    if (options.public) {
      shareParams.public = true;
    }

    const result = await shareItem(shareParams);
    
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
  } catch (error: unknown) {
    handlePortalError(error, 'share item', options);
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