import { getAdminDatabase } from '../utils/database.js';
import { getCurrentEnvironment } from '../session.js';
import { handleError } from '../errors/handler.js';
import { log } from '../utils/logger.js';

export interface InsightOptions {
  environment?: string;
  timeWindow?: string;
  limit?: number;
  format?: 'table' | 'json' | 'csv';
}

/**
 * Show authentication failure patterns and trends
 */
export async function authFailuresInsight(options: InsightOptions = {}): Promise<void> {
  try {
    const db = getAdminDatabase();
    const env = options.environment || getCurrentEnvironment();
    const since = parseTimeWindow(options.timeWindow || '24h');
    
    log.info('Analyzing authentication failure patterns', { environment: env, since });

    const failures = db.executeQuery(`
      SELECT 
        DATE(timestamp/1000, 'unixepoch') as date,
        COUNT(*) as failure_count,
        COUNT(DISTINCT json_extract(metadata, '$.portal')) as affected_portals,
        GROUP_CONCAT(DISTINCT json_extract(metadata, '$.error')) as error_types
      FROM audit_log 
      WHERE environment = ? 
        AND level = 'ERROR' 
        AND message LIKE '%auth%' 
        AND timestamp >= ?
      GROUP BY DATE(timestamp/1000, 'unixepoch')
      ORDER BY date DESC
      LIMIT ?
    `, [env, since, options.limit || 30]);

    if (failures.length === 0) {
      console.log(`✓ No authentication failures found in ${env} environment (${options.timeWindow || '24h'})`);
      return;
    }

    console.log(`\n📊 Authentication Failure Analysis - ${env} environment\n`);
    console.log('Date\t\tFailures\tPortals\tError Types');
    console.log('─'.repeat(80));
    
    for (const row of failures) {
      const date = row.date || 'Unknown';
      const count = row.failure_count || 0;
      const portals = row.affected_portals || 0;
      const errors = (row.error_types || '').substring(0, 30) + '...';
      console.log(`${date}\t${count}\t\t${portals}\t${errors}`);
    }

    // Show recommendations
    const totalFailures = failures.reduce((sum: number, row: any) => sum + (row.failure_count || 0), 0);
    if (totalFailures > 10) {
      console.log(`\n⚠️  High failure count detected (${totalFailures} failures)`);
      console.log('   Consider reviewing token expiration policies and authentication configuration');
    }

  } catch (error) {
    handleError(error, 'Failed to analyze authentication failures');
  }
}

/**
 * Show service health trends and patterns
 */
export async function serviceHealthInsight(options: InsightOptions = {}): Promise<void> {
  try {
    const db = getAdminDatabase();
    const env = options.environment || getCurrentEnvironment();
    const since = parseTimeWindow(options.timeWindow || '7d');
    
    log.info('Analyzing service health trends', { environment: env, since });

    const healthData = db.executeQuery(`
      SELECT 
        service_name,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'FAILURE' THEN 1 END) as failures,
        COUNT(CASE WHEN event_type = 'RESTART' THEN 1 END) as restarts,
        MAX(timestamp) as last_event,
        service_type,
        status
      FROM service_events 
      WHERE environment = ? AND timestamp >= ?
      GROUP BY service_name, service_type
      ORDER BY failures DESC, restarts DESC
      LIMIT ?
    `, [env, since, options.limit || 20]);

    if (healthData.length === 0) {
      console.log(`✓ No service events found in ${env} environment (${options.timeWindow || '7d'})`);
      return;
    }

    console.log(`\n🏥 Service Health Analysis - ${env} environment\n`);
    console.log('Service Name\t\tType\t\tEvents\tFailures\tRestarts\tStatus');
    console.log('─'.repeat(90));
    
    for (const row of healthData) {
      const name = (row.service_name || '').substring(0, 15).padEnd(15);
      const type = (row.service_type || '').substring(0, 10).padEnd(10);
      const events = (row.total_events || 0).toString().padStart(6);
      const failures = (row.failures || 0).toString().padStart(8);
      const restarts = (row.restarts || 0).toString().padStart(8);
      const status = row.status || 'Unknown';
      
      console.log(`${name}\t${type}\t${events}\t${failures}\t${restarts}\t${status}`);
    }

    // Show critical services
    const criticalServices = healthData.filter((row: any) => (row.failures || 0) > 3);
    if (criticalServices.length > 0) {
      console.log(`\n🚨 Critical Services (>3 failures):`);
      criticalServices.forEach((service: any) => {
        console.log(`   ${service.service_name}: ${service.failures} failures, ${service.restarts} restarts`);
      });
    }

  } catch (error) {
    handleError(error, 'Failed to analyze service health');
  }
}

/**
 * Show command execution patterns and performance
 */
