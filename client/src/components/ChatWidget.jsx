import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! Ask me anything about Meridian Bank procedures, policies, or troubleshooting.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/ask', { question: userQuery });
      setMessages((prev) => [...prev, { sender: 'ai', text: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, something went wrong while processing your question.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-ink-900 text-paper px-5 py-3 rounded-full shadow-lg font-medium hover:bg-ink-800 transition flex items-center gap-2 border border-brass/40"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-brass animate-pulse"></span>
          Bank Assistant AI
        </button>
      ) : (
        <div className="bg-white border border-paper-line rounded-sm shadow-2xl w-80 sm:w-96 flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-ink-900 text-paper px-4 py-3 flex items-center justify-between rounded-t-sm">
            <div>
              <p className="font-display font-medium">Meridian Assistant</p>
              <p className="font-mono text-[10px] text-brass uppercase tracking-widest">RAG Knowledge Base</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-paper/70 hover:text-paper text-sm font-mono"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-paper/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm ${
                    msg.sender === 'user'
                      ? 'bg-ink-900 text-paper'
                      : 'bg-white border border-paper-line text-slate'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-paper-line text-[10px] font-mono text-slate-soft">
                      Sources: {msg.sources.map(s => s.section || s.doc).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-white border border-paper-line px-3.5 py-2.5 rounded-sm text-sm text-slate-soft animate-pulse">
                  Searching knowledge base...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-paper-line bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a help guide question..."
              className="flex-1 px-3 py-2 text-sm border border-paper-line rounded-sm focus:outline-none focus:ring-1 focus:ring-brass"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-brass text-ink-900 font-medium px-4 py-2 rounded-sm text-sm hover:bg-brass-dark transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}