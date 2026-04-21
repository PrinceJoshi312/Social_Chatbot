import React, { useState, useRef, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Send, User, Bot, Info, Loader2 } from 'lucide-react';
import './Playground.css';

interface Message {
  role: 'user' | 'bot';
  content: string;
  context?: string[];
}

export const Playground: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I am your RAG-enabled assistant. Upload documents in the Knowledge Base, then ask me anything about them here.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeBusiness || isLoading) return;

    const userQuery = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/query/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          query: userQuery
        }),
      });

      if (!response.ok) throw new Error('Query failed');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data.answer,
        context: data.context 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="playground-container">
      <header className="playground-header">
        <div>
          <h1>Chat Playground</h1>
          <p>Test your knowledge base for <strong>{activeBusiness?.name}</strong></p>
        </div>
      </header>

      <div className="chat-window">
        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {msg.content}
                </div>
                {msg.context && msg.context.length > 0 && (
                  <button 
                    className="context-toggle" 
                    onClick={() => setShowContext(showContext === idx ? null : idx)}
                  >
                    <Info size={14} />
                    {showContext === idx ? 'Hide Sources' : `View ${msg.context.length} Sources`}
                  </button>
                )}
                {showContext === idx && msg.context && (
                  <div className="context-pane">
                    {msg.context.map((text, cIdx) => (
                      <div key={cIdx} className="context-item">
                        <p>"{text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper bot">
              <div className="avatar"><Bot size={16} /></div>
              <div className="message-content">
                <div className="message-bubble loading">
                  <Loader2 className="spin" size={18} />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder={activeBusiness ? "Ask a question about your documents..." : "Please select a business first"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!activeBusiness || isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
