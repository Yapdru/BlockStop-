// Phase 28.1 - Natural Language Threat Analysis Chat Interface
'use client';

import { useEffect, useRef, useState } from 'react';
import { nlpAnalyzer, NLPResponse, QueryIntent } from '@/lib/ai/nlp-analyzer';
import { Card } from '@/components/Card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: NLPResponse;
}

export default function ThreatChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId] = useState('demo-user');
  const [organizationId] = useState('demo-org');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await nlpAnalyzer.processQuery(userId, organizationId, input);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getIntentIcon = (intent: QueryIntent) => {
    switch (intent) {
      case QueryIntent.THREAT_ANALYSIS:
        return '🔍';
      case QueryIntent.THREAT_PREDICTION:
        return '📈';
      case QueryIntent.THREAT_INTELLIGENCE:
        return '📚';
      case QueryIntent.RISK_ASSESSMENT:
        return '⚠️';
      case QueryIntent.INCIDENT_RESPONSE:
        return '🚨';
      case QueryIntent.SECURITY_BEST_PRACTICES:
        return '🛡️';
      default:
        return '💬';
    }
  };

  const getSampleQueries = () => [
    'Is 192.168.1.1 a threat?',
    'Predict threats for next 7 days',
    'What threats might we face?',
    'Is malware.example.com safe?',
    'Best practices for email security',
    'How to respond to a breach?',
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Threat Intelligence Chat</h1>
          <p className="text-sm text-gray-600">
            Ask questions about threats in plain English - AI-powered threat analysis
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <div className="text-5xl">🤖</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Threat Intelligence Chat</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Ask me anything about threats, security risks, and best practices. I'll analyze your questions
                  and provide actionable insights powered by AI and threat intelligence.
                </p>
              </div>

              {/* Sample Queries */}
              <div className="pt-4">
                <p className="text-sm font-medium text-gray-600 mb-3">Try asking:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getSampleQueries().map((query) => (
                    <button
                      key={query}
                      onClick={() => {
                        setInput(query);
                        setTimeout(() => {
                          document.querySelector('form')?.dispatchEvent(
                            new Event('submit', { bubbles: true })
                          );
                        }, 0);
                      }}
                      className="p-3 bg-white border rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left text-sm"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                    : 'bg-white border rounded-lg rounded-tl-none shadow-sm'
                } p-4`}
              >
                {message.role === 'assistant' && message.response && (
                  <div className="mb-3 pb-3 border-b flex items-center gap-2">
                    <span>{getIntentIcon(message.response.intent)}</span>
                    <span className="text-xs font-semibold text-gray-600 capitalize">
                      {message.response.intent.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confidence: {Math.round(message.response.confidence)}%
                    </span>
                  </div>
                )}

                <div className={message.role === 'user' ? 'text-white' : 'text-gray-800'}>
                  {message.content.split('\n').map((line, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      {/* Simple markdown-like rendering */}
                      {line.startsWith('**') && line.endsWith('**') ? (
                        <p className={`font-bold ${message.role === 'assistant' ? 'text-gray-900' : ''}`}>
                          {line.replace(/\*\*/g, '')}
                        </p>
                      ) : line.startsWith('- ') ? (
                        <li className="ml-4">{line.substring(2)}</li>
                      ) : line.startsWith('1. ') ? (
                        <ol className="ml-4 list-decimal">
                          <li>{line.substring(3)}</li>
                        </ol>
                      ) : (
                        <p>{line}</p>
                      )}
                    </div>
                  ))}
                </div>

                {message.role === 'assistant' && message.response?.threatData && message.response.threatData.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Threat Data Found:</p>
                    {message.response.threatData.map((threat, idx) => (
                      <div key={idx} className="bg-red-50 p-2 rounded text-xs text-red-800">
                        <p className="font-semibold">{threat.value}</p>
                        <p>Severity: {threat.severity}</p>
                        <p>Confidence: {threat.confidence}%</p>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && message.response?.followUpQuestions && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Follow-up questions:</p>
                    {message.response.followUpQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(question)}
                        className="block w-full text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 transition"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-lg rounded-tl-none p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about threats, security risks, or best practices..."
              disabled={loading}
              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              {loading ? 'Analyzing...' : 'Send'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Ask about specific IPs, domains, threats, or request recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
