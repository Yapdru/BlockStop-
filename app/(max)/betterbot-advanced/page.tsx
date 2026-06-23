'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/**
 * BetterBot Advanced AI Chat Interface
 * Advanced AI threat analysis and pattern recognition
 */
export default function BetterBotAdvancedPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threatAnalysis, setThreatAnalysis] = useState<any>(null);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      // Call BetterBot API
      const response = await fetch('/api/max/betterbot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.response || 'Analysis complete',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.threatAnalysis) {
        setThreatAnalysis(data.threatAnalysis);
      }
    } catch (error) {
      console.error('Error analyzing threat:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error analyzing threat' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BetterBot Advanced AI</h1>
          <p className="text-gray-600">Advanced threat analysis and pattern recognition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Threat Analysis Chat</CardTitle>
            <CardDescription>Ask about threats, patterns, and security insights</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-gray-500 mb-2">Start by asking about:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Threat analysis</li>
                    <li>• Pattern detection</li>
                    <li>• Behavioral anomalies</li>
                    <li>• Incident recommendations</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-auto max-w-xs'
                      : 'bg-gray-100 max-w-xs'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    {msg.role === 'user' ? 'You' : 'BetterBot'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
            {loading && (
              <div className="p-3 bg-gray-100 rounded-lg max-w-xs">
                <p className="text-sm text-gray-600">Analyzing...</p>
              </div>
            )}
          </CardContent>
          <div className="border-t p-4 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about threats, patterns, or security insights..."
              rows={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Send'}
            </Button>
          </div>
        </Card>

        {/* Analysis Results */}
        <Card className="h-[600px] overflow-y-auto">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Threat intelligence summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {threatAnalysis ? (
              <>
                <div>
                  <label className="text-sm font-semibold">Threat Level</label>
                  <p className="text-lg font-bold text-red-600">
                    {threatAnalysis.threatLevel?.toUpperCase() || 'UNKNOWN'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold">Confidence</label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(threatAnalysis.confidence || 0) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {((threatAnalysis.confidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>

                {threatAnalysis.recommendations && (
                  <div>
                    <label className="text-sm font-semibold">Recommendations</label>
                    <ul className="text-sm space-y-1 mt-2">
                      {threatAnalysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {threatAnalysis.mitreTechniques && (
                  <div>
                    <label className="text-sm font-semibold">MITRE Techniques</label>
                    <div className="text-xs space-y-1 mt-2">
                      {threatAnalysis.mitreTechniques.slice(0, 3).map((tech: any, idx: number) => (
                        <div key={idx} className="bg-gray-100 p-2 rounded">
                          <p className="font-semibold">{tech.id}: {tech.name}</p>
                          <p className="text-gray-600">{tech.tactic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center">
                  Send a message to see threat analysis results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>BetterBot Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Threat Detection', icon: '🎯', desc: 'Advanced threat analysis' },
              { title: 'Pattern Analysis', icon: '📊', desc: 'Behavioral pattern learning' },
              { title: 'NLP Processing', icon: '💬', desc: 'Natural language understanding' },
              { title: 'Recommendations', icon: '🔧', desc: 'Actionable insights' },
              { title: 'Timeline Analysis', icon: '📅', desc: 'Event sequence analysis' },
              { title: 'Correlation', icon: '🔗', desc: 'Event correlation' },
              { title: 'Insights', icon: '💡', desc: 'Deep insights generation' },
              { title: 'Scoring', icon: '⭐', desc: 'Risk scoring' },
            ].map((cap, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                <p className="text-2xl mb-2">{cap.icon}</p>
                <p className="font-semibold text-sm">{cap.title}</p>
                <p className="text-xs text-gray-600">{cap.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
