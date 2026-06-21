import { NextResponse } from "next/server";
import { Pool } from "pg";
import * as redis from "redis";

const packageJson = require("@/package.json");

// PostgreSQL connection pool for health checks
const pgPool =
  process.env.DATABASE_URL &&
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

// Redis client for health checks
let redisClient: redis.RedisClient | null = null;

async function initRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: () => null, // Don't reconnect on health check
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis health check error:", err);
    });

    await redisClient.connect().catch(() => null);
  }

  return redisClient;
}

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    api: HealthStatus;
    database: HealthStatus;
    cache: HealthStatus;
    memory: MemoryStatus;
    disk: DiskStatus;
  };
  environment: string;
}

interface HealthStatus {
  status: "operational" | "degraded" | "down";
  responseTime?: number;
  message?: string;
}

interface MemoryStatus extends HealthStatus {
  usage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    percentageUsed: number;
  };
}

interface DiskStatus extends HealthStatus {
  usage: {
    available: number;
    used: number;
    percentageUsed: number;
  };
}

async function checkDatabase(): Promise<HealthStatus> {
  if (!pgPool) {
    return {
      status: "down",
      message: "Database pool not initialized",
    };
  }

  try {
    const startTime = Date.now();
    const client = await pgPool.connect();
    const responseTime = Date.now() - startTime;

    try {
      await client.query("SELECT NOW()");

      return {
        status: "operational",
        responseTime,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      status: "down",
      message: String(error),
    };
  }
}

async function checkCache(): Promise<HealthStatus> {
  const client = await initRedisClient();

  if (!client) {
    return {
      status: "down",
      message: "Redis client not initialized",
    };
  }

  try {
    const startTime = Date.now();
    await client.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: "operational",
      responseTime,
    };
  } catch (error) {
    return {
      status: "down",
      message: String(error),
    };
  }
}

function checkMemory(): MemoryStatus {
  const memUsage = process.memoryUsage();
  const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  let status: "operational" | "degraded" | "down" = "operational";
  if (heapPercentage > 90) {
    status = "degraded";
  } else if (heapPercentage > 95) {
    status = "down";
  }

  return {
    status,
    usage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      percentageUsed: Math.round(heapPercentage * 100) / 100,
    },
  };
}

function checkDisk(): DiskStatus {
  // Note: In production, this would need os.freemem() or df command
  // For now, we return a placeholder
  return {
    status: "operational",
    usage: {
      available: 0,
      used: 0,
      percentageUsed: 0,
    },
  };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const queryParams = new URL(request.url).searchParams;
  const liveness = queryParams.get("liveness") === "true";
  const readiness = queryParams.get("readiness") === "true";

  try {
    // Liveness probe - is the service running?
    if (liveness) {
      return NextResponse.json({
        status: "alive",
        timestamp: new Date().toISOString(),
      });
    }

    // Readiness probe - is the service ready to handle traffic?
    if (readiness) {
      const dbHealth = await checkDatabase();
      const cacheHealth = await checkCache();

      const isReady =
        dbHealth.status === "operational" && cacheHealth.status === "operational";

      return NextResponse.json(
        {
          status: isReady ? "ready" : "not-ready",
          timestamp: new Date().toISOString(),
          database: dbHealth.status,
          cache: cacheHealth.status,
        },
        { status: isReady ? 200 : 503 }
      );
    }

    // Full health check
    const [dbHealth, cacheHealth, memoryHealth, diskHealth] = await Promise.all([
      checkDatabase(),
      checkCache(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk()),
    ]);

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (
      dbHealth.status === "down" ||
      cacheHealth.status === "down" ||
      memoryHealth.status === "down" ||
      diskHealth.status === "down"
    ) {
      overallStatus = "unhealthy";
    } else if (
      dbHealth.status === "degraded" ||
      cacheHealth.status === "degraded" ||
      memoryHealth.status === "degraded" ||
      diskHealth.status === "degraded"
    ) {
      overallStatus = "degraded";
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: packageJson.version || "1.0.0",
      uptime: process.uptime(),
      checks: {
        api: { status: "operational" },
        database: dbHealth,
        cache: cacheHealth,
        memory: memoryHealth,
        disk: diskHealth,
      },
      environment: process.env.NODE_ENV || "development",
    };

    const statusCode = overallStatus === "unhealthy" ? 503 : overallStatus === "degraded" ? 200 : 200;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: String(error),
      },
      { status: 503 }
    );
  }
}

