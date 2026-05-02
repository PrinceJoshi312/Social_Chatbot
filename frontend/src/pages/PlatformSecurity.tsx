import React, { useState } from 'react';
import { ShieldCheck, Save, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Settings.css';

export const PlatformSecurityPage: React.FC = () => {
  const [cronSecret, setCronSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // In a real app, this would be an API call to update global env/settings
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Platform security settings updated.');
    }, 1000);
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCronSecret(result);
  };

  return (
    <div className="settings-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Platform Security</h1>
          <p>Global security configuration and secret management for the entire platform.</p>
        </div>
        <div className="header-actions">
           <button onClick={handleSaveSecurity} className="primary-btn" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Global Changes'}
          </button>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-main">
          <section className="settings-card">
            <div className="card-header">
              <Lock size={20} className="icon-blue" />
              <div>
                <h3>System Secrets</h3>
                <p>Manage tokens used for internal system communication and automation.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>CRON_SECRET</label>
                <div className="input-with-action">
                  <input 
                    type="text" 
                    value={cronSecret} 
                    onChange={(e) => setCronSecret(e.target.value)} 
                    placeholder="Used to authorize automated crawling jobs"
                  />
                  <button className="secondary-btn sm" onClick={generateSecret}>
                    <RefreshCw size={14} /> Generate
                  </button>
                </div>
                <p className="help-text">
                  This secret must be sent in the <code>Authorization: Bearer</code> header when triggering <code>/api/cron</code>.
                </p>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="card-header">
              <ShieldCheck size={20} className="icon-green" />
              <div>
                <h3>Access Control Policy</h3>
                <p>Global rules for user registration and API access.</p>
              </div>
            </div>
            <div className="card-body">
               <div className="form-group">
                 <label className="checkbox-label">
                   <input type="checkbox" defaultChecked />
                   <span>Allow new business registrations</span>
                 </label>
               </div>
               <div className="form-group">
                 <label className="checkbox-label">
                   <input type="checkbox" defaultChecked />
                   <span>Require email verification for WhatsApp bots</span>
                 </label>
               </div>
               <div className="form-group">
                 <label className="checkbox-label">
                   <input type="checkbox" />
                   <span>Enable maintenance mode (admin only access)</span>
                 </label>
               </div>
            </div>
          </section>
        </div>

        <aside className="settings-sidebar">
          <div className="guide-card warning">
            <div className="guide-header">
              <AlertCircle size={20} />
              <h3>Critical Info</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
              Changes made here affect the <strong>entire platform</strong> and all connected businesses.
              Ensure you update your external cron schedulers if you change the CRON_SECRET.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
