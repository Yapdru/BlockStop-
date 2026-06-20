import { NextRequest, NextResponse } from "next/server";

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    [key: string]: {
      status: "operational" | "degraded" | "offline";
      latency_ms?: number;
      last_check?: string;
      error?: string;
    };
  };
  dependencies?: {
    database: {
      status: "connected" | "disconnected";
      latency_ms?: number;
    };
    cache: {
      status: "connected" | "disconnected";
      latency_ms?: number;
    };
  };
}

const START_TIME = Date.now();

export async function GET(request: NextRequest) {
  try {
    const detailed = request.nextUrl.searchParams.get("detailed") === "true";
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - START_TIME;

    // Check service health
    const services = await checkServices();
    const dependencies = await checkDependencies();

    // Determine overall status
    const allServicesHealthy = Object.values(services).every(
      (s) => s.status === "operational"
    );
    const allDepsHealthy =
      dependencies.database.status === "connected" &&
      dependencies.cache.status === "connected";

    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (!allServicesHealthy || !allDepsHealthy) {
      overallStatus = "degraded";
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp,
      version: "1.0.0",
      uptime,
      environment: process.env.NODE_ENV || "development",
      services,
    };

    if (detailed) {
      response.dependencies = dependencies;
    }

    const statusCode = overallStatus === "healthy" ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
        "X-Health-Status": overallStatus,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: Date.now() - START_TIME,
        environment: process.env.NODE_ENV || "development",
        services: {
          api: {
            status: "offline",
            error: "Health check failed",
          },
        },
      } as HealthCheckResponse,
      { status: 503 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // Quick health check for monitoring
  try {
    const services = await checkServices();
    const allHealthy = Object.values(services).every(
      (s) => s.status === "operational"
    );

    return new NextResponse(null, {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Health-Status": allHealthy ? "healthy" : "degraded",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

async function checkServices(): Promise<
  Record<
    string,
    {
      status: "operational" | "degraded" | "offline";
      latency_ms?: number;
      last_check?: string;
    }
  >
> {
  // In production: check actual services
  const results: Record<
    string,
    {
      status: "operational" | "degraded" | "offline";
      latency_ms?: number;
      last_check?: string;
    }
  > = {};

  // API service
  results.api = {
    status: "operational",
    latency_ms: Math.random() * 50, // Simulate latency
    last_check: new Date().toISOString(),
  };

  // Authentication service
  results.auth = {
    status: "operational",
    latency_ms: Math.random() * 100,
    last_check: new Date().toISOString(),
  };

  // GraphQL service
  results.graphql = {
    status: "operational",
    latency_ms: Math.random() * 75,
    last_check: new Date().toISOString(),
  };

  // Webhook service
  results.webhooks = {
    status: "operational",
    latency_ms: Math.random() * 60,
    last_check: new Date().toISOString(),
  };

  // File scanning service
  results.file_scanner = {
    status: "operational",
    latency_ms: Math.random() * 150,
    last_check: new Date().toISOString(),
  };

  // Email checking service
  results.email_checker = {
    status: "operational",
    latency_ms: Math.random() * 120,
    last_check: new Date().toISOString(),
  };

  return results;
}

async function checkDependencies(): Promise<{
  database: {
    status: "connected" | "disconnected";
    latency_ms?: number;
  };
  cache: {
    status: "connected" | "disconnected";
    latency_ms?: number;
  };
}> {
  // In production: check actual database and cache connections
  try {
    // Check database connection
    const dbStart = Date.now();
    // await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Check cache connection
    const cacheStart = Date.now();
    // await cache.ping();
    const cacheLatency = Date.now() - cacheStart;

    return {
      database: {
        status: "connected",
        latency_ms: dbLatency,
      },
      cache: {
        status: "connected",
        latency_ms: cacheLatency,
      },
    };
  } catch (error) {
    console.error("Dependency check failed:", error);
    return {
      database: {
        status: "disconnected",
      },
      cache: {
        status: "disconnected",
      },
    };
  }
}
