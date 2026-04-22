import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000") + "/api";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`${API}/ai/chat/suggestions`);
        if (res.data.success) {
          setSuggestions(res.data.suggestions);
        }
      } catch (e) {
        setSuggestions([
          "Show all active buses",
          "What routes are available?",
          "Help me find a bus"
        ]);
      }
    };
    fetchSuggestions();
  }, []);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hi there! 👋 I'm RouteFlow AI Assistant. I can help you find buses, check ETAs, and explore routes. What would you like to know?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    // Add user message
    const userMsg = { role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/chat`, { message: msg });
      const aiMsg = {
        role: "assistant",
        content: res.data.response,
        method: res.data.method,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you? 🚌",
      timestamp: new Date()
    }]);
  };

  return (
    <>
      <style>{`
        .ai-chat-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.45),
                      0 0 0 0 rgba(99, 102, 241, 0.4);
          z-index: 10000;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: chatFabPulse 2.5s infinite;
        }
        .ai-chat-fab:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.55);
        }
        .ai-chat-fab.open {
          animation: none;
          transform: rotate(90deg) scale(0.95);
          background: linear-gradient(135deg, #ef4444, #f87171);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }
        .ai-chat-fab svg {
          width: 28px;
          height: 28px;
          color: white;
          transition: transform 0.3s;
        }
        @keyframes chatFabPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.45), 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.45), 0 0 0 12px rgba(99, 102, 241, 0); }
        }

        .ai-chat-panel {
          position: fixed;
          bottom: 100px;
          right: 28px;
          width: 380px;
          max-width: calc(100vw - 32px);
          height: 520px;
          max-height: calc(100vh - 140px);
          border-radius: 20px;
          overflow: hidden;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: rgba(15, 15, 25, 0.92);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      0 0 1px rgba(99, 102, 241, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .ai-chat-panel.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .ai-chat-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          flex-shrink: 0;
        }
        .ai-chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .ai-chat-header-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #f1f1f1;
          letter-spacing: 0.3px;
        }
        .ai-chat-header-info p {
          margin: 2px 0 0;
          font-size: 11px;
          color: rgba(167, 139, 250, 0.8);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ai-chat-header-info p::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .ai-chat-clear {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          transition: all 0.2s;
        }
        .ai-chat-clear:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
        }
        .ai-chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .ai-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 4px;
        }

        .ai-msg {
          max-width: 88%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          animation: msgSlideIn 0.3s ease-out;
          white-space: pre-wrap;
          word-break: break-word;
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-msg.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
        }
        .ai-msg.assistant {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.06);
          color: #e2e2e2;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom-left-radius: 4px;
        }
        .ai-msg-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 4px;
          text-align: right;
        }
        .ai-msg.assistant .ai-msg-time {
          text-align: left;
        }

        .ai-typing {
          align-self: flex-start;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          display: flex;
          gap: 5px;
          animation: msgSlideIn 0.3s ease-out;
        }
        .ai-typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(167, 139, 250, 0.7);
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .ai-typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .ai-typing-dot:nth-child(3) { animation-delay: 0.32s; }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .ai-suggestions {
          padding: 8px 16px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .ai-suggestion-chip {
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #a78bfa;
          font-size: 11.5px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ai-suggestion-chip:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .ai-chat-input-area {
          padding: 12px 16px 16px;
          display: flex;
          gap: 8px;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }
        .ai-chat-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #f1f1f1;
          font-size: 13.5px;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .ai-chat-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .ai-chat-input:focus {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
          background: rgba(255, 255, 255, 0.08);
        }
        .ai-chat-send {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ai-chat-send:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }
        .ai-chat-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        .ai-chat-send svg {
          width: 18px;
          height: 18px;
        }

        .ai-method-badge {
          display: inline-block;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .ai-method-badge.gemini_ai {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .ai-method-badge.rule_based, .ai-method-badge.rule_based_fallback {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        @media (max-width: 480px) {
          .ai-chat-panel {
            right: 8px;
            bottom: 88px;
            width: calc(100vw - 16px);
            height: calc(100vh - 120px);
            border-radius: 16px;
          }
          .ai-chat-fab {
            bottom: 20px;
            right: 20px;
            width: 52px;
            height: 52px;
          }
        }
      `}</style>

      {/* Floating Action Button */}
      <button
        className={`ai-chat-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open AI assistant"}
        id="ai-chatbot-toggle"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`ai-chat-panel ${isOpen ? "open" : ""}`} id="ai-chatbot-panel">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">🤖</div>
          <div className="ai-chat-header-info">
            <h3>RouteFlow AI</h3>
            <p>Online — Ready to help</p>
          </div>
          <button className="ai-chat-clear" onClick={clearChat} title="Clear chat">
            🗑️ Clear
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              <div>{msg.content}</div>
              {msg.method && (
                <span className={`ai-method-badge ${msg.method}`}>
                  {msg.method === "gemini_ai" ? "✨ AI" : "⚡ Quick"}
                </span>
              )}
              <div className="ai-msg-time">
                {msg.timestamp.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-typing">
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="ai-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="ai-suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="ai-chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="ai-chat-input"
            placeholder="Ask about buses, routes, ETAs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            id="ai-chatbot-input"
          />
          <button
            className="ai-chat-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            id="ai-chatbot-send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChatbot;
