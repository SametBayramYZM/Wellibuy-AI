/**
 * 📊 Database Activity Monitoring Service
 * 
 * Query logging, slow query detection, access pattern analysis
 */

import mongoose from 'mongoose';

interface QueryLog {
  collection: string;
  operation: string;
  query: any;
  duration: number;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
}

// In-memory query log (move to Redis for production)
const queryLogs: QueryLog[] = [];
const MAX_LOGS = 1000;
const SLOW_QUERY_THRESHOLD = 100; // ms

/**
 * Setup database monitoring
 */
export const setupDatabaseMonitoring = () => {
  // Monitor slow queries
  mongoose.connection.on('fullsetup', () => {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      const log: QueryLog = {
        collection: collectionName,
        operation: method,
        query,
        duration: 0, // Will be updated by profiler
        timestamp: new Date(),
      };

      queryLogs.push(log);
      if (queryLogs.length > MAX_LOGS) {
        queryLogs.shift();
      }
    });
  });

  console.log('✅ Database monitoring enabled');
};

/**
 * Enable MongoDB profiler
 */
export const enableProfiling = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Set profiling level 1 (slow queries only)
    await db.command({
      profile: 1,
      slowms: SLOW_QUERY_THRESHOLD,
    });

    console.log(`✅ MongoDB profiler enabled (threshold: ${SLOW_QUERY_THRESHOLD}ms)`);
  } catch (err) {
    console.error('Enable profiling error:', err);
  }
};

/**
 * Get slow queries
 */
export const getSlowQueries = async (): Promise<any[]> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return [];

    const systemProfile = db.collection('system.profile');
    const slowQueries = await systemProfile
      .find({
        millis: { $gt: SLOW_QUERY_THRESHOLD },
      })
      .sort({ ts: -1 })
      .limit(50)
      .toArray();

    return slowQueries;
  } catch (err) {
    console.error('Get slow queries error:', err);
    return [];
  }
};

/**
 * Analyze query patterns
 */
export const analyzeQueryPatterns = (): {
  totalQueries: number;
  byCollection: Record<string, number>;
  byOperation: Record<string, number>;
  slowQueries: number;
} => {
  const byCollection: Record<string, number> = {};
  const byOperation: Record<string, number> = {};
  let slowQueries = 0;

  for (const log of queryLogs) {
    byCollection[log.collection] = (byCollection[log.collection] || 0) + 1;
    byOperation[log.operation] = (byOperation[log.operation] || 0) + 1;

    if (log.duration > SLOW_QUERY_THRESHOLD) {
      slowQueries++;
    }
  }

  return {
    totalQueries: queryLogs.length,
    byCollection,
    byOperation,
    slowQueries,
  };
};

/**
 * Middleware: Log database access
 */
export const logDatabaseAccess = (req: any, res: any, next: any) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    // Log after response
    if (req.dbQueries) {
      for (const query of req.dbQueries) {
        queryLogs.push({
          ...query,
          userId: req.user?.id,
          ipAddress: req.ip,
        });

        if (queryLogs.length > MAX_LOGS) {
          queryLogs.shift();
        }
      }
    }

    return originalSend.call(this, data);
  };

  req.dbQueries = [];
  next();
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<any> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return null;

    const stats = await db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize,
      avgObjSize: stats.avgObjSize,
    };
  } catch (err) {
    console.error('Get database stats error:', err);
    return null;
  }
};
