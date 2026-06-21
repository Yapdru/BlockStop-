/**
 * Voice Analyzer
 * Process voice input and extract commands
 */

export interface VoiceCommand {
  command: "analyze_email" | "scan_file" | "show_dashboard" | "check_threat" | "help";
  parameters: Record<string, any>;
  confidence: number; // 0-1
  rawInput: string;
}

export interface VoiceSession {
  sessionId: string;
  userId: string;
  startedAt: Date;
  language: string;
  isActive: boolean;
  transcripts: Array<{
    text: string;
    timestamp: Date;
    isFinal: boolean;
  }>;
  commands: VoiceCommand[];
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export class VoiceAnalyzer {
  private sessions: Map<string, VoiceSession> = new Map();
  private commandPatterns: Map<string, RegExp> = new Map([
    [
      "analyze_email",
      /(?:analyze|check|scan)\s+(?:email|message|sender)\s*(?:from|named)?\s*([^:]+)/i,
    ],
    [
      "scan_file",
      /(?:scan|analyze|check)\s+(?:file|document)\s+(?:named)?([^,;.!?]+)/i,
    ],
    [
      "show_dashboard",
      /(?:show|display|open|go to)\s+(?:dashboard|home|overview)/i,
    ],
    [
      "check_threat",
      /(?:check|list|show|display)\s+(?:threats|alerts|warnings)/i,
    ],
    ["help", /(?:help|what can|how do|help me)/i],
  ]);

  private commandConfidence: Record<string, number> = {
    analyze_email: 0.9,
    scan_file: 0.85,
    show_dashboard: 0.95,
    check_threat: 0.88,
    help: 0.9,
  };

  /**
   * Start a voice session
   */
  async startSession(userId: string, language: string = "en-US"): Promise<VoiceSession> {
    const sessionId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: VoiceSession = {
      sessionId,
      userId,
      startedAt: new Date(),
      language,
      isActive: true,
      transcripts: [],
      commands: [],
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Process speech recognition result
   */
  async processSpeech(
    sessionId: string,
    result: SpeechRecognitionResult
  ): Promise<VoiceCommand | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Add transcript to session
    session.transcripts.push({
      text: result.transcript,
      timestamp: new Date(),
      isFinal: result.isFinal,
    });

    // Only process final transcripts
    if (!result.isFinal) {
      return null;
    }

    // Analyze speech
    const command = await this.analyzeCommand(result.transcript);

    if (command) {
      session.commands.push(command);
      return command;
    }

    return null;
  }

  /**
   * Analyze voice input and extract command
   */
  async analyzeCommand(transcript: string): Promise<VoiceCommand | null> {
    if (!transcript || transcript.trim().length === 0) {
      return null;
    }

    const normalized = transcript.toLowerCase().trim();

    // Try to match against command patterns
    for (const [commandType, pattern] of this.commandPatterns) {
      const match = normalized.match(pattern);

      if (match) {
        const confidence = this.commandConfidence[commandType] || 0.75;

        const command: VoiceCommand = {
          command: commandType as any,
          parameters: this.extractParameters(commandType, match),
          confidence,
          rawInput: transcript,
        };

        return command;
      }
    }

    return null;
  }

  /**
   * Extract parameters from matched pattern
   */
  private extractParameters(
    commandType: string,
    match: RegExpMatchArray
  ): Record<string, any> {
    const params: Record<string, any> = {};

    switch (commandType) {
      case "analyze_email":
        if (match[1]) {
          params.email = match[1].trim();
        }
        break;

      case "scan_file":
        if (match[1]) {
          params.filename = match[1].trim();
        }
        break;

      case "check_threat":
        params.listThreats = true;
        break;

      case "show_dashboard":
        params.redirectTo = "dashboard";
        break;

      case "help":
        params.showHelp = true;
        break;
    }

    return params;
  }

  /**
   * Get supported commands
   */
  getSupportedCommands(): Array<{
    command: string;
    description: string;
    examples: string[];
  }> {
    return [
      {
        command: "analyze_email",
        description: "Analyze an email for threats",
        examples: [
          "Analyze email from John",
          "Check message from security@example.com",
          "Scan sender phishing@spam.com",
        ],
      },
      {
        command: "scan_file",
        description: "Scan a file for malware",
        examples: [
          "Scan file document.pdf",
          "Check document.docx",
          "Analyze spreadsheet.xlsx",
        ],
      },
      {
        command: "show_dashboard",
        description: "Show dashboard",
        examples: [
          "Show dashboard",
          "Open dashboard",
          "Display home",
          "Go to dashboard",
        ],
      },
      {
        command: "check_threat",
        description: "Check active threats",
        examples: [
          "Show threats",
          "List alerts",
          "Display warnings",
          "Check threats",
        ],
      },
      {
        command: "help",
        description: "Get help with voice commands",
        examples: ["Help", "What can I do?", "How do I use voice?"],
      },
    ];
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<VoiceSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session history
   */
  async getSessionHistory(
    userId: string,
    limit: number = 10
  ): Promise<VoiceSession[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  /**
   * Get command stats
   */
  async getCommandStats(
    sessionId: string
  ): Promise<{
    totalCommands: number;
    commandsByType: Record<string, number>;
    averageConfidence: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const commandsByType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const command of session.commands) {
      commandsByType[command.command] =
        (commandsByType[command.command] || 0) + 1;
      totalConfidence += command.confidence;
    }

    return {
      totalCommands: session.commands.length,
      commandsByType,
      averageConfidence:
        session.commands.length > 0
          ? totalConfidence / session.commands.length
          : 0,
    };
  }

  /**
   * Transcribe audio chunk
   */
  async transcribeAudioChunk(audioData: ArrayBuffer): Promise<SpeechRecognitionResult> {
    // In production, use Web Speech API or cloud service
    // For now, return mock result
    return {
      transcript: "Sample transcription",
      isFinal: false,
      confidence: 0.85,
      alternatives: [
        {
          transcript: "Sample transcription alt",
          confidence: 0.75,
        },
      ],
    };
  }

  /**
   * Detect language from audio
   */
  async detectLanguage(audioData: ArrayBuffer): Promise<string> {
    // In production, use language detection service
    return "en-US";
  }

  /**
   * Get session transcript
   */
  async getSessionTranscript(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return "";
    }

    return session.transcripts.map((t) => t.text).join(" ");
  }

  /**
   * Export session
   */
  async exportSession(sessionId: string, format: "json" | "txt" = "json"): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (format === "json") {
      return JSON.stringify(session, null, 2);
    }

    // TXT format
    let txt = `Voice Session Report\n`;
    txt += `Session ID: ${session.sessionId}\n`;
    txt += `Started: ${session.startedAt.toISOString()}\n`;
    txt += `Language: ${session.language}\n\n`;

    txt += `Transcripts:\n`;
    for (const transcript of session.transcripts) {
      txt += `- "${transcript.text}" (${transcript.timestamp.toISOString()})\n`;
    }

    txt += `\nCommands Executed:\n`;
    for (const command of session.commands) {
      txt += `- ${command.command} (confidence: ${(command.confidence * 100).toFixed(1)}%)\n`;
    }

    return txt;
  }

  /**
   * Clear old sessions
   */
  async clearOldSessions(hoursOld: number = 24): Promise<number> {
    let cleared = 0;
    const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions) {
      if (session.startedAt.getTime() < cutoffTime) {
        this.sessions.delete(sessionId);
        cleared++;
      }
    }

    return cleared;
  }
}

export default VoiceAnalyzer;
