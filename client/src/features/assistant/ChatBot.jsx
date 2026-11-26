import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/authSlice';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  Compass,
} from 'lucide-react';
import {
  processAssistantQuery,
  FREQUENT_TOPICS,
  ERP_PAGES,
} from './erpKnowledgeBase';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with helpful welcome message on first mount
  useEffect(() => {
    const saved = localStorage.getItem('erp_chatbot_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {
        // Fallback to fresh greeting
      }
    }

    const initialGreeting = {
      id: 'welcome-msg',
      sender: 'bot',
      title: `👋 Welcome ${user?.name ? user.name.split(' ')[0] : 'there'}!`,
      text: `I'm your **Manufacturing ERP Assistant**. Ask me how to use any part of the system—like creating Work Orders, receiving goods via Goods Receipts, tracking inventory, or downloading invoices.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'How to receive goods?',
        'How to create a work order?',
        'Where are low stock alerts?',
        'How to generate an invoice?',
      ],
    };
    setMessages([initialGreeting]);
  }, [user]);

  // Persist messages in localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('erp_chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate natural response latency
    setTimeout(() => {
      const response = processAssistantQuery(query, location.pathname);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        title: response.title,
        text: response.content,
        link: response.link,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 400);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('erp_chatbot_messages');
    const resetGreeting = {
      id: Date.now().toString(),
      sender: 'bot',
      title: 'Chat History Cleared',
      text: `Hello! How can I help you navigate Manufacturing ERP today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'How do I receive purchased goods?',
        'How to create a work order?',
        'Where can I see low stock alerts?',
      ],
    };
    setMessages([resetGreeting]);
  };

  const currentPageObj = ERP_PAGES.find((p) => p.path === location.pathname);

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
          title="Open ERP Assistant"
          aria-label="Open ERP Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide pr-1">ERP Assistant</span>
          <span className="bg-white/20 text-[11px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
            Help
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Manufacturing ERP Guide</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">
                  {currentPageObj ? `On: ${currentPageObj.name}` : 'Ready to help'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
                title="Clear chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
                title="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Category Chips bar */}
          <div className="bg-slate-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-gray-400 font-medium flex items-center gap-1 flex-shrink-0">
              <Compass className="w-3.5 h-3.5 text-primary-600" /> Jump:
            </span>
            <button
              onClick={() => handleSendMessage('How do I receive purchased goods and increase inventory?')}
              className="flex-shrink-0 px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-md border border-gray-200 font-medium transition"
            >
              📦 Receiving
            </button>
            <button
              onClick={() => handleSendMessage('How to create and execute a production work order?')}
              className="flex-shrink-0 px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-md border border-gray-200 font-medium transition"
            >
              ⚙️ Production
            </button>
            <button
              onClick={() => handleSendMessage('How do I build a BOM for my product?')}
              className="flex-shrink-0 px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-md border border-gray-200 font-medium transition"
            >
              📋 BOM
            </button>
            <button
              onClick={() => handleSendMessage('Where can I see items that are below minimum reorder level?')}
              className="flex-shrink-0 px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-md border border-gray-200 font-medium transition"
            >
              🔔 Alerts
            </button>
            <button
              onClick={() => handleSendMessage('How to generate and download a commercial invoice PDF?')}
              className="flex-shrink-0 px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-md border border-gray-200 font-medium transition"
            >
              📑 Invoices
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Bot Title if present */}
                  {msg.title && (
                    <div className="font-bold text-sm text-gray-900 mb-1.5 flex items-center gap-1.5 border-b border-gray-100 pb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                      <span>{msg.title}</span>
                    </div>
                  )}

                  {/* Message Body with markdown formatting */}
                  <div className="space-y-1.5 text-gray-700 whitespace-pre-wrap">
                    {msg.sender === 'user' ? (
                      <span className="text-white font-medium">{msg.text}</span>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* Interactive Direct Navigation Link */}
                  {msg.link && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          navigate(msg.link.path);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold rounded-lg text-xs transition border border-primary-200/80"
                      >
                        <span>{msg.link.text}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                        Related Topics:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(sug)}
                            className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full font-medium transition text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3 rounded-2xl border border-gray-200/80 w-fit rounded-bl-none shadow-sm">
                <Bot className="w-3.5 h-3.5 text-primary-600 animate-spin" />
                <span className="italic">Assistant is finding the best guide...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about inventory, work orders, BOM, POs..."
                className="flex-1 text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-sm transition active:scale-95 flex-shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Press Enter to ask • Click links to jump directly to any page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to render simple bold text and bullet points cleanly
function renderFormattedText(text) {
  if (!text) return null;

  return text.split('\n').map((line, idx) => {
    // Bold parsing (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <p key={idx} className={line.startsWith('•') || line.match(/^\d+\./) ? 'pl-2 text-gray-700' : 'text-gray-700'}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={pIdx} className="italic text-gray-600">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  });
}
