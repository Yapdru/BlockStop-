'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ScanData {
  id: string;
  type: 'email' | 'file';
  timestamp: Date;
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  details: string;
}

export default function BetterBotAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I&apos;m BetterBot AI, your intelligent security assistant. I can analyze your scan data, answer questions about threats, and provide custom security recommendations. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [scanHistory] = useState<ScanData[]>([
    {
      id: '1',
      type: 'email',
      timestamp: new Date(Date.now() - 3600000),
      threatLevel: 'medium',
      details: 'Phishing attempt detected'
    },
    {
      id: '2',
      type: 'file',
      timestamp: new Date(Date.now() - 7200000),
      threatLevel: 'high',
      details: 'Suspicious executable pattern'
    }
  ]);

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

    // Simulate AI response
    setTimeout(() => {
      const botResponses = [
        'Based on your scan history, you have ' + scanHistory.length + ' recent scans. The most critical one was a suspicious executable pattern detected ' + Math.floor((Date.now() - scanHistory[1].timestamp.getTime()) / 3600000) + ' hours ago.',
        'Your email threat detection system has identified one phishing attempt this week. This is below average for your organization. Would you like enhanced email filtering?',
        'Custom threat intelligence for your environment: You&apos;re experiencing threats consistent with ransomware campaigns targeting your industry. I recommend enabling behavioral anomaly detection.',
        'I can help you set up custom security rules. Based on your threat patterns, I&apos;d suggest rules for: credential harvesting detection, lateral movement monitoring, and data exfiltration prevention.'
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 BetterBot AI</h1>
        <p className="text-gray-400">Your intelligent security intelligence assistant (Available on Office & MAX tiers)</p>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded p-3">
            <p className="text-sm font-bold text-blue-400">BlockStop Office</p>
            <p className="text-xs text-gray-400 mt-1">Basic AI queries • Threat analysis • Insights</p>
          </div>
          <div className="flex-1 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600 rounded p-3">
            <p className="text-sm font-bold text-purple-400">BlockStop MAX</p>
            <p className="text-xs text-gray-300 mt-1">Advanced AI • Custom rules • Smart features • ₹5 auto-add</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6 overflow-y-auto space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-gray-100 px-4 py-3 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about threats, request recommendations, or analyze your security posture..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-medium transition"
          >
            Send
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setInputValue('Analyze my recent threat patterns')}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1 rounded transition"
          >
            Analyze threats
          </button>
          <button
            onClick={() => setInputValue('What custom rules should I enable?')}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1 rounded transition"
          >
            Custom rules
          </button>
          <button
            onClick={() => setInputValue('Generate threat intelligence report')}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1 rounded transition"
          >
            Generate report
          </button>
          <button
            onClick={() => setInputValue('What integrations should I add?')}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1 rounded transition"
          >
            Integration advice
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-4 space-y-2">
        <div className="bg-blue-900/20 border border-blue-700 rounded px-4 py-3 text-sm text-blue-400">
          <p>💡 <strong>Pro tip:</strong> Ask BetterBot about your threat patterns, custom security recommendations, or request automatic feature additions.</p>
        </div>
        <div className="bg-purple-900/20 border border-purple-700 rounded px-4 py-3 text-sm text-purple-300">
          <p><strong>MAX Exclusive:</strong> Use smart feature auto-addition (₹5 per feature) to automatically add security capabilities based on AI recommendations. Office users get essential insights only.</p>
        </div>
      </div>
    </div>
  );
}
