import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { detectServiceType, validateUrl } from '../services/validator.js';
import { inspectService, getServiceDirectory, getLayerInfo } from '../core/server.js';
import { getFederatedToken, isServerFederated } from '../services/federation.js';
import { handleError } from '../errors/handler.js';
import { formatService } from '../utils/output.js';
import { resolveServiceDatastore } from '../services/datastore-resolver.js';
import type { UnifiedInspectionReport, ServiceMetadata, InfrastructureAnalysis } from '../types/unified-report.js';

interface InspectOptions {
  json?: boolean;
  fields?: boolean;
  env?: Environment;
  withInfrastructure?: boolean;
  troubleshoot?: boolean;
  complianceReport?: boolean;
}

export async function inspectCommand(url: string, options: InspectOptions): Promise<void> {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    
    // Detect service type
    const serviceType = detectServiceType(url);
    console.log(`Detected service type: ${serviceType}`);
    
    // Get session for authentication (optional for public services)
    const session = await getSession(options.env);
    console.log(session ? `Using authenticated session for ${session.username}` : 'Attempting unauthenticated request...');
    
    // Handle federated authentication for ArcGIS Server (only if authenticated)
    let authSession = session;
    
    if (session) {
      const serverUrl = new URL(url).origin;
      
      // Check if this is a different server that might need federation
      if (serverUrl !== new URL(session.portal).origin) {
        const isFederated = await isServerFederated(session.portal, serverUrl);
        if (isFederated) {
          console.log(`Obtaining federated token for ${serverUrl}...`);
          try {
            const federatedToken = await getFederatedToken(session, serverUrl);
            // Create a new session with the federated token for this server
            authSession = new (session.constructor as any)({
              portal: session.portal,
              token: federatedToken,
              tokenExpires: session.tokenExpires,
              username: session.username
            });
          } catch (error) {
            console.warn(`Federation failed, using portal token: ${(error as Error).message}`);
          }
        }
      }
    }
    
    // Get service information
    let serviceInfo;
    switch (serviceType) {
      case 'feature-service':
      case 'map-service':
        serviceInfo = await inspectService(url, authSession || undefined);
        break;
      case 'feature-layer':
      case 'map-layer':
        // For layers, get the specific layer information which includes fields
        const layerMatch = url.match(/\/(\d+)$/);
        if (layerMatch && layerMatch[1]) {
          const layerId = parseInt(layerMatch[1], 10);
          const serviceUrl = url.replace(/\/\d+$/, '');
          serviceInfo = await getLayerInfo(serviceUrl, layerId, authSession || undefined);
        } else {
          serviceInfo = await inspectService(url, authSession || undefined);
        }
        break;
      default:
        throw new Error(`Service type "${serviceType}" not yet supported`);
    }
    
    // Check if infrastructure analysis is requested
    if (options.withInfrastructure || options.troubleshoot || options.complianceReport) {
      const report = await generateUnifiedReport(url, serviceInfo, options);
      displayUnifiedReport(report, options);
    } else {
      // Standard service inspection output
      if (options.json) {
        console.log(JSON.stringify(serviceInfo, null, 2));
      } else {
        formatService(serviceInfo, { showFields: options.fields });
      }
    }
    
  } catch (error) {
    handleError(error, 'Service inspection failed');
  }
}

/**
 * Generate unified report combining service and infrastructure analysis
 */
