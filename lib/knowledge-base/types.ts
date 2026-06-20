export interface KBDocument {
  id: string;
  title: string;
  content: string;
  category: KBCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
  isPublished: boolean;
  accessLevel: AccessLevel;
  metadata: Record<string, any>;
}

export interface Playbook extends KBDocument {
  steps: PlaybookStep[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  successCriteria: string[];
  rollbackProcedure?: string;
  relatedPlaybooks: string[];
}

export interface PlaybookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  instructions: string;
  verification: string;
  estimatedTime: number;
  tools: string[];
  riskLevel: 'low' | 'medium' | 'high';
  automatable: boolean;
}

export interface Runbook extends KBDocument {
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  scripts: RunbookScript[];
  triggers: RunbookTrigger[];
  onSuccess: string;
  onFailure: string;
  maxRetries: number;
  timeout: number;
}

export interface RunbookScript {
  id: string;
  name: string;
  language: 'bash' | 'python' | 'javascript' | 'go';
  content: string;
  version: string;
  testCases: string[];
}

export interface RunbookTrigger {
  id: string;
  type: 'manual' | 'event' | 'schedule';
  condition: string;
  actions: string[];
}

export interface Procedure {
  id: string;
  title: string;
  description: string;
  steps: ProcedureStep[];
  category: string;
  subCategory?: string;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  owner: string;
}

export interface ProcedureStep {
  id: string;
  order: number;
  title: string;
  description: string;
  action: string;
  verification: string;
  alternatives?: string[];
}

export interface LessonLearned {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  rootCause: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  preventiveMeasures: string[];
  correctiveActions: string[];
  relatedPlaybooks: string[];
  createdAt: Date;
  reviewedBy: string[];
  status: 'draft' | 'reviewed' | 'approved';
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  category: KBCategory;
  matchedTerms: string[];
  url?: string;
}

export interface KBTag {
  id: string;
  name: string;
  description: string;
  color: string;
  usageCount: number;
  category: string;
}

export interface Version {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  changes: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
}

export interface AISuggestion {
  id: string;
  type: 'improvement' | 'related-content' | 'automation' | 'training';
  title: string;
  description: string;
  confidence: number;
  targetDocument: string;
  suggestedChanges: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  startedAt: Date;
  completedAt?: Date;
  executedBy: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  results: ExecutionStep[];
  errors: ExecutionError[];
}

export interface ExecutionStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  output: string;
  duration: number;
}

export interface ExecutionError {
  stepId: string;
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

export interface KBAnalytics {
  documentId: string;
  views: number;
  searches: number;
  downloads: number;
  shares: number;
  lastAccessed: Date;
  averageRating: number;
  feedbackCount: number;
}

export enum KBCategory {
  INCIDENT_RESPONSE = 'incident_response',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
  TROUBLESHOOTING = 'troubleshooting',
  TRAINING = 'training',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  RUNBOOKS = 'runbooks'
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  PRIVATE = 'private'
}

export interface KBConfig {
  maxVersions: number;
  enableVersioning: boolean;
  enableAISuggestions: boolean;
  searchIndexRefreshInterval: number;
  archiveOldVersions: boolean;
  defaultAccessLevel: AccessLevel;
  requiredReviewers: number;
}

export interface SearchFilters {
  category?: KBCategory;
  tags?: string[];
  createdBy?: string;
  dateRange?: { start: Date; end: Date };
  accessLevel?: AccessLevel;
  isPublished?: boolean;
}
