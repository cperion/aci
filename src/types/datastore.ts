/**
 * Data Store Type Definitions
 * Comprehensive type system for ArcGIS Data Store management
 */

export type DataStoreType = 
  | 'enterprise'      // Enterprise databases (PostgreSQL, SQL Server, Oracle, etc.)
  | 'cloud'           // Cloud stores (S3, Azure Blob, Google Cloud, etc.)  
  | 'relational'      // ArcGIS Relational Data Store
  | 'tileCache'       // ArcGIS Tile Cache Data Store
  | 'spatiotemporal'  // ArcGIS Spatiotemporal Big Data Store
  | 'graph'           // ArcGIS Graph Store
  | 'object'          // ArcGIS Object Store
  | 'fileShare'       // File shares and network folders
  | 'raster';         // Raster stores

export type DataStoreStatus = 'Healthy' | 'Unhealthy' | 'HealthyWithWarning';

export type MachineRole = 'PRIMARY' | 'STANDBY' | 'MEMBER' | 'CLOUD_STORE';

export interface DataStoreInfo {
  name: string;
  type: DataStoreType;
  provider?: string;        // PostgreSQL, S3, Azure, etc.
  status: DataStoreStatus;
  path: string;            // REST API path
  onServerStart: boolean;
  isManaged: boolean;
  connectionStatus?: string;
  machineCount?: number;
}

export interface MachineStatus {
  machineName: string;
  role: MachineRole;
  status: DataStoreStatus;
  version?: string;
  databaseStatus?: 'Active' | 'Inactive' | 'Connecting';
  replicationStatus?: 'InSync' | 'OutOfSync' | 'NotApplicable';
  lastSyncTime?: string;
  diskUsage?: {
    dataDirectory: string;
    logDirectory?: string;
    tempDirectory?: string;
  };
  warnings?: string[];
}

export interface HealthReport {
  name: string;
  type: DataStoreType;
  status: DataStoreStatus;
  machines: MachineStatus[];
  lastValidated: string;
  overallHealth: string;
  warnings?: string[];
  recommendations?: string[];
}

export interface BackupStatus {
  lastFullBackup?: string;
  lastIncrementalBackup?: string;
  lastRestore?: string;
  backupMode: boolean;
  availableBackups: BackupInfo[];
}

export interface BackupInfo {
  backupId: string;
  backupType: 'full' | 'incremental';
  creationTime: string;
  size?: string;
  valid: boolean;
  includedDataStores?: string[];
}

/**
 * Configuration for registering a new data store
 */
export interface DataStoreRegistrationConfig {
  name: string;
  type: DataStoreType;
  provider?: string;
  onServerStart?: boolean;
  isManaged?: boolean;
  connectionParams: Record<string, string>;
}

/**
 * Raw API response types for normalization
 */
export interface RawDataStoreResponse {
  rootItems: string[];
  folders?: string[];
  datastores?: Array<{
    name: string;
    type: string;
    provider?: string;
    path: string;
    onServerStart?: boolean;
    isManaged?: boolean;
  }>;
}

export interface RawHealthResponse {
  status: string;
  overallHealth?: string;
  machines?: Array<{
    machineName: string;
    role: string;
    status: string;
    version?: string;
    isClusterHealthy?: boolean;
    databaseStatus?: string;
    replicationStatus?: string;
    lastSyncTime?: string;
    diskUsage?: {
      dataDirectory?: string;
      logDirectory?: string;
      tempDirectory?: string;
    };
  }>;
  warnings?: string[];
  recommendations?: string[];
  error?: {
    code: number;
    message: string;
  };
}