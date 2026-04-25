import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Book, 
  Shield, 
  Smartphone, 
  CreditCard,
  Zap,
  HelpCircle
} from 'lucide-react';

const categories = [
  {
    id: 'general',
    name: 'Getting Started',
    icon: <Zap size={18} />,
    questions: [
      {
        q: "What exactly is RAG AI?",
        a: "RAG (Retrieval-Augmented Generation) is a technology that allows your AI to answer questions based ONLY on your uploaded documents. This prevents 'hallucinations' and ensures 100% accuracy for your business."
      },
      {
        q: "How fast can I launch my bot?",
        a: "Once you upload your documents and name your bot in the 'Billing' section, your bot is ready to chat instantly in our simulator."
      }
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Integration',
    icon: <Smartphone size={18} />,
    questions: [
      {
        q: "Do I need a real WhatsApp number?",
        a: "Yes. To use the bot with real customers, you need a WhatsApp Business account. You can connect it in 'Bot Settings' using your Meta Phone ID and Permanent Token."
      },
      {
        q: "Is my WhatsApp data secure?",
        a: "Absolutely. We use official Meta Cloud APIs and enterprise-grade encryption to ensure your customer conversations stay private."
      }
    ]
  },
  {
    id: 'billing',
    name: 'Plans & Billing',
    icon: <CreditCard size={18} />,
    questions: [
      {
        q: "Can I upgrade my plan later?",
        a: "Yes! You can switch from Starter to Pro or Enterprise at any time from the 'Billing & Plan' tab. Your limits will update instantly."
      },
      {
        q: "What happens if I hit my message limit?",
        a: "The bot will pause responding until your next billing cycle starts or you upgrade to a higher tier plan."
      }
    ]
  }
];

export const FAQ: React.FC<{ light?: boolean }> = ({ light = false }) => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className={`premium-help-container ${light ? 'light' : ''}`} style={{ padding: '2rem 0' }}>
      <div className="help-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '1rem' }}>
           How can we help you today?
        </h2>
        <div className="help-search-wrapper" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
           <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
           <input 
              type="text" 
              placeholder="Search help articles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', outline: 'none' }}
           />
        </div>
      </div>

      <div className="help-content-grid" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Category Sidebar */}
        <aside className="help-categories" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {categories.map((cat) => (
             <button 
                key={cat.id}
                onClick={() => {setActiveCategory(cat.id); setOpenIndex(0);}}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: activeCategory === cat.id ? 'var(--primary)' : 'transparent',
                  color: activeCategory === cat.id ? 'white' : '#64748b',
                  fontWeight: '700', transition: 'all 0.2s', textAlign: 'left'
                }}
             >
                {cat.icon}
                {cat.name}
             </button>
           ))}
        </aside>

        {/* Question List */}
        <main className="help-questions">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentCategory?.questions.map((item, i) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', 
                    boxShadow: openIndex === i ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  <button 
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    style={{ width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>{item.q}</span>
                    {openIndex === i ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} />}
                  </button>
                  {openIndex === i && (
                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: '#64748b', lineHeight: '1.7', fontSize: '1rem', borderTop: '1px solid #f8fafc', paddingTop: '1rem' }}>
                       {item.a}
                    </div>
                  )}
                </div>
              ))}
           </div>
        </main>
      </div>
    </div>
  );
};
