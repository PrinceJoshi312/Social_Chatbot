import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  ArrowRight, 
  Check,
  Smartphone,
  Cpu,
  Star,
  Globe,
  Mail
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { FAQ } from '../components/FAQ';
import { Modal } from '../components/Modal';
import './index.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    
    toast.success("Feedback sent! Thank you for helping us improve.", { icon: '🚀' });
    setFeedbackText('');
    setIsFeedbackOpen(false);
  };

  const reviews = [
    {
      name: "Prince Joshi",
      role: "SaaS Founder",
      content: "This RAG platform is unmatched. Integrating custom business data into WhatsApp took minutes, not days.",
      rating: 5
    },
    {
      name: "Sarah Jenkins",
      role: "Support Manager",
      content: "Our customer satisfaction scores jumped by 40% after deploying the Llama 3.2 bot.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "E-commerce Owner",
      content: "The real-time order tracking tool is a game changer. My customers get instant answers.",
      rating: 4
    }
  ];

  const PricingSection = () => (
    <section id="pricing" className="features-section" style={{ background: '#f8fafc' }}>
      <div className="section-title">
        <h2>Simple, Transparent Pricing</h2>
        <p>Everything you need to scale your business automation.</p>
      </div>
      <div className="features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '3rem' }}>
        <div className="feature-card" style={{ border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Starter</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>$29</span>
              <span style={{ color: '#64748b' }}>/mo</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 1 WhatsApp Bot</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 50 Documents</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 1,000 Messages/mo</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> Standard RAG</li>
          </ul>
          <button className="primary-btn" style={{ width: '100%' }} onClick={() => navigate('/signup')}>Choose Starter</button>
        </div>

        <div className="feature-card" style={{ border: '2px solid var(--primary)', background: 'white', position: 'relative', transform: 'scale(1.05)' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '2px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            MOST POPULAR
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Pro</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>$79</span>
              <span style={{ color: '#64748b' }}>/mo</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 3 WhatsApp Bots</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 500 Documents</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> 10,000 Messages/mo</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> Advanced Tools (Orders)</li>
          </ul>
          <button className="primary-btn" style={{ width: '100%' }} onClick={() => navigate('/signup')}>Choose Pro</button>
        </div>

        <div className="feature-card" style={{ border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Enterprise</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>$249</span>
              <span style={{ color: '#64748b' }}>/mo</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> Unlimited Bots</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> Unlimited Docs</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> White-label support</li>
            <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}><Check size={16} color="#25d366" /> Custom Tool Dev</li>
          </ul>
          <button className="primary-btn" style={{ width: '100%' }} onClick={() => navigate('/signup')}>Contact Sales</button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="landing-page">
      <Toaster position="bottom-center" />
      
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <MessageSquare color="var(--primary)" fill="var(--primary)" size={28} />
            <span>SocialLink</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link-btn">Pricing</button>
            <button onClick={() => scrollToSection('reviews')} className="nav-link-btn">Reviews</button>
            <Link to="/login" className="login-link">Login</Link>
            <button className="nav-cta" onClick={() => navigate('/signup')}>Start Free</button>
          </div>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content fade-in">
          <div className="badge-new">NEW: Llama 3.2 Support 🚀</div>
          <h1>Deploy AI-Powered <span>SocialLink Bots</span> that know your business.</h1>
          <p>Multi-tenant platform to create accurate, context-aware RAG assistants in seconds.</p>
          <div className="hero-btns">
            <button className="primary-hero-btn" onClick={() => navigate('/signup')}>
              Get Started Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card chat-card">
            <div className="chat-bubble-mini bot">Hi! How can I help?</div>
            <div className="chat-bubble-mini user">What are your store hours?</div>
            <div className="chat-bubble-mini bot">We are open 9 AM to 9 PM!</div>
          </div>
        </div>
      </header>

      <section id="features" className="features-section">
        <div className="section-title"><h2>Automate everything with precision</h2></div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Cpu size={32} /></div>
            <h3>Knowledge Base</h3>
            <p>Upload PDFs and the bot uses them as its only source of truth.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Smartphone size={32} /></div>
            <h3>WhatsApp Cloud</h3>
            <p>Official integration with Meta for a professional presence.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Zap size={32} /></div>
            <h3>Real-time Tools</h3>
            <p>Connect to live data for orders and bookings.</p>
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="reviews" className="features-section" style={{ background: 'white' }}>
        <div className="section-title"><h2>Trusted by Business Owners</h2></div>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
           {reviews.map((rev, i) => (
             <div key={i} className="feature-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(rev.rating)].map((_, si) => <Star key={si} size={14} fill="#FFD700" color="#FFD700" />)}
                </div>
                <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#475569' }}>"{rev.content}"</p>
                <div>
                   <strong style={{ display: 'block', fontSize: '1rem' }}>{rev.name}</strong>
                   <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{rev.role}</span>
                </div>
             </div>
           ))}
        </div>
      </section>

      <FAQ />

      <footer className="landing-footer" style={{ padding: '4rem 2rem', background: '#0f172a', color: 'white' }}>
        <div className="nav-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4rem', padding: 0 }}>
           <div className="footer-brand">
              <div className="nav-logo" style={{ color: 'white', marginBottom: '1.5rem' }}>
                <MessageSquare color="#25d366" fill="#25d366" size={28} />
                <span>SocialLink</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>SocialLink v1.0.2 - Future of business communication.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                 <Globe size={20} style={{ cursor: 'pointer' }} />
                 <Mail size={20} style={{ cursor: 'pointer' }} />
                 <Shield size={20} style={{ cursor: 'pointer' }} />
              </div>
           </div>
           <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Product</h4>
              <ul style={{ listStyle: 'none', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <li onClick={() => scrollToSection('features')} style={{ cursor: 'pointer' }}>Features</li>
                 <li onClick={() => scrollToSection('pricing')} style={{ cursor: 'pointer' }}>Pricing</li>
              </ul>
           </div>
           <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <li style={{ cursor: 'pointer' }}>About Us</li>
                 <li style={{ cursor: 'pointer' }}>Privacy</li>
              </ul>
           </div>
           <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Support</h4>
              <button onClick={() => setIsFeedbackOpen(true)} className="nav-cta" style={{ width: '100%', border: 'none' }}>
                 Give Feedback
              </button>
           </div>
        </div>
      </footer>

      {/* FEEDBACK MODAL */}
      <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Share Your Thoughts">
         <form onSubmit={handleSendFeedback} className="modal-form">
            <div className="form-group">
               <label>How can we improve the platform?</label>
               <textarea 
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Tell us what features you'd like to see..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}
                  required
               />
            </div>
            <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'none' }}>
               <button type="button" className="secondary-btn" onClick={() => setIsFeedbackOpen(false)}>Cancel</button>
               <button type="submit" className="primary-btn">Submit Feedback</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
