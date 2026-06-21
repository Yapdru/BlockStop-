/**
 * Voice Actions
 * Execute actions based on voice commands
 */

export interface VoiceAction {
  id: string;
  userId: string;
  sessionId: string;
  commandType:
    | "analyze_email"
    | "scan_file"
    | "show_dashboard"
    | "check_threat"
    | "help";
  parameters: Record<string, any>;
  executedAt: Date;
  status: "pending" | "executing" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface ActionResponse {
  actionId: string;
  success: boolean;
  message: string;
  audioResponse: string;
  deepLink?: string;
  data?: any;
}

export class VoiceActionExecutor {
  private actions: Map<string, VoiceAction> = new Map();
  private actionHistory: VoiceAction[] = [];

  /**
   * Execute voice command
   */
  async executeCommand(
    userId: string,
    sessionId: string,
    commandType: string,
    parameters: Record<string, any>
  ): Promise<ActionResponse> {
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const action: VoiceAction = {
      id: actionId,
      userId,
      sessionId,
      commandType: commandType as any,
      parameters,
      executedAt: new Date(),
      status: "executing",
    };

    this.actions.set(actionId, action);
    this.actionHistory.push(action);

    try {
      const result = await this.executeAction(commandType, parameters);

      action.status = "completed";
      action.result = result;

      return {
        actionId,
        success: true,
        message: result.message,
        audioResponse: result.audioResponse,
        deepLink: result.deepLink,
        data: result.data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      action.status = "failed";
      action.error = errorMessage;

      return {
        actionId,
        success: false,
        message: `Error executing command: ${errorMessage}`,
        audioResponse: `Sorry, I encountered an error. ${errorMessage}`,
      };
    }
  }

  /**
   * Execute specific action
   */
  private async executeAction(
    commandType: string,
    parameters: Record<string, any>
  ): Promise<{
    message: string;
    audioResponse: string;
    deepLink?: string;
    data?: any;
  }> {
    switch (commandType) {
      case "analyze_email":
        return this.handleAnalyzeEmail(parameters);

      case "scan_file":
        return this.handleScanFile(parameters);

      case "show_dashboard":
        return this.handleShowDashboard(parameters);

      case "check_threat":
        return this.handleCheckThreat(parameters);

      case "help":
        return this.handleHelp(parameters);

      default:
        throw new Error(`Unknown command type: ${commandType}`);
    }
  }

  /**
   * Handle "analyze email" command
   */
  private async handleAnalyzeEmail(parameters: Record<string, any>): Promise<{
    message: string;
    audioResponse: string;
    deepLink?: string;
  }> {
    const email = parameters.email || "unknown sender";

    console.log(`[Voice] Analyzing email from: ${email}`);

    // In production: trigger email analysis
    return {
      message: `Analyzing email from ${email}`,
      audioResponse: `Starting analysis of email from ${email}. This may take a moment.`,
      deepLink: `/analysis/email?sender=${encodeURIComponent(email)}`,
    };
  }

  /**
   * Handle "scan file" command
   */
  private async handleScanFile(parameters: Record<string, any>): Promise<{
    message: string;
    audioResponse: string;
    deepLink?: string;
  }> {
    const filename = parameters.filename || "file";

    console.log(`[Voice] Scanning file: ${filename}`);

    // In production: trigger file scan
    return {
      message: `Scanning file: ${filename}`,
      audioResponse: `Starting scan of ${filename}. Please wait while we analyze the file.`,
      deepLink: `/analysis/file?name=${encodeURIComponent(filename)}`,
    };
  }

  /**
   * Handle "show dashboard" command
   */
  private async handleShowDashboard(): Promise<{
    message: string;
    audioResponse: string;
    deepLink?: string;
  }> {
    console.log("[Voice] Opening dashboard");

    return {
      message: "Opening dashboard",
      audioResponse: "Opening your security dashboard.",
      deepLink: "/dashboard",
    };
  }

  /**
   * Handle "check threat" command
   */
  private async handleCheckThreat(): Promise<{
    message: string;
    audioResponse: string;
    deepLink?: string;
    data?: any;
  }> {
    console.log("[Voice] Checking active threats");

    // In production: get real threat data
    const mockThreats = {
      critical: 2,
      high: 5,
      medium: 12,
      low: 45,
    };

    let audioResponse = "You have ";
    const threatList = [];

    if (mockThreats.critical > 0) {
      threatList.push(`${mockThreats.critical} critical threat`);
    }
    if (mockThreats.high > 0) {
      threatList.push(`${mockThreats.high} high severity threat`);
    }

    if (threatList.length > 0) {
      audioResponse += threatList.join(" and ") + ".";
    } else {
      audioResponse += "no active threats. Your system is secure.";
    }

    return {
      message: "Checking active threats",
      audioResponse,
      deepLink: "/dashboard?tab=threats",
      data: mockThreats,
    };
  }

  /**
   * Handle "help" command
   */
  private async handleHelp(): Promise<{
    message: string;
    audioResponse: string;
  }> {
    const helpText =
      "I can help you with analyzing emails, scanning files, viewing your dashboard, and checking threats. Try saying 'Analyze email', 'Scan file', 'Show dashboard', or 'Check threats'.";

    return {
      message: "Displaying help",
      audioResponse: helpText,
    };
  }

  /**
   * Get action history
   */
  async getActionHistory(userId: string, limit: number = 50): Promise<VoiceAction[]> {
    return this.actionHistory
      .filter((a) => a.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get action status
   */
  async getActionStatus(actionId: string): Promise<VoiceAction | null> {
    return this.actions.get(actionId) || null;
  }

  /**
   * Cancel action
   */
  async cancelAction(actionId: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (action && action.status === "executing") {
      action.status = "failed";
      action.error = "Cancelled by user";
      return true;
    }
    return false;
  }

  /**
   * Get session actions
   */
  async getSessionActions(sessionId: string): Promise<VoiceAction[]> {
    return this.actionHistory.filter((a) => a.sessionId === sessionId);
  }

  /**
   * Get action statistics
   */
  async getActionStats(userId: string): Promise<{
    totalActions: number;
    completedActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    successRate: number;
  }> {
    const userActions = this.actionHistory.filter((a) => a.userId === userId);

    const actionsByType: Record<string, number> = {};
    let completedCount = 0;
    let failedCount = 0;

    for (const action of userActions) {
      actionsByType[action.commandType] =
        (actionsByType[action.commandType] || 0) + 1;

      if (action.status === "completed") {
        completedCount++;
      } else if (action.status === "failed") {
        failedCount++;
      }
    }

    const successRate =
      userActions.length > 0
        ? Math.round((completedCount / userActions.length) * 100)
        : 0;

    return {
      totalActions: userActions.length,
      completedActions: completedCount,
      failedActions: failedCount,
      actionsByType,
      successRate,
    };
  }

  /**
   * Export action log
   */
  async exportActionLog(
    userId: string,
    format: "json" | "csv" = "json"
  ): Promise<string> {
    const userActions = this.actionHistory.filter((a) => a.userId === userId);

    if (format === "json") {
      return JSON.stringify(userActions, null, 2);
    }

    // CSV format
    let csv = "Timestamp,Command,Status,Result\n";
    for (const action of userActions) {
      csv += `${action.executedAt.toISOString()},${action.commandType},${action.status},"${
        action.error || (action.result?.message || "")
      }"\n`;
    }

    return csv;
  }

  /**
   * Clear old actions
   */
  async clearOldActions(daysOld: number = 30): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let cleared = 0;

    this.actionHistory = this.actionHistory.filter((action) => {
      if (action.executedAt.getTime() < cutoffTime) {
        this.actions.delete(action.id);
        cleared++;
        return false;
      }
      return true;
    });

    return cleared;
  }

  /**
   * Get suggested commands for user
   */
  async getSuggestedCommands(userId: string): Promise<string[]> {
    const stats = await this.getActionStats(userId);

    // Suggest commands based on usage
    const suggestions = [];

    // If user frequently uses dashboard, suggest it
    if ((stats.actionsByType["show_dashboard"] || 0) > 5) {
      suggestions.push("Show my dashboard");
    }

    // If user frequently scans files, suggest it
    if ((stats.actionsByType["scan_file"] || 0) > 5) {
      suggestions.push("Scan a file");
    }

    // If user has threats, suggest checking them
    if ((stats.actionsByType["check_threat"] || 0) > 3) {
      suggestions.push("Check threats");
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push("Analyze email");
      suggestions.push("Scan file");
      suggestions.push("Show dashboard");
    }

    return suggestions;
  }
}

export default VoiceActionExecutor;
