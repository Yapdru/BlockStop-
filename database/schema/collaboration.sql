-- Collaboration Schema
-- Tables for incidents, evidence, annotations, and team communication

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  threat_type VARCHAR(50),
  threat_actor_id UUID,
  source_ip INET,
  affected_systems TEXT[],
  created_by VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  INDEX idx_incidents_status (status),
  INDEX idx_incidents_severity (severity),
  INDEX idx_incidents_created_at (created_at DESC)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  evidence_type VARCHAR(50) NOT NULL,
  url VARCHAR(1024),
  file_path VARCHAR(1024),
  file_hash VARCHAR(256),
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chain_of_custody JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_evidence_incident_id (incident_id),
  INDEX idx_evidence_type (evidence_type),
  INDEX idx_evidence_uploaded_at (uploaded_at DESC)
);

-- Annotations table
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL,
  annotation_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  position JSONB,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
  INDEX idx_annotations_evidence_id (evidence_id),
  INDEX idx_annotations_resolved (resolved)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  channel_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  content TEXT NOT NULL,
  content_encrypted BOOLEAN DEFAULT FALSE,
  mentions TEXT[] DEFAULT ARRAY[]::text[],
  attachments TEXT[] DEFAULT ARRAY[]::text[],
  thread_id UUID,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_chat_incident_id (incident_id),
  INDEX idx_chat_channel_id (channel_id),
  INDEX idx_chat_thread_id (thread_id),
  INDEX idx_chat_created_at (created_at DESC)
);

-- Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  reaction_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  INDEX idx_reactions_message_id (message_id),
  UNIQUE(message_id, reaction_type, user_id)
);

-- Team assignments table
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by VARCHAR(255),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_assignments_incident_id (incident_id),
  INDEX idx_assignments_user_id (user_id),
  INDEX idx_assignments_status (status)
);

-- Activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_activity_incident_id (incident_id),
  INDEX idx_activity_user_id (user_id),
  INDEX idx_activity_created_at (created_at DESC)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  status VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_audit_incident_id (incident_id),
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_created_at (created_at DESC)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  resource_id VARCHAR(255),
  resource_type VARCHAR(50),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_read (read),
  INDEX idx_notifications_created_at (created_at DESC)
);

-- Presence tracking table
CREATE TABLE IF NOT EXISTS presence_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'offline',
  location VARCHAR(255),
  viewing_resource_type VARCHAR(50),
  viewing_resource_id VARCHAR(255),
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  session_type VARCHAR(50) NOT NULL,
  title VARCHAR(512),
  participants TEXT[] NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  recording_url VARCHAR(1024),
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_sessions_incident_id (incident_id),
  INDEX idx_sessions_started_at (started_at DESC)
);
