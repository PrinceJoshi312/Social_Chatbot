import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  Building, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Key, 
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import './Settings.css';

export const SettingsPage: React.FC = () => {
  const { activeBusiness, setActiveBusiness } = useBusiness();
  const { getAccessToken } = useAuth();
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // WhatsApp Settings (from config)
  const [phoneId, setPhoneId] = useState('');
  const [token, setToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Settings
  const [aiProvider, setAiProvider] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [maskedGeminiKey, setMaskedGeminiKey] = useState('');
  const [llmModelOverride, setLlmModelOverride] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name);
      setSystemPrompt(activeBusiness.config?.system_prompt || '');
      setPhoneId(activeBusiness.config?.whatsapp_phone_id || '');
      setToken(activeBusiness.config?.whatsapp_token || '');
      setVerifyToken(activeBusiness.config?.whatsapp_verify_token || '');
      
      // Fetch AI Settings
      fetchAiSettings();
    }
  }, [activeBusiness]);

  const fetchAiSettings = async () => {
    if (!activeBusiness) return;
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`/api/businesses/${activeBusiness.id}/ai-settings`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiProvider(data.ai_provider);
        setLlmModelOverride(data.llm_model_override || '');
        setHasGeminiKey(data.has_gemini_api_key);
        setMaskedGeminiKey(data.masked_gemini_api_key);
      }
    } catch (err) {
      console.error("Failed to fetch AI settings", err);
    }
  };

  const handleSaveAISettings = async () => {
    if (!activeBusiness) return;
    if (geminiApiKey && !privacyConsent) {
      setError("Please confirm the privacy statement before saving your API key.");
      return;
    }

    setIsSaving(true);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`/api/businesses/${activeBusiness.id}/ai-settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ai_provider: aiProvider,
          gemini_api_key: geminiApiKey || null,
          llm_model_override: llmModelOverride || null
        })
      });
      if (!res.ok) throw new Error("Failed to update AI settings");
      setGeminiApiKey('');
      await fetchAiSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!activeBusiness || !window.confirm("Are you sure you want to remove your API key? The bot will fall back to server defaults.")) return;
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`/api/businesses/${activeBusiness.id}/gemini-api-key`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        await fetchAiSettings();
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to delete key");
    }
  };

  const handleTestConnection = async () => {
    if (!activeBusiness) return;
    setIsTestingAI(true);
    setTestResult(null);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`/api/businesses/${activeBusiness.id}/test-ai`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ status: 'failed', message: 'Network error' });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: name,
          config: { 
            ...activeBusiness.config, 
            system_prompt: systemPrompt,
            whatsapp_phone_id: phoneId,
            whatsapp_token: token,
            whatsapp_verify_token: verifyToken
          }
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
          <p>Please select a business from the sidebar to configure settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Bot Settings</h1>
          <p>Configure how your bot behaves and connects to WhatsApp.</p>
        </div>
        <div className="header-actions">
          {success && <span className="toast success"><CheckCircle size={16} /> Saved!</span>}
          {error && <span className="toast error"><AlertCircle size={16} /> {error}</span>}
          <button onClick={handleSave} className="primary-btn" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-main">
          {/* Section 1: Business Identity */}
          <section className="settings-card">
            <div className="card-header">
              <Building size={20} className="icon-blue" />
              <div>
                <h3>Business Identity</h3>
                <p>Public name and basic information for your bot.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Acme Customer Support"
                />
              </div>
            </div>
          </section>

          {/* Section 2: AI Intelligence */}
          <section className="settings-card">
            <div className="card-header">
              <MessageSquare size={20} className="icon-green" />
              <div>
                <h3>AI Intelligence</h3>
                <p>Configure the AI engine that powers your bot.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>AI Provider</label>
                <select 
                  value={aiProvider} 
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="provider-select"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="ollama">Ollama (Self-hosted / Advanced)</option>
                </select>
                <p className="help-text">
                  Gemini is fast and reliable for most users. Ollama requires your own GPU server.
                </p>
              </div>

              {aiProvider === 'gemini' && (
                <div className="provider-settings">
                  <div className="form-group">
                    <label>Gemini API Key</label>
                    <div className="input-with-action">
                      <input 
                        type="password" 
                        value={geminiApiKey} 
                        onChange={(e) => setGeminiApiKey(e.target.value)} 
                        placeholder={hasGeminiKey ? maskedGeminiKey : "Enter your API Key"}
                      />
                      {hasGeminiKey && (
                        <button className="text-btn danger" onClick={handleDeleteKey}>Remove Key</button>
                      )}
                    </div>
                    <p className="help-text">
                      Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio <ExternalLink size={10}/></a>
                    </p>
                  </div>

                  {!hasGeminiKey && geminiApiKey && (
                    <div className="privacy-confirm">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={privacyConsent} 
                          onChange={(e) => setPrivacyConsent(e.target.checked)} 
                        />
                        <span>I understand my API key will be <a href="/privacy" target="_blank">stored securely</a> and used only for my requests.</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Model Name (Optional Override)</label>
                <input 
                  type="text" 
                  value={llmModelOverride} 
                  onChange={(e) => setLlmModelOverride(e.target.value)} 
                  placeholder={aiProvider === 'gemini' ? "e.g. gemini-1.5-flash" : "e.g. llama3"}
                />
              </div>

              <div className="action-row">
                <button className="secondary-btn" onClick={handleTestConnection} disabled={isTestingAI}>
                  {isTestingAI ? 'Testing...' : 'Test Connection'}
                </button>
                <button className="primary-btn sm" onClick={handleSaveAISettings} disabled={isSaving}>
                  Save AI Settings
                </button>
              </div>

              {testResult && (
                <div className={`test-feedback ${testResult.status}`}>
                  {testResult.status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: AI Instructions */}
          <section className="settings-card">
            <div className="card-header">
              <MessageSquare size={20} className="icon-blue" />
              <div>
                <h3>System Instructions</h3>
                <p>Define your bot's personality, tone, and rules.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <textarea 
                  value={systemPrompt} 
                  onChange={(e) => setSystemPrompt(e.target.value)} 
                  placeholder="Tell the bot who it is and how to help..."
                  rows={8}
                />
                <div className="prompt-tips">
                  <h4>💡 Pro Tips:</h4>
                  <ul>
                    <li>Tell the bot what it **can't** do (e.g., "Don't give medical advice").</li>
                    <li>Define a tone (e.g., "Be friendly and use emojis").</li>
                    <li>Specify how to handle unknown questions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: WhatsApp Connection */}
          <section className="settings-card">
            <div className="card-header">
              <Phone size={20} className="icon-purple" />
              <div>
                <h3>WhatsApp Cloud API</h3>
                <p>Connect your bot to a real WhatsApp phone number.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label><Phone size={14} /> Phone Number ID</label>
                  <input 
                    type="text" 
                    value={phoneId} 
                    onChange={(e) => setPhoneId(e.target.value)} 
                    placeholder="From Meta Dashboard"
                  />
                </div>
                <div className="form-group">
                  <label><ShieldCheck size={14} /> Verify Token</label>
                  <input 
                    type="text" 
                    value={verifyToken} 
                    onChange={(e) => setVerifyToken(e.target.value)} 
                    placeholder="e.g. my_secret_token_123"
                  />
                </div>
              </div>
              <div className="form-group">
                <label><Key size={14} /> Permanent Access Token</label>
                <input 
                  type="password" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  placeholder="Paste your System User Token"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="settings-sidebar">
          <div className="guide-card">
            <div className="guide-header">
              <HelpCircle size={20} />
              <h3>Quick Guide</h3>
            </div>
            <div className="guide-steps">
              <div className="step">
                <span className="step-num">1</span>
                <p>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer">Meta Developers <ExternalLink size={12}/></a></p>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <p>Create a <strong>Business App</strong> & add <strong>WhatsApp</strong>.</p>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <p>Copy your <strong>Phone ID</strong> & <strong>Token</strong> here.</p>
              </div>
              <div className="step">
                <span className="step-num">4</span>
                <p>Set your Webhook URL to your public server (e.g. ngrok).</p>
              </div>
            </div>
            <div className="webhook-preview">
              <label>Your Webhook URL:</label>
              <code>https://your-domain.com/api/whatsapp/webhook</code>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('https://your-domain.com/api/whatsapp/webhook')}>Copy URL</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
