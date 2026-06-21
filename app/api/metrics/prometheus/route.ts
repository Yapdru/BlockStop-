/**
 * Prometheus Metrics Endpoint
 * Exposes metrics in Prometheus format for scraping
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const packageJson = require('@/package.json');

// PostgreSQL connection pool for metrics
const pgPool =
  process.env.DATABASE_URL &&
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

interface PrometheusMetric {
  name: string;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
  help: string;
  value: number | Record<string, number>;
  labels?: Record<string, string>;
}

// Metrics registry
const metrics: Map<string, PrometheusMetric> = new Map();

function recordMetric(metric: PrometheusMetric): void {
  metrics.set(metric.name, metric);
}

function getPrometheusFormat(): string {
  let output = '';

  for (const [, metric] of metrics) {
    if (typeof metric.value === 'object') {
      // Histogram or summary
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
      for (const [label, value] of Object.entries(metric.value)) {
        output += `${metric.name}${label} ${value}\n`;
      }
    } else {
      // Gauge or counter
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      if (metric.labels) {
        const labelStr = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        output += `${metric.name}{${labelStr}} ${metric.value}\n`;
      } else {
        output += `${metric.name} ${metric.value}\n`;
      }
    }

    output += '\n';
  }

  return output;
}

async function collectMetrics(): Promise<void> {
  try {
    // Process metrics
    const memUsage = process.memoryUsage();
    recordMetric({
      name: 'blockstop_process_memory_heap_used_bytes',
      type: 'gauge',
      help: 'Process heap memory used in bytes',
      value: memUsage.heapUsed,
    });

    recordMetric({
      name: 'blockstop_process_memory_heap_total_bytes',
      type: 'gauge',
      help: 'Process heap memory total in bytes',
      value: memUsage.heapTotal,
    });

    recordMetric({
      name: 'blockstop_process_memory_external_bytes',
      type: 'gauge',
      help: 'Process external memory in bytes',
      value: memUsage.external,
    });

    recordMetric({
      name: 'blockstop_process_uptime_seconds',
      type: 'gauge',
      help: 'Process uptime in seconds',
      value: process.uptime(),
    });

    // Database metrics
    if (pgPool) {
      try {
        const client = await pgPool.connect();
        try {
          // Connection pool stats
          const poolSize = pgPool.totalCount;
          const activeConnections = pgPool.waitingCount + (poolSize - pgPool.idleCount);

          recordMetric({
            name: 'blockstop_database_connections_total',
            type: 'gauge',
            help: 'Total database connections in pool',
            value: poolSize,
          });

          recordMetric({
            name: 'blockstop_database_connections_active',
            type: 'gauge',
            help: 'Active database connections',
            value: activeConnections,
          });

          recordMetric({
            name: 'blockstop_database_connections_idle',
            type: 'gauge',
            help: 'Idle database connections',
            value: pgPool.idleCount,
          });

          recordMetric({
            name: 'blockstop_database_connections_waiting',
            type: 'gauge',
            help: 'Waiting database connections',
            value: pgPool.waitingCount,
          });

          // Database size
          const sizeResult = await client.query(
            `SELECT pg_database.datname,
                    pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
                    pg_database_size(pg_database.datname) AS size_bytes
             FROM pg_database
             WHERE datname = current_database()`
          );

          if (sizeResult.rows.length > 0) {
            recordMetric({
              name: 'blockstop_database_size_bytes',
              type: 'gauge',
              help: 'Database size in bytes',
              value: sizeResult.rows[0].size_bytes,
              labels: { database: sizeResult.rows[0].datname },
            });
          }

          // Table stats
          const tableStatsResult = await client.query(
            `SELECT schemaname, tablename, n_live_tup, n_dead_tup
             FROM pg_stat_user_tables
             LIMIT 100`
          );

          for (const row of tableStatsResult.rows) {
            recordMetric({
              name: 'blockstop_database_table_rows',
              type: 'gauge',
              help: 'Number of live rows in table',
              value: row.n_live_tup,
              labels: {
                schema: row.schemaname,
                table: row.tablename,
              },
            });

            recordMetric({
              name: 'blockstop_database_table_dead_rows',
              type: 'gauge',
              help: 'Number of dead rows in table',
              value: row.n_dead_tup,
              labels: {
                schema: row.schemaname,
                table: row.tablename,
              },
            });
          }

          // Cache metrics from query cache if available
          const cacheStats = await client.query(
            `SELECT blks_hit, blks_read
             FROM pg_stat_database
             WHERE datname = current_database()`
          ).catch(() => ({ rows: [{ blks_hit: 0, blks_read: 0 }] }));

          if (cacheStats.rows.length > 0) {
            const totalBlks = cacheStats.rows[0].blks_hit + cacheStats.rows[0].blks_read;
            const hitRate = totalBlks > 0 ? (cacheStats.rows[0].blks_hit / totalBlks) * 100 : 0;

            recordMetric({
              name: 'blockstop_database_cache_hit_ratio',
              type: 'gauge',
              help: 'Database cache hit ratio (0-100)',
              value: hitRate,
            });

            recordMetric({
              name: 'blockstop_database_cache_hits',
              type: 'counter',
              help: 'Database cache hits',
              value: cacheStats.rows[0].blks_hit,
            });
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error collecting database metrics:', error);
      }
    }

    // Application version
    recordMetric({
      name: 'blockstop_app_version',
      type: 'gauge',
      help: 'Application version',
      value: 1,
      labels: {
        version: packageJson.version || '1.0.0',
        name: packageJson.name || 'blockstop',
      },
    });

    // Build info
    recordMetric({
      name: 'blockstop_build_info',
      type: 'gauge',
      help: 'Build information',
      value: 1,
      labels: {
        environment: process.env.NODE_ENV || 'development',
        buildTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
  }
}

export async function GET(request: Request) {
  try {
    // Collect metrics
    await collectMetrics();

    // Return Prometheus format
    const prometheusOutput = getPrometheusFormat();

    return new NextResponse(prometheusOutput, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating Prometheus metrics:', error);

    return new NextResponse(`# ERROR: ${String(error)}\n`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
