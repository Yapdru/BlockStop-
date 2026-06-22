/**
 * Automation & Orchestration Module
 * Exports workflow engine, scheduler, and incident automation
 */

export { WorkflowEngine, type WorkflowDefinition, type WorkflowExecution, type WorkflowAction, type TriggerType, type ActionType } from './workflow-engine';
export { Scheduler, type ScheduledJob, type JobExecution, type JobHistory, type FailedJobNotification } from './scheduler';
export { IncidentAutomationEngine, type AutoIncidentRule, type AutoAssignmentRule, type AutoEscalationRule, type RemediationPlaybook } from './incident-automation';

// Re-export as default for convenience
import WorkflowEngine from './workflow-engine';
import Scheduler from './scheduler';
import IncidentAutomationEngine from './incident-automation';

export default {
  WorkflowEngine,
  Scheduler,
  IncidentAutomationEngine,
};
