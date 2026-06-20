import { AISuggestion } from './types';
import { KB_CONFIG, KB_SUGGESTION_TYPES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface SuggestionContext {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  documentCategory: string;
  documentTags: string[];
  recentAccess: number;
  userRole: string;
}

export class AISuggestions {
  private suggestions: Map<string, AISuggestion[]> = new Map();
  private suggestionFeedback: Map<string, { accepted: number; rejected: number }> = new Map();

  async generateSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    const improvementSuggestions = await this.generateImprovementSuggestions(context);
    suggestions.push(...improvementSuggestions);

    const relatedContentSuggestions = await this.generateRelatedContentSuggestions(context);
    suggestions.push(...relatedContentSuggestions);

    const automationSuggestions = await this.generateAutomationSuggestions(context);
    suggestions.push(...automationSuggestions);

    const trainingSuggestions = await this.generateTrainingSuggestions(context);
    suggestions.push(...trainingSuggestions);

    const filtered = suggestions
      .filter(s => s.confidence >= KB_CONFIG.MIN_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, KB_CONFIG.MAX_SUGGESTIONS_PER_DOCUMENT);

    this.suggestions.set(context.documentId, filtered);

    return filtered;
  }

  private async generateImprovementSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    const contentLength = context.documentContent.length;
    if (contentLength < 500) {
      suggestions.push({
        id: uuidv4(),
        type: 'improvement',
        title: 'Expand Content',
        description: 'Document content is relatively brief. Consider adding more details, examples, or procedures.',
        confidence: 0.75,
        targetDocument: context.documentId,
        suggestedChanges: 'Add additional sections with examples and step-by-step instructions',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    const hasVerification = context.documentContent.toLowerCase().includes('verify') ||
                          context.documentContent.toLowerCase().includes('check');
    if (!hasVerification) {
      suggestions.push({
        id: uuidv4(),
        type: 'improvement',
        title: 'Add Verification Steps',
        description: 'Consider adding verification or testing steps to validate the procedures.',
        confidence: 0.82,
        targetDocument: context.documentId,
        suggestedChanges: 'Include a "Verification" section with concrete checks',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    if (context.documentTags.length < 3) {
      suggestions.push({
        id: uuidv4(),
        type: 'improvement',
        title: 'Add More Tags',
        description: 'Document has few tags. More tags improve discoverability.',
        confidence: 0.68,
        targetDocument: context.documentId,
        suggestedChanges: `Add tags like: ${this.suggestTags(context).join(', ')}`,
        createdAt: new Date(),
        status: 'pending',
      });
    }

    return suggestions;
  }

  private async generateRelatedContentSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    const relatedKeywords = this.extractKeywords(context.documentContent);

    if (relatedKeywords.length > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'related-content',
        title: 'Link Related Documents',
        description: 'Found potential related content based on keywords and category.',
        confidence: 0.72,
        targetDocument: context.documentId,
        suggestedChanges: `Link to documents about: ${relatedKeywords.slice(0, 3).join(', ')}`,
        createdAt: new Date(),
        status: 'pending',
      });
    }

    return suggestions;
  }

  private async generateAutomationSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    const hasSteps = context.documentContent.toLowerCase().match(/step|procedure|action/gi);
    const isRepetitive = hasSteps && hasSteps.length > 5;

    if (isRepetitive && context.documentCategory.includes('runbook')) {
      suggestions.push({
        id: uuidv4(),
        type: 'automation',
        title: 'Consider Automation',
        description: 'This procedure has repetitive steps that could be automated.',
        confidence: 0.78,
        targetDocument: context.documentId,
        suggestedChanges: 'Create automation scripts for repetitive manual steps',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    if (context.recentAccess > 50) {
      suggestions.push({
        id: uuidv4(),
        type: 'automation',
        title: 'High-Volume Procedure',
        description: 'This procedure is frequently used. Automation could save time.',
        confidence: 0.81,
        targetDocument: context.documentId,
        suggestedChanges: 'Develop automated tooling for frequently accessed procedure',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    return suggestions;
  }

  private async generateTrainingSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    const complexityIndicators = (context.documentContent.match(/complex|advanced|critical|high-risk/gi) || []).length;

    if (complexityIndicators > 2) {
      suggestions.push({
        id: uuidv4(),
        type: 'training',
        title: 'Create Training Material',
        description: 'This is a complex procedure that would benefit from training documentation.',
        confidence: 0.76,
        targetDocument: context.documentId,
        suggestedChanges: 'Develop training guide with prerequisites and learning objectives',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    const prerequisiteMentions = (context.documentContent.match(/prerequisite|require|before|prior/gi) || []).length;
    if (prerequisiteMentions > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'training',
        title: 'Document Prerequisites',
        description: 'Document references prerequisites. Consider creating prerequisite guides.',
        confidence: 0.70,
        targetDocument: context.documentId,
        suggestedChanges: 'Create dedicated prerequisite documentation',
        createdAt: new Date(),
        status: 'pending',
      });
    }

    return suggestions;
  }

  async acceptSuggestion(suggestionId: string): Promise<AISuggestion | null> {
    const suggestion = this.findSuggestion(suggestionId);
    if (!suggestion) return null;

    suggestion.status = 'accepted';

    const feedback = this.suggestionFeedback.get(suggestion.targetDocument) || { accepted: 0, rejected: 0 };
    feedback.accepted++;
    this.suggestionFeedback.set(suggestion.targetDocument, feedback);

    return suggestion;
  }

  async rejectSuggestion(suggestionId: string): Promise<AISuggestion | null> {
    const suggestion = this.findSuggestion(suggestionId);
    if (!suggestion) return null;

    suggestion.status = 'rejected';

    const feedback = this.suggestionFeedback.get(suggestion.targetDocument) || { accepted: 0, rejected: 0 };
    feedback.rejected++;
    this.suggestionFeedback.set(suggestion.targetDocument, feedback);

    return suggestion;
  }

  async getSuggestions(documentId: string): Promise<AISuggestion[]> {
    return this.suggestions.get(documentId) || [];
  }

  async getSuggestionsByType(type: string, limit: number = 10): Promise<AISuggestion[]> {
    const allSuggestions: AISuggestion[] = [];

    this.suggestions.forEach(sug => {
      allSuggestions.push(...sug);
    });

    return allSuggestions
      .filter(s => s.type === type && s.status === 'pending')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  async getFeedbackScore(documentId: string): Promise<number> {
    const feedback = this.suggestionFeedback.get(documentId) || { accepted: 0, rejected: 0 };
    const total = feedback.accepted + feedback.rejected;

    if (total === 0) return 0.5;

    return feedback.accepted / total;
  }

  private findSuggestion(suggestionId: string): AISuggestion | null {
    for (const suggestions of this.suggestions.values()) {
      const found = suggestions.find(s => s.id === suggestionId);
      if (found) return found;
    }
    return null;
  }

  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4 && !this.isCommonWord(w));

    const freq = new Map<string, number>();
    words.forEach(w => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });

    return Array.from(freq.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 5);
  }

  private suggestTags(context: SuggestionContext): string[] {
    const categoryTag = context.documentCategory.replace(/_/g, '-');
    const accessTag = context.recentAccess > 50 ? 'frequently-used' : 'rarely-used';

    return [categoryTag, accessTag, 'needs-review'];
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'that', 'this', 'with', 'from', 'have', 'will', 'your', 'which',
      'been', 'when', 'there', 'their', 'more', 'only', 'just', 'some', 'what',
    ]);

    return commonWords.has(word);
  }

  async getSuggestionStats(): Promise<{
    totalSuggestions: number;
    pendingSuggestions: number;
    acceptedSuggestions: number;
    rejectedSuggestions: number;
    avgAcceptanceRate: number;
  }> {
    let total = 0, pending = 0, accepted = 0, rejected = 0;

    this.suggestions.forEach(sug => {
      total += sug.length;
      pending += sug.filter(s => s.status === 'pending').length;
      accepted += sug.filter(s => s.status === 'accepted').length;
      rejected += sug.filter(s => s.status === 'rejected').length;
    });

    const feedbackScores = Array.from(this.suggestionFeedback.values());
    const avgRate =
      feedbackScores.length > 0
        ? feedbackScores.reduce((sum, f) => sum + f.accepted / (f.accepted + f.rejected), 0) / feedbackScores.length
        : 0;

    return {
      totalSuggestions: total,
      pendingSuggestions: pending,
      acceptedSuggestions: accepted,
      rejectedSuggestions: rejected,
      avgAcceptanceRate: avgRate,
    };
  }
}
