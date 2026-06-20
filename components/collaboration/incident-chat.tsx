"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/collaboration";

interface IncidentChatProps {
  incidentId: string;
  messages: ChatMessage[];
  onSendMessage?: (content: string) => void;
  currentUserId: string;
  currentUserName: string;
}

export default function IncidentChat({
  incidentId,
  messages,
  onSendMessage,
  currentUserId,
  currentUserName,
}: IncidentChatProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      if (onSendMessage) {
        onSendMessage(input);
      } else {
        const res = await fetch(`/api/incidents/${incidentId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input }),
        });
        if (!res.ok) throw new Error("Failed to send message");
      }
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-light-border">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.userId === currentUserId ? "justify-end" : ""
              }`}
            >
              {msg.userId !== currentUserId && (
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                  {msg.userName.charAt(0)}
                </div>
              )}

              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.userId === currentUserId
                    ? "bg-primary-600 text-white"
                    : "bg-light-surface text-gray-900"
                }`}
              >
                {msg.userId !== currentUserId && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {msg.userName}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
                {msg.edited && (
                  <p className="text-xs opacity-70 mt-1">(edited)</p>
                )}
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <div className="border-t border-light-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
