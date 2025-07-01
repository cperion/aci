/**
 * Unified Report Types
 * Combines service metadata with infrastructure health for integrated analysis
 */

import type { DataStoreInfo, HealthReport } from './datastore.js';

export interface ServiceMetadata {
  name: string;
  type: string;
  url: string;
  description?: string;
  capabilities?: string[];
  spatialReference?: {
    wkid?: number;
    latestWkid?: number;
    wkt?: string;
  };
  extent?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    spatialReference: any;
  };
  fields?: Array<{
    name: string;
    type: string;
    alias?: string;
    domain?: any;
  }>;
  relationships?: Array<{
    id: number;
    name: string;
    relatedTableId: number;
    cardinality: string;
  }>;
  lastEditDate?: number;
  maxRecordCount?: number;
  supportedQueryFormats?: string;
  hasStaticData?: boolean;
}

export interface DataQualityMetrics {
  recordCount?: number;
  spatialExtent?: {
    xmin: number;
    ymin: number; 
    xmax: number;
    ymax: number;
  };
  geometryValidation?: {
    totalGeometries: number;
    validGeometries: number;
    invalidGeometries: number;
    nullGeometries: number;
  };
  attributeCompleteness?: Record<string, {
    totalRecords: number;
    nonNullRecords: number;
    completenessPercent: number;
  }>;
  lastUpdate?: string;
  performanceMetrics?: {
    avgResponseTime?: number;
    maxRecordCount: number;
    indexesPresent: boolean;
  };
}

export interface InfrastructureAnalysis {
  correlation: {
    method: 'direct' | 'heuristic' | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  datastore?: DataStoreInfo;
  health?: HealthReport;
  recommendations: string[];
  alerts: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    action?: string;
  }>;
}

export interface UnifiedInspectionReport {
  service: ServiceMetadata;
  dataQuality?: DataQualityMetrics;
  infrastructure?: InfrastructureAnalysis;
  reportGenerated: string;
  analysisType: 'basic' | 'with-infrastructure' | 'troubleshoot' | 'compliance';
  summary: {
    overallStatus: 'healthy' | 'warning' | 'error';
    keyFindings: string[];
    actionItems: string[];
  };
}

export interface ComplianceReport extends UnifiedInspectionReport {
  compliance: {
    dataGovernance: {
      schemaDocumented: boolean;
      fieldsDocumented: boolean;
      metadataComplete: boolean;
    };
    dataQuality: {
      geometryValidation: 'pass' | 'fail' | 'warning';
      attributeCompleteness: 'pass' | 'fail' | 'warning';
      temporalConsistency: 'pass' | 'fail' | 'warning';
    };
    infrastructure: {
      backupRecency: 'pass' | 'fail' | 'warning';
      highAvailability: 'pass' | 'fail' | 'warning';
      performanceBaseline: 'pass' | 'fail' | 'warning';
    };
    overallScore: number; // 0-100
    certificationDate: string;
  };
}

export interface TroubleshootingReport extends UnifiedInspectionReport {
  troubleshooting: {
    performanceIssues: Array<{
      issue: string;
      severity: 'low' | 'medium' | 'high';
      possibleCauses: string[];
      diagnosticCommands: string[];
      remediationSteps: string[];
    }>;
    infrastructureIssues: Array<{
      component: 'service' | 'datastore' | 'network' | 'configuration';
      issue: string;
      impact: string;
      resolution: string;
    }>;
    nextSteps: string[];
  };
}