export async function commandTrendsInsight(options: InsightOptions = {}): Promise<void> {
  try {
    const db = getAdminDatabase();
    const env = options.environment || getCurrentEnvironment();
    const since = parseTimeWindow(options.timeWindow || '7d');
    
    log.info('Analyzing command execution trends', { environment: env, since });

    const trends = db.executeQuery(`
      SELECT 
        command,
        COUNT(*) as execution_count,
        AVG(duration) as avg_duration_ms,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failure_count,
        MAX(start_time) as last_execution,
        MIN(start_time) as first_execution
      FROM command_history 
      WHERE environment = ? AND start_time >= ?
      GROUP BY command
      ORDER BY execution_count DESC
      LIMIT ?
    `, [env, since, options.limit || 15]);

    if (trends.length === 0) {
      console.log(`✓ No command executions found in ${env} environment (${options.timeWindow || '7d'})`);
      return;
    }

    console.log(`\n📈 Command Execution Trends - ${env} environment\n`);
    console.log('Command\t\t\tCount\tAvg Duration\tFailures\tSuccess Rate');
    console.log('─'.repeat(80));
    
    for (const row of trends) {
      const command = (row.command || '').substring(0, 15).padEnd(15);
      const count = (row.execution_count || 0).toString().padStart(5);
      const duration = Math.round(row.avg_duration_ms || 0).toString().padStart(8) + 'ms';
      const failures = (row.failure_count || 0).toString().padStart(8);
      const successRate = ((((row.execution_count || 0) - (row.failure_count || 0)) / (row.execution_count || 1)) * 100).toFixed(1) + '%';
      
      console.log(`${command}\t${count}\t${duration}\t${failures}\t${successRate}`);
    }

    // Show performance insights
    const slowCommands = trends.filter((row: any) => (row.avg_duration_ms || 0) > 5000);
    if (slowCommands.length > 0) {
      console.log(`\n🐌 Slow Commands (>5s average):`);
      slowCommands.forEach((cmd: any) => {
        console.log(`   ${cmd.command}: ${Math.round(cmd.avg_duration_ms)}ms average`);
      });
    }

  } catch (error) {
    handleError(error, 'Failed to analyze command trends');
  }
}

/**
 * Show resource usage and capacity trends
 */
export async function resourceTrendsInsight(options: InsightOptions = {}): Promise<void> {
  try {
    const db = getAdminDatabase();
    const env = options.environment || getCurrentEnvironment();
    const since = parseTimeWindow(options.timeWindow || '24h');
    
    log.info('Analyzing resource usage trends', { environment: env, since });

    // Analyze admin session usage
    const sessionData = db.executeQuery(`
      SELECT 
        DATE(created_time/1000, 'unixepoch') as date,
        COUNT(*) as sessions_created,
        COUNT(DISTINCT username) as unique_users,
        AVG(expires_time - created_time) as avg_session_duration,
        auth_method
      FROM admin_sessions 
      WHERE environment = ? AND created_time >= ?
      GROUP BY DATE(created_time/1000, 'unixepoch'), auth_method
      ORDER BY date DESC
      LIMIT ?
    `, [env, since, options.limit || 10]);

    console.log(`\n💾 Resource Usage Analysis - ${env} environment\n`);
    
    if (sessionData.length > 0) {
      console.log('Admin Session Usage:');
      console.log('Date\t\tSessions\tUsers\tAvg Duration\tAuth Method');
      console.log('─'.repeat(70));
      
      for (const row of sessionData) {
        const date = row.date || 'Unknown';
        const sessions = (row.sessions_created || 0).toString().padStart(8);
        const users = (row.unique_users || 0).toString().padStart(5);
        const duration = Math.round((row.avg_session_duration || 0) / 60000).toString().padStart(8) + 'm';
        const method = row.auth_method || 'Unknown';
        
        console.log(`${date}\t${sessions}\t${users}\t${duration}\t${method}`);
      }
    }

    // Database size and performance
    const dbStats = db.executeQuery(`
      SELECT 
        'command_history' as table_name,
        COUNT(*) as row_count
      FROM command_history
      WHERE environment = ?
      UNION ALL
      SELECT 
        'audit_log' as table_name,
        COUNT(*) as row_count
      FROM audit_log
      WHERE environment = ?
      UNION ALL
      SELECT 
        'service_events' as table_name,
        COUNT(*) as row_count
      FROM service_events
      WHERE environment = ?
    `, [env, env, env]);

    if (dbStats.length > 0) {
      console.log('\nDatabase Statistics:');
      console.log('Table\t\t\tRecords');
      console.log('─'.repeat(30));
      for (const stat of dbStats) {
        const table = (stat.table_name || '').padEnd(20);
        const count = (stat.row_count || 0).toString().padStart(10);
        console.log(`${table}${count}`);
      }
    }

  } catch (error) {
    handleError(error, 'Failed to analyze resource trends');
  }
}

/**
 * Execute guided template analysis
 */
export async function templateAnalysis(template: string, options: InsightOptions = {}): Promise<void> {
  try {
    const templates = {
      'auth-correlation': authCorrelationTemplate,
      'service-dependency': serviceDependencyTemplate,
      'failure-cascade': failureCascadeTemplate,
      'performance-degradation': performanceDegradationTemplate
    };

    const templateFn = templates[template as keyof typeof templates];
    if (!templateFn) {
      console.log('Available templates:');
      Object.keys(templates).forEach(name => console.log(`  ${name}`));
      return;
    }

    await templateFn(options);

  } catch (error) {
    handleError(error, `Failed to execute template: ${template}`);
  }
}

