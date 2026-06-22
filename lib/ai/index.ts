/**
 * Advanced AI Module Index - Phase 30.4
 * Exports all AI modules for easy integration
 */

// Custom ML Models
export {
  CustomMLModelsManager,
  customMLModelsManager,
  type ModelTrainingConfig,
  type ModelVersion,
  type AnomalyDetectionModel,
  type ThreatClassificationModel,
  type ModelDeployment,
  type ModelRollbackRecord,
  type PredictionResult,
} from './custom-ml-models';

// Threat Simulator
export {
  ThreatSimulator,
  threatSimulator,
  type MITREATTACKTechnique,
  type AttackScenario,
  type SyntheticPayload,
  type PurpleTeamExercise,
  type DefenseEffectivenessTest,
  type SimulationMetrics,
} from './threat-simulator';

// Behavior Predictor
export {
  BehaviorPredictor,
  behaviorPredictor,
  type UserBehaviorProfile,
  type EntityBehaviorProfile,
  type AnomalyScore,
  type InsiderThreatIndicator,
  type MLModel,
} from './behavior-predictor';

// Advanced NLP
export {
  AdvancedNLPAnalyzer,
  advancedNLPAnalyzer,
  type TextAnalysisResult,
  type SocialEngineeringIndicator,
  type SpearPhishingPattern,
  type EmailAnalysis,
} from './advanced-nlp';

/**
 * Initialize all AI modules
 */
export function initializeAIModules() {
  return {
    ml: customMLModelsManager,
    threats: threatSimulator,
    behavior: behaviorPredictor,
    nlp: advancedNLPAnalyzer,
  };
}

/**
 * Get module status
 */
export function getAIModuleStatus() {
  return {
    customMLModels: {
      status: 'active',
      description: 'Custom ML model training, deployment, and management',
      features: ['model training', 'version control', 'A/B testing', 'auto-rollback', 'canary deployment'],
    },
    threatSimulation: {
      status: 'active',
      description: 'Threat simulation and purple team exercises',
      features: ['MITRE ATT&CK scenarios', 'payload generation', 'defense testing', 'metrics & analytics'],
    },
    behavioralPrediction: {
      status: 'active',
      description: 'UEBA and insider threat detection',
      features: ['user profiling', 'entity monitoring', 'anomaly detection', 'insider threat detection'],
    },
    advancedNLP: {
      status: 'active',
      description: 'Deep text analysis and threat pattern recognition',
      features: ['sentiment analysis', 'social engineering detection', 'phishing detection', 'entity extraction'],
    },
  };
}
