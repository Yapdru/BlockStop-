'use client';

/**
 * MAX Phase 31.1 - AI Insights Dashboard
 * AI-powered insights and multi-turn conversations with BetterBot V2
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import BetterBotV2 from '@/lib/max/phase31/betterbot-v2';
import { ConversationContext, BotResponse } from '@/types/max-phase31';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
}

const AIInsightsDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationContext | null>(null);
  const [botEngine] = useState(() => new BetterBotV2());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Start conversation
  const startConversation = useCallback(() => {
    const ctx = botEngine.startConversation('user-123');
    setConversation(ctx);
    setSessionStarted(true);

    // Add greeting
    setMessages([
      {
        id: 'greeting',
        role: 'assistant',
        content:
          'Hello! I\'m BetterBot V2, your AI-powered security assistant. I can help you with threat analysis, incident investigation, malware analysis, and security recommendations. What would you like to know?',
        timestamp: new Date(),
      },
    ]);
  }, [botEngine]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !conversation || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await botEngine.processMessage(
        conversation.sessionId,
        input
      );

      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        toolCalls: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to process message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, conversation, botEngine, loading]);

  // Quick prompts
  const quickPrompts = [
    'Analyze threat indicators for my environment',
    'What are the latest attack techniques?',
    'How can I improve my security posture?',
    'Investigate suspicious network activity',
    'Generate a threat report for today',
  ];

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-4">BetterBot V2</h1>
            <p className="text-slate-400 mb-8">
              Your advanced AI-powered security assistant for threat intelligence, incident response, and security operations.
            </p>
            <button
              onClick={startConversation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AI-Powered Insights</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            BetterBot V2: Context-aware security intelligence and threat analysis
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-slate-400 text-lg">No messages yet</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-700 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {message.content}
                    </p>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-300">
                        <p className="font-semibold mb-1">Tools Used:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.toolCalls.map((tool, idx) => (
                            <span key={idx} className="bg-slate-600 px-2 py-1 rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if no messages) */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-sm text-slate-400 mb-3">Suggested queries:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt);
                    }}
                    className="text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-700 bg-slate-800 p-4 sm:p-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me about threats, incidents, malware, or security recommendations..."
                className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="hidden sm:inline">Send</span>
                <span className="text-xl">→</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press Shift+Enter for new line, Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
