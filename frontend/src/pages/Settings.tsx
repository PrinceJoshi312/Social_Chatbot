import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Save, Building, MessageSquare, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import './Settings.css';

export const SettingsPage: React.FC = () => {
  const { activeBusiness, setActiveBusiness, businesses } = useBusiness();
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name);
      setSystemPrompt(activeBusiness.config?.system_prompt || '');
    }
  }, [activeBusiness]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          config: { ...activeBusiness.config, system_prompt: systemPrompt }
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      
      const updated = await response.json();
      setActiveBusiness(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeBusiness) {
    return (
      <div className="settings-container">
        <div className="empty-state">
          <Building size={48} />
          <p>Please select or create a business to manage settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Configure bot behavior and business information.</p>
        </div>
      </header>

      <form className="settings-form" onSubmit={handleSave}>
        <section className="settings-section">
          <div className="section-header">
            <Building size={20} />
            <h2>Business Information</h2>
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <MessageSquare size={20} />
            <h2>Bot Persona</h2>
          </div>
          <div className="form-group">
            <label>System Prompt</label>
            <textarea 
              value={systemPrompt} 
              onChange={(e) => setSystemPrompt(e.target.value)} 
              placeholder="Define how your bot should behave..."
              rows={6}
            />
            <p className="help-text">
              This prompt guides the AI's personality and boundaries. 
              Example: "You are a helpful customer support agent for Acme Corp. Use a professional tone."
            </p>
          </div>
        </section>

        <div className="form-actions">
          {error && (
            <div className="status-msg error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="status-msg success">
              <CheckCircle size={16} />
              <span>Settings saved successfully!</span>
            </div>
          )}
          <button type="submit" className="save-btn" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
