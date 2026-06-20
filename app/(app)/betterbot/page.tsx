'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Card, Badge } from '@/components';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function BetterBotAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m BetterBot AI, your intelligent security assistant. I can analyze your scan data, answer questions about threats, and provide custom recommendations. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const responses = [
        'Based on your recent scans, I recommend enabling enhanced email filtering to catch phishing attempts earlier.',
        'Your threat patterns indicate consistent ransomware targeting. I suggest enabling behavioral anomaly detection.',
        'Would you like me to generate a custom threat intelligence report based on your activity?',
        'I can help set up custom security rules for credential harvesting and lateral movement monitoring.'
      ];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
  };

  const quickPrompts = [
    { label: 'Analyze threats', prompt: 'Analyze my recent threat patterns' },
    { label: 'Custom rules', prompt: 'What custom rules should I enable?' },
    { label: 'Gen report', prompt: 'Generate threat intelligence report' },
    { label: 'Integrations', prompt: 'What integrations should I add?' }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0 flex flex-col">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-h3 font-bold text-neutral-900">🤖 BetterBot AI</h1>
          </div>
          <p className="text-sm text-neutral-600">Your intelligent security assistant</p>
        </div>
      </header>

      {/* Tier Info */}
      <div className="container-max py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md" className="border-primary-200 bg-primary-50">
            <p className="font-semibold text-primary-900 text-sm mb-1">📚 BlockStop Office</p>
            <p className="text-xs text-primary-700">Basic AI queries, threat analysis, security insights</p>
          </Card>
          <Card padding="md" className="border-accent-300 bg-accent-50">
            <p className="font-semibold text-accent-900 text-sm mb-1">⭐ BlockStop MAX</p>
            <p className="text-xs text-accent-700">Advanced AI, custom rules, smart feature auto-add (₹5)</p>
          </Card>
        </div>
      </div>

      {/* Chat Area */}
      <div className="container-max flex-1 flex flex-col py-4">
        {/* Messages */}
        <div className="flex-1 bg-neutral-0 border border-neutral-200 rounded-lg p-6 mb-4 overflow-y-auto space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-900'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-neutral-600'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 text-neutral-900 px-4 py-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card padding="md" className="border-neutral-200">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about threats, security recommendations..."
                className="input flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                variant="primary"
                size="md"
              >
                Send
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt.prompt}
                  onClick={() => setInputValue(prompt.prompt)}
                  className="text-xs font-medium px-3 py-1 bg-neutral-100 text-neutral-700 hover:bg-primary-100 hover:text-primary-700 rounded-full transition"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Info Banners */}
      <div className="container-max py-4 space-y-3">
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
          <p className="text-sm text-primary-900">
            💡 <strong>Pro tip:</strong> Ask me about your threat patterns, security recommendations, or custom rules.
          </p>
        </div>
        <div className="bg-accent-50 border border-accent-200 rounded-lg px-4 py-3">
          <p className="text-sm text-accent-900">
            <strong>MAX Feature:</strong> Smart feature auto-addition automatically adds security capabilities based on AI recommendations (₹5 per feature).
          </p>
        </div>
      </div>
    </div>
  );
}
