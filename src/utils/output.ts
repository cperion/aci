import chalk from 'chalk';
// @ts-ignore - No types available for chalk-table
import table from 'chalk-table';

interface FormatOptions {
  showFields?: boolean;
  compact?: boolean;
  raw?: boolean;
}

// Core minimal formatting system
const formats = {
  // Visual anchors
  entity: '•',
  metadata: '─',
  separator: '≡',
  tree: '├',
  treeEnd: '└',
  // Colors
  header: chalk.blue,
  label: chalk.dim,
  value: chalk.reset,
  status: {
    active: chalk.green,
    inactive: chalk.yellow,
    error: chalk.red
  }
};

// Service formatting
export function formatService(data: any, options: FormatOptions = {}): void {
  if (!data) {
    console.log('No data to display');
    return;
  }

  const isLayer = data.id !== undefined && data.parentLayer !== undefined;
  
  if (isLayer) {
    // Layer - compact profile format
    console.log(`${formats.entity} ${formats.header(data.name || 'Unnamed Layer')} ${formats.label(`(${data.geometryType || 'Unknown'})`)}`);
    console.log(`  id: ${data.id} | type: ${data.type || 'N/A'}`);
    if (data.description) {
      console.log(`  ${formats.label('desc:')} ${data.description}`);
    }
    
    // Capabilities on one line
    const caps = [];
    if (data.supportsAdvancedQueries) caps.push('advanced-query');
    if (data.supportsStatistics) caps.push('statistics');
    if (caps.length > 0) {
      console.log(`  ${formats.label('caps:')} ${caps.join(' ≡ ')}`);
    }
    
    // Relationships
    if (data.relationships?.length > 0) {
      console.log(`  ${formats.label('relationships:')} ${data.relationships.length}`);
      data.relationships.slice(0, 3).forEach((rel: any, i: number) => {
        const prefix = i === data.relationships.length - 1 ? formats.treeEnd : formats.tree;
        console.log(`  ${prefix} ${rel.name} → ${rel.relatedTableId}`);
      });
      if (data.relationships.length > 3) {
        console.log(`  ${formats.label(`  ... +${data.relationships.length - 3} more`)}`);
      }
    }
  } else {
    // Service - header with key metrics
    console.log(`${formats.entity} ${formats.header(data.name || 'Unnamed Service')} ${formats.label(`(${data.type || 'Unknown'})`)}`);
    console.log(`  max-records: ${data.maxRecordCount || 'N/A'} | query: ${data.supportsQuery ? '✓' : '○'}`);
    if (data.serviceDescription || data.description) {
      console.log(`  ${formats.label('desc:')} ${data.serviceDescription || data.description}`);
    }
    
    // Layers table
    if (data.layers?.length > 0) {
      console.log(`\n${formats.metadata} Layers (${data.layers.length})`);
      data.layers.forEach((layer: any) => {
        console.log(`  ${layer.id.toString().padStart(2)} ${layer.name} ${formats.label(`(${layer.geometryType || layer.type || 'N/A'})`)}`); 
      });
    }
    
    // Fields - only if requested
    if (options.showFields && data.fields?.length > 0) {
      console.log(`\n${formats.metadata} Fields (${data.fields.length})`);
      data.fields.slice(0, 10).forEach((field: any) => {
        const alias = field.alias && field.alias !== field.name ? ` ${formats.label(`as ${field.alias}`)}` : '';
        const length = field.length ? ` ${formats.label(`(${field.length})`)}` : '';
        console.log(`  ${field.name}:${field.type}${alias}${length}`);
      });
      if (data.fields.length > 10) {
        console.log(`  ${formats.label(`... +${data.fields.length - 10} more fields`)}`);
      }
    }
  }
  console.log('');
}

// Legacy wrapper for backward compatibility
export function formatOutput(data: any, options: FormatOptions = {}): void {
  formatService(data, options);
}

export function formatServiceTable(services: any[]): string {
  if (!services || services.length === 0) {
    return 'No services found.';
  }

  const lines: string[] = [];
  
  services.forEach(service => {
    const status = service.status === 'STARTED' ? formats.status.active('✓') : 
                   service.status === 'STOPPED' ? formats.status.inactive('○') :
                   service.status === 'FAILED' ? formats.status.error('✗') :
                   formats.status.inactive('?');
    
    const folder = service.folder ? ` ${formats.label(`/${service.folder}`)}` : '';
    lines.push(`${formats.entity} ${service.serviceName} ${formats.label(`(${service.type})`)} ${status}${folder}`);
  });

  return lines.join('\n');
}

export function formatServiceStatus(serviceInfo: any): string {
  const status = serviceInfo.status === 'STARTED' ? formats.status.active('✓ Active') : 
                 serviceInfo.status === 'STOPPED' ? formats.status.inactive('○ Stopped') :
                 serviceInfo.status === 'FAILED' ? formats.status.error('✗ Failed') :
                 formats.status.inactive('? Unknown');
  
  const lines = [
    `${formats.entity} ${formats.header(serviceInfo.serviceName)} ${formats.label(`(${serviceInfo.type})`)} ${status}`,
    `  provider: ${serviceInfo.provider || 'N/A'}${serviceInfo.folder ? ` | folder: /${serviceInfo.folder}` : ''}`,
  ];

  if (serviceInfo.description) {
    lines.push(`  ${formats.label('desc:')} ${serviceInfo.description}`);
  }

  if (serviceInfo.instances) {
    lines.push(`  ${formats.label('instances:')} ${serviceInfo.instances.running}/${serviceInfo.instances.max} (min: ${serviceInfo.instances.min})`);
  }

  if (serviceInfo.configuredState && serviceInfo.realTimeState) {
    lines.push(`  ${formats.label('state:')} ${serviceInfo.configuredState} → ${serviceInfo.realTimeState}`);
  }

  return lines.join('\n');
}

