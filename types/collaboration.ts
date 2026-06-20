export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  description: string;
  assignedTo?: string[];
  tags: string[];
}

export interface ChatMessage {
  id: string;
  incidentId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  reactions?: Record<string, string[]>;
  edited?: boolean;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'detection' | 'investigation' | 'action' | 'note';
  author: string;
  metadata?: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  incidentId: string;
  name: string;
  type: 'file' | 'log' | 'screenshot' | 'network' | 'system';
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  url: string;
  tags: string[];
  annotations?: Annotation[];
}

export interface Annotation {
  id: string;
  evidenceId: string;
  userId: string;
  userName: string;
  text: string;
  position?: { x: number; y: number };
  color?: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  incidentId: string;
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'analyst' | 'manager' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
  avatar?: string;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: PlaybookStep[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  tools: string[];
  expectedOutput: string;
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  incidentType: string;
  steps: RunbookStep[];
  createdAt: Date;
}

export interface RunbookStep {
  id: string;
  order: number;
  title: string;
  command?: string;
  description: string;
  expectedResult: string;
}

export interface LessonLearned {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  createdAt: Date;
  author: string;
}