async function generateUnifiedReport(
  url: string,
  serviceInfo: any,
  options: InspectOptions
): Promise<UnifiedInspectionReport> {
  console.log('Analyzing service and infrastructure correlation...');
  
  // Convert service info to standardized metadata
  const serviceMetadata: ServiceMetadata = {
    name: serviceInfo.name || serviceInfo.mapName || 'Unknown Service',
    type: serviceInfo.type || 'Unknown',
    url: url,
    description: serviceInfo.description,
    capabilities: serviceInfo.capabilities?.split(','),
    spatialReference: serviceInfo.spatialReference,
    extent: serviceInfo.fullExtent || serviceInfo.extent,
    fields: serviceInfo.fields,
    relationships: serviceInfo.relationships,
    lastEditDate: serviceInfo.editingInfo?.lastEditDate,
    maxRecordCount: serviceInfo.maxRecordCount,
    supportedQueryFormats: serviceInfo.supportedQueryFormats,
    hasStaticData: serviceInfo.hasStaticData
  };

  // Determine analysis type
  let analysisType: UnifiedInspectionReport['analysisType'] = 'basic';
  if (options.complianceReport) analysisType = 'compliance';
  else if (options.troubleshoot) analysisType = 'troubleshoot';
  else if (options.withInfrastructure) analysisType = 'with-infrastructure';

  const report: UnifiedInspectionReport = {
    service: serviceMetadata,
    reportGenerated: new Date().toISOString(),
    analysisType,
    summary: {
      overallStatus: 'healthy',
      keyFindings: [],
      actionItems: []
    }
  };

  // Add infrastructure analysis if admin session available
  try {
    const correlation = await resolveServiceDatastore(url, options.env);
    
    if (correlation.backingDatastore) {
      console.log(`✓ Found backing datastore: ${correlation.backingDatastore.name} (${correlation.correlationConfidence} confidence)`);
      
      const infrastructureAnalysis: InfrastructureAnalysis = {
        correlation: {
          method: correlation.correlationMethod,
          confidence: correlation.correlationConfidence,
          reasoning: getCorrelationReasoning(correlation)
        },
        datastore: correlation.backingDatastore,
        recommendations: [],
        alerts: []
      };

      // Try to get detailed health if admin access available
      try {
        const { ArcGISServerAdminClient } = await import('../services/admin-client.js');
        const { getAdminSession } = await import('../session.js');
        
        const adminSession = await getAdminSession(options.env);
        if (adminSession) {
          const adminClient = new ArcGISServerAdminClient(adminSession);
          const healthReport = await adminClient.validateDatastore(correlation.backingDatastore.name);
          infrastructureAnalysis.health = healthReport;
          
          console.log(`✓ Infrastructure health: ${healthReport.status}`);
        }
      } catch (error) {
        infrastructureAnalysis.alerts.push({
          severity: 'info',
          message: 'Admin access not available for detailed health analysis',
          action: 'Use: aci admin login for infrastructure health details'
        });
      }

      // Generate recommendations based on analysis type
      generateRecommendations(infrastructureAnalysis, analysisType);
      
      report.infrastructure = infrastructureAnalysis;
    } else {
      console.log('⚠ Could not correlate service with backing datastore');
      report.summary.keyFindings.push('Backing datastore could not be identified');
      report.summary.actionItems.push('Verify service registration and datastore connectivity');
    }
  } catch (error) {
    console.log(`⚠ Infrastructure analysis failed: ${(error as Error).message}`);
    report.summary.keyFindings.push('Infrastructure analysis unavailable');
  }

  // Update overall status based on findings
  updateOverallStatus(report);

  return report;
}

/**
 * Get human-readable correlation reasoning
 */