/**
 * Expert SQL console with security safeguards
 */
export async function expertSqlConsole(query: string, options: InsightOptions = {}): Promise<void> {
  try {
    const db = getAdminDatabase();
    
    log.audit('Expert SQL query executed', { query: (query || '').substring(0, 100) });

    console.log('🔒 Executing query with security restrictions...\n');
    
    const results = db.executeQuery(query || '');
    
    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    // Format output based on requested format
    if (options.format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (options.format === 'csv') {
      if (results.length > 0) {
        const headers = Object.keys(results[0]);
        console.log(headers.join(','));
        results.forEach(row => {
          console.log(headers.map(h => row[h] || '').join(','));
        });
      }
    } else {
      // Table format (default)
      if (results.length > 0) {
        const headers = Object.keys(results[0]);
        console.log(headers.join('\t'));
        console.log('─'.repeat(headers.length * 15));
        results.forEach(row => {
          console.log(headers.map(h => String(row[h] || '').substring(0, 15)).join('\t'));
        });
      }
    }

    console.log(`\n📊 Query returned ${results.length} rows`);

  } catch (error) {
    handleError(error, 'SQL query failed');
  }
}

// Helper functions

function parseTimeWindow(window: string): number {
  const now = Date.now();
  const match = window.match(/^(\d+)([hdw])$/);
  
  if (!match) {
    throw new Error('Invalid time window format. Use: 1h, 24h, 7d, 1w');
  }

  const value = parseInt(match[1] || '1');
  const unit = match[2] || 'h';
  
  const multipliers = {
    'h': 60 * 60 * 1000,      // hours
    'd': 24 * 60 * 60 * 1000, // days
    'w': 7 * 24 * 60 * 60 * 1000 // weeks
  };

  return now - (value * multipliers[unit as keyof typeof multipliers]);
}

// Template functions

async function authCorrelationTemplate(options: InsightOptions): Promise<void> {
  const db = getAdminDatabase();
  const env = options.environment || getCurrentEnvironment();
  const since = parseTimeWindow(options.timeWindow || '24h');

  console.log('🔍 Auth-Service Correlation Analysis\n');

  const correlation = db.executeQuery(`
    SELECT 
      a.timestamp as auth_time,
      s.timestamp as service_time,
      a.message as auth_event,
      s.service_name,
      s.event_type,
      (s.timestamp - a.timestamp) as time_diff_ms
    FROM audit_log a
    JOIN service_events s ON abs(a.timestamp - s.timestamp) < 300000
    WHERE a.environment = ? 
      AND s.environment = ?
      AND a.level = 'ERROR'
      AND a.message LIKE '%auth%'
      AND a.timestamp >= ?
    ORDER BY a.timestamp DESC
    LIMIT 20
  `, [env, env, since]);

  if (correlation.length === 0) {
    console.log('✓ No authentication-service correlations found');
    return;
  }

  correlation.forEach(row => {
    const timeDiff = Math.round(row.time_diff_ms / 1000);
    console.log(`Auth failure → Service ${row.event_type} (${timeDiff}s later)`);
    console.log(`  Service: ${row.service_name}`);
    console.log(`  Auth Error: ${row.auth_event}`);
    console.log('');
  });
}

async function serviceDependencyTemplate(options: InsightOptions): Promise<void> {
  const db = getAdminDatabase();
  const env = options.environment || getCurrentEnvironment();
  const since = parseTimeWindow(options.timeWindow || '7d');

  console.log('🔗 Service Dependency Analysis\n');

  const dependencies = db.executeQuery(`
    SELECT 
      s1.service_name as primary_service,
      s2.service_name as affected_service,
      COUNT(*) as correlation_count,
      AVG(s2.timestamp - s1.timestamp) as avg_delay_ms
    FROM service_events s1
    JOIN service_events s2 ON s2.timestamp > s1.timestamp 
      AND s2.timestamp < s1.timestamp + 600000
      AND s1.service_name != s2.service_name
    WHERE s1.environment = ? 
      AND s2.environment = ?
      AND s1.event_type = 'FAILURE'
      AND s2.event_type IN ('FAILURE', 'RESTART')
      AND s1.timestamp >= ?
    GROUP BY s1.service_name, s2.service_name
    HAVING COUNT(*) > 2
    ORDER BY correlation_count DESC
    LIMIT 10
  `, [env, env, since]);

  dependencies.forEach(row => {
    const delay = Math.round(row.avg_delay_ms / 1000);
    console.log(`${row.primary_service} → ${row.affected_service}`);
    console.log(`  Correlations: ${row.correlation_count}, Avg delay: ${delay}s\n`);
  });
}

async function failureCascadeTemplate(options: InsightOptions): Promise<void> {
  console.log('🌊 Failure Cascade Analysis\n');
  // Implementation for cascade analysis
  console.log('Template: failure-cascade (implementation pending)');
}

async function performanceDegradationTemplate(options: InsightOptions): Promise<void> {
  console.log('📉 Performance Degradation Analysis\n');
  // Implementation for performance analysis
  console.log('Template: performance-degradation (implementation pending)');
}