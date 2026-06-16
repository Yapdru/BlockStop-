/**
 * Type Definitions for Threat Hunting & Security Analytics
 */

// ==================== BEHAVIORAL ANALYTICS ====================

export interface UserEntity {
  id: string;
  type: "user" | "service" | "device" | "account";
  name: string;
  department?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

export interface BehavioralEvent {
  id: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
  eventType: string;
  action: string;
  target?: string;
  sourceIp?: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export interface AnomalyResult {
  eventId: string;
  entityId: string;
  severity: "low" | "medium" | "high" | "critical";
  anomalyType: string;
  score: number;
  reasons: string[];
  timestamp: Date;
}

// ==================== THREAT HUNTING ====================

export interface ThreatIndicator {
  type: "ip" | "domain" | "hash" | "email" | "url" | "pattern";
  value: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  confidence: number;
  lastSeen?: Date;
  context?: string;
}

export interface HuntStatus {
  huntId: string;
  status: "created" | "running" | "completed" | "failed" | "paused";
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  resultsCount: number;
  errorsCount: number;
}

// ==================== FORENSICS ====================

export interface EvidenceItem {
  id: string;
  type: "file" | "memory" | "network" | "disk" | "log";
  source: string;
  timestamp: Date;
  hash: string;
  size: number;
  chainOfCustody: {
    action: string;
    timestamp: Date;
    actor: string;
  }[];
}

export interface InvestigationFinding {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: string[];
  timestamp: Date;
  confidence: number;
}

// ==================== LOG ANALYSIS ====================

export interface LogEntry {
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  source: string;
  message: string;
  fields: Record<string, unknown>;
}

export interface LogCorrelation {
  id: string;
  ruleId: string;
  relatedLogs: string[];
  detectedAt: Date;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
}

// ==================== DETECTION RULES ====================

export interface DetectionCondition {
  type: "field" | "pattern" | "aggregation" | "script";
  field?: string;
  operator: "equals" | "contains" | "regex" | "greater_than" | "less_than" | "in";
  value: string | number | string[];
  logic?: "AND" | "OR";
}

export interface DetectionAction {
  type: "alert" | "quarantine" | "block" | "log" | "notify" | "escalate";
  parameters?: Record<string, unknown>;
}

// ==================== REPORTING ====================

export interface SecurityMetrics {
  totalEvents: number;
  anomaliesDetected: number;
  threatsCaught: number;
  falsePositives: number;
  investigationsOpen: number;
  casesResolved: number;
}

export interface RiskMetrics {
  entityId: string;
  riskScore: number;
  trendDirection: "improving" | "stable" | "degrading";
  topRisks: Array<{
    type: string;
    score: number;
    lastSeen: Date;
  }>;
}

// ==================== COMMON ====================

export type Severity = "low" | "medium" | "high" | "critical";

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// ==================== ENUMS ====================

export enum HuntType {
  IOC = "ioc",
  BEHAVIOR = "behavior",
  ANOMALY = "anomaly",
  TIMELINE = "timeline",
  CUSTOM = "custom",
}

export enum EvidenceType {
  FILE = "file",
  MEMORY = "memory",
  NETWORK = "network",
  DISK = "disk",
  LOG = "log",
}

export enum CaseStatus {
  OPEN = "open",
  IN_PROGRESS = "in-progress",
  CLOSED = "closed",
  ESCALATED = "escalated",
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}