function getCorrelationReasoning(correlation: any): string {
  switch (correlation.correlationMethod) {
    case 'direct':
      return 'Correlated through admin API cross-reference';
    case 'heuristic':
      return 'Correlated using service metadata and naming patterns';
    default:
      return 'Correlation method unknown';
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(analysis: InfrastructureAnalysis, analysisType: string): void {
  if (!analysis.datastore) return;

  // Basic infrastructure recommendations
  if (analysis.datastore.status === 'HealthyWithWarning') {
    analysis.recommendations.push('Monitor datastore warnings and plan maintenance');
    analysis.alerts.push({
      severity: 'warning',
      message: 'Backing datastore shows warnings',
      action: `Use: aci admin datastores validate ${analysis.datastore.name} --detailed`
    });
  }

  if (analysis.datastore.status === 'Unhealthy') {
    analysis.recommendations.push('Immediate attention required for backing datastore');
    analysis.alerts.push({
      severity: 'error',
      message: 'Backing datastore is unhealthy',
      action: `Use: aci admin datastores validate ${analysis.datastore.name} --detailed`
    });
  }

  // Analysis type specific recommendations
  if (analysisType === 'troubleshoot') {
    analysis.recommendations.push('Check service performance metrics');
    analysis.recommendations.push('Verify datastore machine health and replication status');
    analysis.recommendations.push('Review recent logs for errors or warnings');
  }

  if (analysisType === 'compliance') {
    analysis.recommendations.push('Verify backup schedule compliance');
    analysis.recommendations.push('Document service-to-datastore mapping');
    analysis.recommendations.push('Validate data governance policies');
  }
}

/**
 * Update overall status based on analysis
 */
function updateOverallStatus(report: UnifiedInspectionReport): void {
  if (report.infrastructure?.health?.status === 'Unhealthy') {
    report.summary.overallStatus = 'error';
  } else if (report.infrastructure?.health?.status === 'HealthyWithWarning') {
    report.summary.overallStatus = 'warning';
  } else {
    report.summary.overallStatus = 'healthy';
  }

  // Generate key findings summary
  if (report.infrastructure?.datastore) {
    report.summary.keyFindings.push(`Backed by ${report.infrastructure.datastore.type} datastore: ${report.infrastructure.datastore.name}`);
  }

  if (report.infrastructure?.health) {
    report.summary.keyFindings.push(`Infrastructure status: ${report.infrastructure.health.status}`);
  }
}

/**
 * Display unified report in appropriate format
 */
function displayUnifiedReport(report: UnifiedInspectionReport, options: InspectOptions): void {
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Format unified report output
  console.log('\n' + '='.repeat(60));
  console.log(`UNIFIED INSPECTION REPORT - ${report.analysisType.toUpperCase()}`);
  console.log('='.repeat(60));
  
  // Service Information
  console.log('\n📋 SERVICE INFORMATION');
  console.log(`Name: ${report.service.name}`);
  console.log(`Type: ${report.service.type}`);
  console.log(`URL: ${report.service.url}`);
  if (report.service.description) {
    console.log(`Description: ${report.service.description}`);
  }

  // Infrastructure Analysis
  if (report.infrastructure) {
    console.log('\n🏗️ INFRASTRUCTURE ANALYSIS');
    console.log(`Correlation: ${report.infrastructure.correlation.method} (${report.infrastructure.correlation.confidence} confidence)`);
    console.log(`Reasoning: ${report.infrastructure.correlation.reasoning}`);
    
    if (report.infrastructure.datastore) {
      console.log(`Backing Datastore: ${report.infrastructure.datastore.name}`);
      console.log(`Datastore Type: ${report.infrastructure.datastore.type}`);
      console.log(`Status: ${formatStatus(report.infrastructure.datastore.status)}`);
    }

    if (report.infrastructure.health) {
      console.log(`Health Status: ${formatStatus(report.infrastructure.health.status)}`);
      console.log(`Machines: ${report.infrastructure.health.machines.length}`);
      console.log(`Last Validated: ${formatTimestamp(report.infrastructure.health.lastValidated)}`);
    }
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log(`Overall Status: ${formatStatus(report.summary.overallStatus)}`);
  
  if (report.summary.keyFindings.length > 0) {
    console.log('\nKey Findings:');
    report.summary.keyFindings.forEach(finding => console.log(`• ${finding}`));
  }

  // Recommendations
  if (report.infrastructure?.recommendations && report.infrastructure.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    report.infrastructure.recommendations.forEach(rec => console.log(`• ${rec}`));
  }

  // Alerts
  if (report.infrastructure?.alerts && report.infrastructure.alerts.length > 0) {
    console.log('\n⚠️ ALERTS');
    report.infrastructure.alerts.forEach(alert => {
      const icon = alert.severity === 'error' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
      console.log(`${icon} ${alert.message}`);
      if (alert.action) {
        console.log(`   Action: ${alert.action}`);
      }
    });
  }

  console.log(`\nReport generated: ${formatTimestamp(report.reportGenerated)}`);
}

/**
 * Format status with color coding
 */
function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
      return '\x1b[32m✓ Healthy\x1b[0m';
    case 'warning':
    case 'healthywithwarning':
      return '\x1b[33m⚠ Warning\x1b[0m';
    case 'error':
    case 'unhealthy':
      return '\x1b[31m✗ Error\x1b[0m';
    default:
      return status;
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return timestamp;
  }
}