export function formatQueryResults(results: any): void {
  if (!results || !results.features) {
    console.log('No features found');
    return;
  }
  
  const features = results.features;
  console.log(`${formats.metadata} Query Results (${features.length} features)\n`);
  
  if (features.length === 0) {
    return;
  }
  
  // Show first few features with compact formatting
  features.slice(0, 5).forEach((feature: any, index: number) => {
    console.log(`${formats.entity} ${formats.header(`Feature ${index + 1}`)}`);
    
    if (feature.attributes) {
      // Show key attributes on one line, others indented
      const attrs = Object.entries(feature.attributes);
      const keyAttrs = attrs.slice(0, 3);
      const otherAttrs = attrs.slice(3);
      
      if (keyAttrs.length > 0) {
        const keyValues = keyAttrs.map(([k, v]) => `${k}:${v}`).join(' ≡ ');
        console.log(`  ${keyValues}`);
      }
      
      if (otherAttrs.length > 0) {
        otherAttrs.forEach(([key, value]) => {
          console.log(`  ${formats.label(key)}: ${value}`);
        });
      }
    }
    
    if (feature.geometry) {
      console.log(`  ${formats.label('geometry:')} ${feature.geometry.type || 'Unknown'}`);
    }
    
    console.log('');
  });
  
  if (features.length > 5) {
    console.log(`${formats.label(`... +${features.length - 5} more features (use --json for all)`)}`);
  }
}

// Ultra-minimal table utility leveraging chalk-table/asciitable features
const minimalTable = <T extends Record<string, any>>(
  data: T[],
  columns: { field: keyof T; name: string }[],
  maxRows = 5
) => {
  // Leverage asciitable's skinny mode and custom intersection character
  const options = {
    leftPad: 0,               // No left padding for minimal aesthetic
    skinny: true,             // Trim hanging characters - saves 2 characters width
    intersectionCharacter: '─', // Use our metadata character for intersections
    columns: columns.map(col => ({
      field: col.field as string,
      name: formats.label(col.name) // Dimmed headers for minimal aesthetic
    }))
  };
  
  const tableData = data.slice(0, maxRows).map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      const value = item[col.field];
      // Format values for better readability
      row[col.field as string] = value === null || value === undefined ? 
        formats.label('─') : // Use dash for null values
        String(value).length > 25 ? String(value).substring(0, 22) + '...' : // Truncate long values
        String(value);
    });
    return row;
  });
  
  const result = table(tableData, options);
  if (data.length > maxRows) {
    return result + `\n${formats.label(`... +${data.length - maxRows} more`)}`;
  }
  return result;
};

// Helper to detect homogeneous data structure
const isHomogeneous = (data: any[]): boolean => {
  if (data.length < 2) return false;
  const firstKeys = Object.keys(data[0] || {}).sort();
  return data.every(item => {
    const keys = Object.keys(item || {}).sort();
    return keys.length === firstKeys.length && keys.every((key, i) => key === firstKeys[i]);
  });
};

// Portal entity formatters
export function formatUser(user: any): string {
  const role = user.roleId ? formats.label(`(${user.roleId})`) : '';
  const groups = user.groups ? ` | groups: ${user.groups.length}` : '';
  
  return `${formats.entity} ${formats.header(user.username)} ${role}\n` +
         `  email: ${user.email || 'N/A'}${groups}\n` +
         (user.groups?.length > 0 ? `${formats.separator}${formats.separator} ${user.groups.slice(0, 3).map((g: any) => g.title || g.id).join(` ${formats.separator} `)}\n` : '');
}

// Table formatters for larger datasets
export function formatUsersTable(users: any[]): string {
  if (users.length <= 3) {
    return users.map(formatUser).join('');
  }
  
  return minimalTable(users, [
    { field: 'username', name: 'user' },
    { field: 'role', name: 'role' },
    { field: 'email', name: 'email' }
  ]);
}

export function formatGroup(group: any): string {
  const access = group.access ? formats.label(`(${group.access})`) : '';
  const members = group.memberCount ? ` | members: ${group.memberCount}` : '';
  
  return `${formats.entity} ${formats.header(group.title)} ${access}\n` +
         `  id: ${group.id}${members}\n` +
         (group.description ? `  ${formats.label('desc:')} ${group.description}\n` : '') +
         (group.tags?.length > 0 ? `  ${formats.label('tags:')} ${group.tags.join(', ')}\n` : '');
}

export function formatGroupsTable(groups: any[]): string {
  if (groups.length <= 3) {
    return groups.map(formatGroup).join('');
  }
  
  return minimalTable(groups, [
    { field: 'title', name: 'title' },
    { field: 'access', name: 'access' },
    { field: 'owner', name: 'owner' }
  ]);
}

export function formatItem(item: any): string {
  const type = item.type ? formats.label(`(${item.type})`) : '';
  const owner = item.owner ? ` | owner: ${item.owner}` : '';
  const views = item.numViews ? ` | views: ${item.numViews}` : '';
  
  return `${formats.entity} ${formats.header(item.title)} ${type}\n` +
         `  id: ${item.id}${owner}${views}\n` +
         (item.snippet ? `  ${formats.label('desc:')} ${item.snippet}\n` : '') +
         (item.tags?.length > 0 ? `  ${formats.label('tags:')} ${item.tags.join(', ')}\n` : '');
}

export function formatItemsTable(items: any[]): string {
  if (items.length <= 3) {
    return items.map(formatItem).join('');
  }
  
  return minimalTable(items, [
    { field: 'title', name: 'title' },
    { field: 'type', name: 'type' },
    { field: 'owner', name: 'owner' }
  ]);
}