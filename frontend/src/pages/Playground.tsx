import React, { useState, useRef, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Send, Bot, Info, Search, MoreVertical, Paperclip, Loader2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Playground.css';

interface Message {
  role: 'user' | 'bot' | 'queued';
  content: string;
  context?: string[];
  timestamp: string;
}

export const Playground: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      content: 'Hello! I am your RAG-enabled assistant. You can send multiple messages now, and I will process them in a queue.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);
  const [showContext, setShowContext] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // QUEUE PROCESSOR
  useEffect(() => {
    if (!isLoading && pendingQueue.length > 0) {
      const nextMessage = pendingQueue[0];
      setPendingQueue(prev => prev.slice(1));
      executeMessage(nextMessage);
    }
  }, [isLoading, pendingQueue]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeBusiness) return;

    const userQuery = input;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setInput('');
    
    // Add to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userQuery, timestamp: now }]);

    if (isLoading) {
      // If bot is busy, add to queue
      setPendingQueue(prev => [...prev, userQuery]);
      toast("Message queued", { icon: '⏲️', duration: 1500 });
    } else {
      // If bot is free, execute directly
      executeMessage(userQuery);
    }
  };

  const executeMessage = async (query: string) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/query/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          business_id: activeBusiness?.id,
          query: query
        }),
      });

      if (!response.ok) throw new Error('Query failed');
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data.answer,
        context: data.context,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, I encountered an error while processing that message.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeBusiness) return <div className="empty-dashboard"><Bot size={48} /><h2>Select a Bot</h2></div>;

  return (
    <div className="playground-container">
      <div className="playground-layout">
        <div className="chat-interface">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar"><Bot size={24} color="white" /></div>
              <div className="chat-status">
                <h3>{activeBusiness.name}</h3>
                <span>{isLoading ? 'Processing Queue...' : 'Online'}</span>
              </div>
            </div>
            <div className="chat-header-actions">
               {pendingQueue.length > 0 && (
                 <div className="queue-indicator">
                    <Clock size={14} /> {pendingQueue.length} queued
                 </div>
               )}
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`bubble-row ${msg.role}`}>
                <div className={`bubble ${msg.role}`}>
                  <p>{msg.content}</p>
                  <div className="bubble-meta">
                    <span className="timestamp">{msg.timestamp}</span>
                    {msg.role === 'bot' && <CheckCircleIcon />}
                  </div>
                </div>
                {msg.context && showContext === idx && (
                   <div className="source-details">
                      {msg.context.map((c, ci) => <div key={ci} className="source-text">{c}</div>)}
                   </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bubble-row bot">
                <div className="bubble bot loading-bubble"><div className="typing-dots"><span></span><span></span><span></span></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-footer" onSubmit={handleSend}>
            <div className="input-wrapper">
              <Paperclip size={20} className="icon-btn" />
              <input 
                type="text" 
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <button type="submit" disabled={!input.trim()} className="send-circle active">
              <Send size={20} fill="white" />
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        .queue-indicator {
          background: #e2e8f0;
          color: #475569;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
      `}</style>
    </div>
  );
};

const CheckCircleIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}>
    <path d="M1 5L5 9L14 1" stroke="#53BDEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L9 9L18 1" stroke="#53BDEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4, 0)"/>
  </svg>
);
