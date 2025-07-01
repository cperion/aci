interface FormatOptions {
  showFields?: boolean;
}

export function formatOutput(data: any, options: FormatOptions = {}): void {
  if (!data) {
    console.log('No data to display');
    return;
  }
  
  // Detect if this is layer-specific metadata or service metadata
  const isLayer = data.id !== undefined && data.parentLayer !== undefined;
  
  if (isLayer) {
    // Layer-specific formatting
    console.log('=== Layer Information ===');
    console.log(`Name: ${data.name || 'N/A'}`);
    console.log(`Description: ${data.description || 'N/A'}`);
    console.log(`Type: ${data.type || 'N/A'}`);
    console.log(`Layer ID: ${data.id || 'N/A'}`);
    console.log(`Geometry Type: ${data.geometryType || 'N/A'}`);
    if (data.supportsAdvancedQueries !== undefined) {
      console.log(`Supports Advanced Queries: ${data.supportsAdvancedQueries}`);
    }
    if (data.supportsStatistics !== undefined) {
      console.log(`Supports Statistics: ${data.supportsStatistics}`);
    }
    if (data.relationships && Array.isArray(data.relationships) && data.relationships.length > 0) {
      console.log(`Relationships: ${data.relationships.length} found`);
      data.relationships.forEach((rel: any, index: number) => {
        console.log(`   ${index + 1}. ${rel.name} (ID: ${rel.id}) → Table ${rel.relatedTableId}`);
      });
    }
    console.log('');
  } else {
    // Service-level formatting
    console.log('=== Service Information ===');
    console.log(`Name: ${data.name || 'N/A'}`);
    console.log(`Description: ${data.serviceDescription || data.description || 'N/A'}`);
    console.log(`Type: ${data.type || 'N/A'}`);
    console.log(`Max Record Count: ${data.maxRecordCount || 'N/A'}`);
    console.log(`Supports Query: ${data.supportsQuery || 'N/A'}`);
    console.log('');
  }
  
  // Layer information
  if (data.layers && Array.isArray(data.layers)) {
    console.log('=== Layers ===');
    data.layers.forEach((layer: any, index: number) => {
      console.log(`${index}: ${layer.name} (ID: ${layer.id})`);
      if (layer.type) console.log(`   Type: ${layer.type}`);
      if (layer.geometryType) console.log(`   Geometry: ${layer.geometryType}`);
    });
    console.log('');
  }
  
  // Field information
  if (options.showFields && data.fields && Array.isArray(data.fields)) {
    console.log('=== Fields ===');
    data.fields.forEach((field: any) => {
      console.log(`${field.name}: ${field.type}`);
      if (field.alias && field.alias !== field.name) {
        console.log(`   Alias: ${field.alias}`);
      }
      if (field.length) {
        console.log(`   Length: ${field.length}`);
      }
    });
    console.log('');
  }
}

export function formatServiceTable(services: any[]): string {
  if (!services || services.length === 0) {
    return 'No services found.';
  }

  // Calculate column widths
  const nameWidth = Math.max(12, Math.max(...services.map(s => s.serviceName.length)));
  const typeWidth = Math.max(8, Math.max(...services.map(s => s.type.length)));
  const statusWidth = 10;
  const folderWidth = Math.max(8, Math.max(...services.map(s => (s.folder || 'Root').length)));

  // Create header
  const header = 
    'NAME'.padEnd(nameWidth) + ' | ' +
    'TYPE'.padEnd(typeWidth) + ' | ' +
    'STATUS'.padEnd(statusWidth) + ' | ' +
    'FOLDER'.padEnd(folderWidth);
  
  const separator = '-'.repeat(header.length);

  // Create rows
  const rows = services.map(service => {
    const status = service.status === 'STARTED' ? '✓ Started' : 
                   service.status === 'STOPPED' ? '○ Stopped' :
                   service.status === 'FAILED' ? '✗ Failed' :
                   service.status || 'Unknown';
    
    return (
      service.serviceName.padEnd(nameWidth) + ' | ' +
      service.type.padEnd(typeWidth) + ' | ' +
      status.padEnd(statusWidth) + ' | ' +
      (service.folder || 'Root').padEnd(folderWidth)
    );
  });

  return [header, separator, ...rows].join('\n');
}

export function formatServiceStatus(serviceInfo: any): string {
  const lines = [
    '=== Service Status ===',
    `Name: ${serviceInfo.serviceName}`,
    `Type: ${serviceInfo.type}`,
    `Status: ${serviceInfo.status}`,
    `Provider: ${serviceInfo.provider || 'N/A'}`,
  ];

  if (serviceInfo.description) {
    lines.push(`Description: ${serviceInfo.description}`);
  }

  if (serviceInfo.folder) {
    lines.push(`Folder: ${serviceInfo.folder}`);
  }

  if (serviceInfo.instances) {
    lines.push('=== Instance Information ===');
    lines.push(`Running Instances: ${serviceInfo.instances.running}`);
    lines.push(`Min Instances: ${serviceInfo.instances.min}`);
    lines.push(`Max Instances: ${serviceInfo.instances.max}`);
  }

  if (serviceInfo.configuredState && serviceInfo.realTimeState) {
    lines.push('=== State Information ===');
    lines.push(`Configured State: ${serviceInfo.configuredState}`);
    lines.push(`Real-time State: ${serviceInfo.realTimeState}`);
  }

  return lines.join('\n');
}

export function formatQueryResults(results: any): void {
  if (!results || !results.features) {
    console.log('No features found');
    return;
  }
  
  const features = results.features;
  console.log(`Found ${features.length} feature(s)`);
  console.log('');
  
  if (features.length === 0) {
    return;
  }
  
  // Show first few features in a readable format
  features.slice(0, 5).forEach((feature: any, index: number) => {
    console.log(`=== Feature ${index + 1} ===`);
    
    if (feature.attributes) {
      Object.entries(feature.attributes).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
    if (feature.geometry) {
      console.log(`Geometry Type: ${feature.geometry.type || 'N/A'}`);
    }
    
    console.log('');
  });
  
  if (features.length > 5) {
    console.log(`... and ${features.length - 5} more features`);
    console.log('Use --json flag to see all results');
  }
}