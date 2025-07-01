/**
 * Data Store Output Formatting Utilities
 * Concise, consistent formatting for datastore operations
 */

import type { DataStoreInfo, HealthReport, MachineStatus, BackupStatus } from '../types/datastore.js';

/**
 * Format list of data stores in table format
 */
export function formatDatastoreList(stores: DataStoreInfo[]): string {
  if (stores.length === 0) {
    return 'No registered data stores found';
  }

  const header = 'NAME                 TYPE        STATUS              MACHINES';
  const separator = '='.repeat(65);
  
  const rows = stores.map(store => {
    const name = store.name.padEnd(20);
    const type = store.type.toUpperCase().padEnd(11);
    const status = formatStatusWithColor(store.status).padEnd(26); // Account for ANSI codes
    const machines = `${store.machineCount || 0} machine(s)`;
    return `${name} ${type} ${status} ${machines}`;
  });

  return [header, separator, ...rows, '', `Total: ${stores.length} data store(s)`].join('\n');
}

/**
 * Format health report with optional detailed view
 */
export function formatHealthReport(report: HealthReport, detailed: boolean = false): string {
  const header = `DataStore: ${report.name} [${report.type}]`;
  const statusLine = `Status: ${formatStatusWithColor(report.status)}`;
  
  if (!detailed) {
    const lastValidated = `Last Validated: ${formatTimestamp(report.lastValidated)}`;
    const machineCount = `Machines: ${report.machines.length}`;
    return [header, statusLine, lastValidated, machineCount].join('\n');
  }

  const sections = [
    header,
    '='.repeat(50),
    statusLine,
    `Overall Health: ${report.overallHealth}`,
    `Last Validated: ${formatTimestamp(report.lastValidated)}`,
    '',
    'Machines:',
    ...report.machines.map(machine => formatMachineStatus(machine)),
  ];

  if (report.warnings && report.warnings.length > 0) {
    sections.push('', 'Warnings:', ...report.warnings.map(w => `⚠ ${w}`));
  }

  if (report.recommendations && report.recommendations.length > 0) {
    sections.push('', 'Recommendations:', ...report.recommendations.map(r => `💡 ${r}`));
  }

  return sections.join('\n');
}

/**
 * Format machine status for detailed health report
 */
export function formatMachineStatus(machine: MachineStatus): string {
  const status = formatStatusWithColor(machine.status);
  const role = machine.role.padEnd(10);
  let details = '';

  if (machine.databaseStatus) {
    details += ` | DB: ${machine.databaseStatus}`;
  }
  
  if (machine.replicationStatus && machine.replicationStatus !== 'NotApplicable') {
    details += ` | Repl: ${machine.replicationStatus}`;
  }
  
  if (machine.diskUsage?.dataDirectory) {
    details += ` | Disk: ${machine.diskUsage.dataDirectory}`;
  }

  if (machine.version) {
    details += ` | v${machine.version}`;
  }

  return `  ${machine.machineName} [${role}] ${status}${details}`;
}

/**
 * Format backup status information
 */
export function formatBackupStatus(backup: BackupStatus): string {
  const sections = [
    'Backup Status',
    '='.repeat(30)
  ];

  if (backup.lastFullBackup) {
    sections.push(`Last Full Backup: ${formatTimestamp(backup.lastFullBackup)}`);
  } else {
    sections.push('Last Full Backup: Never');
  }

  if (backup.lastIncrementalBackup) {
    sections.push(`Last Incremental: ${formatTimestamp(backup.lastIncrementalBackup)}`);
  }

  if (backup.lastRestore) {
    sections.push(`Last Restore: ${formatTimestamp(backup.lastRestore)}`);
  }

  sections.push(`Backup Mode: ${backup.backupMode ? '🔄 Active' : '⏸ Inactive'}`);

  if (backup.availableBackups && backup.availableBackups.length > 0) {
    sections.push('', `Available Backups: ${backup.availableBackups.length}`);
    
    // Show most recent 3 backups
    const recentBackups = backup.availableBackups
      .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())
      .slice(0, 3);
      
    for (const backup of recentBackups) {
      const status = backup.valid ? '✓' : '✗';
      const size = backup.size ? ` (${backup.size})` : '';
      sections.push(`  ${status} ${backup.backupId} - ${formatTimestamp(backup.creationTime)}${size}`);
    }
  } else {
    sections.push('', 'Available Backups: None');
  }

  return sections.join('\n');
}

/**
 * Format machine list for machines command
 */
export function formatMachineList(storeName: string, machines: MachineStatus[]): string {
  if (machines.length === 0) {
    return `No machines found for data store: ${storeName}`;
  }

  const header = `Machines for DataStore: ${storeName}`;
  const separator = '='.repeat(header.length);
  
  const tableHeader = 'MACHINE                  ROLE        STATUS              DETAILS';
  const tableSeparator = '-'.repeat(70);

  const rows = machines.map(machine => {
    const name = machine.machineName.padEnd(24);
    const role = machine.role.padEnd(11);
    const status = formatStatusWithColor(machine.status).padEnd(26); // Account for ANSI codes
    
    let details = '';
    if (machine.databaseStatus) {
      details = `DB: ${machine.databaseStatus}`;
    }
    if (machine.replicationStatus && machine.replicationStatus !== 'NotApplicable') {
      details += details ? ` | Repl: ${machine.replicationStatus}` : `Repl: ${machine.replicationStatus}`;
    }
    
    return `${name} ${role} ${status} ${details}`;
  });

  return [header, separator, '', tableHeader, tableSeparator, ...rows].join('\n');
}

/**
 * Format status with color coding
 */
function formatStatusWithColor(status: string): string {
  switch (status) {
    case 'Healthy':
      return '\x1b[32m✓ Healthy\x1b[0m';
    case 'HealthyWithWarning':
      return '\x1b[33m⚠ With Warnings\x1b[0m';
    case 'Unhealthy':
      return '\x1b[31m✗ Unhealthy\x1b[0m';
    default:
      return status;
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${date.toLocaleDateString()} (${diffDays} day${diffDays > 1 ? 's' : ''} ago)`;
    } else if (diffHours > 0) {
      return `${date.toLocaleTimeString()} (${diffHours} hour${diffHours > 1 ? 's' : ''} ago)`;
    } else {
      return `${date.toLocaleTimeString()} (recent)`;
    }
  } catch (error) {
    return timestamp;
  }
}

/**
 * Format error message with recovery actions
 */
export function formatDatastoreError(error: Error, recoveryActions?: string[]): string {
  let message = `Error: ${error.message}`;
  
  if (recoveryActions && recoveryActions.length > 0) {
    message += '\n\nSuggested actions:';
    for (const action of recoveryActions) {
      message += `\n• ${action}`;
    }
  }
  
  return message;
}