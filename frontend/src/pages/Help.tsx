import React from 'react';
import { FAQ } from '../components/FAQ';
import { MessageCircle, Mail } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="kb-container">
      <header className="kb-header">
        <div>
          <h1>Help Center</h1>
          <p>Get answers to common questions and learn how to master your RAG bot.</p>
        </div>
      </header>

      <div style={{ marginBottom: '3rem' }}>
        <FAQ light />
      </div>

      <section className="documents-section">
        <h2>Still need help?</h2>
        <div className="features-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
           <div className="feature-card" style={{ padding: '1.5rem' }}>
              <Mail className="icon" />
              <h3>Email Support</h3>
              <p>Contact our technical team at support@ragsaas.com</p>
           </div>
           <div className="feature-card" style={{ padding: '1.5rem' }}>
              <MessageCircle className="icon" />
              <h3>Community Discord</h3>
              <p>Join our developer group to discuss RAG strategies.</p>
           </div>
        </div>
      </section>
    </div>
  );
};
