import React from 'react';
import { ShieldCheck, EyeOff, Trash2, Database } from 'lucide-react';
import './index.css';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="privacy-container" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Privacy & Security Policy</h1>
      <p className="subtitle">We value your trust and protect your data.</p>
      
      <section style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <ShieldCheck className="icon-blue" />
          <h2>API Key Security</h2>
        </div>
        <p>
          Your Gemini API keys are <strong>encrypted at rest</strong> using industry-standard AES-256 (Fernet) encryption. 
          We never store your keys in plain text.
        </p>
      </section>

      <section style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <EyeOff className="icon-green" />
          <h2>Strict Usage Only</h2>
        </div>
        <p>
          We do not sell, share, or analyze your API keys. They are used <strong>exclusively</strong> to process AI 
          requests for your specific business. Our team cannot see your full API keys.
        </p>
      </section>

      <section style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Database className="icon-purple" />
          <h2>Data Protection</h2>
        </div>
        <p>
          Website data and documents you upload are indexed locally for your AI assistant. 
          This data is isolated per business and is never shared across different accounts.
        </p>
      </section>

      <section style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Trash2 className="icon-red" />
          <h2>Right to Delete</h2>
        </div>
        <p>
          You can delete your API keys or documents at any time from your dashboard. 
          Deletion is immediate and permanent from our database.
        </p>
      </section>

      <footer style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p>If you have any questions about our privacy practices, please contact support.</p>
      </footer>
    </div>
  );
};
