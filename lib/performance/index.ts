/**
 * BlockStop Performance Optimization Module
 * Exports for query optimization and performance management
 */

export {
  QueryOptimizer,
  CacheLevel,
  QueryOptimizationType,
  type QueryPlan,
  type CachedQuery,
  type ConnectionPoolConfig,
  type PooledConnection,
  type PerformanceMetrics,
  type MemoryConfig,
  type CPUThrottlingConfig,
  type QueryOptimizerConfig,
  type Index,
  type Statistics,
} from './query-optimizer';

export default QueryOptimizer;
